import os
from dotenv import load_dotenv
from crewai import LLM

load_dotenv()

DEFAULT_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash-lite"]


def get_models() -> list[str]:
    """Models to try, in order. Override with GEMINI_MODELS=a,b,c in .env"""
    raw = os.getenv("GEMINI_MODELS", "")
    models = [m.strip() for m in raw.split(",") if m.strip()]
    return models or DEFAULT_MODELS


def get_llm(model: str | None = None) -> LLM:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set. Add it to server-agent/.env")

    return LLM(
        model=f"gemini/{model or get_models()[0]}",
        api_key=api_key,
        temperature=0.3,
    )