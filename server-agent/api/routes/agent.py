
import uuid
import time
import traceback

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from api.schemas.requests import AgentMessageRequest
from api.schemas.responses import (
    AgentMessageResponse,
    AgentReply,
    ToolCall,
)

from crew.crew import run_chat, run_correction
from crew.router import classify_message


router = APIRouter()


# ==========================================
# CORRECTION REQUEST SCHEMA
# ==========================================

class CorrectionRequest(BaseModel):
    originalGoal: str = Field(
        min_length=1,
        max_length=2000,
    )

    actionResults: list[dict[str, Any]] = Field(
        min_length=1,
        max_length=50,
    )

    desktop: dict[str, Any] | None = None


# ==========================================
# NORMAL AGENT MESSAGE
# ==========================================

@router.post(
    "/message",
    response_model=AgentMessageResponse,
)
def handle_message(body: AgentMessageRequest):

    history = [
        h.model_dump()
        for h in body.history
    ]

    desktop_data = getattr(body, "desktop", None)

    if desktop_data is None:
        desktop = None
    elif isinstance(desktop_data, dict):
        desktop = desktop_data
    else:
        desktop = desktop_data.model_dump()

    try:
        reply_text, tool_calls = run_chat(
            user_message=body.text,
            history=history,
            desktop=desktop,
        )

    except Exception as e:
        traceback.print_exc()

        print(
            "[agent/message] CrewAI failed:",
            type(e).__name__,
            str(e),
        )

        raise HTTPException(
            status_code=502,
            detail="CrewAI failed to process the request.",
        ) from e

    message_type = (
        "task"
        if tool_calls
        else classify_message(body.text)
    )

    return AgentMessageResponse(
        reply=AgentReply(
            id=str(uuid.uuid4()),
            role="agent",
            text=reply_text,
            timestamp=int(time.time() * 1000),
        ),
        toolCalls=[
            ToolCall(**tc)
            for tc in tool_calls
        ],
        messageType=message_type,
    )


# ==========================================
# AGENT CORRECTION ENDPOINT
# ==========================================

@router.post(
    "/correction",
    response_model=AgentMessageResponse,
)
def handle_correction(body: CorrectionRequest):
    """
    Called by the Node.js backend when one or more
    desktop actions failed verification.

    CrewAI receives:
    - Original user goal
    - Actual frontend execution results
    - Verification results
    - Latest desktop snapshot

    CrewAI may return corrective tool calls.
    """

    print("\n========== CORRECTION STARTED ==========")
    print("ORIGINAL GOAL:", body.originalGoal)
    print("ACTION COUNT:", len(body.actionResults))
    print("========================================\n")

    try:
        reply_text, tool_calls = run_correction(
            original_goal=body.originalGoal,
            action_results=body.actionResults,
            desktop=body.desktop,
        )

    except Exception as e:
        traceback.print_exc()

        print(
            "[agent/correction] CrewAI failed:",
            type(e).__name__,
            str(e),
        )

        raise HTTPException(
            status_code=503,
            detail="CrewAI correction is unavailable.",
        ) from e

    print("\n========== CORRECTION COMPLETED ==========")
    print("CORRECTIVE TOOL CALLS:", len(tool_calls))
    print("==========================================\n")

    return AgentMessageResponse(
        reply=AgentReply(
            id=str(uuid.uuid4()),
            role="agent",
            text=reply_text,
            timestamp=int(time.time() * 1000),
        ),
        toolCalls=[
            ToolCall(**tc)
            for tc in tool_calls
        ],
        messageType="task",
    )
