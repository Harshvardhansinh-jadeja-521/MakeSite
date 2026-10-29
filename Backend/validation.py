import os
import re
import math
import logging
from collections import Counter
from typing import Optional, Tuple, Dict, Any, List
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("makesite.validation")

# Common vowels (including 'y' as semi-vowel in English/Hinglish)
VOWELS = set("aeiouyAEIOUY")

# Keyboard sequences for walk detection (QWERTY layout & diagonals)
KEYBOARD_SEQUENCES = [
    "1234567890",
    "0987654321",
    "qwertyuiop",
    "poiuytrewq",
    "asdfghjkl",
    "lkjhgfdsa",
    "zxcvbnm",
    "mnbvcxz",
    "qazwsxedcrfvtgbyhnujmikolp",
    "plmoknijbuhvygctfxrdzsewaq",
    "1qa2ws3ed4rf5tg6yh7uj8ik9ol0p",
]

# Home row characters (where two-handed mashing occurs, e.g. ajhsdahj, asdfgh)
HOME_ROW = set("asdfghjkl")

# Common words made only of home row letters that are valid English words
VALID_HOME_ROW_WORDS = {
    "salad", "flash", "flask", "glass", "hall", "fall", "dash", "half",
    "slag", "flag", "gash", "lash", "hash", "fall", "glad", "shad", "sash"
}

# Known acronyms or abbreviations that have few/no vowels
LEGITIMATE_ACRONYMS = {
    "kfc", "bmw", "hdfc", "sbi", "tcs", "dlf", "mrf", "pvr", "bbl", "ibm",
    "hp", "lg", "jcb", "cng", "png", "atm", "dhl", "ups", "b2b", "b2c",
    "gym", "dry", "sky", "fly", "by", "my", "tv", "it", "ai", "pr", "hr"
}

# Recognized common business categories / industries across English & Hinglish
KNOWN_CATEGORY_KEYWORDS = {
    "bakery", "cafe", "coffee", "restaurant", "bistro", "diner", "eatery",
    "dhaba", "bar", "pub", "brewery", "roastery", "sweet", "sweets", "mithai",
    "namkeen", "snack", "snacks", "tea", "chai", "tapri", "fast food",
    "cyber cafe", "internet cafe", "xerox", "printing", "stationery",
    "it", "software", "tech", "technology", "web", "digital", "consulting",
    "financial", "finance", "wealth", "accounting", "tax", "audit", "insurance",
    "salon", "beauty", "parlour", "parlor", "spa", "barber", "grooming",
    "gym", "fitness", "yoga", "crossfit", "martial arts", "wellness",
    "clinic", "dental", "dentist", "doctor", "hospital", "pharmacy", "chemist",
    "medical", "therapy", "physiotherapy", "ayurveda", "homeopathy",
    "boutique", "fashion", "apparel", "clothing", "tailor", "tailoring",
    "textile", "garments", "footwear", "shoes", "jewellery", "jewelry",
    "kirana", "grocery", "provision", "supermarket", "mart", "store",
    "retail", "wholesale", "trading", "distributor", "hardware", "electrical",
    "plumbing", "contractor", "construction", "real estate", "property", "interior",
    "automotive", "garage", "repair", "mechanic", "car wash", "auto", "bike",
    "photography", "studio", "videography", "media", "production", "marketing",
    "education", "coaching", "tuition", "tutor", "school", "academy", "classes",
    "logistics", "courier", "transport", "travel", "tourism", "hotel", "resort",
    "homestay", "catering", "event", "events", "decor", "florist", "flowers",
    "pet", "veterinary", "vet", "cleaning", "laundry", "dry cleaning", "security",
    "dukaan", "shop", "service", "services", "agency", "firm", "solutions",
    "hub", "enterprises", "associates", "works", "industries"
}


class ValidationResult(BaseModel):
    valid: bool
    error: Optional[str] = None
    cleaned_value: Optional[str] = None
    field: Optional[str] = None


def shannon_entropy(s: str) -> float:
    """Calculates Shannon entropy for string complexity measurement."""
    if not s:
        return 0.0
    counts = Counter(s.lower())
    length = len(s)
    return -sum((c / length) * math.log2(c / length) for c in counts.values())


def has_keyboard_walk(text: str, min_run: int = 4) -> bool:
    """Detects sequential QWERTY keyboard runs like 'asdfghjkl' or '123456'."""
    clean = re.sub(r"[^a-zA-Z0-9]", "", text.lower())
    if len(clean) < min_run:
        return False
    for seq in KEYBOARD_SEQUENCES:
        for i in range(len(clean) - min_run + 1):
            sub = clean[i : i + min_run]
            if sub in seq:
                return True
    return False


def is_repeated_char_spam(text: str) -> bool:
    """Checks for repeated alphabetic characters (e.g. 'aaaaa', 'zzzz') or repeated 2-char loops."""
    clean = re.sub(r"[^a-zA-Z]", "", text.lower())
    if not clean:
        return False
    # 4+ identical consecutive alphabetic characters (e.g. 'aaaa', 'zzzz')
    if re.search(r"([a-zA-Z])\1{3,}", clean):
        return True
    # Repeating 2-3 char pattern >= 3 times in a single word/token e.g. 'asdasdasd', 'hahahaha'
    if len(clean) >= 6 and re.search(r"^([a-zA-Z]{2,3})\1{2,}$", clean):
        return True
    return False


def is_gibberish_word(word: str) -> bool:
    """
    Evaluates whether a single word is gibberish or keyboard mash.
    Handles English, Hinglish, acronyms, and legitimate short words.
    """
    clean = re.sub(r"[^a-zA-Z]", "", word).lower()
    if not clean:
        return False

    # Short acronyms (e.g. KFC, BMW, 3M, TCS)
    if clean in LEGITIMATE_ACRONYMS or (len(clean) <= 4 and word.isupper()):
        return False

    # Known home-row words (e.g. salad, flash)
    if clean in VALID_HOME_ROW_WORDS:
        return False

    # 1. Keyboard walk check (e.g. asdf, hjkl, qwerty)
    if len(clean) >= 4 and has_keyboard_walk(clean, min_run=4):
        return True

    # 2. Repeated characters
    if is_repeated_char_spam(clean):
        return True

    # 3. Consonant clusters: 5+ consecutive consonants is unpronounceable gibberish
    if re.search(r"[bcdfghjklmnpqrstvwxz]{5,}", clean):
        return True

    # 4. Zero vowels in words of 5+ letters
    vowel_count = sum(1 for c in clean if c in VOWELS)
    if len(clean) >= 5 and vowel_count == 0:
        return True

    # 5. Home row mashing: strings >= 6 chars composed solely of home-row keys (ajhsdahj, etc.)
    if len(clean) >= 6 and set(clean).issubset(HOME_ROW):
        # Home row only has 'a' as a vowel
        if vowel_count <= 2 and clean not in VALID_HOME_ROW_WORDS:
            return True

    # 6. Character diversity ratio (e.g. 'ababab', 'xxyyzz')
    if len(clean) >= 7:
        unique_ratio = len(set(clean)) / len(clean)
        if unique_ratio < 0.35:
            return True

    return False


def is_pure_numbers_or_noise(text: str) -> bool:
    """Detects strings that are just numbers or punctuation with no lexical content."""
    clean = text.strip()
    # Strip common punctuation
    no_punct = re.sub(r"[\s\.,\-_/\\#()!?:;'\"@+*&]", "", clean)
    if not no_punct:
        return True
    # Only numbers
    if no_punct.isdigit():
        return True
    return False


def clean_speech_to_text(text: str, field: Optional[str] = None) -> str:
    """
    Cleans natural spoken conversational prefixes from speech-to-text transcriptions.
    Example:
      'My business name is Harsh Cyber Cafe' -> 'Harsh Cyber Cafe'
      'Our phone number is 9876543210' -> '9876543210'
      'We are an artisan bakery' -> 'Artisan Bakery'
      'We are located in Bandra West' -> 'Bandra West'
    """
    val = text.strip()
    if not val:
        return ""

    # Common conversational opening prefixes
    prefixes = [
        r"^(?:(?:my|our|the)\s+)?(?:business\s+name|shop\s+name|company\s+name|brand\s+name)\s+(?:is|called)?\s*",
        r"^(?:it\s+is\s+called|we\s+are\s+called|called)\s+",
        r"^(?:our\s+category\s+is|category\s+is|we\s+are\s+a|we\s+are\s+an|we\s+operate\s+as\s+a|we\s+operate\s+as\s+an|it\s+is\s+a|it\s+is\s+an)\s+",
        r"^(?:we\s+are\s+located\s+in|located\s+in|our\s+location\s+is|location\s+is|we\s+operate\s+in|based\s+in|we\s+are\s+in|situated\s+in|hamari\s+dukaan|hamari\s+shop)\s+",
        r"^(?:(?:my|our|the)\s+)?(?:phone\s+number|mobile\s+number|contact\s+number|phone|mobile|contact|email)\s+(?:is|at)?\s*",
        r"^(?:call\s+us\s+at|reach\s+us\s+at|call\s+on|contact\s+us\s+at|reach\s+at|call\s+us)\s*",
        r"^(?:opening\s+hours\s+are|hours\s+are|timing\s+is|we\s+are\s+open|open\s+from)\s+",
        r"^(?:the\s+owner\s+is|owner\s+name\s+is|my\s+name\s+is|founder\s+is)\s+",
    ]

    for p in prefixes:
        val = re.sub(p, "", val, flags=re.IGNORECASE).strip()

    # Clean trailing conversational punctuation
    val = re.sub(r"[\.!\?]+$", "", val).strip()
    # Strip surrounding quotes
    val = re.sub(r"^['\"]+|['\"]+$", "", val).strip()

    return val


# ----------------------------------------------------
# Field-Specific Validation Functions
# ----------------------------------------------------

def validate_business_name(value: str) -> ValidationResult:
    """
    Validates business name.
    Accepts:
      - Legitimate names ("Bean & Bloom", "Golden Crust Bakery", "Harsh Cyber Cafe")
      - Short legitimate names ("Nike", "Apple", "KFC", "3M", "BMW", "Zara", "Cafe 99", "Studio 54", "A1 Bakery")
      - Hinglish / Indian names ("Raju Omelette", "Sharma General Store", "Chai Sutta Bar", "Desi Tadka", "Apna Salon")
    Rejects:
      - Keyboard mash ("asdfghjkl", "ajhsdahj", "qwerty")
      - Pure numbers ("1234567890", "987654")
      - Placeholders / noise ("none", "n/a", "no name", "test", "asdf")
    """
    cleaned = clean_speech_to_text(value, field="business_name")
    if not cleaned or len(cleaned) < 2:
        return ValidationResult(
            valid=False,
            error="Please enter a valid business name (at least 2 characters).",
            field="business_name"
        )

    if len(cleaned) > 100:
        return ValidationResult(
            valid=False,
            error="Business name is too long (maximum 100 characters).",
            field="business_name"
        )

    # Pure numbers rejection
    clean_digits = re.sub(r"[\s\-_.]", "", cleaned)
    if clean_digits.isdigit():
        return ValidationResult(
            valid=False,
            error="A business name cannot consist solely of numbers. If your brand includes numbers, please include letters (e.g., 'Studio 54' or '7-Eleven' or 'A1 Bakery').",
            field="business_name"
        )

    # Placeholder / noise rejection
    lower = cleaned.lower()
    placeholders = {"none", "null", "n/a", "na", "no name", "unknown", "test", "testing", "random", "nothing", "asdf", "xyz"}
    if lower in placeholders:
        return ValidationResult(
            valid=False,
            error=f"'{cleaned}' is not a valid business name. Please provide your actual trade or brand name.",
            field="business_name"
        )

    # Check words for gibberish
    words = cleaned.split()
    gibberish_count = 0
    for w in words:
        if is_gibberish_word(w):
            gibberish_count += 1

    if gibberish_count > 0 and gibberish_count == len(words):
        return ValidationResult(
            valid=False,
            error="The business name appears to contain unrecognized random characters or keyboard mashing. Please enter a genuine business name.",
            field="business_name"
        )

    return ValidationResult(valid=True, cleaned_value=cleaned, field="business_name")


KNOWN_CITIES = {
    "mumbai", "delhi", "new delhi", "bengaluru", "bangalore", "ahmedabad",
    "chicago", "new york", "london", "pune", "hyderabad", "chennai", "kolkata",
    "jaipur", "surat", "lucknow", "kanpur", "nagpur", "indore", "thane",
    "bhopal", "visakhapatnam", "patna", "vadodara", "ghaziabad", "ludhiana",
    "agra", "nashik", "faridabad", "meerut", "rajkot", "varanasi", "srinagar",
    "aurangabad", "dhanbad", "amritsar", "navi mumbai", "allahabad", "ranchi",
    "howrah", "coimbatore", "jabalpur", "gwalior", "vijayawada", "jodhpur",
    "madurai", "raipur", "kota", "guwahati", "chandigarh", "solapur", "noida",
    "gurgaon", "gurugram", "dehradun", "kochi", "cochin", "goa", "paris",
    "tokyo", "singapore", "dubai", "toronto", "san francisco", "seattle"
}


def validate_category(value: str) -> ValidationResult:
    """
    Validates business category / industry.
    Accepts:
      - Standard categories ("Artisan Cafe", "Cyber Cafe", "Bakery", "Financial Advisory", "Gym & Fitness")
      - Short answers ("Bakery", "Salon", "Retail", "Cafe")
      - Hinglish categories ("Chai aur nashta", "Kirana store", "Chai ki tapri", "Mithai shop", "Kapde ki dukaan")
    Rejects:
      - Keyboard mash ("asdfghjkl", "ajhsdahj")
      - Pure numbers ("123456")
      - Mistaken contact or location entries
    """
    cleaned = clean_speech_to_text(value, field="category")
    if not cleaned or len(cleaned) < 2:
        return ValidationResult(
            valid=False,
            error="Please enter a business category (e.g., 'Bakery', 'Cyber Cafe', 'Financial Services', 'Salon').",
            field="category"
        )

    if len(cleaned) > 80:
        return ValidationResult(
            valid=False,
            error="Category description is too long (maximum 80 characters).",
            field="category"
        )

    # Pure numbers
    if is_pure_numbers_or_noise(cleaned):
        return ValidationResult(
            valid=False,
            error="Category cannot be pure numbers. Please specify your industry (e.g., 'Cyber Cafe', 'Bakery', 'Retail').",
            field="category"
        )

    # City check (user entered location by mistake)
    if cleaned.lower() in KNOWN_CITIES:
        return ValidationResult(
            valid=False,
            error=f"It looks like you entered a city ('{cleaned}') instead of a business category. Please specify what your business does (e.g., 'Bakery', 'Cyber Cafe', 'Artisan Cafe', 'Retail Store').",
            field="category"
        )

    # Check if user entered phone or email
    if re.search(r"[\w\.-]+@[\w\.-]+\.\w+", cleaned) or re.search(r"\b\d{7,15}\b", cleaned):
        return ValidationResult(
            valid=False,
            error="It looks like you entered contact details instead of a business category. Please specify your trade or industry (e.g., 'Artisan Cafe' or 'Tech Services').",
            field="category"
        )

    # Check words for gibberish
    words = cleaned.split()
    gibberish_count = sum(1 for w in words if is_gibberish_word(w))
    if gibberish_count > 0 and (gibberish_count == len(words) or len(words) == 1):
        return ValidationResult(
            valid=False,
            error="The category contains unrecognized characters or keyboard mashing. Please provide a recognized trade or industry (e.g., 'Bakery', 'Cyber Cafe', 'Fitness Studio').",
            field="category"
        )

    # Format category cleanly (Title Case if short)
    formatted = cleaned.title() if len(cleaned.split()) <= 4 else cleaned
    return ValidationResult(valid=True, cleaned_value=formatted, field="category")


def validate_location(value: str) -> ValidationResult:
    """
    Validates physical location or operating region.
    Accepts:
      - Cities ("Mumbai", "Ahmedabad", "Chicago", "London", "Bengaluru")
      - Areas & Streets ("Bandra, Mumbai", "CG Road", "Connaught Place, New Delhi", "Downtown Chicago")
      - Landmarks ("Near Metro Station", "Opposite City Mall")
      - Remote / Online ("Online / Remote", "Nationwide across India", "Remote Worldwide")
      - Hinglish ("Bandra station ke pass", "CG road par")
    Rejects:
      - Keyboard mash ("asdfghjkl", "ajhsdahj")
      - Pure numbers ("1234567890")
      - Contact info
    """
    cleaned = clean_speech_to_text(value, field="location")
    if not cleaned or len(cleaned) < 2:
        return ValidationResult(
            valid=False,
            error="Please provide a valid location, city, or operating region (e.g., 'Bandra, Mumbai' or 'Online / Remote').",
            field="location"
        )

    if len(cleaned) > 120:
        return ValidationResult(
            valid=False,
            error="Location description is too long (maximum 120 characters).",
            field="location"
        )

    # Pure numbers rejection
    if is_pure_numbers_or_noise(cleaned):
        return ValidationResult(
            valid=False,
            error="Location cannot be just numbers. Please enter a city or address (e.g., 'CG Road, Ahmedabad' or 'Chicago, IL').",
            field="location"
        )

    # Contact info mistakenly entered
    if re.search(r"[\w\.-]+@[\w\.-]+\.\w+", cleaned) or re.search(r"\b\d{8,15}\b", cleaned):
        return ValidationResult(
            valid=False,
            error="It looks like you entered contact details. Please enter your physical city, area, or 'Online / Remote'.",
            field="location"
        )

    # Gibberish check
    words = cleaned.split()
    gibberish_count = sum(1 for w in words if is_gibberish_word(w))
    if gibberish_count > 0 and (gibberish_count == len(words) or len(words) == 1):
        return ValidationResult(
            valid=False,
            error="Location appears to contain random letters or keyboard mashing. Please enter a real city, street, or 'Online / Nationwide'.",
            field="location"
        )

    return ValidationResult(valid=True, cleaned_value=cleaned, field="location")


def validate_contact(value: str) -> ValidationResult:
    """
    Validates phone number or email address (Compulsory field).
    Accepts:
      - Phone: Indian 10-digit (+91 9876543210, 9876543210, 022-26001234), International (+1 (312) 555-0199)
      - Email: name@domain.com, contact@shop.in
      - Combined: +91 9876543210 / hello@domain.com
      - Speech-to-text: "Call us on 9876543210", "Email is contact at mysite dot com"
    Rejects:
      - Keyboard mash ("asdfghjkl", "ajhsdahj")
      - Short numbers ("123", "000")
      - Text without valid phone or email ("call me", "none", "na", "no contact")
    """
    cleaned = clean_speech_to_text(value, field="contact")
    if not cleaned:
        return ValidationResult(
            valid=False,
            error="Contact information is compulsory. Please enter a phone number or email address.",
            field="contact"
        )

    # Check for email pattern
    email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", cleaned)
    
    # Check for phone pattern (extract digit sequences)
    digits_only = re.sub(r"\D", "", cleaned)
    has_valid_phone = 7 <= len(digits_only) <= 16

    # Formatted phone pattern test (e.g. +91 9876543210, (312) 555-0199, 9876543210)
    phone_pattern = re.search(r"(\+?\d{1,4}[-.\s]?)?(\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}", cleaned)

    if not email_match and not (has_valid_phone and phone_pattern):
        # Specific friendly guidance
        if is_gibberish_word(cleaned) or is_repeated_char_spam(cleaned):
            return ValidationResult(
                valid=False,
                error="The contact information entered contains unrecognized random characters. Please provide an active phone number (e.g., '+91 9876543210') or email (e.g., 'hello@yourbusiness.com').",
                field="contact"
            )
        if len(digits_only) > 0 and len(digits_only) < 7:
            return ValidationResult(
                valid=False,
                error=f"The phone number provided ({digits_only}) is too short. Please enter a full phone number with area or country code (at least 7 to 10 digits).",
                field="contact"
            )
        return ValidationResult(
            valid=False,
            error="Please provide a valid phone number (e.g., '+91 9876543210') or email address (e.g., 'contact@yourdomain.com').",
            field="contact"
        )

    return ValidationResult(valid=True, cleaned_value=cleaned, field="contact")


def validate_hours(value: str) -> ValidationResult:
    """Validates operating hours."""
    cleaned = clean_speech_to_text(value, field="hours")
    if not cleaned:
        return ValidationResult(valid=True, cleaned_value=None, field="hours")

    if is_pure_numbers_or_noise(cleaned):
        return ValidationResult(
            valid=False,
            error="Please format your operating hours (e.g., '9:00 AM - 9:00 PM' or 'Mon-Sat 10am-7pm' or 'Open 24/7').",
            field="hours"
        )

    words = cleaned.split()
    gibberish_count = sum(1 for w in words if is_gibberish_word(w))
    if gibberish_count > 0 and gibberish_count == len(words):
        return ValidationResult(
            valid=False,
            error="Operating hours contain unrecognized characters. Example: '9:00 AM to 8:00 PM' or 'Open 24/7'.",
            field="hours"
        )

    return ValidationResult(valid=True, cleaned_value=cleaned, field="hours")


def validate_owner_name(value: str) -> ValidationResult:
    """Validates owner or founder name."""
    cleaned = clean_speech_to_text(value, field="owner_name")
    if not cleaned:
        return ValidationResult(valid=True, cleaned_value=None, field="owner_name")

    if is_pure_numbers_or_noise(cleaned):
        return ValidationResult(
            valid=False,
            error="Owner name cannot be numbers. Please enter the founder or owner's name (e.g., 'Harsh' or 'Priya Sharma').",
            field="owner_name"
        )

    words = cleaned.split()
    gibberish_count = sum(1 for w in words if is_gibberish_word(w))
    if gibberish_count > 0 and gibberish_count == len(words):
        return ValidationResult(
            valid=False,
            error="Owner name contains unrecognized random characters. Please enter a valid name.",
            field="owner_name"
        )

    return ValidationResult(valid=True, cleaned_value=cleaned.title(), field="owner_name")


def validate_products(value: Any) -> ValidationResult:
    """Validates products / services offerings."""
    if not value:
        return ValidationResult(valid=True, cleaned_value="", field="products")

    if isinstance(value, list):
        cleaned_list = []
        for item in value:
            s = str(item).strip()
            if s and not is_gibberish_word(s):
                cleaned_list.append(s)
        return ValidationResult(valid=True, cleaned_value=", ".join(cleaned_list), field="products")

    val_str = str(value).strip()
    if is_pure_numbers_or_noise(val_str):
        return ValidationResult(
            valid=False,
            error="Products or services cannot be just random numbers. Please describe what you offer (e.g., 'Espresso, Croissants, Sandwiches').",
            field="products"
        )

    words = val_str.split()
    gibberish_count = sum(1 for w in words if is_gibberish_word(w))
    if gibberish_count > 0 and gibberish_count == len(words):
        return ValidationResult(
            valid=False,
            error="Products or services list contains unrecognized random characters. Example: 'Color Printing, Xerox, Document Scanning'.",
            field="products"
        )

    return ValidationResult(valid=True, cleaned_value=val_str, field="products")


# ----------------------------------------------------
# Initial Business Description Pre-Validator
# ----------------------------------------------------

def validate_initial_description(description: str) -> Tuple[bool, Optional[str]]:
    """
    Pre-validates the initial freeform business description before calling Groq AI.
    Rejects:
      - Keyboard mash ('asdfghjkl', 'ajhsdahj')
      - Pure numbers ('1234567890')
      - Less than 10 characters or under 3 words
      - Repeated single characters ('aaaaaaa', 'zzzzz')
    Returns:
      (True, None) if plausible
      (False, "friendly error message") if invalid
    """
    clean = description.strip()
    if not clean:
        return False, "Please provide a description of your business to get started."

    # Minimum length
    if len(clean) < 10:
        return False, "Your description is too short. Please provide at least a sentence explaining what your business does, where you are located, or your business name."

    # Pure numbers
    if is_pure_numbers_or_noise(clean):
        return False, "Your description consists entirely of numbers or punctuation. Please describe your business in words (e.g., 'We operate a bakery in Chicago baking sourdough bread and pastries. Contact: 312-555-0199')."

    # Repeated character spam
    if is_repeated_char_spam(clean):
        return False, "Your input appears to contain repeated spam characters. Please describe your business with genuine details."

    # Check words for dominant gibberish
    words = clean.split()
    if len(words) < 2 and len(clean) < 18:
        # Check single or two short words
        if any(is_gibberish_word(w) for w in words):
            return False, "The description provided appears to be random keyboard mashing (e.g., 'asdfghjkl' or 'ajhsdahj'). Please tell us about your actual business or services."
        if len(clean) < 12:
            return False, "Please provide a more detailed description of your business (e.g., what products/services you offer, your location, or opening hours)."

    gibberish_words = sum(1 for w in words if is_gibberish_word(w))
    if gibberish_words > 0 and (gibberish_words / len(words)) >= 0.6:
        return False, "Your description appears to contain unrecognized random characters or keyboard mashing. Please describe your business, services, and location in plain English or Hinglish."

    return True, None


SEMANTIC_CHECK_SYSTEM_PROMPT = """You are a precision context-aware field validator for MakeSite website builder.
Validate if the user's input is a plausible, legitimate entry for the requested business field.
The user may respond in English, Hindi, Hinglish, or casual speech-to-text.

Field Rules:
- business_name: Real or plausible commercial brand/trade name (e.g. 'Harsh Cyber Cafe', 'Bean & Bloom', 'Nike', '3M', 'KFC', 'Studio 54', 'Sharma Sweets', 'Apna Salon'). Reject conversational statements, general questions, jokes, or nonsensical phrases (e.g. 'who is elon musk', 'i love chocolate', 'test message').
- category: Legitimate trade, industry, or service (e.g. 'Bakery', 'Artisan Cafe', 'Kirana Store', 'Cyber Cafe', 'Fitness Studio', 'Chai aur nashta'). Reject off-topic sentences, questions, or random phrases.
- location: Plausible geographical city, state, country, area, street, landmark, operating region, or nationwide/online/remote (e.g. 'Bandra, Mumbai', 'Chicago, IL', 'Online / Remote', 'Nationwide across India', 'Across Delhi NCR'). Accept regional operating areas. Reject random nouns, insults, or conversational chatter.
- contact: Phone number, email, or direct contact handle.
- hours: Plausible operating schedule or 'Open 24/7'.
- owner_name: Person's name or partners.

Return JSON ONLY:
{
  "valid": true or false,
  "reason": "Friendly explanation if false (e.g., 'Please provide a valid business category...'), else null",
  "cleaned": "Cleaned value without conversational filler"
}
"""


def validate_field_sync(field: str, value: str) -> ValidationResult:
    """Synchronous field validation using Python rules."""
    field_name = field.strip().lower()

    if field_name == "business_name":
        return validate_business_name(value)
    elif field_name == "category":
        return validate_category(value)
    elif field_name == "location":
        return validate_location(value)
    elif field_name == "contact":
        return validate_contact(value)
    elif field_name == "hours":
        return validate_hours(value)
    elif field_name == "owner_name":
        return validate_owner_name(value)
    elif field_name == "products":
        return validate_products(value)
    else:
        cleaned = clean_speech_to_text(value)
        if not cleaned or is_gibberish_word(cleaned):
            return ValidationResult(
                valid=False,
                error=f"Please provide a valid answer for {field_name.replace('_', ' ')}.",
                field=field_name
            )
        return ValidationResult(valid=True, cleaned_value=cleaned, field=field_name)


async def validate_clarification_field(
    field: str,
    value: str,
    async_client: Optional[Any] = None
) -> ValidationResult:
    """
    Validates a clarification answer for a specific field.
    Runs fast Python rules first. If Python rules reject it (e.g. gibberish, pure numbers, invalid email/phone),
    it is rejected immediately.
    If Python rules pass and an async_client is provided, an AI semantic check is performed for
    multi-word or ambiguous phrases to prevent off-topic questions or jokes from being accepted.
    """
    # 1. Fast Python validation
    py_result = validate_field_sync(field, value)
    if not py_result.valid:
        return py_result

    # If contact was validated with valid phone/email regex, no AI call needed!
    if field.strip().lower() == "contact" and py_result.valid:
        return py_result

    # 2. AI Semantic Check for ambiguous or multi-word inputs if Groq client is available
    if async_client:
        clean_val = py_result.cleaned_value or value
        # Trigger semantic AI check if input has 3+ words or might be a statement/question
        lower_val = clean_val.lower()
        needs_ai_check = (
            len(clean_val.split()) >= 3
            or any(q_word in lower_val for q_word in ["who", "what", "where", "why", "how", "tell me", "joke", "recipe", "python"])
        )

        if needs_ai_check:
            try:
                import json
                model = os.getenv("GROQ_PRIMARY_MODEL", "openai/gpt-oss-120b")
                response = await async_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": SEMANTIC_CHECK_SYSTEM_PROMPT},
                        {
                            "role": "user",
                            "content": f"Field: {field}\nValue: {clean_val}",
                        },
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.0,
                    max_tokens=200,
                )
                raw_json = response.choices[0].message.content or "{}"
                data = json.loads(raw_json)
                if not data.get("valid", True):
                    return ValidationResult(
                        valid=False,
                        error=data.get("reason") or f"The provided value does not appear to be a valid {field.replace('_', ' ')}. Please try again.",
                        field=field
                    )
                if data.get("cleaned"):
                    return ValidationResult(
                        valid=True,
                        cleaned_value=data.get("cleaned"),
                        field=field
                    )
            except Exception as e:
                logger.warning(f"Semantic AI check skipped due to error: {e}")
                # Graceful fallback to Python validation result
                return py_result

    return py_result
