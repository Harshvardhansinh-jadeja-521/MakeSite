import json
from fastapi.testclient import TestClient
import main
from validation import (
    is_gibberish_word,
    has_keyboard_walk,
    validate_initial_description,
    validate_business_name,
    validate_category,
    validate_location,
    validate_contact,
    clean_speech_to_text,
)

client = TestClient(main.app)

def run_tests():
    print("==================================================")
    print("MakeSite Smart Context-Aware Validation Test Suite")
    print("==================================================")

    # ----------------------------------------------------
    # 1. Low-Level Python Rule Checks
    # ----------------------------------------------------
    print("\n--- 1. Testing Keyboard Walk & Gibberish Heuristics ---")
    assert is_gibberish_word("asdfghjkl") is True, "asdfghjkl should be gibberish"
    assert is_gibberish_word("ajhsdahj") is True, "ajhsdahj should be gibberish"
    assert is_gibberish_word("qwertyuiop") is True, "qwertyuiop should be gibberish"
    assert is_gibberish_word("aaaaaaa") is True, "aaaaaaa should be gibberish"
    assert is_gibberish_word("bcdfghjkl") is True, "bcdfghjkl should be gibberish"
    
    # Legitimate names & words
    assert is_gibberish_word("Harsh") is False, "Harsh should not be gibberish"
    assert is_gibberish_word("Bakery") is False, "Bakery should not be gibberish"
    assert is_gibberish_word("KFC") is False, "KFC should not be gibberish"
    assert is_gibberish_word("3M") is False, "3M should not be gibberish"
    assert is_gibberish_word("Nike") is False, "Nike should not be gibberish"
    assert is_gibberish_word("Cafe") is False, "Cafe should not be gibberish"
    assert is_gibberish_word("salad") is False, "salad should not be gibberish"
    print("  [OK] Keyboard walk and gibberish word detection verified.")

    # ----------------------------------------------------
    # 2. Speech-to-Text Conversational Prefix Stripping
    # ----------------------------------------------------
    print("\n--- 2. Testing Speech-to-Text Conversational Cleaning ---")
    assert clean_speech_to_text("My business name is Harsh Cyber Cafe") == "Harsh Cyber Cafe"
    assert clean_speech_to_text("It is called Golden Crust") == "Golden Crust"
    assert clean_speech_to_text("We are an artisan bakery") == "Artisan Bakery" or clean_speech_to_text("We are an artisan bakery").lower() == "artisan bakery"
    assert clean_speech_to_text("We are located in Bandra West, Mumbai") == "Bandra West, Mumbai"
    assert clean_speech_to_text("Our phone number is 9876543210") == "9876543210"
    print("  [OK] Speech-to-text natural conversational prefixes cleaned.")

    # ----------------------------------------------------
    # 3. Initial Description Validation (Fast pre-checks & /extract)
    # ----------------------------------------------------
    print("\n--- 3. Testing Initial Description Rejection (/extract) ---")
    invalid_prompts = [
        "ajhsdahj",
        "asdfghjkl",
        "1234567890",
        "aaaaaaa",
        "qwerty",
    ]
    for prompt in invalid_prompts:
        resp = client.post("/extract", json={"description": prompt})
        assert resp.status_code == 400, f"Expected 400 for '{prompt}', got {resp.status_code}"
        data = resp.json()
        assert data.get("error") == "Invalid business description"
        assert len(data.get("detail", "")) > 10
        print(f"  [OK] Successfully rejected gibberish prompt: '{prompt}' with friendly message: {data['detail'][:45]}...")

    # Legitimate descriptions should pass
    print("\n--- Testing Valid Business Descriptions (/extract) ---")
    valid_prompts = [
        "Artisan Bakery in Chicago called Golden Crust baking sourdough bread and pastries. Contact: +1 (312) 555-0199 or hello@goldencrust.com",
        "Mera naam Harsh hai. Mai Harsh Cyber Cafe chalata hu CG Road Ahmedabad mai. We are open 9:00 AM to 10:00 PM. Phone: +91 9876543210.",
    ]
    for prompt in valid_prompts:
        resp = client.post("/extract", json={"description": prompt})
        assert resp.status_code == 200, f"Expected 200 for valid prompt, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["data"]["business_name"] is not None
        assert data["data"]["contact"] is not None
        print(f"  [OK] Extracted valid business: '{data['data']['business_name']}' | contact: '{data['data']['contact']}'")

    # ----------------------------------------------------
    # 4. Clarification Field Updates (/update-business)
    # ----------------------------------------------------
    print("\n--- 4. Testing Context-Aware Clarification Validation (/update-business) ---")
    sample_initial = {
        "business_name": "Harsh Cyber Cafe",
        "category": "Cyber Cafe",
        "location": "Ahmedabad",
        "contact": None,
        "hours": "9am-9pm",
        "products": ["Printing", "Scanning"],
    }

    # 4a. Reject gibberish contact and preserve existing data
    invalid_contacts = ["asdfghjkl", "ajhsdahj", "123", "none", "call me"]
    for inv_c in invalid_contacts:
        resp = client.post("/update-business", json={
            "business_data": sample_initial,
            "field": "contact",
            "value": inv_c
        })
        assert resp.status_code == 400, f"Expected 400 for invalid contact '{inv_c}', got {resp.status_code}"
        data = resp.json()
        assert "Invalid Contact" in data.get("error", "")
        print(f"  [OK] Rejected invalid contact '{inv_c}': {data.get('detail')[:50]}...")

    # 4b. Accept valid contact (phone or email or speech-to-text)
    valid_contacts = [
        "+91 9876543210",
        "022-26001234",
        "hello@goldencrust.com",
        "Call us at 9876543210",
    ]
    for val_c in valid_contacts:
        resp = client.post("/update-business", json={
            "business_data": sample_initial,
            "field": "contact",
            "value": val_c
        })
        assert resp.status_code == 200, f"Expected 200 for valid contact '{val_c}', got {resp.status_code}: {resp.text}"
        res_data = resp.json()
        assert res_data["data"]["contact"] is not None
        assert "contact" not in res_data["missing_fields"]
        print(f"  [OK] Accepted valid contact '{val_c}' -> cleaned: '{res_data['data']['contact']}'")

    # 4c. Reject gibberish business names
    invalid_names = ["asdfghjkl", "ajhsdahj", "1234567890", "none", "test"]
    for inv_n in invalid_names:
        resp = client.post("/update-business", json={
            "business_data": sample_initial,
            "field": "business_name",
            "value": inv_n
        })
        assert resp.status_code == 400, f"Expected 400 for invalid name '{inv_n}', got {resp.status_code}"
        print(f"  [OK] Rejected invalid name '{inv_n}': {resp.json().get('detail')[:50]}...")

    # 4d. Accept legitimate & Hinglish business names
    valid_names = [
        "Nike",
        "3M",
        "KFC",
        "Studio 54",
        "Sharma Sweets",
        "Chai Sutta Bar",
        "My business name is Sunrise Bakery",
    ]
    for val_n in valid_names:
        resp = client.post("/update-business", json={
            "business_data": sample_initial,
            "field": "business_name",
            "value": val_n
        })
        assert resp.status_code == 200, f"Expected 200 for valid name '{val_n}', got {resp.status_code}: {resp.text}"
        print(f"  [OK] Accepted legitimate name '{val_n}' -> cleaned: '{resp.json()['data']['business_name']}'")

    # 4e. Category validation: reject numbers, gibberish, and plain city names
    invalid_categories = ["asdfghjkl", "123456", "Mumbai"]
    for inv_cat in invalid_categories:
        resp = client.post("/update-business", json={
            "business_data": sample_initial,
            "field": "category",
            "value": inv_cat
        })
        assert resp.status_code == 400, f"Expected 400 for category '{inv_cat}', got {resp.status_code}"
        print(f"  [OK] Rejected invalid category '{inv_cat}': {resp.json().get('detail')[:50]}...")

    # Accept valid & Hinglish categories
    valid_categories = ["Artisan Cafe", "Cyber Cafe", "Chai ki tapri", "Fitness Studio", "We are an artisan bakery"]
    for val_cat in valid_categories:
        resp = client.post("/update-business", json={
            "business_data": sample_initial,
            "field": "category",
            "value": val_cat
        })
        assert resp.status_code == 200, f"Expected 200 for category '{val_cat}', got {resp.status_code}: {resp.text}"
        print(f"  [OK] Accepted valid category '{val_cat}' -> cleaned: '{resp.json()['data']['category']}'")

    # 4f. Location validation
    invalid_locations = ["asdfghjkl", "123456789", "9876543210"]
    for inv_loc in invalid_locations:
        resp = client.post("/update-business", json={
            "business_data": sample_initial,
            "field": "location",
            "value": inv_loc
        })
        assert resp.status_code == 400, f"Expected 400 for location '{inv_loc}', got {resp.status_code}"
        print(f"  [OK] Rejected invalid location '{inv_loc}': {resp.json().get('detail')[:50]}...")

    # Accept valid locations
    valid_locations = ["Bandra, Mumbai", "CG Road, Ahmedabad", "Chicago, IL", "Online / Remote", "Nationwide across India"]
    for val_loc in valid_locations:
        resp = client.post("/update-business", json={
            "business_data": sample_initial,
            "field": "location",
            "value": val_loc
        })
        assert resp.status_code == 200, f"Expected 200 for location '{val_loc}', got {resp.status_code}: {resp.text}"
        print(f"  [OK] Accepted valid location '{val_loc}' -> cleaned: '{resp.json()['data']['location']}'")

    # ----------------------------------------------------
    # 5. Guard Website Generation
    # ----------------------------------------------------
    print("\n--- 5. Testing Website Generation Guards ---")
    incomplete_profile = {
        "business_name": "Golden Crust",
        "category": "Artisan Bakery",
        "location": "Chicago",
        "contact": None,  # Contact missing!
        "hours": "9am-5pm",
        "products": ["Sourdough"]
    }
    content_payload = {
        "hero_title": "Fresh Artisan Bread",
        "hero_description": "Baked daily in Chicago.",
        "about": "Our bakery story.",
        "services": [{"name": "Sourdough", "description": "Fresh bread"}],
        "cta": "Contact Us"
    }

    # /generate-content should reject when contact is missing
    gc_resp = client.post("/generate-content", json=incomplete_profile)
    assert gc_resp.status_code == 400, f"Expected 400 for /generate-content with missing contact, got {gc_resp.status_code}"
    print(f"  [OK] /generate-content guarded: {gc_resp.json().get('detail')[:55]}...")

    # /generate-html should reject when contact is missing
    gh_resp = client.post("/generate-html", json={
        "business_data": incomplete_profile,
        "content": content_payload,
        "template_id": "modern-dark"
    })
    assert gh_resp.status_code == 400, f"Expected 400 for /generate-html with missing contact, got {gh_resp.status_code}"
    print(f"  [OK] /generate-html guarded: {gh_resp.json().get('detail')[:55]}...")

    # Succeeded when all required fields are valid
    complete_profile = dict(incomplete_profile)
    complete_profile["contact"] = "+1 (312) 555-0199"

    gh_ok = client.post("/generate-html", json={
        "business_data": complete_profile,
        "content": content_payload,
        "template_id": "modern-dark"
    })
    assert gh_ok.status_code == 200, f"Expected 200 for /generate-html with complete profile, got {gh_ok.status_code}: {gh_ok.text}"
    assert len(gh_ok.json().get("html", "")) > 1000
    print("  [OK] /generate-html succeeded when all required fields are validated!")

    print("\n==================================================")
    print("ALL SMART VALIDATION TESTS PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
