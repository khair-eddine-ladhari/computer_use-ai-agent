import time
import concurrent.futures
from crewai import Crew, Process
from crew.agents import create_computer_agent
from crew.tasks import create_chat_task
from tools.desktop_tools import build_tools
from llm.client import get_models

ATTEMPT_TIMEOUT_SECONDS = 15
TOTAL_BUDGET_SECONDS = 45  # must stay below the timeouts in server-web and lib/api.ts

_executor = concurrent.futures.ThreadPoolExecutor(max_workers=16)


def _kickoff(
    user_message: str,
    calls: list,
    model: str,
    history: list[dict],
    desktop: dict | None,
) -> str:
    agent = create_computer_agent(build_tools(calls), model)
    task = create_chat_task(user_message, agent, history, desktop)

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



def _is_model_problem(err: Exception) -> bool:
    """True only for failures where trying another model could help."""
    reason = f"{type(err).__name__}: {err}"
    return isinstance(err, TimeoutError) or any(
        marker in reason
        for marker in ("503", "429", "404", "UNAVAILABLE", "RESOURCE_EXHAUSTED", "NOT_FOUND")
    )

def run_chat(
    user_message: str,
    history: list[dict] | None = None,
    desktop: dict | None = None,
):
    history = history or []
    deadline = time.monotonic() + TOTAL_BUDGET_SECONDS
    last_error: Exception | None = None

    for model in get_models():
        remaining = deadline - time.monotonic()
        if remaining < 3:
            break

        calls: list[dict] = []
        future = _executor.submit(
            _kickoff, user_message, calls, model, history, desktop
        )

        try:
            reply = future.result(timeout=min(ATTEMPT_TIMEOUT_SECONDS, remaining))
            return reply, list(calls)
        except Exception as e:
            last_error = e
            print(f"[run_chat] model {model} failed: {type(e).__name__}: {e}")
            if calls:
                return _fallback_reply(calls), list(calls)
            # A bug in our own code won't be fixed by another model: show it now.
            if not _is_model_problem(e):
                raise

    raise RuntimeError(
        "The AI model is overloaded or not responding. Please try again in a moment."
    ) from last_error