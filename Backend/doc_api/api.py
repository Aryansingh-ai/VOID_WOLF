import os
import re
import io
import json
import base64
from datetime import datetime, timedelta

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from PyPDF2 import PdfReader

from fastapi import FastAPI
from pydantic import BaseModel

from deep_translator import GoogleTranslator

from sumy.parsers.plaintext import PlaintextParser
from sumy.summarizers.lsa import LsaSummarizer
from sumy.nlp.tokenizers import Tokenizer

from dotenv import load_dotenv
import dateparser

# ✅ Central OpenAI client
from doc_api.openai_client import client

# ========== CONFIG ==========
load_dotenv()
app = FastAPI(title="AI Email Summarizer API")

# ---------- Utility Functions ----------

def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print("PDF extraction failed:", e)
        return ""


def fetch_emails(limit: int, creds_json: str):
    """Fetch last N emails from Gmail (safe + improved parsing)"""
    try:
        creds = Credentials.from_authorized_user_info(json.loads(creds_json))
        service = build("gmail", "v1", credentials=creds)

        results = service.users().messages().list(
            userId="me",
            maxResults=limit
        ).execute()

        messages = results.get("messages", [])
        emails = []

        for msg in messages:
            msg_data = service.users().messages().get(
                userId="me",
                id=msg["id"],
                format="full"
            ).execute()

            headers = msg_data.get("payload", {}).get("headers", [])
            subject = next((h["value"] for h in headers if h["name"] == "Subject"), "No Subject")

            parts = msg_data.get("payload", {}).get("parts", [])
            body = ""

            if parts:
                for part in parts:
                    if part.get("mimeType") in ["text/plain", "text/html"]:
                        data = part.get("body", {}).get("data")
                        if data:
                            body += base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
            else:
                data = msg_data.get("payload", {}).get("body", {}).get("data")
                if data:
                    body += base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")

            if body.strip():
                emails.append(f"Subject: {subject}\n\n{body}")

        return emails

    except Exception as e:
        print("Email fetch failed:", e)
        return []


def translate_text(text: str, target_lang="en") -> str:
    if not text.strip():
        return ""
    try:
        return GoogleTranslator(source="auto", target=target_lang).translate(text)
    except Exception:
        return text


# ---------- Summarization ----------

def summarize_with_openai(text: str) -> str:
    if not client or not text.strip():
        return None
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You summarize emails into clear actionable bullet points."},
                {"role": "user", "content": f"Summarize this:\n\n{text}"}
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("OpenAI summary failed:", e)
        return None


def summarize_text_local(text: str, max_points: int = 6) -> str:
    try:
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        summarizer = LsaSummarizer()
        summary = summarizer(parser.document, max_points)
        return "\n".join([f"• {s}" for s in summary]) or text[:400]
    except Exception:
        return text[:400]


# ---------- Meeting Detection ----------

def detect_meeting_info_ai(text: str) -> dict:
    if not client or not text.strip():
        return {}

    try:
        prompt = f"""
Extract meeting details from this email.
Return JSON with keys: title, date, time, meeting_link.

Text:
{text}
"""
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        content = response.choices[0].message.content.strip()
        match = re.search(r"\{.*\}", content, re.S)
        if match:
            return json.loads(match.group(0))
    except Exception as e:
        print("Meeting extraction failed:", e)

    return {}


# ---------- Calendar ----------

def add_event_to_calendar(creds_json: str, meeting_info: dict):
    try:
        creds = Credentials.from_authorized_user_info(json.loads(creds_json))
        service = build("calendar", "v3", credentials=creds)

        start_date = dateparser.parse(meeting_info.get("date", str(datetime.now().date())))

        time_text = meeting_info.get("time", "10:00 AM")
        time_match = re.search(r"\d{1,2}(:\d{2})?\s?(AM|PM|am|pm)", time_text)
        start_time = time_match.group(0) if time_match else "10:00 AM"

        start_dt = dateparser.parse(f"{start_date} {start_time}")
        end_dt = start_dt + timedelta(hours=1)

        event = {
            "summary": meeting_info.get("title", "Meeting"),
            "start": {"dateTime": start_dt.isoformat(), "timeZone": "Asia/Kolkata"},
            "end": {"dateTime": end_dt.isoformat(), "timeZone": "Asia/Kolkata"},
        }

        created = service.events().insert(calendarId="primary", body=event).execute()
        return {"status": "added", "calendar_link": created.get("htmlLink")}

    except Exception as e:
        return {"error": str(e)}


# ---------- API Schema ----------

class EmailPayload(BaseModel):
    email_content: str = None
    file_content: bytes = None
    credentials: str = None
    email_count: int = 3

def classify_priority(text: str):
    """Simple priority classification using AI"""
    if not client or not text.strip():
        return "medium"

    try:
        prompt = f"""
Classify this email priority strictly as one of:
high, medium, low

Email:
{text}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        result = response.choices[0].message.content.strip().lower()

        if "high" in result:
            return "high"
        elif "low" in result:
            return "low"
        else:
            return "medium"

    except Exception:
        return "medium"
    
# ---------- Endpoint ----------

@app.post("/process_email")
async def process_email(payload: EmailPayload):
    """Fetch → process multiple emails → summarize intelligently"""

    email_count = max(1, min(payload.email_count or 3, 20))

    # Fetch emails
    emails = []
    if payload.credentials:
        emails = fetch_emails(email_count, payload.credentials)

    if not emails and payload.email_content:
        emails = [payload.email_content]

    if not emails:
        return {"error": "No emails found or provided."}

    # Translate
    translated_emails = [translate_text(e) for e in emails]
    # 🔥 Step: classify priority
    priority_map = {"high": 3, "medium": 2, "low": 1}
    emails_with_priority = []
    for email in translated_emails:
        priority = classify_priority(email)
        emails_with_priority.append((email, priority))

    emails_sorted = sorted(
        emails_with_priority,
        key=lambda x: priority_map.get(x[1], 0),
        reverse=True
        )
    sorted_emails = [e[0] for e in emails_sorted]
    sorted_priorities = [e[1] for e in emails_sorted]

    # Individual summaries
    individual_summaries = [
        summarize_with_openai(e) or summarize_text_local(e)
        for e in sorted_emails
    ]

    # Final summary
    combined_summary = summarize_with_openai("\n\n".join(individual_summaries)) \
                       or summarize_text_local("\n\n".join(individual_summaries))

    # Meeting detection (on combined)
    meeting_info = detect_meeting_info_ai("\n\n".join(translated_emails))

    # Calendar
    calendar_status = {}
    if payload.credentials and meeting_info:
        calendar_status = add_event_to_calendar(payload.credentials, meeting_info)

    return {
    "emails_processed": len(emails),
    "priorities": sorted_priorities,
    "individual_summaries": individual_summaries,
    "final_summary": combined_summary,
    "meeting_detected": meeting_info,
    "calendar_status": calendar_status,
    }
