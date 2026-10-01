import os
import time
import json
import logging
from typing import List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from schemas import (
    BusinessRequest,
    BusinessInfo,
    BusinessUpdateRequest,
    BusinessDataResponse,
    ContentGenerationResponse,
    GenerateHtmlRequest,
    GenerateHtmlResponse,
    HealthResponse,
    ErrorResponse,
)
from extraction import async_extract_business_info, PRIMARY_MODEL, FALLBACK_MODEL
from content_generation import async_generate_website_content
from website_generator import (
    generate_standalone_website_html,
    get_available_templates,
)
from middleware import RequestMonitoringMiddleware, RateLimitMiddleware

# ----------------------------------------------------
# Logging & State
# ----------------------------------------------------
logger = logging.getLogger("makesite.api")
START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("⚡ MakeSite AI API Server started successfully")
    yield
    logger.info("MakeSite API Server shutting down gracefully")


# ----------------------------------------------------
# FastAPI Application
# ----------------------------------------------------
app = FastAPI(
    title="MakeSite AI Engine",
    description="Next-generation autonomous website generator API powered by Groq and FastAPI.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ----------------------------------------------------
# Custom Middlewares
# ----------------------------------------------------
app.add_middleware(RequestMonitoringMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)

# ----------------------------------------------------
# CORS Middleware
# Fully covers local dev ports (5173, 5174, 3000, etc.)
# ----------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------
# Helper: Determine Missing Required Fields (DRY)
# ----------------------------------------------------
REQUIRED_FIELDS = ["business_name", "category", "location", "contact"]


def get_missing_fields(business_info: BusinessInfo) -> List[str]:
    """Finds which essential fields are still None or blank."""
    missing = []
    for field in REQUIRED_FIELDS:
        val = getattr(business_info, field, None)
        if val is None or (isinstance(val, str) and not val.strip()):
            missing.append(field)
    return missing


# ----------------------------------------------------
# Global Exception Handlers
# ----------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.warning(f"[{req_id}] Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Invalid request payload",
            "detail": exc.errors(),
            "request_id": req_id,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"[{req_id}] Uncaught exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error occurred",
            "detail": str(exc),
            "request_id": req_id,
        },
    )


# ----------------------------------------------------
# Home & Info
# ----------------------------------------------------
@app.get("/", tags=["General"])
async def home():
    return {
        "message": "MakeSite AI API is running",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/docs",
        "endpoints": [
            "POST /extract",
            "POST /update-business",
            "POST /generate-content",
            "POST /generate-html",
            "GET /templates",
            "GET /health",
        ],
    }


# ----------------------------------------------------
# Health Check Endpoint
# ----------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["General"])
async def health():
    uptime = time.time() - START_TIME
    groq_key_set = bool(os.getenv("GROQ_API_KEY"))
    return {
        "status": "healthy" if groq_key_set else "degraded",
        "version": "2.0.0",
        "uptime_seconds": round(uptime, 2),
        "groq_api_status": "configured" if groq_key_set else "missing_api_key",
        "model_primary": PRIMARY_MODEL,
        "model_fallback": FALLBACK_MODEL,
    }


# ----------------------------------------------------
# Extract Business Information
# ----------------------------------------------------
@app.post(
    "/extract",
    response_model=BusinessDataResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    tags=["Core AI"],
)
async def extract(request: BusinessRequest):
    """
    Extracts structured business metadata from freeform descriptions
    in English, Hindi, Hinglish, or any regional language.
    """
    result_raw = await async_extract_business_info(request.description)

    try:
        data = json.loads(result_raw)
        business_info = BusinessInfo(**data)
        missing_fields = get_missing_fields(business_info)

        return {
            "data": business_info.model_dump(),
            "missing_fields": missing_fields,
            "is_complete": len(missing_fields) == 0,
        }

    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode AI extraction output: {e}")
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={
                "error": "AI returned invalid JSON format",
                "raw_response": result_raw,
            },
        )


# ----------------------------------------------------
# Update Business Information (Clarification flow)
# ----------------------------------------------------
@app.post(
    "/update-business",
    response_model=BusinessDataResponse,
    responses={400: {"model": ErrorResponse}},
    tags=["Core AI"],
)
async def update_business(request: BusinessUpdateRequest):
    """
    Applies user answers for missing fields during clarification flow.
    """
    business_dict = request.business_data.model_dump()
    target_field = request.field

    # Update requested field
    business_dict[target_field] = request.value

    # Re-validate model
    updated_business = BusinessInfo(**business_dict)
    missing_fields = get_missing_fields(updated_business)

    return {
        "data": updated_business.model_dump(),
        "missing_fields": missing_fields,
        "is_complete": len(missing_fields) == 0,
    }


# ----------------------------------------------------
# Generate Website Content
# ----------------------------------------------------
@app.post(
    "/generate-content",
    response_model=ContentGenerationResponse,
    responses={500: {"model": ErrorResponse}},
    tags=["Core AI"],
)
async def generate_content(request: BusinessInfo):
    """
    Generates compelling, conversion-focused website copy (hero, about,
    services, and CTA) using the extracted business profile.
    """
    result_raw = await async_generate_website_content(request.model_dump())

    try:
        content = json.loads(result_raw)
        return {
            "content": content,
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse content generation JSON: {e}")
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={
                "error": "AI returned invalid JSON",
                "raw_response": result_raw,
            },
        )


# ----------------------------------------------------
# Server-side HTML Generator
# ----------------------------------------------------
@app.post(
    "/generate-html",
    response_model=GenerateHtmlResponse,
    tags=["Website Generator"],
)
async def generate_html(request: GenerateHtmlRequest):
    """
    Renders standalone production-ready HTML with embedded CSS and modern
    typography for direct preview or download.
    """
    html_output = generate_standalone_website_html(
        business_data=request.business_data.model_dump(),
        content=request.content,
        template_id=request.template_id,
    )

    return {
        "html": html_output,
        "template_id": request.template_id,
        "size_bytes": len(html_output.encode("utf-8")),
    }


# ----------------------------------------------------
# Available Templates
# ----------------------------------------------------
@app.get("/templates", tags=["Website Generator"])
async def templates():
    """Returns list of all available website design templates."""
    return {
        "templates": get_available_templates()
    }