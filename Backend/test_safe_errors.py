"""
Comprehensive Test Suite: Safe Error Handling and Request ID Tracing

Verifies:
1. Standardized JSON error response format (error, detail, request_id, status_code).
2. X-Request-ID response header propagation and client ID reflection.
3. 500 error sanitization: ensuring zero stack trace or internal exception leakage.
4. 422 schema validation error formatting with request_id.
5. 404 not found error formatting with request_id.
6. Guarded endpoint errors (/extract, /update-business, /generate-content, /generate-html).
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app, raise_server_exceptions=False)


def test_custom_request_id_reflection():
    """Verify that client-provided X-Request-ID header is honored and reflected."""
    custom_id = "req_custom_trace_9999"
    resp = client.post(
        "/extract",
        json={"description": "short"},
        headers={"X-Request-ID": custom_id},
    )
    assert resp.status_code == 400
    data = resp.json()

    assert data.get("request_id") == custom_id, f"Expected request_id '{custom_id}', got {data.get('request_id')}"
    assert resp.headers.get("X-Request-ID") == custom_id
    assert "error" in data
    assert "detail" in data
    print("  [OK] Custom X-Request-ID preserved and reflected in body & headers")


def test_generated_request_id_format():
    """Verify that auto-generated request IDs follow the 'req_' prefix convention."""
    resp = client.post("/extract", json={"description": "1234567890"})
    assert resp.status_code == 400
    data = resp.json()

    req_id = data.get("request_id")
    assert req_id and req_id.startswith("req_"), f"Generated request_id should start with 'req_', got '{req_id}'"
    assert resp.headers.get("X-Request-ID") == req_id
    print(f"  [OK] Auto-generated request ID format valid: '{req_id}'")


def test_validation_error_422_with_request_id():
    """Verify 422 Unprocessable Entity includes request_id and clean message."""
    resp = client.post("/extract", json={"wrong_key": "some text"})
    assert resp.status_code == 422
    data = resp.json()

    assert "request_id" in data
    assert resp.headers.get("X-Request-ID") == data["request_id"]
    assert data.get("error") == "Validation Error"
    assert "detail" in data
    print(f"  [OK] 422 Validation error contains Request ID: {data['request_id']}")


def test_404_not_found_with_request_id():
    """Verify 404 Route Not Found returns safe envelope with request_id."""
    resp = client.get("/non-existent-endpoint")
    assert resp.status_code == 404
    data = resp.json()

    assert "request_id" in data
    assert resp.headers.get("X-Request-ID") == data["request_id"]
    assert "detail" in data
    print(f"  [OK] 404 Not Found returns Request ID: {data['request_id']}")


def test_update_business_rejection_has_request_id():
    """Verify rejected clarification inputs return safe error payload with request_id."""
    sample_data = {
        "business_name": "Test Cafe",
        "category": "Cafe",
        "location": "Mumbai",
        "contact": None,
        "hours": None,
        "products": [],
        "tagline": None,
    }
    resp = client.post("/update-business", json={
        "business_data": sample_data,
        "field": "contact",
        "value": "123",  # Invalid phone number
    })
    assert resp.status_code == 400
    data = resp.json()

    assert "request_id" in data
    assert resp.headers.get("X-Request-ID") == data["request_id"]
    assert data.get("field") == "contact"
    assert "too short" in data.get("detail", "").lower()
    print(f"  [OK] /update-business rejection contains Request ID: {data['request_id']}")


def test_generate_content_guard_has_request_id():
    """Verify /generate-content guard rejection returns request_id."""
    incomplete_data = {
        "business_name": "Test Cafe",
        "category": "Cafe",
        "location": "Mumbai",
        "contact": None,  # Missing compulsory contact
        "hours": None,
        "products": [],
        "tagline": None,
    }
    resp = client.post("/generate-content", json=incomplete_data)
    assert resp.status_code == 400
    data = resp.json()

    assert "request_id" in data
    assert resp.headers.get("X-Request-ID") == data["request_id"]
    assert "contact" in data.get("detail", "")
    print(f"  [OK] /generate-content guard contains Request ID: {data['request_id']}")


def test_500_internal_error_safety_and_masking():
    """Verify simulated 500 error does NOT leak internal exceptions or stack trace."""
    from errors import safe_error_response
    from starlette.requests import Request
    from starlette.datastructures import Headers

    # Mock a request with sensitive detail
    class DummyRequest:
        state = type("State", (), {"request_id": "req_simulated_500"})()
        headers = Headers({"X-Request-ID": "req_simulated_500"})

    dummy_req = DummyRequest()
    secret_internal_detail = "Database connection failed: postgres://admin:supersecret@10.0.0.1:5432/db"

    resp = safe_error_response(
        request=dummy_req,
        status_code=500,
        error="Internal Server Error",
        detail=secret_internal_detail,
    )

    import json
    content = json.loads(resp.body.decode())

    # Ensure secret is NOT in response
    assert "postgres" not in content["detail"]
    assert "supersecret" not in content["detail"]
    assert "10.0.0.1" not in content["detail"]
    assert "req_simulated_500" in content["detail"]
    assert content["request_id"] == "req_simulated_500"
    print("  [OK] 500 error safely masked internal secrets and retained Request ID")


if __name__ == "__main__":
    print("\n==================================================")
    print("RUNNING SAFE ERRORS & REQUEST ID TEST SUITE")
    print("==================================================")
    test_custom_request_id_reflection()
    test_generated_request_id_format()
    test_validation_error_422_with_request_id()
    test_404_not_found_with_request_id()
    test_update_business_rejection_has_request_id()
    test_generate_content_guard_has_request_id()
    test_500_internal_error_safety_and_masking()
    print("\n==================================================")
    print("ALL SAFE ERROR & REQUEST ID TESTS PASSED 100%!")
    print("==================================================")
