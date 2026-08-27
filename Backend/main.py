# main.py
from fastapi import FastAPI
from extraction import extract_business_info

app = FastAPI()

@app.post("/extract")
def extract(description: str):
    return extract_business_info(description)