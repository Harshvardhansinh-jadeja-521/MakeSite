"""
Test verification for MakeSite Industry Archetypes:
Verifies that salons, cafes, boutiques, tuition classes, local services, and consultants
render genuinely distinct sections, content structures, and calls to action.
"""

from archetypes import (
    detect_industry_archetype,
    get_archetype_html_sections,
)
from website_generator import generate_standalone_website_html


def test_archetype_detection():
    cases = [
        ("Hair Salon & Luxury Spa", "Aura Spa", "salon"),
        ("Artisan Café and Roastery", "Blue Tokai Coffee", "cafe"),
        ("Designer Saree Boutique & Couture", "Ritu Kumar Studio", "boutique"),
        ("IIT-JEE Coaching & Tuition Classes", "Apex Science Academy", "tuition"),
        ("Emergency AC Repair & Plumbing", "QuickFix Local Technicians", "local_service"),
        ("Wealth Management & Legal Advisory", "Fiduciary Wealth Partners", "consultant"),
    ]
    for cat, name, expected in cases:
        detected = detect_industry_archetype(cat, name, [])
        assert detected == expected, f"Expected {expected} for '{cat} {name}', got {detected}"
    print("[OK] All 6 industry archetypes detected accurately.")


def test_archetype_sections_structure():
    # 1. Salon
    salon_res = get_archetype_html_sections(
        "salon", "Aura Spa", "Bandra, Mumbai", "10 AM - 8 PM", "+91 98765 43210", []
    )
    assert salon_res["hero_cta"] == "Book Treatment Slot"
    assert salon_res["hero_target"] == "#book-appointment"
    salon_html = salon_res["body_sections"]
    assert 'id="treatment-menu"' in salon_html
    assert 'id="stylists"' in salon_html
    assert 'id="hygiene"' in salon_html
    assert 'id="book-appointment"' in salon_html
    assert "⏱️" in salon_html and "₹" in salon_html
    print("[OK] Salon layout contains Treatment Menu, Stylists, Hygiene, and Booking Widget.")

    # 2. Café
    cafe_res = get_archetype_html_sections(
        "cafe", "Blue Tokai Roastery", "Indiranagar, Bangalore", "7 AM - 11 PM", "+91 98765 43210", []
    )
    assert cafe_res["hero_cta"] == "View Food & Drink Menu"
    assert cafe_res["hero_target"] == "#cafe-menu"
    cafe_html = cafe_res["body_sections"]
    assert 'id="cafe-menu"' in cafe_html
    assert 'id="roast-spotlight"' in cafe_html
    assert 'id="directions"' in cafe_html
    assert 'id="table-reservation"' in cafe_html
    assert "Google Maps" in cafe_html
    print("[OK] Café layout contains Roast Spotlight, Categorized Menu, Directions & Transit, and Table Reservation.")

    # 3. Boutique
    boutique_res = get_archetype_html_sections(
        "boutique", "Ananya Atelier", "Colaba, Mumbai", "11 AM - 8 PM", "+91 98765 43210", []
    )
    assert boutique_res["hero_cta"] == "Explore Lookbook"
    assert boutique_res["hero_target"] == "#lookbook"
    boutique_html = boutique_res["body_sections"]
    assert 'id="lookbook"' in boutique_html
    assert 'id="craft"' in boutique_html
    assert 'id="fitting"' in boutique_html
    print("[OK] Boutique layout contains Lookbook, Artisan Craft Story, and Private Fitting Suite Form.")

    # 4. Tuition
    tuition_res = get_archetype_html_sections(
        "tuition", "Prerna Coaching Classes", "Kothrud, Pune", "4 PM - 9 PM", "+91 98765 43210", []
    )
    assert tuition_res["hero_cta"] == "Book Free Demo Class"
    assert tuition_res["hero_target"] == "#demo-class"
    tuition_html = tuition_res["body_sections"]
    assert 'id="results"' in tuition_html
    assert 'id="curriculum"' in tuition_html
    assert 'id="faculty"' in tuition_html
    assert 'id="demo-class"' in tuition_html
    assert "98.4%" in tuition_html
    print("[OK] Tuition layout contains Distinction Stats, Curriculum Batches, Faculty Credentials, and Demo Class Form.")

    # 5. Local Services
    local_res = get_archetype_html_sections(
        "local_service", "Express Emergency Plumbing & AC", "Sector 18, Noida", "24/7", "+91 98765 43210", []
    )
    assert "Call On-Duty Tech" in local_res["hero_cta"] or "Dispatch" in local_res["hero_cta"]
    local_html = local_res["body_sections"]
    assert 'id="emergency-ribbon"' in local_html
    assert 'id="pricing-guide"' in local_html
    assert 'id="coverage"' in local_html
    assert 'id="guarantees"' in local_html
    assert 'id="dispatch-form"' in local_html
    assert "24/7" in local_html
    print("[OK] Local Services layout contains Emergency Ribbon, Fixed Rate Card, Coverage, and Dispatch Request Form.")

    # 6. Consultant
    consultant_res = get_archetype_html_sections(
        "consultant", "Apex Strategic Wealth Advisory", "BKC, Mumbai", "9 AM - 6 PM", "+91 98765 43210", []
    )
    assert consultant_res["hero_cta"] == "Schedule 15-Min Discovery Call"
    assert consultant_res["hero_target"] == "#discovery-call"
    consultant_html = consultant_res["body_sections"]
    assert 'id="fiduciary-oath"' in consultant_html
    assert 'id="practice-areas"' in consultant_html
    assert 'id="case-studies"' in consultant_html
    assert 'id="credentials"' in consultant_html
    assert 'id="discovery-call"' in consultant_html
    assert "Fiduciary" in consultant_html
    print("[OK] Consultant layout contains Fiduciary Oath, Practice Pillars, Case Studies, Credentials, and Discovery Call Scheduler.")


def test_standalone_generator_injection():
    business = {
        "business_name": "Luxe Salon & Spa",
        "category": "Salon & Spa Sanctuary",
        "location": "Juhu, Mumbai",
        "hours": "10:00 AM - 8:30 PM",
        "contact": "+91 99887 76655",
        "products": ["Organic Balayage Hair Spa", "Aromatherapy Deep Tissue Massage"]
    }
    content = {
        "hero_title": "Sanctuary Spa in Juhu",
        "hero_description": "Restorative botanical rituals.",
        "about": "A peaceful oasis in Mumbai.",
        "cta": "Book Treatment Slot",
        "services": [{"name": "Hair Spa", "description": "Keratin care"}],
        "features": ["Private suites", "Clean formulas"],
        "faqs": [{"question": "Do I need an appointment?", "answer": "Walk-ins are welcomed, bookings prioritized."}]
    }
    html = generate_standalone_website_html(business, content, "emerald-wellness")
    assert 'id="treatment-menu"' in html
    assert 'id="book-appointment"' in html
    assert "Book Treatment Slot" in html
    print("[OK] Standalone website generator properly injects archetype sections into full template HTML.")


if __name__ == "__main__":
    print("=" * 50)
    print("RUNNING INDUSTRY ARCHETYPES VERIFICATION SUITE")
    print("=" * 50)
    test_archetype_detection()
    test_archetype_sections_structure()
    test_standalone_generator_injection()
    print("=" * 50)
    print("ALL 6 INDUSTRY ARCHETYPE TESTS PASSED 100%!")
    print("=" * 50)
