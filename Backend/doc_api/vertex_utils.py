import os
import traceback
from google.cloud import aiplatform
from google.cloud import translate_v2 as translate

# --- Local fallback tools ---
from transformers import pipeline
from sumy.summarizers.lex_rank import LexRankSummarizer
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer

# Set your service account JSON (replace path)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "your_service_account.json"

PROJECT_ID = "your-project-id"
LOCATION = "us-central1"
MODEL_NAME = "gemini-1.5-flash"  # change if needed

# --- Safe summarization + translation ---
def summarize_text_local(text, lang="en"):
    """Local summarization using Transformers or Sumy"""
    try:
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        summary = summarizer(text, max_length=100, min_length=30, do_sample=False)
        return summary[0]['summary_text']
    except Exception:
        parser = PlaintextParser.from_string(text, Tokenizer(lang))
        summarizer = LexRankSummarizer()
        summary = summarizer(parser.document, 3)
        return " ".join([str(s) for s in summary])

def translate_text_local(text, target_lang="en"):
    """Dummy local fallback — just returns text"""
    return text


def generate_with_vertex(prompt, target_language="en"):
    """Try Vertex AI + Cloud Translation; fallback to local if fails"""
    try:
        print("🔗 Trying Vertex AI + Translation...")
        aiplatform.init(project=PROJECT_ID, location=LOCATION)

        # Vertex AI model call
        model = aiplatform.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        output = response.text.strip()

        # Translation
        translate_client = translate.Client()
        translated_text = translate_client.translate(output, target_language=target_language)
        return translated_text['translatedText']

    except Exception as e:
        print("⚠️ Vertex/Translation unavailable:", e)
        print("🧠 Switching to local summarization mode...")
        print(traceback.format_exc())

        # Fallback mode
        summary = summarize_text_local(prompt)
        translated_summary = translate_text_local(summary)
        return translated_summary


# --- Example usage ---
if __name__ == "__main__":
    user_input = """
    Machine learning is a subfield of artificial intelligence that focuses on the
    development of algorithms that can learn from data and make predictions or
    decisions without being explicitly programmed.
    """
    output = generate_with_vertex(user_input, target_language="en")
    print("\n✅ Final Output:\n", output)
