import time
import uuid
import logging
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

# Setup logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("makesite.middleware")


class RequestMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Middleware that:
    1. Assigns a unique X-Request-ID to every incoming request.
    2. Measures total processing time and appends X-Process-Time header.
    3. Logs request lifecycle with structured metrics.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        start_time = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"

        try:
            response = await call_next(request)
            process_time_ms = (time.perf_counter() - start_time) * 1000

            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{process_time_ms:.2f}ms"

            # Color/formatted log
            status = response.status_code
            log_fn = logger.info if status < 400 else (logger.warning if status < 500 else logger.error)
            log_fn(
                f"[{request_id}] {request.method} {request.url.path} "
                f"-> {status} in {process_time_ms:.2f}ms (IP: {client_ip})"
            )
            return response

        except Exception as exc:
            process_time_ms = (time.perf_counter() - start_time) * 1000
            logger.exception(
                f"[{request_id}] Unhandled error on {request.method} {request.url.path} "
                f"after {process_time_ms:.2f}ms: {exc}"
            )
            raise


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    In-memory rate limiter per IP address using a sliding time window.
    Exempts static docs and health endpoints.
    """
    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # client_ip -> list of timestamps
        self.history = defaultdict(list)
        self.exempt_paths = {"/", "/health", "/docs", "/openapi.json", "/redoc", "/templates"}

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in self.exempt_paths or request.method == "OPTIONS":
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        window_start = now - self.window_seconds

        # Prune older entries
        recent_requests = [ts for ts in self.history[client_ip] if ts > window_start]
        self.history[client_ip] = recent_requests

        remaining = max(0, self.max_requests - len(recent_requests))

        if len(recent_requests) >= self.max_requests:
            oldest_in_window = recent_requests[0]
            retry_after = max(1, int(oldest_in_window + self.window_seconds - now))
            logger.warning(f"Rate limit exceeded for IP {client_ip} on {request.url.path}")

            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "detail": f"Maximum {self.max_requests} requests per minute. Retry in {retry_after}s.",
                    "retry_after": retry_after,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0",
                },
            )

        # Record this request
        self.history[client_ip].append(now)

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining - 1)
        return response
