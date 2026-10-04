from crewai.tools import tool

# Tracks which tools were actually called during one request,
# since CrewAI's final output is just text — we need this list
# to know what structured actions actually happened.
_called_tools = []

def get_called_tools():
    return list(_called_tools)

def clear_called_tools():
    _called_tools.clear()

@tool("Open App")
def open_app(app_id: str) -> str:
    """
    Opens an application on the user's simulated desktop.
    Valid app_id values: 'files', 'browser', 'terminal', 'agent'.
    Use this whenever the user asks you to open, launch, or show an app.
    """
    _called_tools.append({"tool": "open_app", "args": {"appId": app_id}})
    return f"Opened the {app_id} app."