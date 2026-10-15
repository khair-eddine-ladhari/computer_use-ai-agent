from crewai.tools import tool
from tools.file_system import resolve_path, find_file_anywhere, describe_tree

VALID_APPS = ["files", "browser", "terminal", "agent"]
CLOSABLE_APPS = ["files", "browser", "terminal"]
SUPPORTED_COMMANDS = ["help", "whoami", "date", "ls", "clear"]


def build_tools(calls: list) -> list:
    """Builds the agent's tools for ONE request. Each tool appends the action
    it performed to `calls`, which the API returns to the frontend as toolCalls."""

    @tool("Open App", result_as_answer=True)
    def open_app(app_id: str) -> str:
        """
        Opens an application window on the simulated desktop.
        Valid app_id values: 'files', 'browser', 'terminal', 'agent'.
        """
        app = app_id.strip().lower()
        if app not in VALID_APPS:
            return f"I don't know an app called '{app_id}'. Available apps: {', '.join(VALID_APPS)}."
        calls.append({"tool": "open_app", "args": {"appId": app}})
        return f"Opened the {app} app."

    @tool("Close App", result_as_answer=True)
    def close_app(app_id: str) -> str:
        """
        Closes one application window on the simulated desktop.
        Valid app_id values: 'files', 'browser', 'terminal', 'agent'.
        """
        app = app_id.strip().lower()
        if app not in VALID_APPS:
            return f"I don't know an app called '{app_id}'. Available apps: {', '.join(VALID_APPS)}."
        calls.append({"tool": "close_app", "args": {"appId": app}})
        return f"Closed the {app} app."

    @tool("Close All Apps", result_as_answer=True)
    def close_all_apps() -> str:
        """
        Closes every open app window (files, browser, terminal).
        Use this when the user asks to close everything.
        """
        for app in CLOSABLE_APPS:
            calls.append({"tool": "close_app", "args": {"appId": app}})
        return "Closed all app windows."

    @tool("Open Folder", result_as_answer=True)
    def open_folder(folder_path: str) -> str:
        """
        Opens a folder in the Files app (opens the Files app if needed).
        Examples for folder_path: 'Documents', 'Home/Downloads', 'Home'.
        """
        resolved = resolve_path(folder_path)
        if resolved is None or resolved[1]["type"] != "folder":
            return f"I couldn't find the folder '{folder_path}'. Here is what exists:\n{describe_tree()}"
        path, _ = resolved
        calls.append({"tool": "open_folder", "args": {"path": path}})
        return f"Opened the folder {'/'.join(path)}."

    @tool("Open File", result_as_answer=True)
    def open_file(file_path: str) -> str:
        """
        Opens a file in the Files app (opens the Files app if needed).
        Examples for file_path: 'Documents/CV.pdf' or just 'CV.pdf'.
        """
        resolved = resolve_path(file_path)

        if resolved is None:
            last = file_path.replace("\\", "/").strip("/").split("/")[-1]
            found = find_file_anywhere(last)
            if found is None:
                return f"I couldn't find '{file_path}'. Here is what exists:\n{describe_tree()}"
            canonical = found
        else:
            canonical, node = resolved
            if node["type"] != "file":
                return f"'{file_path}' is a folder, not a file."

        calls.append(
            {"tool": "open_file", "args": {"path": canonical[:-1], "fileName": canonical[-1]}}
        )
        return f"Opened {canonical[-1]}."

    @tool("Run Terminal Command", result_as_answer=True)
    def run_command(command: str) -> str:
        """
        Runs a command in the simulated Terminal app (opens it if needed).
        Supported commands: help, whoami, date, ls, clear.
        """
        cmd = command.strip()
        if cmd not in SUPPORTED_COMMANDS:
            return f"The terminal doesn't support '{command}'. Supported: {', '.join(SUPPORTED_COMMANDS)}."
        calls.append({"tool": "run_command", "args": {"command": cmd}})
        return f"Ran '{cmd}' in the terminal."

    return [open_app, close_app, close_all_apps, open_folder, open_file, run_command]