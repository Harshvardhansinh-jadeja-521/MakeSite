import os
import re
import json
import time
import asyncio
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from groq import Groq, AsyncGroq

load_dotenv()

logger = logging.getLogger("makesite.content_generation")

PRIMARY_MODEL = os.getenv("GROQ_PRIMARY_MODEL", "openai/gpt-oss-120b")
FALLBACK_MODEL = os.getenv("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b")

api_key = os.getenv("GROQ_API_KEY")
sync_client = Groq(api_key=api_key) if api_key else None
async_client = AsyncGroq(api_key=api_key) if api_key else None

COPYWRITER_SYSTEM_PROMPT = """You are an award-winning brand copywriter and conversion-rate optimization expert for MakeSite.
Your goal is to produce engaging, professional, modern website copy tailored specifically to the given business profile.

CRITICAL INSTRUCTIONS:
1. Return ONLY pure, valid JSON.
2. DO NOT use markdown code fences (no ```json or ```).
3. DO NOT include preamble, greeting, or explanations.
4. Output MUST conform to this exact JSON schema:

{
  "hero_title": "Short, powerful, compelling headline (6-10 words)",
  "hero_description": "2-3 sentences explaining the core value proposition and why customers love them.",
  "about": "A natural 3-4 sentence paragraph telling the business story, their commitment to quality, and community trust.",
  "services": [
    {
      "name": "Service / Offering Name",
      "description": "1-2 engaging sentences detailing the customer benefit."
    }
  ],
  "cta": "Informational call-to-action button text (e.g. 'Get In Touch', 'Contact Us', 'Inquire Today', 'Connect With Us', 'Visit Our Office')",
  "features": [
    {
      "title": "Core Benefit 1",
      "description": "Why customers choose us."
    },
    {
      "title": "Core Benefit 2",
      "description": "Our reliability or speed."
    },
    {
      "title": "Core Benefit 3",
      "description": "Transparent & customer-first service."
    }
  ],
  "faqs": [
    {
      "question": "Common customer question relevant to this industry?",
      "answer": "Helpful, reassuring answer."
    },
    {
      "question": "What are your operating hours?",
      "answer": "Accurate hours from business data or standard answer."
    }
  ]
}

CRITICAL RULES:
- This is strictly a STATIC, INFORMATIONAL presentation website.
- ABSOLUTELY DO NOT generate "Shop Now", "Buy Now", "Order Now", "Add to Cart", "Purchase", or any e-commerce / online shopping / checkout buttons.
- All CTAs must be purely informational or contact-oriented, such as "Get In Touch", "Contact Us", "Inquire Today", "Connect With Us", "Visit Us", or "Learn More".
- If products are listed in the business data, generate a dedicated informational service entry for each.
- If products are empty, generate 3-4 realistic services suitable for this business category.
- Keep the tone welcoming, trustworthy, and modern.
- Incorporate the business location and hours naturally into the copy where relevant.
- Do NOT invent specific certifications or fake celebrity testimonials.
"""


def sanitize_cta(cta_text: Optional[str]) -> str:
    """Enforces static, informational website CTAs and strips any e-commerce/shop/buy/order buttons."""
    if not cta_text or not isinstance(cta_text, str) or not cta_text.strip():
        return "Get In Touch"

    clean = cta_text.strip()
    forbidden = [
        "shop now", "buy now", "order now", "add to cart", "cart",
        "purchase", "checkout", "shop online", "order online", "order & visit",
        "order today", "buy online", "shop"
    ]
    lower = clean.lower()
    for f in forbidden:
        if f in lower:
            return "Get In Touch"
    return clean


def clean_json_response(raw_text: str) -> str:
    """Cleans raw text to extract valid JSON without markdown fences."""
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


def create_fallback_content(business_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generates guaranteed high-quality fallback website content if AI fails."""
    b_name = business_data.get("business_name") or "Our Enterprise"
    category = business_data.get("category") or "Premier Services"
    location = business_data.get("location") or "Your City"
    hours = business_data.get("hours") or "Monday to Saturday, Regular Hours"
    products = business_data.get("products") or []

    services_list = []
    if products and isinstance(products, list):
        for prod in products:
            services_list.append({
                "name": str(prod).title(),
                "description": f"Top-quality {prod} tailored to your exact needs with precision and care."
            })
    else:
        services_list = [
            {"name": "Core Service", "description": f"Professional and dedicated {category.lower()} solutions."},
            {"name": "Consultation", "description": "Expert advice to help you make informed and confident decisions."},
            {"name": "Customer Support", "description": "Responsive assistance every step of the way."},
        ]

    return {
        "hero_title": f"Welcome to {b_name} — Excellence in {category}",
        "hero_description": f"Serving {location} with trusted, top-tier {category.lower()} solutions designed to exceed your expectations every single day.",
        "about": f"At {b_name}, we take pride in delivering honest, reliable, and high-impact services across {location}. Founded on trust and customer satisfaction, our mission is to provide an effortless experience for all our clients.",
        "services": services_list,
        "cta": "Get In Touch Today",
        "features": [
            {"title": "Trusted Quality", "description": "Consistent, high-caliber service you can always rely on."},
            {"title": "Local Experience", "description": f"Proudly rooted in {location} with deep community focus."},
            {"title": "Customer First", "description": "Your goals and convenience are always our highest priority."},
        ],
        "faqs": [
            {
                "question": f"Where is {b_name} located?",
                "answer": f"We are located in {location}. Visit us during our operating hours: {hours}."
            },
            {
                "question": "How can I get started?",
                "answer": "Reach out directly via phone or visit us in person to speak with our team."
            }
        ]
    }


async def async_generate_website_content(business_data: Dict[str, Any], max_retries: int = 3) -> str:
    """
    Asynchronously generates website content using Groq with retries and fallbacks.
    Returns valid JSON string with sanitized static CTAs.
    """
    if not async_client:
        logger.error("GROQ_API_KEY is not configured")
        return json.dumps(create_fallback_content(business_data))

    prompt = f"""Generate full website content for this business profile:
{json.dumps(business_data, indent=2)}

Remember: Return ONLY valid JSON matching the exact required schema. Do NOT include any 'Shop Now', 'Buy Now', or e-commerce buttons."""

    models_to_try = [PRIMARY_MODEL, FALLBACK_MODEL, "openai/gpt-oss-120b"]
    last_error = None

    for attempt in range(max_retries):
        model = models_to_try[min(attempt, len(models_to_try) - 1)]
        logger.info(f"Generate content attempt {attempt + 1}/{max_retries} using model '{model}'")

        try:
            response = await async_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": COPYWRITER_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=1400,
            )

            raw_content = response.choices[0].message.content or "{}"
            cleaned = clean_json_response(raw_content)

            data = json.loads(cleaned)
            required_keys = ["hero_title", "hero_description", "about", "services", "cta"]
            if all(k in data for k in required_keys) and isinstance(data["services"], list):
                # Strictly sanitize CTA against shop/buy/order buttons
                data["cta"] = sanitize_cta(data.get("cta"))
                logger.info("Successfully generated static website copy")
                return json.dumps(data)
            else:
                logger.warning(f"Response missing some required keys: {list(data.keys())}")
                fallback = create_fallback_content(business_data)
                for k in required_keys:
                    if k not in data or not data[k]:
                        data[k] = fallback[k]
                data["cta"] = sanitize_cta(data.get("cta"))
                return json.dumps(data)

        except (json.JSONDecodeError, KeyError) as e:
            logger.warning(f"Content generation attempt {attempt + 1} parse issue: {e}")
            last_error = e
            await asyncio.sleep(0.4 * (attempt + 1))

        except Exception as e:
            logger.warning(f"Content generation attempt {attempt + 1} API error on {model}: {e}")
            last_error = e
            await asyncio.sleep(0.5 * (attempt + 1))

    logger.error(f"All {max_retries} content generation attempts failed: {last_error}. Returning fallback.")
    fallback = create_fallback_content(business_data)
    fallback["cta"] = sanitize_cta(fallback.get("cta"))
    return json.dumps(fallback)


def generate_website_content(business_data: Dict[str, Any], max_retries: int = 3) -> str:
    """
    Synchronous wrapper for backward compatibility.
    """
    if not sync_client:
        logger.error("GROQ_API_KEY is not configured")
        return json.dumps(create_fallback_content(business_data))

    prompt = f"""Generate full website content for this business profile:
{json.dumps(business_data, indent=2)}

Remember: Return ONLY valid JSON matching the exact required schema. Do NOT include any 'Shop Now', 'Buy Now', or e-commerce buttons."""

    models_to_try = [PRIMARY_MODEL, FALLBACK_MODEL, "openai/gpt-oss-120b"]
    last_error = None

    for attempt in range(max_retries):
        model = models_to_try[min(attempt, len(models_to_try) - 1)]
        try:
            response = sync_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": COPYWRITER_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=1400,
            )

            raw_content = response.choices[0].message.content or "{}"
            cleaned = clean_json_response(raw_content)
            data = json.loads(cleaned)

            required_keys = ["hero_title", "hero_description", "about", "services", "cta"]
            if all(k in data for k in required_keys) and isinstance(data["services"], list):
                data["cta"] = sanitize_cta(data.get("cta"))
                return json.dumps(data)
            else:
                fallback = create_fallback_content(business_data)
                for k in required_keys:
                    if k not in data or not data[k]:
                        data[k] = fallback[k]
                data["cta"] = sanitize_cta(data.get("cta"))
                return json.dumps(data)

        except Exception as e:
            logger.warning(f"Sync content generation attempt {attempt + 1} failed: {e}")
            last_error = e
            time.sleep(0.4 * (attempt + 1))

    logger.error(f"Sync generation failed: {last_error}. Returning fallback.")
    fallback = create_fallback_content(business_data)
    fallback["cta"] = sanitize_cta(fallback.get("cta"))
    return json.dumps(fallback)