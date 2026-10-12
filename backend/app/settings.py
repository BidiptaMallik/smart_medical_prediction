import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(BASE_DIR)
load_dotenv(os.path.join(BACKEND_DIR, ".env"))


ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5")
REPORT_PROVIDER = os.getenv("REPORT_PROVIDER", "anthropic" if ANTHROPIC_API_KEY else "template").strip().lower()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "120"))


SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "") or SMTP_USER

DOCTOR_EMAIL_OVERRIDE = os.getenv("DOCTOR_EMAIL_OVERRIDE", "")

DB_PATH = os.path.join(BASE_DIR, "data", "appointments.db")
OUTBOX_DIR = os.path.join(BACKEND_DIR, "outbox")


RECOMMEND_THRESHOLD = 0.30   
URGENT_PNEUMOTHORAX = 0.50   


LOW_RELIABILITY = {
    "Fibrosis": "very low",
    "Pneumonia": "low",
    "Cardiomegaly": "low",
    "Mass": "low",
    "Nodule": "low",
    "Infiltration": "low",
    "Hernia": "unreliable (only 13 training examples)",
}