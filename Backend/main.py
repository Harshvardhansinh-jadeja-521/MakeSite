from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from extraction import extract_business_info
from content_generation import generate_website_content

from schemas import (
    BusinessRequest,
    BusinessInfo,
    BusinessUpdateRequest
)

import json


app = FastAPI()


# --------------------------------
# CORS
# --------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------
# Home
# --------------------------------

@app.get("/")
def home():
    return {
        "message": "MakeSite API is running"
    }


# --------------------------------
# Extract Business Information
# --------------------------------

@app.post("/extract")
def extract(request: BusinessRequest):

    result = extract_business_info(
        request.description
    )

    try:

        data = json.loads(result)

        # Validate AI response
        business_info = BusinessInfo(**data)

        # Required fields before
        # generating a website
        required_fields = [
            "business_name",
            "category",
            "location"
        ]

        # Find missing fields
        missing_fields = []

        for field in required_fields:

            if getattr(
                business_info,
                field
            ) is None:

                missing_fields.append(field)

        return {
            "data": business_info.model_dump(),
            "missing_fields": missing_fields
        }

    except json.JSONDecodeError:

        return {
            "error": "AI returned invalid JSON",
            "raw_response": result
        }


# --------------------------------
# Update Business Information
# --------------------------------

@app.post("/update-business")
def update_business(
    request: BusinessUpdateRequest
):

    # Convert Pydantic model
    # into a dictionary
    business_data = (
        request.business_data.model_dump()
    )

    # Update requested field
    business_data[
        request.field
    ] = request.value

    # Validate updated data
    updated_business = BusinessInfo(
        **business_data
    )

    # Required fields
    required_fields = [
        "business_name",
        "category",
        "location"
    ]

    # Check missing fields
    missing_fields = []

    for field in required_fields:

        if getattr(
            updated_business,
            field
        ) is None:

            missing_fields.append(field)

    return {
        "data": updated_business.model_dump(),
        "missing_fields": missing_fields
    }


# --------------------------------
# Generate Website Content
# --------------------------------

@app.post("/generate-content")
def generate_content(
    request: BusinessInfo
):

    # Generate personalized content
    # using the AI
    result = generate_website_content(
        request.model_dump()
    )

    try:

        content = json.loads(result)

        return {
            "content": content
        }

    except json.JSONDecodeError:

        return {
            "error": "AI returned invalid JSON",
            "raw_response": result
        }