import uuid
import time
import traceback
from fastapi import APIRouter, HTTPException
from api.schemas.requests import AgentMessageRequest
from api.schemas.responses import AgentMessageResponse, AgentReply, ToolCall
from crew.crew import run_chat
from crew.router import classify_message

router = APIRouter()


@router.post("/message", response_model=AgentMessageResponse)
def handle_message(body: AgentMessageRequest):
    try:
        reply_text, tool_calls = run_chat(body.text)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"{type(e).__name__}: {e}")

    message_type = "task" if tool_calls else classify_message(body.text)

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