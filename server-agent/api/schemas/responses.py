from pydantic import BaseModel
from typing import List, Dict, Any, Literal

class ToolCall(BaseModel):
    tool: str
    args: Dict[str, Any]

class AgentReply(BaseModel):
    id: str
    role: str
    text: str
    timestamp: int

class AgentMessageResponse(BaseModel):
    reply: AgentReply
    toolCalls: List[ToolCall]
    messageType: Literal["chat", "task"]