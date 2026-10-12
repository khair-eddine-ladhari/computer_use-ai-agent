from llm.client import get_llm

def classify_message(user_message: str) -> str:
    """
    Decides whether a message is casual chat or an actual task/request
    for the agent to act on. Returns 'chat' or 'task'.
    """
    llm = get_llm()

    prompt = (
        "Classify the following user message as either 'chat' or 'task'.\n"
        "'chat' = greetings, thanks, small talk, or general questions that need no action.\n"
        "'task' = any request asking the agent to do something "
        "(open an app, find a file, perform an action).\n\n"
        f"Message: \"{user_message}\"\n\n"
        "Reply with exactly one word: chat or task."
    )

    response = llm.call(prompt)
    result = response.strip().lower()

    return "task" if "task" in result else "chat"