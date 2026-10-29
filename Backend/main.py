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
    RephraseRequest,
    RephraseResponse,
    ErrorResponse,
)
from extraction import async_extract_business_info, PRIMARY_MODEL, FALLBACK_MODEL, async_client
from validation import (
    validate_clarification_field,
    validate_field_sync,
    validate_initial_description,
)
from content_generation import async_generate_website_content, async_rephrase_section
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
# Helper: Determine Missing Required Fields (DRY & Validated)
# ----------------------------------------------------
REQUIRED_FIELDS = ["business_name", "category", "location", "contact"]


def get_missing_fields(business_info: BusinessInfo) -> List[str]:
    """
    Finds which essential fields are still None, blank, or invalid.
    Never marks invalid answers or random gibberish as confirmed.
    """
    missing = []
    for field in REQUIRED_FIELDS:
        val = getattr(business_info, field, None)
        if val is None or (isinstance(val, str) and not val.strip()):
            missing.append(field)
            continue
        # Strict validation: verify that the value actually satisfies rules
        validation_res = validate_field_sync(field, str(val))
        if not validation_res.valid:
            missing.append(field)
    return missing


# ----------------------------------------------------
# Global Exception Handlers
# ----------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.warning(f"[{req_id}] Validation error on {request.url.path}: {exc.errors()}")
    # Format friendly message from first error if available
    friendly_msg = "Invalid request payload"
    errors = exc.errors()
    if errors and len(errors) > 0:
        first_err = errors[0]
        msg = first_err.get("msg", "")
        if "Value error," in msg:
            friendly_msg = msg.split("Value error,")[-1].strip()
        elif msg:
            friendly_msg = msg

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "detail": friendly_msg,
            "errors": exc.errors(),
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
            "POST /rephrase-section",
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
    Validates against gibberish, random numbers, and off-topic prompts.
    """
    # 1. Fast pre-validation
    is_valid, err_msg = validate_initial_description(request.description)
    if not is_valid:
        logger.warning(f"Rejected invalid description: {err_msg}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": "Invalid business description",
                "detail": err_msg,
                "field": "description",
            },
        )

    result_raw = await async_extract_business_info(request.description)

    try:
        data = json.loads(result_raw)

        # 2. Check if AI validation rejected the input
        if not data.get("is_valid_business", True):
            rejection_reason = data.get("rejection_reason") or (
                "Your input does not appear to describe a business or commercial service. "
                "Please describe what your business does, what services/products you offer, and where you are located."
            )
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "error": "Invalid business description",
                    "detail": rejection_reason,
                    "field": "description",
                },
            )

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
    Validates and applies user answers for missing fields during clarification flow.
    Rejects invalid answers with friendly error messages without altering previously accepted information.
    """
    target_field = request.field
    raw_value = request.value

    # Validate input against specific field rules and AI semantic check
    val_result = await validate_clarification_field(
        field=target_field,
        value=raw_value,
        async_client=async_client
    )

    if not val_result.valid:
        logger.info(f"Rejected invalid clarification value for '{target_field}': {val_result.error}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": f"Invalid {target_field.replace('_', ' ').title()}",
                "detail": val_result.error or f"Please provide a valid {target_field.replace('_', ' ')}.",
                "field": target_field,
                "value": raw_value,
            },
        )

    # Use the cleaned/normalized value
    business_dict = request.business_data.model_dump()
    business_dict[target_field] = val_result.cleaned_value

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
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    tags=["Core AI"],
)
async def generate_content(request: BusinessInfo):
    """
    Generates compelling, conversion-focused website copy (hero, about,
    services, and CTA) using the extracted business profile.
    Guarded: All required fields must be properly validated before generating.
    """
    missing = get_missing_fields(request)
    if missing:
        logger.warning(f"Attempted content generation with missing or invalid fields: {missing}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": "Incomplete Business Profile",
                "detail": f"Cannot generate website. The following required fields are missing or invalid: {', '.join(missing)}. Please provide all required details before proceeding.",
            },
        )

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
    responses={400: {"model": ErrorResponse}},
    tags=["Website Generator"],
)
async def generate_html(request: GenerateHtmlRequest):
    """
    Renders standalone production-ready HTML with embedded CSS and modern
    typography for direct preview or download.
    Guarded: All required fields must be properly validated before generating.
    """
    missing = get_missing_fields(request.business_data)
    if missing:
        logger.warning(f"Attempted HTML generation with missing or invalid fields: {missing}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": "Incomplete Business Profile",
                "detail": f"Cannot generate website HTML. Required fields missing or invalid: {', '.join(missing)}.",
            },
        )

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
# AI Rephrase / Polish Section Endpoint
# ----------------------------------------------------
@app.post(
    "/rephrase-section",
    response_model=RephraseResponse,
    tags=["Core AI"],
)
async def rephrase_section(request: RephraseRequest):
    """
    Polishes, elevates, or rewrites a specific website section (headline,
    subtitle, about story, service, or CTA) with compelling AI suggestions.
    """
    result = await async_rephrase_section(
        section=request.section,
        text=request.text,
        business_name=request.business_name,
        category=request.category,
        style=request.style,
    )
    return result


# ----------------------------------------------------
# Available Templates
# ----------------------------------------------------
@app.get("/templates", tags=["Website Generator"])
async def templates():
    """Returns list of all available website design templates."""
    return {
        "templates": get_available_templates()
    }