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

EXTRACTION_SYSTEM_PROMPT = """You are a precision AI information extraction engine for MakeSite.
Your task is to analyze user-provided descriptions of businesses (which may be in English, Hindi, Hinglish, or any regional language) and extract structured entity information into pure JSON.

CRITICAL INSTRUCTIONS:
1. Return ONLY a single raw JSON object.
2. DO NOT include markdown code fences such as ```json or ```.
3. DO NOT include introductory or concluding thoughts.
4. Output must match this exact schema:
{
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
- business_name: Commercial name of the business/firm. If omitted, use null.
- owner_name: Person's name who owns or runs it. If omitted, use null.
- category: Standard business category (e.g. Cyber Cafe, Restaurant, Financial Services, Boutique, Clinic, Fitness Studio). If unclear, use null.
- location: Physical city, area, or address. If omitted, use null.
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
    name_match = re.search(r"(?:called|named|name is)\s+([A-Za-z0-9&'\s]+?)(?:\s+in|\s+at|\.|\,|$)", description, re.IGNORECASE)
    loc_match = re.search(r"(?:in|at|located in)\s+([A-Za-z\s]+?)(?:\.|\,|$)", description, re.IGNORECASE)
    
    return {
        "business_name": name_match.group(1).strip() if name_match else None,
        "owner_name": None,
        "category": "Services & Retail",
        "location": loc_match.group(1).strip() if loc_match else None,
        "hours": None,
        "contact": None,
        "products": [],
        "tagline": None,
    }


async def async_extract_business_info(description: str, max_retries: int = 3) -> str:
    """
    Asynchronously extracts business info using Groq with automated retries,
    model fallbacks, and response cleaning.
    """
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
                        "content": f"Extract structured business information from the following text:\n\n{description}",
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=600,
            )

            raw_content = response.choices[0].message.content or "{}"
            cleaned_json = clean_json_response(raw_content)

            parsed = json.loads(cleaned_json)
            if "products" in parsed and not isinstance(parsed["products"], list):
                parsed["products"] = [str(parsed["products"])]

            logger.info("Successfully extracted business info")
            return json.dumps(parsed)

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
                        "content": f"Extract structured business information from the following text:\n\n{description}",
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=600,
            )

            raw_content = response.choices[0].message.content or "{}"
            cleaned_json = clean_json_response(raw_content)

            parsed = json.loads(cleaned_json)
            if "products" in parsed and not isinstance(parsed["products"], list):
                parsed["products"] = [str(parsed["products"])]

            return json.dumps(parsed)

        except Exception as e:
            logger.warning(f"Sync attempt {attempt + 1} failed: {e}")
            last_error = e
            time.sleep(0.4 * (attempt + 1))

    logger.error(f"Sync extraction failed: {last_error}")
    return json.dumps(fallback_extracted_data(description))