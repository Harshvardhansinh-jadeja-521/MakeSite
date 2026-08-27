from groq import Groq  # pip install groq

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)
description = "Mera naam Priya hai, Sharma Boutique chalati hoon, Andheri mein, subah 10 se raat 8 baje tak"

response = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[{
        "role": "user",
        "content": f"Extract business_name, owner_name, location, hours, category as JSON. If missing, use null. Text: {description}"
    }]
)

print(response.choices[0].message.content)