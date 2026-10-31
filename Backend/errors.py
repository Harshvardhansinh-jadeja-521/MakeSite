"""
MakeSite AI - Safe Error Handling & Request ID Module

Provides standardized, secure error responses.
Ensures internal stack traces, API keys, and sensitive environment details
are never leaked to client responses while guaranteeing every error contains
a traceable request_id for debugging and user support.
"""

import uuid
import logging
from typing import Optional, Dict, Any
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("makesite.errors")


def generate_request_id() -> str:
    """Generates a unique, collision-resistant MakeSite request identifier."""
    return f"req_{uuid.uuid4().hex[:12]}"


def get_request_id(request: Request) -> str:
    """
    Extracts the request_id assigned by middleware or request headers.
    Falls back to generating a fresh ID if not yet assigned.
    """
    if hasattr(request, "state") and getattr(request.state, "request_id", None):
        return request.state.request_id

    header_id = request.headers.get("X-Request-ID")
    if header_id and header_id.strip():
        req_id = header_id.strip()
    else:
        req_id = generate_request_id()

    # Cache on state if accessible
    if hasattr(request, "state"):
        try:
            request.state.request_id = req_id
        except Exception:
            pass

    return req_id


def sanitize_detail_message(detail: Optional[str], status_code: int, request_id: str) -> str:
    """
    Masks internal error strings for 5xx errors to prevent leaking stack traces,
    file system paths, or third-party service tokens to clients.
    """
    if status_code >= 500:
        return (
            "An unexpected server error occurred while processing your request. "
            f"Please try again or reference Request ID: {request_id}."
        )

    if not detail or not str(detail).strip():
        if status_code == 400:
            return "The request was invalid or could not be understood."
        if status_code == 404:
            return "The requested resource was not found."
        if status_code == 422:
            return "Validation error: The provided data is not in an acceptable format."
        if status_code == 429:
            return "Too many requests. Please slow down and try again."
        return "An error occurred while processing the request."

    cleaned = str(detail).strip()
    # Strip any potential Groq / OpenAI API key patterns if ever accidentally bubbled up
    if "gsk_" in cleaned or "sk-" in cleaned or "api_key" in cleaned.lower():
        return f"AI provider service temporarily unavailable. Reference Request ID: {request_id}."

    return cleaned


def safe_error_response(
    request: Request,
    status_code: int,
    error: str,
    detail: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
) -> JSONResponse:
    """
    Constructs a standardized, safe error JSONResponse containing:
    - error: high-level error classification
    - detail: user-safe description
    - request_id: unique tracing ID
    - status_code: matching HTTP status code
    - X-Request-ID header: matching the request_id
    """
    req_id = get_request_id(request)
    safe_detail = sanitize_detail_message(detail, status_code, req_id)

    content: Dict[str, Any] = {
        "error": error,
        "detail": safe_detail,
        "request_id": req_id,
        "status_code": status_code,
    }

    if extra:
        for k, v in extra.items():
            if k not in content and v is not None:
                content[k] = v

    resp_headers = {"X-Request-ID": req_id}
    if headers:
        resp_headers.update(headers)

    return JSONResponse(
        status_code=status_code,
        content=content,
        headers=resp_headers,
    )
