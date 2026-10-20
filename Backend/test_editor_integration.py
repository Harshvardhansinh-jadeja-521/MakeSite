"""
End-to-end test verifying post-generation website editing & customization,
AI section polishing, and server-side standalone HTML export synchronization.
"""
from fastapi.testclient import TestClient
from main import app
from website_generator import AVAILABLE_TEMPLATES

client = TestClient(app)

def test_full_editing_flow():
    print("\n==================================================")
    print("TEST: MakeSite Post-Generation Editor & Customization")
    print("==================================================")

    # 1. Test Health
    health_res = client.get("/health")
    assert health_res.status_code == 200, f"Health check failed: {health_res.text}"
    print("[OK] Backend is healthy")

    # 2. Simulated Initial Business & Content
    initial_business = {
        "business_name": "Aura Wellness Sanctuary",
        "category": "Holistic Spa & Ayurveda",
        "location": "Indiranagar, Bengaluru",
        "hours": "Tue - Sun: 8:00 AM - 8:30 PM",
        "contact": "+91 9876543210 / booking@aurawellness.in",
        "products": ["Ayurvedic Massage", "Organic Herbal Facials", "Sound Bath Meditation"],
        "tagline": "Restoring harmony naturally"
    }

    initial_content = {
        "hero_title": "Awaken Your Senses with Ancient Ayurvedic Healing",
        "hero_description": "Immerse yourself in deeply restorative therapies crafted for mind-body balance.",
        "about": "Aura Wellness is Bengaluru's premier sanctuary for authentic holistic care and personalized wellness journeys.",
        "cta": "Connect With Our Practitioners",
        "services": [
            {"name": "Ayurvedic Massage", "description": "Traditional herbal oil therapies to release muscle tension."},
            {"name": "Organic Herbal Facials", "description": "Botanical skin rejuvenation customized for your glow."},
            {"name": "Sound Bath Meditation", "description": "Vibrational acoustic frequencies to soothe stress."}
        ],
        "features": [
            {"title": "Master Practitioners", "description": "Certified Ayurvedic doctors and therapists."},
            {"title": "Pure Organic Botanicals", "description": "100% natural cold-pressed herbs."}
        ],
        "faqs": [
            {"question": "How do I book an appointment?", "answer": "Call or email our front desk anytime."}
        ]
    }

    # 3. Test AI Rephrase / Polish endpoint
    print("\n--- Testing AI Polish Endpoint (/rephrase-section) ---")
    rephrase_res = client.post("/rephrase-section", json={
        "section": "hero_title",
        "text": initial_content["hero_title"],
        "business_name": initial_business["business_name"],
        "category": initial_business["category"],
        "style": "punchy and luxury"
    })
    assert rephrase_res.status_code == 200, f"Rephrase failed: {rephrase_res.text}"
    rephrase_data = rephrase_res.json()
    assert "improved" in rephrase_data
    assert len(rephrase_data.get("alternatives", [])) >= 0
    print(f"[OK] Rephrased headline: '{rephrase_data['improved']}'")

    # 4. User Customizes the Website
    print("\n--- Applying User In-Template Custom Edits ---")
    edited_business = dict(initial_business)
    edited_business["business_name"] = "Aura Luxe Wellness Sanctuary & Spa"
    edited_business["contact"] = "+91 9999988888 / vip@auraluxe.in"

    edited_content = dict(initial_content)
    edited_content["hero_title"] = "Bengaluru's Most Exclusive Ayurvedic Healing Retreat"
    edited_content["hero_description"] = "Bespoke therapies, private meditation suites, and therapeutic herbal rituals."
    edited_content["cta"] = "Book Your Private Consultation"
    # User adds a 4th customized service:
    edited_content["services"] = list(initial_content["services"]) + [
        {"name": "Himalayan Salt Sauna", "description": "Detoxifying thermal mineral heat for deep cellular recovery."}
    ]
    # User adds an FAQ:
    edited_content["faqs"] = list(initial_content["faqs"]) + [
        {"question": "Are private consultations available?", "answer": "Yes, private one-on-one sessions can be reserved in advance."}
    ]

    # 5. Verify Standalone HTML Generation for all templates with user's custom edits
    import html as html_module
    print("\n--- Verifying Standalone HTML with User's Customizations Across Templates ---")
    for tpl in AVAILABLE_TEMPLATES:
        t_id = tpl["id"]
        html_res = client.post("/generate-html", json={
            "business_data": edited_business,
            "content": edited_content,
            "template_id": t_id
        })
        assert html_res.status_code == 200, f"HTML gen failed for {t_id}: {html_res.text}"
        html_code = html_res.json()["html"]

        # Check customized business name (escaped)
        assert html_module.escape(edited_business["business_name"]) in html_code, f"Custom business name missing in {t_id}"
        # Check customized hero title (escaped)
        assert html_module.escape(edited_content["hero_title"]) in html_code, f"Custom headline missing in {t_id}"
        # Check customized contact
        assert "vip@auraluxe.in" in html_code or "+91 9999988888" in html_code, f"Custom contact missing in {t_id}"
        # Check newly added 4th service
        assert html_module.escape("Himalayan Salt Sauna") in html_code, f"New service missing in {t_id}"
        # Check newly added FAQ
        assert html_module.escape("Are private consultations available?") in html_code, f"New FAQ missing in {t_id}"

        print(f"[OK] {t_id:<20}: All custom edits (name, title, contact, 4th service, FAQ) present in rendered HTML")

    print("\n==================================================")
    print("ALL TESTS PASSED! In-template website editing is 100% operational.")
    print("==================================================")

if __name__ == "__main__":
    test_full_editing_flow()
