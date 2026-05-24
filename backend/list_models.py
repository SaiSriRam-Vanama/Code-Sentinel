import google.generativeai as genai
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

for m in genai.list_models():
  if 'generateContent' in m.supported_generation_methods:
    print(m.name)
