import sys
from fastapi.testclient import TestClient
import main

client = TestClient(main.app)

def test_all():
    print("--- 1. Testing GET /health ---")
    h_res = client.get("/health")
    assert h_res.status_code == 200, f"Health check failed: {h_res.text}"
    print("Health:", h_res.json())

    print("\n--- 2. Testing GET /templates ---")
    t_res = client.get("/templates")
    assert t_res.status_code == 200, f"Templates fetch failed: {t_res.text}"
    templates = t_res.json().get("templates", [])
    assert len(templates) == 7, f"Expected 7 templates, got {len(templates)}"
    ids = [t["id"] for t in templates]
    print(f"Loaded {len(templates)} templates: {ids}")

    print("\n--- 3. Testing POST /generate-html for all 7 templates ---")
    sample_b = {
        "business_name": "Bean & Bloom",
        "category": "Artisan Cafe",
        "location": "Bandra, Mumbai",
        "hours": "7:30am - 10pm",
        "contact": "hello@beanandbloom.in",
        "products": ["Espresso", "Croissants", "Cold Brew"]
    }
    sample_c = {
        "hero_title": "Artisanal Coffee & Bakery",
        "hero_description": "Crafted with love in Bandra.",
        "about": "A cozy neighborhood cafe.",
        "services": [
            {"name": "Espresso Roast", "description": "Single-origin pour-over."},
            {"name": "Sourdough Croissant", "description": "Freshly baked daily."}
        ],
        "cta": "Visit & Inquire"
    }

    for t_id in ids:
        payload = {
            "business_data": sample_b,
            "content": sample_c,
            "template_id": t_id
        }
        gen_res = client.post("/generate-html", json=payload)
        assert gen_res.status_code == 200, f"Failed for {t_id}: {gen_res.text}"
        data = gen_res.json()
        assert data.get("html") and len(data["html"]) > 1000
        print(f"  [OK] Template '{t_id}': OK, size = {data.get('size_bytes')} bytes")

    print("\n--- 4. Testing POST /update-business ---")
    upd_res = client.post("/update-business", json={
        "business_data": sample_b,
        "field": "business_name",
        "value": "Bean & Bloom Roastery"
    })
    assert upd_res.status_code == 200
    assert upd_res.json()["data"]["business_name"] == "Bean & Bloom Roastery"
    print("  [OK] Clarification update: OK")

    print("\nALL INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_all()
