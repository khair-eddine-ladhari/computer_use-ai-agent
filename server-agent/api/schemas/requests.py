from typing import List, Literal
from pydantic import BaseModel


class HistoryMessage(BaseModel):
    role: Literal["user", "agent"]
    text: str


class AgentMessageRequest(BaseModel):
    text: str
    sessionId: str
    history: List[HistoryMessage] = []