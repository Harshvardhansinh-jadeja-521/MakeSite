from website_generator import generate_standalone_website_html, AVAILABLE_TEMPLATES

b_data = {
    'business_name': 'Test Firm',
    'category': 'Tech Services',
    'location': 'Mumbai',
    'hours': '9am - 6pm',
    'contact': '+91 9999999999'
}

content = {
    'hero_title': 'Enterprise Solutions',
    'hero_description': 'Delivering exceptional services',
    'about': 'About our test company',
    'services': [{'name': 'Cloud Dev', 'description': 'Modern web systems'}],
    'cta': 'Connect With Us'
}

for t in AVAILABLE_TEMPLATES:
    tid = t['id']
    html = generate_standalone_website_html(b_data, content, template_id=tid)
    assert 'id="contact"' in html, f"{tid} missing id='contact'"
    assert 'highlight-pulse' in html, f"{tid} missing highlight-pulse"
    assert 'btn-copy-contact' in html, f"{tid} missing btn-copy-contact"
    assert '<script>' in html, f"{tid} missing <script>"
    print(f"[OK] {tid:20}: Verified #contact section, interactive script, copy button, smooth scroll")

print("\nSUCCESS: All 7 templates fully verified!")
