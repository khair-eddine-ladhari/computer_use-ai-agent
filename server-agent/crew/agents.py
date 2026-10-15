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
            "- For a request to open, close, or run something, call exactly ONE "
            "matching tool. The tool's result is your final answer.\n"
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
    )