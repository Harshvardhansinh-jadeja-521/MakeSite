from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from extraction import extract_business_info
from schemas import BusinessRequest, BusinessInfo, BusinessUpdateRequest
import json

app = FastAPI()

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


@app.get("/")
def home():
    return {"message": "MakeSite API is running"}


@app.post("/extract")
def extract(request: BusinessRequest):

    result = extract_business_info(request.description)

    try:
        data = json.loads(result)

        # Validate AI response
        business_info = BusinessInfo(**data)

        # Fields required before generating a website
        required_fields = [
            "business_name",
            "category",
            "location"
        ]

        # Check which required fields are missing
        missing_fields = []

        for field in required_fields:
            if getattr(business_info, field) is None:
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

@app.post("/update-business")
def update_business(request: BusinessUpdateRequest):

    # Convert Pydantic model into a dictionary
    business_data = request.business_data.model_dump()

    # Update the requested field
    business_data[request.field] = request.value

    # Validate the updated data
    updated_business = BusinessInfo(**business_data)

    # Required fields
    required_fields = [
        "business_name",
        "category",
        "location"
    ]

    # Check for missing fields again
    missing_fields = []

    for field in required_fields:
        if getattr(updated_business, field) is None:
            missing_fields.append(field)

    return {
        "data": updated_business.model_dump(),
        "missing_fields": missing_fields
    }