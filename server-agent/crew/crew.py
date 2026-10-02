from crewai import Crew, Process
from crew.agents import create_computer_agent
from crew.tasks import create_chat_task

def run_chat(user_message: str) -> str:
    agent = create_computer_agent()
    task = create_chat_task(user_message)

    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=True,
    )

    result = crew.kickoff()
    return str(result)