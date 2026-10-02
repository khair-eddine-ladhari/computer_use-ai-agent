from crewai import Task
from crew.agents import create_computer_agent

def create_chat_task(user_message: str) -> Task:
    agent = create_computer_agent()

    return Task(
        description=(
            f"The user said: \"{user_message}\"\n\n"
            "Respond helpfully and naturally, as if you are the computer agent "
            "talking directly to the user."
        ),
        expected_output="A short, natural reply to the user's message.",
        agent=agent,
    )