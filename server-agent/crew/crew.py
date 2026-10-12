from crewai import Crew, Process
from crew.agents import create_computer_agent
from crew.tasks import create_chat_task
from tools.desktop_tools import get_called_tools, clear_called_tools

def run_chat(user_message: str):
    clear_called_tools()

    agent = create_computer_agent()
    task = create_chat_task(user_message)

    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=True,
    )

    result = crew.kickoff()
    tool_calls = get_called_tools()

    return str(result), tool_calls