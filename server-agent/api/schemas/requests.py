from pydantic import BaseModel

class AgentMessageRequest(BaseModel):
    text: str
    sessionId: str