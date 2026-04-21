import asyncio
from fastapi import APIRouter, HTTPException, Body, Path, Query
from pydantic import BaseModel, Field
from typing import Any

from app.rag.agent import (
    run_agent,
    get_or_create_thread,
    create_session,
    list_sessions,
    get_session,
    update_session_title,
    delete_session,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    session_id: str | None = Field(
        None, description="Existing session; omit to create new."
    )
    userId: str = Field(..., description="Clerk user ID")


class SendMessageResponse(BaseModel):
    reply: str
    sources: list[dict]
    web_sources: list[dict]
    session_id: str


class NewSessionResponse(BaseModel):
    session_id: str


class SessionMeta(BaseModel):
    session_id: str
    title: str
    created_at: Any
    message_count: int


class SessionsListResponse(BaseModel):
    sessions: list[SessionMeta]


class SessionDetail(BaseModel):
    session_id: str
    title: str
    created_at: Any
    messages: list[dict]


class RenameSessionRequest(BaseModel):
    title: str


@router.post("/send", response_model=SendMessageResponse)
async def send_message(body: SendMessageRequest = Body(...)):
    """Send a message and get agent reply (RAG or chat). Uses thread pool to avoid blocking."""
    msg = (body.message or "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="message is required")
    if body.session_id:
        thread_id = get_or_create_thread(body.session_id, body.userId)
    else:
        thread_id, _ = create_session(body.userId)
    try:
        result = await asyncio.to_thread(run_agent, thread_id, msg, thread_id, body.userId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")
    return SendMessageResponse(
        reply=result["reply"],
        sources=result.get("sources", []) or [],
        web_sources=result.get("web_sources", []) or [],
        session_id=thread_id,
    )


@router.post("/sessions", response_model=NewSessionResponse)
def new_session(userId: str = Body(..., alias="userId")):
    """Create a new chat session."""
    session_id, _ = create_session(userId)
    return NewSessionResponse(session_id=session_id)


@router.get("/sessions", response_model=SessionsListResponse)
def get_sessions(userId: str = Query(..., alias="userId")):
    """List all sessions with metadata."""
    sessions = list_sessions(userId)
    return SessionsListResponse(
        sessions=[
            SessionMeta(
                session_id=s["session_id"],
                title=s.get("title", "New Chat"),
                created_at=s.get("created_at"),
                message_count=s.get("message_count", 0),
            )
            for s in sessions
        ]
    )


@router.get("/sessions/{session_id}", response_model=SessionDetail)
def get_session_detail(session_id: str = Path(..., description="Session ID"), userId: str = Query(..., alias="userId")):
    """Get full message history for a session."""
    session = get_session(session_id, userId)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionDetail(
        session_id=session["session_id"],
        title=session.get("title", "New Chat"),
        created_at=session.get("created_at"),
        messages=session.get("messages", []),
    )


@router.patch("/sessions/{session_id}")
def rename_session(
    session_id: str = Path(..., description="Session ID"),
    body: RenameSessionRequest = Body(...),
    userId: str = Query(..., alias="userId"),
):
    """Rename a session."""
    success = update_session_title(session_id, body.title, userId)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True}


@router.delete("/sessions/{session_id}")
def delete_session_endpoint(session_id: str = Path(..., description="Session ID"), userId: str = Query(..., alias="userId")):
    """Delete a session."""
    success = delete_session(session_id, userId)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True}
