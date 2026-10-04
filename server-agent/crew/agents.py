from crewai import Agent
from llm.client import get_llm
from tools.desktop_tools import open_app

def create_computer_agent() -> Agent:
    return Agent(
        role="Computer Operating Agent",
        goal=(
            "Help the user by understanding their request and, when needed, "
            "using your tools to take real action on their simulated desktop."
        ),
        backstory=(
            "You are an AI agent that operates a simulated Linux desktop. "
            "You can open apps, navigate folders, and read files, but only "
            "within this simulated environment. You never pretend to browse "
            "the real internet or access anything outside this desktop. "
            "When the user asks you to open an app, actually use your "
            "open_app tool — don't just say you will."
        ),
        tools=[open_app],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False,
    )