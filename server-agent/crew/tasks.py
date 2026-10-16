from crewai import Task, Agent

MAX_CHARS_PER_MESSAGE = 500


def _format_history(history: list[dict]) -> str:
    if not history:
        return "(no earlier messages)"

    lines = []
    for m in history:
        speaker = "User" if m["role"] == "user" else "Agent"
        lines.append(f"{speaker}: {m['text'][:MAX_CHARS_PER_MESSAGE]}")
    return "\n".join(lines)


def create_chat_task(user_message: str, agent: Agent, history: list[dict] | None = None) -> Task:
    return Task(
        description=(
            "Earlier conversation (oldest first):\n"
            f"{_format_history(history or [])}\n\n"
            f"The user's new message: \"{user_message}\"\n\n"
            "Use the earlier conversation to answer questions about it (for example "
            "'what did I ask before?' or 'what is my number?') and to understand words "
            "like 'it' or 'that'. If the new message asks you to do something on the "
            "desktop, call the one matching tool. Otherwise reply naturally in a short "
            "sentence without using any tool."
        ),
        expected_output="A short, natural reply, or the result of the single tool you used.",
        agent=agent,
    )