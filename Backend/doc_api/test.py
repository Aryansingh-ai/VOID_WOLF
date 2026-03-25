import os
from dotenv import load_dotenv

load_dotenv()
print("OPENAI_API_KEY:", os.getenv("OPENAI_API_KEY"))
print("CLIENT_SECRETS_FILE:", os.getenv("GOOGLE_CLIENT_SECRET_PATH"))
print("SERVICE_ACCOUNT:", os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
