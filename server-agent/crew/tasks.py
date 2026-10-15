from crewai import Task, Agent


def create_chat_task(user_message: str, agent: Agent) -> Task:
    return Task(
        description=(
            f"The user said: \"{user_message}\"\n\n"
            "If this is a request to do something on the desktop, call the one "
            "matching tool. If it is just conversation, reply naturally in a "
            "short sentence without using any tool."
        ),
        expected_output="A short, natural reply, or the result of the single tool you used.",
        agent=agent,
    )