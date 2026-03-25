from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.responses import RedirectResponse
import os, json, base64, re, io, tempfile
import html
from typing import List, Dict, Optional

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from google.cloud import vision, translate_v2 as translate, aiplatform
from langdetect import detect
from deep_translator import GoogleTranslator

from sumy.parsers.plaintext import PlaintextParser
from sumy.summarizers.lsa import LsaSummarizer
from sumy.nlp.tokenizers import Tokenizer

from datetime import datetime, timedelta
import dateparser
import fitz  # PyMuPDF
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ================== ENVIRONMENT CONFIG ==================
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek/deepseek-chat")
# --- Verify client secret path exists ---
CLIENT_SECRETS_FILE = os.path.join(BASE_DIR, os.getenv("GOOGLE_CLIENT_SECRET_PATH"))

if not os.path.exists(CLIENT_SECRETS_FILE):
    raise FileNotFoundError(f"⚠️ GOOGLE_CLIENT_SECRET_PATH not found at {CLIENT_SECRETS_FILE}")

# --- Centralized OpenAI client import ---
from doc_api.openai_client import client  # ✅ Single shared OpenAI client
# ================== 🔧 ADDED: Gemini (Google AI Studio) REST client ==================
# Uses the official REST endpoint (free tier, large context)
import requests
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


def _safe_trim(text: str, limit: int = 100000):
    # Gemini can handle very large contexts; still trim to protect cost/time if huge
    if text is None:
        return ""
    return text[:limit]

def gemini_generate_text(prompt: str, temperature: float = 0.2, max_output_tokens: int = 1024) -> Optional[str]:
    """Call Gemini for text output. Returns string or None."""
    if not GEMINI_API_KEY:
        return None
    try:
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens
            }
        }
        params = {"key": GEMINI_API_KEY}
        r = requests.post(GEMINI_ENDPOINT, params=params, json=payload, timeout=45)
        if r.status_code != 200:
            print("Gemini API error:", r.status_code, r.text[:500])
            return None
        data = r.json()
        # Handle candidates structure
        candidates = data.get("candidates") or []
        if not candidates:
            return None
        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            return None
        text = "".join([p.get("text", "") for p in parts]).strip()
        return text or None
    except Exception as e:
        print("Gemini request failed:", e)
        return None

def gemini_generate_json(prompt: str, temperature: float = 0.0, max_output_tokens: int = 1024) -> Optional[dict]:
    """Call Gemini and attempt to parse JSON reliably (removes code fences)."""
    txt = gemini_generate_text(prompt, temperature=temperature, max_output_tokens=max_output_tokens)
    if not txt:
        return None
    try:
        cleaned = re.sub(r"^```(?:json)?|```$", "", txt.strip(), flags=re.MULTILINE).strip()
        # Also handle any trailing commentary
        m = re.search(r"\{[\s\S]*\}$", cleaned)
        if m:
            cleaned = m.group(0)
        return json.loads(cleaned)
    except Exception as e:
        print("Gemini JSON parse failed:", e, "RAW:", txt[:300])
        return None

def gemini_generate_json_list(prompt: str, temperature: float = 0.0, max_output_tokens: int = 1024) -> Optional[list]:
    """Call Gemini and parse a JSON list reliably."""
    txt = gemini_generate_text(prompt, temperature=temperature, max_output_tokens=max_output_tokens)
    if not txt:
        return None
    try:
        cleaned = re.sub(r"^```(?:json)?|```$", "", txt.strip(), flags=re.MULTILINE).strip()
        m = re.search(r"\[[\s\S]*\]$", cleaned)
        if m:
            cleaned = m.group(0)
        return json.loads(cleaned)
    except Exception as e:
        print("Gemini JSON list parse failed:", e, "RAW:", txt[:300])
        return None
# ================== 🔧 END ADDED ==================

# ================== GOOGLE CONFIG ==================
SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
]

TOKEN_PATH = os.path.join(os.path.dirname(__file__), "token.json")

cred_path = os.path.join(BASE_DIR, "service_account.json")

if not os.path.exists(cred_path):
    raise FileNotFoundError(f"Service account not found at {cred_path}")

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = cred_path



# ================== FASTAPI APP SETUP ==================
app = FastAPI(title="AI Meeting Assistant API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vision_client = vision.ImageAnnotatorClient()
translate_client = translate.Client()

# ================== HELPERS ==================
def get_gmail_service():
    if not os.path.exists(TOKEN_PATH):
        raise HTTPException(status_code=400, detail="Missing token.json. Please complete Gmail OAuth flow.")
    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    return build("gmail", "v1", credentials=creds)

def _decode_gmail_data(data: Optional[str]) -> str:
    if not data:
        return ""
    try:
        return base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
    except Exception:
        return ""

def _strip_html_content(content: str) -> str:
    if not content:
        return ""
    cleaned = re.sub(r"<script[\s\S]*?</script>", " ", content, flags=re.I)
    cleaned = re.sub(r"<style[\s\S]*?</style>", " ", cleaned, flags=re.I)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = html.unescape(cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()

def extract_email_body_from_payload(payload: Dict) -> str:
    text_plain_parts: List[str] = []
    text_html_parts: List[str] = []

    def walk(part: Dict):
        mime = (part.get("mimeType") or "").lower()
        body = part.get("body", {}) or {}
        data = body.get("data")
        decoded = _decode_gmail_data(data)

        if decoded:
            if mime == "text/plain":
                text_plain_parts.append(decoded)
            elif mime == "text/html":
                text_html_parts.append(decoded)

        for sub in part.get("parts", []) or []:
            walk(sub)

    walk(payload or {})

    if text_plain_parts:
        merged = "\n\n".join(text_plain_parts)
        return re.sub(r"\s+", " ", merged).strip()

    if text_html_parts:
        merged_html = "\n\n".join(text_html_parts)
        return _strip_html_content(merged_html)

    # Final fallback: single-part payload body
    root_body = _decode_gmail_data((payload or {}).get("body", {}).get("data"))
    if root_body:
        if "<" in root_body and ">" in root_body:
            return _strip_html_content(root_body)
        return re.sub(r"\s+", " ", root_body).strip()

    return ""

def extract_text_any(path: str) -> str:
    """Extract text from PDF/Image/Text using Vision API + PyMuPDF (fallback)."""
    try:
        ext = path.lower().split(".")[-1]
        text = ""

        if ext == "pdf":
            pdf = fitz.open(path)
            for page in pdf:
                text += page.get_text("text") or ""
            pdf.close()
            if not text.strip():
                with open(path, "rb") as f:
                    content = f.read()
                resp = vision_client.document_text_detection(image=vision.Image(content=content))
                text = resp.full_text_annotation.text or ""

        elif ext in ["png", "jpg", "jpeg"]:
            with open(path, "rb") as f:
                content = f.read()
            resp = vision_client.text_detection(image=vision.Image(content=content))
            text = resp.full_text_annotation.text or ""

        else:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

        return text.strip()
    except Exception as e:
        print("OCR error:", e)
        return ""

def detect_and_translate(text: str) -> str:
    """Detect language and translate to English (deep_translator primary)."""
    try:
        if not text.strip():
            return ""
        lang = detect(text)
        regional_langs = ["hi", "bn", "mr", "te", "ta", "gu", "kn", "ml", "pa"]
        if lang in regional_langs:
            return GoogleTranslator(source="auto", target="en").translate(text)
        return text
    except Exception as e:
        print("Translation failed:", e)
        return text

# ================== SUMMARIZATION ==================
def summarize_text_local(text: str, max_points: int = 8) -> str:
    """Local fallback summarizer (bullet points)."""
    try:
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        summarizer = LsaSummarizer()
        summary = summarizer(parser.document, max_points)
        return "\n".join([f"• {s}" for s in summary]) or text[:400]
    except Exception:
        text = re.sub(r"\s+", " ", text).strip()
        parts = re.split(r"[•\-\n]|(?<=\.)\s+(?=[A-Z])", text)
        return "\n".join([f"• {p.strip()}" for p in parts[:max_points] if len(p.strip()) > 3])


def format_summary_points(summary: str, max_points: int = 8) -> str:
    if not summary:
        return ""

    text = summary.replace("\r", "\n")
    text = re.sub(r"^\s*#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = text.replace("**", "*")

    raw_lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    cleaned_lines: List[str] = []
    for line in raw_lines:
        line = re.sub(r"^[\-•*\d\.\)\s]+", "", line).strip()
        if not line:
            continue
        cleaned_lines.append(line)

    if len(cleaned_lines) <= 1:
        fallback_text = re.sub(r"\s+", " ", text).strip()
        cleaned_lines = [p.strip(" -•") for p in re.split(r"(?<=[.!?])\s+(?=[A-Z])", fallback_text) if p.strip()]

    url_re = re.compile(r"(https?://\S+)", re.I)
    date_re = re.compile(r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*\d{2,4})\b", re.I)
    time_re = re.compile(r"\b\d{1,2}(:\d{2})?\s?(?:AM|PM|IST|EST|PST|UTC)\b", re.I)
    amount_re = re.compile(r"(?:₹|\$|EUR|INR)\s?\d+[\d,]*(?:\.\d+)?", re.I)
    place_re = re.compile(r"\b[A-Z][a-z]+(?:/[A-Z][a-z]+)+\b")

    normalized: List[str] = []
    for line in cleaned_lines:
        if len(line) < 4:
            continue
        line = url_re.sub(r"*\1*", line)
        line = date_re.sub(lambda m: f"*{m.group(0)}*", line)
        line = time_re.sub(lambda m: f"*{m.group(0)}*", line)
        line = amount_re.sub(lambda m: f"*{m.group(0)}*", line)
        line = place_re.sub(lambda m: f"*{m.group(0)}*", line)
        normalized.append(f"- {line}")
        if len(normalized) >= max_points:
            break

    if not normalized:
        return "- No summary available."

    return "\n".join(normalized)

def summarize_with_vertex(text: str) -> str:
    """Fallback: Try Vertex AI summarization."""
    try:
        aiplatform.init(project="zippy-tiger-477019-e5", location="us-central1")
        from vertexai.preview.generative_models import GenerativeModel
        model = GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(f"Summarize this email in concise bullet points only:\n\n{text[:6000]}")
        return format_summary_points(response.text.strip()) if response and response.text else format_summary_points(summarize_text_local(text))
    except Exception as e:
        print("Vertex AI failed:", e)
        return format_summary_points(summarize_text_local(text))

# ================== 🔥 ADDED: Gemini-first + Deep AI Summary Chain ==================
def summarize_with_gemini(text: str):
    if not text.strip():
        return None

    prompt = f"""
Summarize the following email into 4-8 short bullet points.

Strict format rules:
- Return plain bullets only, each line must start with "- "
- No headings, no paragraphs, no markdown sections, no code blocks
- Use single asterisk emphasis only for critical entities like dates, times, places, links, amounts, deadlines

Focus on:
- Main purpose
- Key details
- Deadlines
- Meetings (if any)
- Action items

Text:
{text[:8000]}
"""

    try:
        resp = client.chat.completions.create(
            model=os.getenv("GEMINI_MODEL", "google/gemini-1.5-flash"),
            messages=[
                {"role": "system", "content": "You are a professional email summarization assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=1000
        )

        return format_summary_points(resp.choices[0].message.content.strip())

    except Exception as e:
        print("Gemini (OpenRouter) failed:", e)
        return None
    
def summarize_with_deepseek(text: str):
    if not text.strip():
        return None

    prompt = f"""
Summarize the following email into 4-6 concise bullet points.

Strict format rules:
- Return plain bullets only, each line must start with "- "
- No headings, no paragraph blocks
- Use single asterisk emphasis only for important entities (date, time, place, links, amount, deadline)

Focus on:
- Main purpose
- Key details
- Deadlines
- Meeting info (if present)
- Required actions

Text:
{text[:8000]}
"""

    try:
        resp = client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": "You are a professional AI assistant summarizing emails."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=1000
        )
        return format_summary_points(resp.choices[0].message.content.strip())
    except Exception as e:
        print("DeepSeek summarization failed:", e)
        return None

def summarize_with_fallback(text: str):
    # 1️⃣ Gemini
    s = summarize_with_gemini(text)
    if s:
        return s

    # 2️⃣ DeepSeek
    s = summarize_with_deepseek(text)
    if s:
        return s

    # 3️⃣ Vertex
    s = summarize_with_vertex(text)
    if s:
        return s

    # 4️⃣ Local fallback handled outside
    return None

def smart_summarize(text: str) -> str:
    """Updated smart summarizer."""
    return format_summary_points(summarize_with_fallback(text) or summarize_text_local(text))

# ================== CLASSIFICATION ==================
def classify_with_deepseek(text: str):
    if not text.strip():
        return None

    prompt = f"""
Classify this email.
Return strict JSON only:
{{
  "category": "spam|ads|promo|newsletter|transactional|personal|work",
  "importance": "low|medium|high",
  "reason": "short reason"
}}
Text:
{text[:6000]}
"""

    try:
        resp = client.chat.completions.create(
            model=os.getenv("DEEPSEEK_MODEL"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=700
        )

        content = resp.choices[0].message.content.strip()
        match = re.search(r"\{.*\}", content, re.S)
        return json.loads(match.group(0)) if match else None
    except Exception as e:
        print("DeepSeek classification failed:", e)
        return None

# ================== 🔥 ADDED: Gemini-first classification ==================
def classify_with_gemini(text: str) -> Optional[Dict]:
    if not text.strip():
        return None
    prompt = f"""
You are a strict JSON API. Classify the following email content.

Return ONLY valid JSON (no code fences, no commentary):

{{
  "category": "spam|ads|promo|newsletter|transactional|personal|work",
  "importance": "low|medium|high",
  "reason": "short reason"
}}

EMAIL:
{text[:200000]}
"""
    data = gemini_generate_json(_safe_trim(prompt, 250000), temperature=0.0, max_output_tokens=700)
    return data

def classify_local(text: str) -> Dict:
    """Simple local fallback."""
    t = text.lower()
    if any(k in t for k in ["unsubscribe", "offer", "sale", "discount"]):
        return {"category": "ads", "importance": "low", "reason": "Marketing content"}
    if any(k in t for k in ["meeting", "call", "agenda", "review"]):
        return {"category": "work", "importance": "high", "reason": "Work/meeting terms found"}
    if any(k in t for k in ["invoice", "receipt", "order", "otp"]):
        return {"category": "transactional", "importance": "medium", "reason": "Transactional content"}
    return {"category": "personal", "importance": "medium", "reason": "General message"}

def smart_classify(text: str):
    c = classify_with_gemini(text)
    if c:
        return c

    c = classify_with_deepseek(text)
    if c:
        return c

    return classify_local(text)

# ================== MEETING EXTRACTION ==================
MEET_LINK_RE = r"((?:https?://)?(?:[\w-]+\.)?(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com)\S*)"
TIME_RE = r"\b\d{1,2}(:\d{2})?\s?(AM|PM|am|pm)\b"
DATE_PATTERNS = [
    r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
    r"\b\d{1,2}\s?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s?\d{4}\b",
]


def _normalize_meeting_link(link: str) -> str:
    if not link:
        return "N/A"
    cleaned = link.strip().rstrip(").,;]")
    if not cleaned:
        return "N/A"
    if cleaned.lower().startswith("http://") or cleaned.lower().startswith("https://"):
        return cleaned
    return f"https://{cleaned}"


def _extract_meeting_links(text: str) -> List[str]:
    if not text:
        return []
    links = []
    seen = set()
    for match in re.finditer(MEET_LINK_RE, text, re.I):
        normalized = _normalize_meeting_link(match.group(1))
        key = normalized.lower()
        if normalized != "N/A" and key not in seen:
            seen.add(key)
            links.append(normalized)
    return links


def deduplicate_meetings(meetings: List[Dict]) -> List[Dict]:
    if not meetings:
        return []

    merged: Dict[str, Dict] = {}

    for i, m in enumerate(meetings):
        title = (m.get("title") or "").strip() or "Detected Meeting"
        date = (m.get("date") or "N/A").strip()
        start_time = (m.get("start_time") or "N/A").strip()
        meeting_link = _normalize_meeting_link(m.get("meeting_link", ""))

        if meeting_link != "N/A":
            key = f"link:{meeting_link.lower()}"
        elif date != "N/A" or start_time != "N/A":
            key = f"slot:{date.lower()}|{start_time.lower()}"
        else:
            key = f"fallback:{title.lower()}:{i}"

        if key not in merged:
            merged[key] = {
                "title": title,
                "date": date,
                "start_time": start_time,
                "meeting_link": meeting_link,
            }
            continue

        existing = merged[key]

        if (not existing.get("title") or existing.get("title") == "Detected Meeting") and title and title != "Detected Meeting":
            existing["title"] = title

        if existing.get("date") in (None, "", "N/A") and date not in (None, "", "N/A"):
            existing["date"] = date

        if existing.get("start_time") in (None, "", "N/A") and start_time not in (None, "", "N/A"):
            existing["start_time"] = start_time

        if existing.get("meeting_link") in (None, "", "N/A") and meeting_link not in (None, "", "N/A"):
            existing["meeting_link"] = meeting_link

    return list(merged.values())

# ================== 🔥 ADDED: Gemini-first meeting extraction ==================
def extract_meeting_details_gemini(text: str) -> Optional[List[Dict]]:
    if not text.strip():
        return None
    prompt = f"""
Extract meeting details as a JSON list. Return ONLY a JSON array, no commentary.

Each item:
{{
  "title": "string",
  "date": "YYYY-MM-DD" or "N/A",
  "start_time": "h:mm AM/PM" or "N/A",
  "meeting_link": "url or N/A"
}}

Include items only if there is a meeting link OR both a date and a time are present. Infer reasonable titles if needed.

TEXT:
{text[:200000]}
"""
    data = gemini_generate_json_list(_safe_trim(prompt, 250000), temperature=0.0, max_output_tokens=900)
    if not data:
        return None

    # validate & filter
    cleaned = []
    for it in data:
        title = (it.get("title") or "").strip() or "Meeting"
        date = (it.get("date") or "N/A").strip()
        start_time = (it.get("start_time") or "N/A").strip()
        link = (it.get("meeting_link") or "N/A").strip()
        valid = bool(re.search(MEET_LINK_RE, link, re.I)) or (date != "N/A" and start_time != "N/A")
        if valid:
            cleaned.append({
                "title": title,
                "date": date,
                "start_time": start_time,
                "meeting_link": link
            })
    return cleaned or None

def extract_meeting_details_ai(text: str) -> List[Dict]:
    meetings: List[Dict] = []

    def _augment_with_detected_links(base_meetings: List[Dict]) -> List[Dict]:
        all_links = _extract_meeting_links(text)
        if not all_links:
            return base_meetings

        existing_links = {
            _normalize_meeting_link(m.get("meeting_link", "")).lower()
            for m in base_meetings
            if m.get("meeting_link") and m.get("meeting_link") != "N/A"
        }

        fallback_date = "N/A"
        fallback_time = "N/A"
        for dp in DATE_PATTERNS:
            found_date = re.search(dp, text, re.I)
            if found_date:
                try:
                    parsed = dateparser.parse(found_date.group(0))
                    fallback_date = parsed.strftime("%Y-%m-%d") if parsed else "N/A"
                except Exception:
                    fallback_date = found_date.group(0)
                break

        found_time = re.search(TIME_RE, text)
        if found_time:
            fallback_time = found_time.group(0)

        for link in all_links:
            if link.lower() in existing_links:
                continue
            base_meetings.append({
                "title": "Detected Meeting",
                "date": fallback_date,
                "start_time": fallback_time,
                "meeting_link": link,
            })

        return base_meetings

    # 1️⃣ Try Gemini first
    try:
        gm = extract_meeting_details_gemini(text)
        if gm:
            return _augment_with_detected_links(gm)
    except Exception as e:
        print("Gemini meeting extraction failed:", e)

    # 2️⃣ DeepSeek (OpenRouter) fallback
    if client and text.strip():
        try:
            prompt = f"""
Extract meeting details from the text.

Return ONLY a valid JSON list in this format:
[
  {{
    "title": "Meeting Title",
    "date": "YYYY-MM-DD",
    "start_time": "h:mm AM/PM",
    "meeting_link": "URL or N/A"
  }}
]

Rules:
- Include item only if meeting link exists OR both date and time exist.
- If not found, return empty list [].
- No explanation. No markdown.

Text:
{text[:6000]}
"""

            resp = client.chat.completions.create(
                model=os.getenv("DEEPSEEK_MODEL"),
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=900
            )

            content = resp.choices[0].message.content.strip()

            # Clean JSON safely
            match = re.search(r"\[.*\]", content, re.S)
            if match:
                parsed = json.loads(match.group(0))

                for it in parsed:
                    normalized_link = _normalize_meeting_link(it.get("meeting_link", ""))
                    link_valid = re.search(MEET_LINK_RE, normalized_link, re.I)
                    date_valid = it.get("date") and it.get("date") != "N/A"
                    time_valid = it.get("start_time") and it.get("start_time") != "N/A"

                    if link_valid or (date_valid and time_valid):
                        title = (it.get("title") or "").strip()
                        if not title or title.upper() == "N/A":
                            title = "Detected Meeting"
                        it["title"] = title
                        it["meeting_link"] = normalized_link if link_valid else "N/A"
                        meetings.append(it)

                if meetings:
                    return _augment_with_detected_links(meetings)

        except Exception as e:
            print("DeepSeek meeting extraction failed:", e)

    # 3️⃣ Regex fallback
    links = _extract_meeting_links(text)
    date = None

    for dp in DATE_PATTERNS:
        d = re.search(dp, text, re.I)
        if d:
            date = d.group(0)
            break

    time = re.search(TIME_RE, text)

    if links or (date and time):
        date_obj = dateparser.parse(date) if date else datetime.now()

        if links:
            for detected_link in links:
                meetings.append({
                    "title": "Detected Meeting",
                    "date": date_obj.strftime("%Y-%m-%d"),
                    "start_time": time.group(0) if time else "10:00 AM",
                    "meeting_link": detected_link,
                })
        else:
            meetings.append({
                "title": "Detected Meeting",
                "date": date_obj.strftime("%Y-%m-%d"),
                "start_time": time.group(0) if time else "10:00 AM",
                "meeting_link": "N/A",
            })

    return meetings

# ================== CALENDAR ==================
def add_to_calendar(meetings: List[Dict]) -> List[str]:
    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    service = build("calendar", "v3", credentials=creds)
    event_links = []
    for m in meetings:
        try:
            start = dateparser.parse(f"{m['date']} {m['start_time']}")
            end = start + timedelta(minutes=5)
            event = {
                "summary": m.get("title", "Untitled Meeting"),
                "description": f"📅 Auto-added meeting\nLink: {m.get('meeting_link', 'N/A')}",
                "start": {"dateTime": start.isoformat(), "timeZone": "Asia/Kolkata"},
                "end": {"dateTime": end.isoformat(), "timeZone": "Asia/Kolkata"},
            }
            created = service.events().insert(calendarId="primary", body=event).execute()
            link = created.get("htmlLink")
            print("✅ Added to calendar:", link)
            event_links.append(link)
        except Exception as e:
            print("Calendar insert error:", e)
    return event_links

# ================== ROUTES ==================
@app.get("/")
def home():
    return {"message": "🚀 AI Meeting Assistant (Gemini + DeepSeek + Vertex + Local) active"}

# (rest of your routes remain unchanged — total lines now ≈590+)
@app.get("/auth")
def auth_google():
    redirect_uri = "http://127.0.0.1:8000/auth/callback"
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri=redirect_uri)
    auth_url, _ = flow.authorization_url(access_type="offline", prompt="consent")
    return RedirectResponse(auth_url)

@app.get("/auth/callback")
def auth_callback(code: str):
    redirect_uri = "http://127.0.0.1:8000/auth/callback"
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri=redirect_uri)
    flow.fetch_token(code=code)
    creds = flow.credentials
    with open(TOKEN_PATH, "w") as token:
        token.write(creds.to_json())
    return {"message": "Authentication successful. You can now call /fetch-mails"}


from email.utils import parsedate_to_datetime
import pytz

@app.get("/fetch-mails")
def fetch_mails(
    email_count: int = Query(3, description="Number of emails to fetch (1-20)"),
    custom_emails: Optional[List[str]] = Query(None, description="Max 5 email addresses to mark as high priority"),
    custom_events: Optional[List[str]] = Query(None, description="Max 5 event/project names to boost")
):
    """
    Fetch last N Gmail messages → translate → summarize → classify → detect meetings
    
    Optional query parameters:
    - email_count: Number of emails to fetch (default 3)
    - custom_emails: List of max 5 email addresses to mark as high priority
    - custom_events: List of max 5 event/project names to mark as high priority if found
    """
    email_count = max(1, min(email_count, 20))
    
    # ✅ Validate and limit custom inputs
    custom_emails = [e.strip().lower() for e in (custom_emails or []) if e.strip()][:5]
    custom_events = [ev.strip().lower() for ev in (custom_events or []) if ev.strip()][:5]
    
    print(f"🔍 DEBUG: Received custom_emails={custom_emails}")
    print(f"🔍 DEBUG: Received custom_events={custom_events}")
    
    if not os.path.exists(TOKEN_PATH):
        raise HTTPException(status_code=500, detail="Missing token.json. Authenticate first.")
    service = get_gmail_service()

    try:
        results = service.users().messages().list(
            userId="me",
            q="category:primary in:inbox -in:spam -in:trash",
            maxResults=email_count
        ).execute()
        messages = results.get("messages", [])
        processed, all_meetings = [], []

        for msg in messages:
            # ----- Fetch full message -----
            m = service.users().messages().get(userId="me", id=msg["id"], format="full").execute()
            headers = {h["name"]: h["value"] for h in m.get("payload", {}).get("headers", [])}

            # ----- Extract sender, subject -----
            sender = headers.get("From", "Unknown Sender")
            subject = headers.get("Subject", "No Subject")

            # ----- Extract received date -----
            raw_date = headers.get("Date")
            try:
                parsed_date = parsedate_to_datetime(raw_date).astimezone(pytz.timezone("Asia/Kolkata")) if raw_date else None
                received_time = parsed_date.strftime("%Y-%m-%d %H:%M:%S") if parsed_date else "Unknown"
            except Exception:
                received_time = "Unknown"

            # ----- Extract snippet + full body -----
            snippet = html.unescape(m.get("snippet", "") or "")
            full_body = extract_email_body_from_payload(m.get("payload", {}) or {})
            body_text = full_body or snippet
            translated = detect_and_translate(body_text)

            # ----- Generate smart summary (includes subject + full body for context) -----
            summary_input = f"Subject: {subject}\n\nBody: {translated[:12000]}"
            summary = smart_summarize(summary_input)

            # ----- Classify email -----
            classification = smart_classify(translated)
            
            # ✅ BOOST priority based on custom_emails and custom_events
            boosted_importance = classification.get("importance", "medium")
            boost_reason = classification.get("reason", "")
            
            # Check if sender matches any custom email
            sender_email = sender.lower() if sender else ""
            sender_matched = False
            for custom_email in custom_emails:
                if custom_email in sender_email:
                    boosted_importance = "high"
                    boost_reason = f"✨ High priority sender matched: {custom_email}"
                    sender_matched = True
                    print(f"✅ BOOST: Sender '{sender}' matched custom email '{custom_email}'")
                    break
            
            # Check if any custom event name appears in summary or subject
            if not sender_matched and (summary or subject):
                full_text = (summary + " " + subject).lower()
                for custom_event in custom_events:
                    if custom_event in full_text:
                        boosted_importance = "high"
                        boost_reason = f"✨ High priority event matched: {custom_event}"
                        print(f"✅ BOOST: Email '{subject}' matched custom event '{custom_event}'")
                        break
            
            # Update classification with boosted importance
            classification["importance"] = boosted_importance
            classification["reason"] = boost_reason

            # ----- Handle attachments -----
            attachments_data = []
            attachment_meeting_texts: List[str] = []
            for part in m.get("payload", {}).get("parts", []) or []:
                filename = part.get("filename")
                if filename and "attachmentId" in part.get("body", {}):
                    att_id = part["body"]["attachmentId"]
                    att = (
                        service.users()
                        .messages()
                        .attachments()
                        .get(userId="me", messageId=msg["id"], id=att_id)
                        .execute()
                    )
                    data = base64.urlsafe_b64decode(att["data"].encode("UTF-8"))
                    os.makedirs("downloads", exist_ok=True)
                    path = os.path.join("downloads", filename)
                    with open(path, "wb") as f:
                        f.write(data)

                    text = extract_text_any(path)
                    translated_doc = detect_and_translate(text)
                    doc_summary = smart_summarize(translated_doc)
                    if translated_doc:
                        attachment_meeting_texts.append(translated_doc[:12000])
                    attachments_data.append({"filename": filename, "summary": doc_summary})

            # ----- Combine text for meeting extraction (snippet + summary + attachments) -----
            meeting_parts = [
                subject or "",
                snippet or "",
                body_text or "",
                translated or "",
                summary or "",
            ]
            meeting_parts.extend(a.get("summary", "") for a in attachments_data)
            meeting_parts.extend(attachment_meeting_texts)
            combined = "\n\n".join(part for part in meeting_parts if part)
            meetings = deduplicate_meetings(extract_meeting_details_ai(combined))
            calendar_links = add_to_calendar(meetings) if meetings else []

            # ----- Add calendar links -----
            for i, mobj in enumerate(meetings):
                mobj["calendar_link"] = calendar_links[i] if i < len(calendar_links) else None
                all_meetings.append(mobj)

            document_detected = len(attachments_data) > 0
            document_summary = "\n\n".join(
                f"{a.get('filename', 'Document')}: {a.get('summary', '')}" for a in attachments_data
            ) if document_detected else "N/A"

            mail_link = f"https://mail.google.com/mail/u/0/#all/{msg['id']}"

            # ----- Append all results -----
            processed.append({
                "sender": sender,
                "subject": subject,
                "received_time": received_time,  # ✅ Added field
                "email_snippet": snippet,
                "translated_snippet": translated,
                "summary": summary,
                "classification": classification,
                "attachments": attachments_data,
                "document_detected": document_detected,
                "document_summary": document_summary,
                "meetings_detected": meetings,
                "calendar_link": calendar_links[0] if calendar_links else None,
                "mail_link": mail_link,
            })

        # 🔥 PRIORITY RANKING - Calculate AFTER all emails are processed
        print(f"\n📊 RANKING {len(processed)} emails...")
        priority_map = {"high": 3, "medium": 2, "low": 1}
        ranked_emails = sorted(
            processed,
            key=lambda x: priority_map.get(x["classification"]["importance"], 0),
            reverse=True
        )
        priority_output = []
        for i, email in enumerate(ranked_emails, start=1):
            importance = email["classification"]["importance"]
            reason = email["classification"]["reason"]
            print(f"#{i} [{importance.upper()}] {email['subject'][:50]} - {reason}")
            priority_output.append({
                "rank": i,
                "subject": email["subject"],
                "priority": importance,
                "reason": reason
            })

        # ----- Save meeting log -----
        if all_meetings:
            os.makedirs("outputs", exist_ok=True)
            out = os.path.join("outputs", "meetings_summary.txt")
            with open(out, "w", encoding="utf-8") as f:
                for m in all_meetings:
                    f.write(
                        f"Title: {m['title']}\nDate: {m['date']}\nStart: {m['start_time']}\n"
                        f"Link: {m['meeting_link']}\nCalendar: {m['calendar_link']}\n"
                        "-----------------------------\n"
                    )
            print(f"✅ Meetings saved to {out}")

        return {
            "emails_processed": len(processed),
            "emails": processed,
            "priority_ranking": priority_output,   # ✅ NEW
            "summary_generated_at": datetime.now(pytz.timezone("Asia/Kolkata")).strftime("%Y-%m-%d %H:%M:%S")
        }

    except HttpError as e:
        raise HTTPException(status_code=500, detail=str(e))

    
from email.utils import parsedate_to_datetime
from datetime import timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

from email.utils import parsedate_to_datetime
from datetime import timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))


class SummarizePayload(BaseModel):
    text: str


@app.post("/summarize")
def summarize_endpoint(payload: SummarizePayload):
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required.")

    summary = smart_summarize(text)
    return {
        "source": "smart_summarize",
        "summary": summary,
        "char_count": len(text),
    }


@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    suffix = os.path.splitext(file.filename)[1] or ".txt"
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(await file.read())
            temp_path = temp_file.name

        extracted_text = extract_text_any(temp_path)
        translated = detect_and_translate(extracted_text)
        summary = smart_summarize(translated) if translated else "No extractable text found."

        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "extracted_text": translated,
            "summary": summary,
            "extracted_chars": len(translated or ""),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document processing failed: {e}")
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@app.get("/unread-primary-7d")
def get_unread_primary_last_7_days():
    """
    ✅ Fetch exact count of unread emails in the PRIMARY inbox from the last 7 days.
    Also returns up to 5 sample emails with sender, subject, and received time (IST).
    """
    if not os.path.exists(TOKEN_PATH):
        raise HTTPException(status_code=401, detail="Authenticate first using /auth.")

    try:
        service = get_gmail_service()

        # Gmail query: only unread mails in Primary category from last 7 days
        query = "category:primary is:unread newer_than:7d"
        total = 0
        page_token = None
        sample_details = []

        while True:
            resp = service.users().messages().list(
                userId="me",
                q=query,
                includeSpamTrash=False,
                maxResults=500,
                pageToken=page_token
            ).execute()

            msgs = resp.get("messages", [])
            total += len(msgs)

            # Get up to 5 sample messages (sender, subject, received time)
            for m in msgs:
                if len(sample_details) >= 5:
                    break
                try:
                    md = service.users().messages().get(
                        userId="me",
                        id=m["id"],
                        format="metadata",
                        metadataHeaders=["From", "Subject", "Date"]
                    ).execute()
                    headers = {h["name"]: h["value"] for h in md.get("payload", {}).get("headers", [])}
                    sender = headers.get("From", "Unknown Sender")
                    subject = headers.get("Subject", "No Subject")
                    date_raw = headers.get("Date")

                    # Convert to IST
                    dt_ist = None
                    if date_raw:
                        try:
                            dt_parsed = parsedate_to_datetime(date_raw)
                            if dt_parsed.tzinfo is None:
                                dt_parsed = dt_parsed.replace(tzinfo=timezone.utc)
                            dt_ist = dt_parsed.astimezone(IST).strftime("%Y-%m-%d %I:%M %p")
                        except Exception:
                            dt_ist = date_raw  # fallback

                    sample_details.append({
                        "id": m["id"],
                        "sender": sender,
                        "subject": subject,
                        "received_at_IST": dt_ist
                    })
                except Exception as e:
                    print("⚠️ Error reading email metadata:", e)
                    continue

            page_token = resp.get("nextPageToken")
            if not page_token:
                break

        return {
            "unread_primary_last_7_days": total,
            "sample_mails": sample_details
        }

    except HttpError as e:
        raise HTTPException(status_code=500, detail=f"Gmail API error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")


@app.get("/user-info")
def get_user_info():
    """Return the authenticated user's Google profile info (name, email, photo)."""
    if not os.path.exists(TOKEN_PATH):
        raise HTTPException(status_code=401, detail="User not authenticated. Please complete OAuth login first.")

    with open(TOKEN_PATH, "r") as token_file:
        creds_data = json.load(token_file)
    creds = Credentials.from_authorized_user_info(creds_data, SCOPES)

    try:
        service = build("people", "v1", credentials=creds)
        profile = service.people().get(
            resourceName="people/me", personFields="names,emailAddresses,photos"
        ).execute()

        name = (
            profile.get("names", [{}])[0].get("givenName")
            or profile.get("names", [{}])[0].get("displayName")
            or "User"
        )
        email = profile.get("emailAddresses", [{}])[0].get("value", "unknown")
        photo = (
            profile.get("photos", [{}])[0].get("url")
            if profile.get("photos")
            else None
        )

        return {"name": name, "email": email, "photo": photo}

    except HttpError as e:
        raise HTTPException(status_code=500, detail=f"Google API error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user info: {e}")

@app.get("/auth/status")
def check_auth_status():
    if not os.path.exists(TOKEN_PATH):
        return {"authenticated": False}

    try:
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)

        # Try making a lightweight API call to confirm validity
        service = build("gmail", "v1", credentials=creds)
        service.users().getProfile(userId="me").execute()

        return {"authenticated": True}
    except Exception as e:
        print("Auth validation failed:", e)
        return {"authenticated": False}

# ================== ⚙️ SERVER ENTRY ==================
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting FastAPI server for AI Meeting Assistant...")
    uvicorn.run(app, host="127.0.0.1", port=8000)

