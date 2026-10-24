from typing import List, Literal, Optional
from pydantic import BaseModel


class HistoryMessage(BaseModel):
    role: Literal["user", "agent"]
    text: str


class DesktopWindow(BaseModel):
    app: str
    minimized: bool = False
    focused: bool = False


class DesktopFiles(BaseModel):
    path: str
    contents: List[str] = []
    selectedFile: Optional[str] = None


class DesktopTerminal(BaseModel):
    lastLines: List[str] = []


class DesktopSnapshot(BaseModel):
    openWindows: List[DesktopWindow] = []
    files: Optional[DesktopFiles] = None
    terminal: Optional[DesktopTerminal] = None


class AgentMessageRequest(BaseModel):
    text: str
    sessionId: str
    history: List[HistoryMessage] = []
    desktop: Optional[DesktopSnapshot] = None