
from crewai.tools import tool
from tools.file_system import (
    resolve_path,
    find_file_anywhere,
    describe_tree,
)

VALID_APPS = ["files", "browser", "terminal", "agent"]
CLOSABLE_APPS = ["files", "browser", "terminal"]
SUPPORTED_COMMANDS = ["help", "whoami", "date", "ls", "clear"]


def build_tools(calls: list) -> list:
    """
    Build the agent's tools for ONE request.

    Tools validate and queue actions in `calls`.
    The frontend executes those actions later.

    IMPORTANT:
    Queuing an action does not mean it succeeded.
    Actual execution results and desktop snapshots
    are reported separately by the frontend.
    """

    @tool("Open App")
    def open_app(app_id: str) -> str:
        """
        Request opening an application on the simulated desktop.

        Valid app_id values:
        'files', 'browser', 'terminal', 'agent'.
        """
        app = app_id.strip().lower()

        if app not in VALID_APPS:
            return (
                f"I don't know an app called '{app_id}'. "
                f"Available apps: {', '.join(VALID_APPS)}."
            )

        calls.append({
            "tool": "open_app",
            "args": {"appId": app},
        })

        return (
            f"Requested opening the {app} app. "
            "Awaiting execution confirmation."
        )

    @tool("Close App")
    def close_app(app_id: str) -> str:
        """
        Request closing an application window.

        Valid app_id values:
        'files', 'browser', 'terminal', 'agent'.
        """
        app = app_id.strip().lower()

        if app not in VALID_APPS:
            return (
                f"I don't know an app called '{app_id}'. "
                f"Available apps: {', '.join(VALID_APPS)}."
            )

        calls.append({
            "tool": "close_app",
            "args": {"appId": app},
        })

        return (
            f"Requested closing the {app} app. "
            "Awaiting execution confirmation."
        )

    @tool("Close All Apps")
    def close_all_apps() -> str:
        """
        Request closing all closable application windows.

        Applications:
        files, browser, terminal.

        The agent window is excluded.
        """
        for app in CLOSABLE_APPS:
            calls.append({
                "tool": "close_app",
                "args": {"appId": app},
            })

        return (
            "Requested closing all closable app windows. "
            "Awaiting execution confirmation."
        )

    @tool("Open Folder")
    def open_folder(folder_path: str) -> str:
        """
        Request opening a folder in the Files app.

        Opens the Files app if necessary.

        Examples:
        'Documents'
        'Home/Downloads'
        'Home'
        """
        resolved = resolve_path(folder_path)

        if resolved is None or resolved[1]["type"] != "folder":
            return (
                f"I couldn't find the folder '{folder_path}'. "
                f"Here is what exists:\n{describe_tree()}"
            )

        path, _ = resolved

        calls.append({
            "tool": "open_folder",
            "args": {"path": path},
        })

        return (
            f"Requested opening the folder {'/'.join(path)}. "
            "Awaiting execution confirmation."
        )

    @tool("Open File")
    def open_file(file_path: str) -> str:
        """
        Request opening a file in the Files app.

        Opens the Files app if necessary.

        Examples:
        'Documents/CV.pdf'
        'CV.pdf'
        """
        resolved = resolve_path(file_path)

        if resolved is None:
            last = (
                file_path
                .replace("\\", "/")
                .strip("/")
                .split("/")[-1]
            )

            found = find_file_anywhere(last)

            if found is None:
                return (
                    f"I couldn't find '{file_path}'. "
                    f"Here is what exists:\n{describe_tree()}"
                )

            canonical = found

        else:
            canonical, node = resolved

            if node["type"] != "file":
                return (
                    f"'{file_path}' is a folder, not a file."
                )

        calls.append({
            "tool": "open_file",
            "args": {
                "path": canonical[:-1],
                "fileName": canonical[-1],
            },
        })

        return (
            f"Requested opening {canonical[-1]}. "
            "Awaiting execution confirmation."
        )

    @tool("Run Terminal Command")
    def run_command(command: str) -> str:
        """
        Request running a command in the simulated Terminal.

        Opens the Terminal app if necessary.

        Supported commands:
        help, whoami, date, ls, clear.
        """
        cmd = command.strip()

        if cmd not in SUPPORTED_COMMANDS:
            return (
                f"The terminal doesn't support '{command}'. "
                f"Supported: {', '.join(SUPPORTED_COMMANDS)}."
            )

        calls.append({
            "tool": "run_command",
            "args": {"command": cmd},
        })

        return (
            f"Requested running '{cmd}' in the terminal. "
            "Awaiting execution confirmation."
        )

    return [
        open_app,
        close_app,
        close_all_apps,
        open_folder,
        open_file,
        run_command,
    ]
