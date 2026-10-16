import time
import concurrent.futures
from crewai import Crew, Process
from crew.agents import create_computer_agent
from crew.tasks import create_chat_task
from tools.desktop_tools import build_tools
from llm.client import get_models

ATTEMPT_TIMEOUT_SECONDS = 15
TOTAL_BUDGET_SECONDS = 45  # must stay below the 60s timeout in the frontend's lib/api.ts

_executor = concurrent.futures.ThreadPoolExecutor(max_workers=16)


def _kickoff(user_message: str, calls: list, model: str, history: list[dict]) -> str:
    agent = create_computer_agent(build_tools(calls), model)
    task = create_chat_task(user_message, agent, history)

    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=True,
    )
    return str(crew.kickoff())


def _describe(call: dict) -> str:
    tool, args = call["tool"], call["args"]
    if tool == "open_app":
        return f"opened the {args['appId']} app"
    if tool == "close_app":
        return f"closed the {args['appId']} app"
    if tool == "open_folder":
        return f"opened the folder {'/'.join(args['path'])}"
    if tool == "open_file":
        return f"opened {args['fileName']}"
    if tool == "run_command":
        return f"ran '{args['command']}' in the terminal"
    return tool


def _fallback_reply(calls: list) -> str:
    return "Done. I " + ", then ".join(_describe(c) for c in calls) + "."


def run_chat(user_message: str, history: list[dict] | None = None):
    history = history or []
    deadline = time.monotonic() + TOTAL_BUDGET_SECONDS
    last_error: Exception | None = None

    for model in get_models():
        remaining = deadline - time.monotonic()
        if remaining < 3:
            break

        calls: list[dict] = []
        future = _executor.submit(_kickoff, user_message, calls, model, history)

        try:
            reply = future.result(timeout=min(ATTEMPT_TIMEOUT_SECONDS, remaining))
            return reply, list(calls)
        except Exception as e:
            last_error = e
            print(f"[run_chat] model {model} failed: {type(e).__name__}: {e}")
            if calls:
                return _fallback_reply(calls), list(calls)

    raise RuntimeError(
        "The AI model is overloaded or not responding. Please try again in a moment."
    ) from last_error