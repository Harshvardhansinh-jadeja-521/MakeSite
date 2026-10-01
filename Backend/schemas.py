import html
import re
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator


def sanitize_text(value: Optional[str]) -> Optional[str]:
    """Sanitize user input against XSS and control characters while preserving unicode."""
    if value is None:
        return None
    val = value.strip()
    if not val:
        return None
    # Strip script and dangerous tags
    val = re.sub(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", "", val, flags=re.IGNORECASE | re.DOTALL)
    val = re.sub(r"<\s*iframe[^>]*>.*?<\s*/\s*iframe\s*>", "", val, flags=re.IGNORECASE | re.DOTALL)
    # Strip null bytes
    val = val.replace("\x00", "")
    return val


# ----------------------------------------------------
# Request Schemas
# ----------------------------------------------------

class BusinessRequest(BaseModel):
    description: str = Field(
        ...,
        min_length=3,
        max_length=4000,
        description="Freeform description of the business in any language (English, Hindi, etc.)",
        json_schema_extra={
            "example": "Mera naam Harsh hai. Mai Harsh Cyber Cafe chalata hu Ahmedabad mai. Open 9am to 9pm. Contact 9876543210. Hum printing, scanning aur xerox karte hai."
        }
    )

    @field_validator("description")
    @classmethod
    def validate_and_sanitize_description(cls, v: str) -> str:
        clean = sanitize_text(v)
        if not clean or len(clean) < 3:
            raise ValueError("Description must contain at least 3 characters of valid text.")
        return clean


class BusinessInfo(BaseModel):
    business_name: Optional[str] = Field(None, description="Official business name")
    owner_name: Optional[str] = Field(None, description="Owner or founder name")
    category: Optional[str] = Field(None, description="Category or industry type")
    location: Optional[str] = Field(None, description="Physical location or city/state")
    hours: Optional[str] = Field(None, description="Operating hours")
    contact: Optional[str] = Field(None, description="Phone, email, or contact handle")
    products: List[str] = Field(default_factory=list, description="List of products or services offered")
    tagline: Optional[str] = Field(None, description="Catchy tagline or slogan")

    @field_validator("business_name", "owner_name", "category", "location", "hours", "contact", "tagline", mode="before")
    @classmethod
    def clean_strings(cls, v):
        if isinstance(v, str):
            clean = sanitize_text(v)
            return clean if clean else None
        return v

    @field_validator("products", mode="before")
    @classmethod
    def clean_products(cls, v):
        if not v:
            return []
        if isinstance(v, list):
            cleaned = []
            for item in v:
                if isinstance(item, str):
                    s = sanitize_text(item)
                    if s:
                        cleaned.append(s)
            return cleaned
        return []

    model_config = {
        "json_schema_extra": {
            "example": {
                "business_name": "Harsh Cyber Cafe",
                "owner_name": "Harsh",
                "category": "Cyber Cafe & Tech Services",
                "location": "Ahmedabad, Gujarat",
                "hours": "9:00 AM - 9:00 PM",
                "contact": "+91 9876543210",
                "products": ["High Speed Internet", "Color Printing", "Document Scanning", "Online Applications"],
                "tagline": "Your one-stop digital hub"
            }
        }
    }


class BusinessUpdateRequest(BaseModel):
    business_data: BusinessInfo
    field: str = Field(..., description="Field name to update")
    value: str = Field(..., description="New value for the field")

    @field_validator("field")
    @classmethod
    def validate_field_name(cls, v: str) -> str:
        allowed = {
            "business_name",
            "owner_name",
            "category",
            "location",
            "hours",
            "contact",
            "products",
            "tagline",
        }
        clean_field = v.strip().lower()
        if clean_field not in allowed:
            raise ValueError(f"Field '{v}' is not recognized. Allowed fields: {', '.join(sorted(allowed))}")
        return clean_field

    @field_validator("value")
    @classmethod
    def sanitize_val(cls, v: str) -> str:
        clean = sanitize_text(v)
        if not clean:
            raise ValueError("Value cannot be blank")
        return clean


# ----------------------------------------------------
# Content Models
# ----------------------------------------------------

class ServiceItem(BaseModel):
    name: str = Field(..., description="Service or product name")
    description: str = Field(..., description="Detailed benefit-oriented description")


class WebsiteContent(BaseModel):
    hero_title: str
    hero_description: str
    about: str
    services: List[ServiceItem]
    cta: str
    features: Optional[List[Dict[str, str]]] = None
    faqs: Optional[List[Dict[str, str]]] = None


# ----------------------------------------------------
# Server-side HTML Generation Models
# ----------------------------------------------------

class GenerateHtmlRequest(BaseModel):
    business_data: BusinessInfo
    content: Dict[str, Any]
    template_id: str = Field(default="modern-dark", description="Template identifier: modern-dark, minimal-clean, vibrant-gradient, corporate-pro")


class GenerateHtmlResponse(BaseModel):
    html: str
    template_id: str
    size_bytes: int


# ----------------------------------------------------
# API Response Schemas
# ----------------------------------------------------

class BusinessDataResponse(BaseModel):
    data: Dict[str, Any]
    missing_fields: List[str]
    is_complete: bool = False


class ContentGenerationResponse(BaseModel):
    content: Dict[str, Any]
    generated_at: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    uptime_seconds: float
    groq_api_status: str
    model_primary: str
    model_fallback: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    raw_response: Optional[str] = None