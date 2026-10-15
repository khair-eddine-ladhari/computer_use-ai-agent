import concurrent.futures
from llm.client import get_llm

CLASSIFY_TIMEOUT_SECONDS = 10

_executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)


def _classify(user_message: str) -> str:
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
    result = str(response).strip().lower()
    return "task" if "task" in result else "chat"


def classify_message(user_message: str) -> str:
    future = _executor.submit(_classify, user_message)
    try:
        return future.result(timeout=CLASSIFY_TIMEOUT_SECONDS)
    except Exception:
        return "chat"