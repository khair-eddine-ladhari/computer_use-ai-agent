import uuid
import time
from fastapi import APIRouter
from api.schemas.requests import AgentMessageRequest
from api.schemas.responses import AgentMessageResponse, AgentReply, ToolCall
from crew.crew import run_chat
from crew.router import classify_message

router = APIRouter()

@router.post("/message", response_model=AgentMessageResponse)
def handle_message(body: AgentMessageRequest):
    message_type = classify_message(body.text)
    reply_text, tool_calls = run_chat(body.text)

    return AgentMessageResponse(
        reply=AgentReply(
            id=str(uuid.uuid4()),
            role="agent",
            text=reply_text,
            timestamp=int(time.time() * 1000),
        ),
        toolCalls=[ToolCall(**tc) for tc in tool_calls],
        messageType=message_type,
    )