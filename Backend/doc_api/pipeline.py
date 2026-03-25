import os
import re
import mimetypes
import json
import asyncio
from google.cloud import vision
from google.cloud import translate_v2 as translate
from vertexai import init
from vertexai.generative_models import GenerativeModel
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from typing import List, Dict

# ---------- Config ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_PATH = os.path.join(BASE_DIR, "service_account.json")
TOKEN_FILE = os.path.join(BASE_DIR, "token.json")

PROJECT_ID = "zippy-tiger-477019-e5"
LOCATION = "us-central1"
TRANSLATE_TARGET = "en"
SCOPES = ["https://www.googleapis.com/auth/calendar.events"]

# ---------- Init ----------
if os.path.exists(SERVICE_ACCOUNT_PATH):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = SERVICE_ACCOUNT_PATH
    print(f"✅ Loaded service account: {SERVICE_ACCOUNT_PATH}")
else:
    print(f"⚠️ service_account.json missing — Gemini/Vision/Translate may fail")

init(project=PROJECT_ID, location=LOCATION)
gemini_model = GenerativeModel("gemini-1.5-flash-001")

translate_client = translate.Client()
vision_client = vision.ImageAnnotatorClient()

# ---------- Text Extraction ----------
def extract_text_any(path: str, client: vision.ImageAnnotatorClient, force_ocr: bool = False) -> str:
    try:
        mime, _ = mimetypes.guess_type(path)
        mime = mime or ""

        with open(path, "rb") as f:
            content = f.read()

        # If image or PDF → OCR
        if path.lower().endswith((".pdf", ".jpg", ".jpeg", ".png")) or force_ocr:
            print(f"🔍 Using Vision OCR on: {path}")
            resp = client.document_text_detection(image=vision.Image(content=content))
            if resp.error.message:
                raise RuntimeError(resp.error.message)
            return resp.full_text_annotation.text or ""

        # Assume text file
        return content.decode("utf-8", errors="ignore")

    except Exception as e:
        print(f"⚠️ OCR/Text extraction failed for {path}: {e}")
        return f"File extraction failed ({e})"


# ---------- Translation ----------
def translate_to(text: str, target_lang: str = TRANSLATE_TARGET) -> str:
    chunks = [text[i:i + 4000] for i in range(0, len(text), 4000)]
    translated = []

    for ch in chunks:
        try:
            result = translate_client.translate(ch, target_language=target_lang)
            translated.append(result.get("translatedText", ch))
        except Exception as e:
            print(f"⚠️ Translate API failed: {e}")
            translated.append(ch)

    return "\n".join(translated)


# ---------- Summarization ----------
def summarize_text(text: str, max_points: int = 5) -> str:
    prompt = f"""
Summarize the following text into {max_points} clear, bullet-style points:
{text}
"""
    try:
        response = gemini_model.generate_content(prompt)
        return getattr(response, "text", "").strip() or "No summary generated."
    except Exception as e:
        print(f"⚠️ Gemini summarization failed ({e}), using fallback.")
        try:
            parser = PlaintextParser.from_string(text, Tokenizer("english"))
            summarizer = LsaSummarizer()
            return "\n".join([f"- {str(s)}" for s in summarizer(parser.document, max_points)])
        except Exception:
            return text[:500]


# ---------- Metadata Extraction ----------
def clean_json_output(raw: str) -> str:
    # Remove markdown code block wrappers and stray text
    cleaned = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    cleaned = cleaned.replace("“", '"').replace("”", '"')
    return cleaned

def extract_metadata(text: str) -> Dict:
    prompt = f"""
Extract meetings, priority and department from this text as JSON:
{{
  "meetings": [{{"title": "...", "date": "YYYY-MM-DD", "time": "HH:MM"}}],
  "priority": "High/Medium/Low",
  "department": "HR/Finance/Legal/Operations/General"
}}
Text:
{text}
"""
    try:
        response = gemini_model.generate_content(prompt)
        raw = getattr(response, "text", "").strip()
        raw = clean_json_output(raw)
        data = json.loads(raw)
        return data
    except Exception as e:
        print(f"⚠️ Metadata parsing failed: {e}")
        return {"meetings": [], "priority": "Unknown", "department": "General"}


# ---------- Calendar Integration ----------
def add_meetings_to_calendar(meetings: List[Dict]):
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        print("⚠️ Missing or invalid token.json, skipping Calendar API.")
        return

    service = build("calendar", "v3", credentials=creds)
    for m in meetings:
        try:
            start = f"{m['date']}T{m['time']}:00"
            event = {
                "summary": m.get("title", "Untitled Meeting"),
                "description": "Added automatically by AI document analyzer.",
                "start": {"dateTime": start, "timeZone": "Asia/Kolkata"},
                "end": {"dateTime": start, "timeZone": "Asia/Kolkata"},
            }
            service.events().insert(calendarId="primary", body=event).execute()
            print(f"✅ Calendar event added: {m['title']}")
        except Exception as e:
            print(f"⚠️ Calendar insertion failed for {m}: {e}")


# ---------- Main Orchestrator ----------
def process_file_with_summary(path: str, target_lang: str = "en", force_ocr: bool = False):
    raw_text = extract_text_any(path, vision_client, force_ocr=force_ocr)
    translated = translate_to(raw_text, target_lang) if target_lang else raw_text
    summary = summarize_text(translated)
    metadata = extract_metadata(translated)

    if metadata.get("meetings"):
        add_meetings_to_calendar(metadata["meetings"])

    return {
        "file": os.path.basename(path),
        "snippet": raw_text[:500] + ("..." if len(raw_text) > 500 else ""),
        "translated_text": translated,
        "summary": summary,
        "metadata": metadata,
    }

def process_multiple_emails(paths: List[str], email_count: int = 3, target_lang: str = "en"):
    """
    Process last N email files and return combined + individual summaries
    """

    # safety cap
    email_count = min(email_count, len(paths), 20)

    selected_paths = paths[:email_count]

    results = []
    combined_text = ""

    for path in selected_paths:
        result = process_file_with_summary(path, target_lang=target_lang)
        results.append(result)
        combined_text += "\n\n--- EMAIL ---\n\n" + result["translated_text"]

    # Final combined summary
    final_summary = summarize_text(combined_text)

    return {
        "emails_processed": len(results),
        "individual_results": results,
        "final_summary": final_summary
    }