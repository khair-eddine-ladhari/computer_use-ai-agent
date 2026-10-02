from crewai import Agent
from llm.client import get_llm

def create_computer_agent() -> Agent:
    return Agent(
        role="Computer Operating Agent",
        goal=(
            "Help the user by understanding their request and, when needed, "
            "deciding what action to take on their simulated desktop."
        ),
        backstory=(
            "You are an AI agent that operates a simulated Linux desktop. "
            "You can open apps, navigate folders, and read files, but only "
            "within this simulated environment. You never pretend to browse "
            "the real internet or access anything outside this desktop."
        ),
        llm=get_llm(),
        verbose=True,
        allow_delegation=False,
    )