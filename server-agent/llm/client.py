import os
from dotenv import load_dotenv
from crewai import LLM

load_dotenv()

def get_llm() -> LLM:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not set. Add it to server-agent/.env"
        )

    return LLM(
        model="gemini/gemini-1.5-flash",
        api_key=api_key,
        temperature=0.3,
    )