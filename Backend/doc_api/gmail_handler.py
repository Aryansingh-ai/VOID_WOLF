import os
import base64
import re
import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def fetch_latest_attachments(limit=3, output_dir="downloads"):
    """Fetches attachments from last N emails and saves them locally."""
    os.makedirs(output_dir, exist_ok=True)

    creds = None
    token_path = os.path.join(os.path.dirname(__file__), "token.json")

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    else:
        raise Exception("Missing token.json. Please complete Gmail OAuth flow.")

    service = build("gmail", "v1", credentials=creds)

    try:
        results = service.users().messages().list(userId="me", maxResults=limit).execute()
        messages = results.get("messages", [])
        saved_files = []

        for msg in messages:
            msg_data = service.users().messages().get(userId="me", id=msg["id"]).execute()
            parts = msg_data.get("payload", {}).get("parts", [])

            for part in parts:
                filename = part.get("filename")
                body = part.get("body", {})
                attachment_id = body.get("attachmentId")

                if filename and attachment_id:
                    attachment = service.users().messages().attachments().get(
                        userId="me", messageId=msg["id"], id=attachment_id
                    ).execute()

                    data = base64.urlsafe_b64decode(attachment["data"].encode("UTF-8"))
                    path = os.path.join(output_dir, filename)
                    with open(path, "wb") as f:
                        f.write(data)
                    saved_files.append(path)
                    print(f"📎 Saved: {path}")

        return saved_files

    except HttpError as e:
        print(f"Gmail API error: {e}")
        return []
