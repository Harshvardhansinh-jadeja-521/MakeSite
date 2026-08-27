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
Extract the following business information from the text.

Return ONLY valid JSON.

Fields:
- business_name
- owner_name
- location
- hours
- category

If information is missing, use null.

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
    Mera naam Priya hai, Sharma Boutique chalati hoon,
    Andheri mein, subah 10 se raat 8 baje tak
    """

    result = extract_business_info(description)

    print(result)