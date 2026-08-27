import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def extract_business_info(description):

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "user",
                "content": f"""
Extract business information from the following text.

Return ONLY valid JSON. Do not use markdown or ```json.

Fields:
- business_name
- owner_name
- category
- location
- hours
- contact
- products

Rules:
- business_name: Name of the business. Use null if not mentioned.
- owner_name: Name of the owner. Use null if not mentioned.
- category: Type of business, for example Cyber Cafe, Boutique, Restaurant. Use null if unclear.
- location: Business location. Use null if not mentioned.
- hours: Opening and closing hours. Use null if not mentioned.
- contact: Phone number, email, or other contact information. Use null if not mentioned.
- products: List of products or services offered by the business. Use [] if none are mentioned.

Text:
{description}
"""
            }
        ]
    )

    return response.choices[0].message.content


# Test this file directly
if __name__ == "__main__":

    description = """
    Mera naam harsh hai. Mai ek Harsh Finance naam ka money lending firm chalaata hoon Gondal, Gujarat mai. 10:00 se 12:00 tak.
    """

    result = extract_business_info(description)

    print(result)