import os
import re
import json
import time
import asyncio
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from groq import Groq, AsyncGroq

load_dotenv()

logger = logging.getLogger("makesite.extraction")

PRIMARY_MODEL = os.getenv("GROQ_PRIMARY_MODEL", "openai/gpt-oss-120b")
FALLBACK_MODEL = os.getenv("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b")

api_key = os.getenv("GROQ_API_KEY")
sync_client = Groq(api_key=api_key) if api_key else None
async_client = AsyncGroq(api_key=api_key) if api_key else None

from validation import (
    validate_initial_description,
    validate_field_sync,
    validate_business_name,
    validate_category,
    validate_location,
    validate_contact,
    validate_hours,
    validate_owner_name,
)

EXTRACTION_SYSTEM_PROMPT = """You are a precision AI information extraction and business validation engine for MakeSite.
Your task is to analyze user-provided text descriptions (which may be in English, Hindi, Hinglish, or any regional language) and determine if it represents a genuine business, shop, freelancer, agency, or commercial service, and extract structured entity information into pure JSON.

CRITICAL INSTRUCTIONS:
1. Return ONLY a single raw JSON object matching the exact schema below.
2. DO NOT include markdown code fences such as ```json or ```.
3. DO NOT include introductory or concluding thoughts.
4. VALIDATION RULE:
   - If the input is gibberish (e.g. 'ajhsdahj', 'asdfghjkl'), random numbers ('1234567890'), off-topic general queries (e.g. 'who is elon musk', 'tell me a joke', 'what is python'), personal chat, or not describing a business, firm, or commercial enterprise:
     Set "is_valid_business": false
     Set "rejection_reason": "A friendly explanation of why this input was rejected and asking the user to describe what their business does, what services/products they offer, and where they are located."
     Set all entity fields to null (and products to []).
   - If the input IS a legitimate business description:
     Set "is_valid_business": true
     Set "rejection_reason": null
     Extract the entities faithfully.

5. RULE OF TRUTH:
   - NEVER invent or hallucinate missing information.
   - If a business name, contact, location, hours, or owner is not mentioned or unclear, set it to null.
   - DO NOT mark invalid answers or random words as business names.

Output Schema:
{
  "is_valid_business": true or false,
  "rejection_reason": string or null,
  "business_name": string or null,
  "owner_name": string or null,
  "category": string or null,
  "location": string or null,
  "hours": string or null,
  "contact": string or null,
  "products": [string, ...],
  "tagline": string or null
}

Field Rules:
- business_name: Commercial name of the business/firm. If omitted or not stated, use null.
- owner_name: Person's name who owns or runs it. If omitted, use null.
- category: Standard business category (e.g. Artisan Cafe, Cyber Cafe, Restaurant, Financial Services, Boutique, Clinic, Fitness Studio). If unclear, use null.
- location: Physical city, area, address, or operating region. If omitted, use null.
- hours: Operating schedule or opening hours. If omitted, use null.
- contact: Phone number, email, or contact handle. If omitted, use null.
- products: Array of specific products/services offered. Return [] if none listed.
- tagline: Any slogan or concise motto mentioned. If omitted, use null.
"""


def clean_json_response(raw_text: str) -> str:
    """
    Cleans raw LLM output to extract pure JSON.
    Handles markdown fences, stray explanatory text, and typographic quotes.
    """
    if not raw_text:
        return "{}"

    cleaned = raw_text.strip()
    cleaned = cleaned.replace("“", "\"").replace("”", "\"").replace("’", "'").replace("‘", "'")

    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)

    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}")

    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        cleaned = cleaned[start_idx : end_idx + 1]

    try:
        json.loads(cleaned)
        return cleaned
    except json.JSONDecodeError:
        fixed = re.sub(r",\s*([\]}])", r"\1", cleaned)
        try:
            json.loads(fixed)
            return fixed
        except Exception:
            logger.warning(f"Could not parse cleaned JSON: {cleaned[:120]}...")
            return cleaned


def fallback_extracted_data(description: str) -> Dict[str, Any]:
    """Graceful fallback if AI service is completely unavailable."""
    is_valid, err_msg = validate_initial_description(description)
    if not is_valid:
        return {
            "is_valid_business": False,
            "rejection_reason": err_msg or "The input does not appear to describe a business.",
            "business_name": None,
            "owner_name": None,
            "category": None,
            "location": None,
            "hours": None,
            "contact": None,
            "products": [],
            "tagline": None,
        }

    name_match = re.search(r"(?:called|named|name is)\s+([A-Za-z0-9&'\s]+?)(?:\s+in|\s+at|\.|\,|$)", description, re.IGNORECASE)
    loc_match = re.search(r"(?:in|at|located in)\s+([A-Za-z\s]+?)(?:\.|\,|$)", description, re.IGNORECASE)
    contact_match = re.search(r"(\+?\d{1,4}[-.\s]?)?(\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}", description)
    email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", description)

    b_name = name_match.group(1).strip() if name_match else None
    if b_name:
        b_res = validate_business_name(b_name)
        b_name = b_res.cleaned_value if b_res.valid else None

    b_loc = loc_match.group(1).strip() if loc_match else None
    if b_loc:
        l_res = validate_location(b_loc)
        b_loc = l_res.cleaned_value if l_res.valid else None

    b_contact = None
    if email_match:
        b_contact = email_match.group(0).strip()
    elif contact_match and len(re.sub(r"\D", "", contact_match.group(0))) >= 7:
        b_contact = contact_match.group(0).strip()

    return {
        "is_valid_business": True,
        "rejection_reason": None,
        "business_name": b_name,
        "owner_name": None,
        "category": "Services & Retail",
        "location": b_loc,
        "hours": None,
        "contact": b_contact,
        "products": [],
        "tagline": None,
    }


def post_process_extracted_data(parsed: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates and cleans all fields extracted by AI using strict Python rules.
    Guarantees no gibberish or hallucinated values sneak through.
    """
    # 1. If AI rejected as invalid business, respect that
    if not parsed.get("is_valid_business", True):
        return {
            "is_valid_business": False,
            "rejection_reason": parsed.get("rejection_reason") or "The input does not appear to describe a business. Please describe your business, services, and location.",
            "business_name": None,
            "owner_name": None,
            "category": None,
            "location": None,
            "hours": None,
            "contact": None,
            "products": [],
            "tagline": None,
        }

    # 2. Validate individual fields with Python rules
    # business_name
    raw_name = parsed.get("business_name")
    if raw_name:
        res = validate_business_name(str(raw_name))
        parsed["business_name"] = res.cleaned_value if res.valid else None
    else:
        parsed["business_name"] = None

    # category
    raw_cat = parsed.get("category")
    if raw_cat:
        res = validate_category(str(raw_cat))
        parsed["category"] = res.cleaned_value if res.valid else None
    else:
        parsed["category"] = None

    # location
    raw_loc = parsed.get("location")
    if raw_loc:
        res = validate_location(str(raw_loc))
        parsed["location"] = res.cleaned_value if res.valid else None
    else:
        parsed["location"] = None

    # contact
    raw_con = parsed.get("contact")
    if raw_con:
        res = validate_contact(str(raw_con))
        parsed["contact"] = res.cleaned_value if res.valid else None
    else:
        parsed["contact"] = None

    # hours
    raw_hrs = parsed.get("hours")
    if raw_hrs:
        res = validate_hours(str(raw_hrs))
        parsed["hours"] = res.cleaned_value if res.valid else None
    else:
        parsed["hours"] = None

    # owner_name
    raw_own = parsed.get("owner_name")
    if raw_own:
        res = validate_owner_name(str(raw_own))
        parsed["owner_name"] = res.cleaned_value if res.valid else None
    else:
        parsed["owner_name"] = None

    # products
    raw_prods = parsed.get("products", [])
    if isinstance(raw_prods, list):
        clean_prods = []
        for p in raw_prods:
            p_str = str(p).strip()
            if p_str and len(p_str) >= 2:
                clean_prods.append(p_str)
        parsed["products"] = clean_prods
    else:
        parsed["products"] = []

    # 3. Completeness sanity check: if literally every field is None or empty, reject as non-business
    has_any_info = any([
        parsed["business_name"],
        parsed["category"],
        parsed["location"],
        parsed["contact"],
        len(parsed["products"]) > 0,
    ])

    if not has_any_info:
        parsed["is_valid_business"] = False
        parsed["rejection_reason"] = (
            "We could not identify any valid business details from your description. "
            "Please describe your business, what you offer, and where you are located."
        )

    return parsed


async def async_extract_business_info(description: str, max_retries: int = 3) -> str:
    """
    Asynchronously extracts business info using Groq with pre-validation,
    automated retries, model fallbacks, and strict response cleaning.
    """
    # 1. Fast Python pre-validation check on raw input
    is_valid, err_msg = validate_initial_description(description)
    if not is_valid:
        logger.info(f"Pre-validation rejected description: {err_msg}")
        return json.dumps({
            "is_valid_business": False,
            "rejection_reason": err_msg,
            "business_name": None,
            "owner_name": None,
            "category": None,
            "location": None,
            "hours": None,
            "contact": None,
            "products": [],
            "tagline": None,
        })

    if not async_client:
        logger.error("GROQ_API_KEY is not configured")
        return json.dumps(fallback_extracted_data(description))

    models_to_try = [PRIMARY_MODEL, FALLBACK_MODEL, "openai/gpt-oss-120b"]
    last_error = None

    for attempt in range(max_retries):
        model = models_to_try[min(attempt, len(models_to_try) - 1)]
        logger.info(f"Extract attempt {attempt + 1}/{max_retries} using model '{model}'")

        try:
            response = await async_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"Extract structured business information and validate if this describes a real business:\n\n{description}",
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
                max_tokens=600,
            )

            raw_content = response.choices[0].message.content or "{}"
            cleaned_json = clean_json_response(raw_content)

            parsed = json.loads(cleaned_json)
            # Post-process and sanitize with Python validation rules
            processed = post_process_extracted_data(parsed)

            logger.info("Successfully extracted and validated business info")
            return json.dumps(processed)

        except (json.JSONDecodeError, KeyError) as e:
            logger.warning(f"Attempt {attempt + 1}: JSON parsing issue: {e}")
            last_error = e
            await asyncio.sleep(0.3 * (attempt + 1))

        except Exception as e:
            logger.warning(f"Attempt {attempt + 1}: Groq API error on model {model}: {e}")
            last_error = e
            await asyncio.sleep(0.5 * (attempt + 1))

    logger.error(f"All {max_retries} extraction attempts failed. Last error: {last_error}")
    return json.dumps(fallback_extracted_data(description))


def extract_business_info(description: str, max_retries: int = 3) -> str:
    """
    Synchronous wrapper for backward compatibility.
    """
    is_valid, err_msg = validate_initial_description(description)
    if not is_valid:
        return json.dumps({
            "is_valid_business": False,
            "rejection_reason": err_msg,
            "business_name": None,
            "owner_name": None,
            "category": None,
            "location": None,
            "hours": None,
            "contact": None,
            "products": [],
            "tagline": None,
        })

    if not sync_client:
        logger.error("GROQ_API_KEY is not configured")
        return json.dumps(fallback_extracted_data(description))

    models_to_try = [PRIMARY_MODEL, FALLBACK_MODEL, "openai/gpt-oss-120b"]
    last_error = None

    for attempt in range(max_retries):
        model = models_to_try[min(attempt, len(models_to_try) - 1)]
        try:
            response = sync_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"Extract structured business information and validate if this describes a real business:\n\n{description}",
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
                max_tokens=600,
            )

            raw_content = response.choices[0].message.content or "{}"
            cleaned_json = clean_json_response(raw_content)

            parsed = json.loads(cleaned_json)
            processed = post_process_extracted_data(parsed)
            return json.dumps(processed)

        except Exception as e:
            logger.warning(f"Sync attempt {attempt + 1} failed: {e}")
            last_error = e
            time.sleep(0.4 * (attempt + 1))

    logger.error(f"Sync extraction failed: {last_error}")
    return json.dumps(fallback_extracted_data(description))