import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://openrouter.ai/api/v1")

if not OPENROUTER_API_KEY:
    raise ValueError("❌ OPENROUTER_API_KEY not found in .env")

client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url=DEEPSEEK_BASE_URL,
)

print("✅ DeepSeek (OpenRouter) client initialized")