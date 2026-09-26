import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def generate_website_content(business_data):
    prompt = f"""
Create website content for the following business.

Business information:
{json.dumps(business_data, indent=2)}

Return ONLY valid JSON.
Do not use markdown.
Do not use ```json.

Return exactly these fields:

{{
    "hero_title": "",
    "hero_description": "",
    "about": "",
    "services": [
        {{
            "name": "",
            "description": ""
        }}
    ],
    "cta": ""
}}

Rules:

- hero_title: A short, attractive headline for the business.
- hero_description: 1-2 sentences explaining what the business offers.
- about: A natural 3-4 sentence description of the business.
- services: Create one entry for each product/service provided.
- Each service description should be 1-2 sentences.
- cta: A short call-to-action such as "Visit Us Today" or "Get in Touch".
- Do not invent specific facts such as prices, years of experience,
  awards, guarantees, or customer numbers.
- Use only information supported by the provided business data.
- Keep the language natural and suitable for a real business website.
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content


if __name__ == "__main__":

    sample_business = {
        "business_name": "Harsh Cyber Cafe",
        "owner_name": "Harsh",
        "category": "Cyber Cafe",
        "location": "Ahmedabad",
        "hours": "24/7",
        "contact": "9876543210",
        "products": [
            "Printing",
            "Scanning",
            "Photocopy",
            "Online Form Filling"
        ]
    }

    result = generate_website_content(sample_business)

    print(result)