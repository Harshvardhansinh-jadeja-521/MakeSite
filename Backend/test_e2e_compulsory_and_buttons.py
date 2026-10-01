import urllib.request
import json
import sys

API_BASE = "http://127.0.0.1:8000"

def test_api():
    print("==================================================")
    print("MakeSite E2E Validation: Compulsory Contact & Buttons")
    print("==================================================")

    # 1. Health check
    req = urllib.request.Request(f"{API_BASE}/health")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Health check failed with {resp.status}"
        data = json.loads(resp.read().decode())
        print(f"[OK] API Health: {data['status']}, Groq: {data['groq_api_status']}")

    # 2. Extract without contact info -> MUST flag contact in missing_fields
    no_contact_prompt = "Artisan Bakery in Chicago called Golden Crust baking sourdough bread and croissants"
    payload = json.dumps({"description": no_contact_prompt}).encode('utf-8')
    req = urllib.request.Request(f"{API_BASE}/extract", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        missing = res.get("missing_fields", [])
        is_comp = res.get("is_complete", False)
        print(f"[OK] Prompt without contact details:")
        print(f"     is_complete: {is_comp}")
        print(f"     missing_fields: {missing}")
        assert "contact" in missing, "CRITICAL: 'contact' MUST be in missing_fields when not provided!"
        assert not is_comp, "CRITICAL: is_complete must be False when contact is missing!"

    # 3. Extract with contact info -> MUST be complete
    with_contact_prompt = "Artisan Bakery in Chicago called Golden Crust baking sourdough bread. Contact: +1 (312) 555-0199 or hello@goldencrust.com"
    payload = json.dumps({"description": with_contact_prompt}).encode('utf-8')
    req = urllib.request.Request(f"{API_BASE}/extract", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        data = res.get("data", {})
        missing = res.get("missing_fields", [])
        is_comp = res.get("is_complete", False)
        print(f"[OK] Prompt with contact details:")
        print(f"     contact field: {data.get('contact')}")
        print(f"     is_complete: {is_comp}")
        print(f"     missing_fields: {missing}")
        assert data.get("contact") is not None and len(data.get("contact")) > 0, "Contact must be extracted!"
        assert "contact" not in missing, "Contact should not be in missing_fields when provided!"

    # 4. Generate website HTML for all 7 templates and verify buttons + #contact section
    templates = [
        "modern-dark",
        "minimal-clean",
        "vibrant-gradient",
        "corporate-pro",
        "warm-artisan",
        "emerald-wellness",
        "tech-bold"
    ]

    print("\n--- Verifying Buttons & #contact In All 7 Templates ---")
    for t_id in templates:
        gen_payload = json.dumps({
            "business_data": {
                "business_name": "Golden Crust Bakery",
                "category": "Artisan Bakery",
                "location": "Chicago, IL",
                "contact": "+1 (312) 555-0199 | hello@goldencrust.com",
                "hours": "Tue-Sun: 6:00 AM - 4:00 PM",
                "products": ["Sourdough Boule", "Butter Croissant", "Brioche"]
            },
            "content": {
                "hero_title": "Handcrafted Organic Breads & Viennoiserie",
                "hero_description": "Slow-fermented artisan loaves and flaky French pastries baked daily.",
                "cta": "Connect With Our Bakers"
            },
            "template_id": t_id
        }).encode('utf-8')

        req = urllib.request.Request(f"{API_BASE}/generate-html", data=gen_payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            html_res = json.loads(resp.read().decode())
            html = html_res.get("html", "")
            
            # Button target checks
            assert 'id="contact"' in html, f"Template {t_id} missing id=\"contact\" section!"
            assert 'href="#contact"' in html, f"Template {t_id} missing href=\"#contact\" buttons!"
            assert 'scroll-behavior: smooth' in html or 'scrollBehavior' in html, f"Template {t_id} missing smooth scroll!"
            assert 'btn-copy-contact' in html, f"Template {t_id} missing 1-click copy button!"
            assert 'copyContactInfo' in html or 'navigator.clipboard' in html, f"Template {t_id} missing offline clipboard script!"
            assert 'highlight-pulse' in html, f"Template {t_id} missing button click highlight pulse animation!"
            assert 'target="_blank"' not in html, f"Template {t_id} contains forbidden target='_blank' redirects!"
            
            print(f"[OK] {t_id:18}: #contact anchor present, smooth scrolling active, copy button embedded, zero redirects")

    print("\n==================================================")
    print("ALL TESTS PASSED! Fixes are 100% operational.")
    print("==================================================")

if __name__ == "__main__":
    test_api()
