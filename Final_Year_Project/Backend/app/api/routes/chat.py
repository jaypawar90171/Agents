import asyncio
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field

from app.rag.agent import (
    run_agent,
    get_or_create_thread,
    create_session,
    list_sessions,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    session_id: str | None = Field(None, description="Existing session; omit to create new.")


class SendMessageResponse(BaseModel):
    reply: str
    sources: list[dict]
    session_id: str


class NewSessionResponse(BaseModel):
    session_id: str


class SessionsListResponse(BaseModel):
    sessions: list[str]


@router.post("/send", response_model=SendMessageResponse)
async def send_message(body: SendMessageRequest = Body(...)):
    """Send a message and get agent reply (RAG or chat). Uses thread pool to avoid blocking."""
    msg = (body.message or "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="message is required")
    if body.session_id:
        thread_id = get_or_create_thread(body.session_id)
    else:
        thread_id, _ = create_session()
    try:
        result = await asyncio.to_thread(run_agent, thread_id, msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")
    return SendMessageResponse(
        reply=result["reply"],
        sources=result.get("sources", []) or [],
        session_id=thread_id,
    )


@router.post("/sessions", response_model=NewSessionResponse)
def new_session():
    """Create a new chat session."""
    session_id, _ = create_session()
    return NewSessionResponse(session_id=session_id)


@router.get("/sessions", response_model=SessionsListResponse)
def get_sessions():
    """List all session IDs."""
    return SessionsListResponse(sessions=list_sessions())
