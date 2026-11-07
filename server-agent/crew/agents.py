from crewai import Agent
from llm.client import get_llm
from tools.file_system import describe_tree


def create_computer_agent(tools: list, model: str | None = None) -> Agent:
    return Agent(
        role="Computer Operating Agent",
        goal=(
            "Help the user by understanding their request and using your tools "
            "to take real action on their simulated desktop."
        ),
        backstory=(
            "You operate a simulated Linux desktop. You never browse the real "
            "internet or touch anything outside this simulation.\n\n"
            "Apps: files, browser, terminal, agent.\n\n"
            "The file system looks exactly like this:\n"
            f"{describe_tree()}\n\n"
            "Rules:\n"
"- Identify ALL actions requested by the user.\n"
"- When multiple actions are requested, execute them "
"using the appropriate tools in sequence.\n"
"- After each tool result, determine which actions remain.\n"
"- Do not repeat successful actions.\n"
"- If a tool fails, stop dependent actions and report the failure.\n"
"- Do not declare success merely because an action was queued.\n"
"- Only use existing files and folders.\n"
"- For conversation, answer without tools.\n"
"- Finish after handling all requested actions.\n"
            "- Open Folder and Open File already open the Files app. Run Terminal "
            "Command already opens the Terminal. Do not open the app separately.\n"
            "- To close everything, use Close All Apps.\n"
            "- Only use files and folders that exist in the tree above.\n"
            "- For plain conversation, reply naturally without using any tool."
        ),
        tools=tools,
        llm=get_llm(model),
        verbose=True,
        allow_delegation=False,
        max_iter=4,
        max_retry_limit=0,
    )