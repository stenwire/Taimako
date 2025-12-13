from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from app.db.session import get_db
from app.models.widget import WidgetSettings, GuestUser, GuestMessage
from app.models.user import User
from app.models.business import Business
from app.models.chat_session import ChatSession, SessionOrigin
from app.schemas.widget import (
    GuestStartRequest, GuestStartResponse,
    WidgetChatRequest, WidgetChatResponse, GuestMessageSchema,
    WidgetConfigResponse, GuestUserResponse,
    SessionStartRequest, SessionHistoryResponse
)
from app.services.agent_service import run_conversation
from app.auth.router import get_current_user

# Additional Schema for Updating Settings
from pydantic import BaseModel
class WidgetUpdate(BaseModel):
    theme: Optional[str] = None
    primary_color: Optional[str] = None
    icon_url: Optional[str] = None
    welcome_message: Optional[str] = None
    initial_ai_message: Optional[str] = None
    send_initial_message_automatically: Optional[bool] = None



router = APIRouter()

@router.get("/config/{public_widget_id}", response_model=WidgetConfigResponse)
def get_widget_config(public_widget_id: str, db: Session = Depends(get_db)):
    widget = db.query(WidgetSettings).filter(WidgetSettings.public_widget_id == public_widget_id).first()
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    return widget

@router.get("/my-settings", response_model=WidgetConfigResponse)
def get_my_widget_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    widget = db.query(WidgetSettings).filter(WidgetSettings.user_id == current_user.id).first()
    if not widget:
        # Create default if not exists
        widget = WidgetSettings(user_id=current_user.id)
        db.add(widget)
        db.commit()
        db.refresh(widget)
    return widget

@router.put("/my-settings", response_model=WidgetConfigResponse)
def update_my_widget_settings(
    settings: WidgetUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    widget = db.query(WidgetSettings).filter(WidgetSettings.user_id == current_user.id).first()
    if not widget:
        widget = WidgetSettings(user_id=current_user.id)
        db.add(widget)
    
    if settings.theme:
        widget.theme = settings.theme
    if settings.primary_color:
        widget.primary_color = settings.primary_color
    if settings.icon_url:
        widget.icon_url = settings.icon_url
    if settings.welcome_message is not None:
        val = settings.welcome_message.strip()
        if val == "":
            widget.welcome_message = None
        else:
            if len(val) > 1000:
                raise HTTPException(status_code=400, detail="Welcome message too long")
            widget.welcome_message = val
            
    if settings.initial_ai_message is not None:
        val = settings.initial_ai_message.strip()
        if val == "":
            widget.initial_ai_message = None
        else:
            if len(val) > 1000:
                raise HTTPException(status_code=400, detail="Initial AI message too long")
            widget.initial_ai_message = val

    if settings.send_initial_message_automatically is not None:
        widget.send_initial_message_automatically = settings.send_initial_message_automatically
        
    db.commit()
    db.refresh(widget)
    db.commit()
    db.refresh(widget)
    return widget

@router.get("/guests", response_model=List[GuestUserResponse])
def get_my_widget_guests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    widget = db.query(WidgetSettings).filter(WidgetSettings.user_id == current_user.id).first()
    if not widget:
        return []
    
    guests = db.query(GuestUser).filter(GuestUser.widget_id == widget.id).order_by(GuestUser.created_at.desc()).all()
    return guests

@router.get("/interactions/{guest_id}", response_model=List[GuestMessageSchema])
def get_guest_interactions(
    guest_id: str, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Verify ownership
    widget = db.query(WidgetSettings).filter(WidgetSettings.user_id == current_user.id).first()
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")

    guest = db.query(GuestUser).filter(GuestUser.id == guest_id, GuestUser.widget_id == widget.id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest session not found or access denied")
        
    messages = db.query(GuestMessage).filter(GuestMessage.guest_id == guest_id).order_by(GuestMessage.created_at).all()
    return messages

@router.post("/guest/start/{public_widget_id}", response_model=GuestStartResponse)
def start_guest_session(public_widget_id: str, guest_in: GuestStartRequest, db: Session = Depends(get_db)):
    widget = db.query(WidgetSettings).filter(WidgetSettings.public_widget_id == public_widget_id).first()
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")

    # Determine if we should reuse an existing guest (e.g. by email/phone matching?)
    # For now, let's create a new one every time strictly based on request, or maybe we just create.
    # The requirement says "Create or identify a guest user".
    # Logic: if email is provided, check if exists for this widget.
    
    existing_guest = None
    if guest_in.email:
        existing_guest = db.query(GuestUser).filter(
            GuestUser.widget_id == widget.id, 
            GuestUser.email == guest_in.email
        ).first()
    elif guest_in.phone:
        existing_guest = db.query(GuestUser).filter(
            GuestUser.widget_id == widget.id, 
            GuestUser.phone == guest_in.phone
        ).first()
        
    if existing_guest:
        guest = existing_guest
        # Update name if changed? Let's just keep matching one.
    else:
        guest = GuestUser(
            widget_id=widget.id,
            name=guest_in.name,
            email=guest_in.email,
            phone=guest_in.phone
        )
        db.add(guest)
        db.commit()
        db.refresh(guest)

    # Note: We do NOT create a ChatSession here. Session is created on first message.
    # Also, we do NOT send initial AI message here anymore if session logic is used,
    # OR we send it but it's not part of a 'session' until user responds?
    # REQUIREMENT: "A new session_id is created only after the first message is successfully sent."
    # AND: "Guest users should be able to manually start a new chat session... Starting a new session resets the message area."
    
    # If we want an initial AI greeting, it should probably be transient or part of the session start.
    # The requirement says: "No backend call [on manual start]. First user message triggers backend session creation."
    # So `guest/start` is effectively just "Identifying the user".
    # The frontend already uses this to prompt for name/email.
    
    return GuestStartResponse(
        guest_id=guest.id,
        widget_owner_id=widget.user_id,
        status="ready"
    )

@router.post("/guest/session/init/{public_widget_id}", response_model=WidgetChatResponse)
async def init_guest_session(
    public_widget_id: str,
    session_in: SessionStartRequest,
    db: Session = Depends(get_db)
):
    """
    Starts a new chat session for a guest and processes the first message.
    """
    widget = db.query(WidgetSettings).filter(WidgetSettings.public_widget_id == public_widget_id).first()
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")

    guest = db.query(GuestUser).filter(GuestUser.id == session_in.guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")

    # Create new session
    # If origin is RESUMED, we should error or handle differently?
    # Requirement: "If origin = “resumed” -> do NOT create new session, append message to existing."
    # But for "resumed", the frontend should probably call the /chat/session/{id} endpoint with the existing ID.
    # If `init` is called with origin="resumed", it implies we are trying to resume but maybe don't have the ID?
    # The prompt says: "Clicking 'History' fetches past sessions ... Clicking a past session loads old messages ... Sending a message continues session_id."
    # So `init` should primarily be for NEW sessions (manual or auto-start).
    
    session = ChatSession(
        guest_id=guest.id,
        origin=session_in.origin
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Process message
    return await process_chat_message(db, widget, guest, session.id, session_in.message)


@router.post("/chat/{public_widget_id}/session/{session_id}", response_model=WidgetChatResponse)
async def chat_in_session(
    public_widget_id: str,
    session_id: str,
    chat_in: WidgetChatRequest,
    db: Session = Depends(get_db)
):
    widget = db.query(WidgetSettings).filter(WidgetSettings.public_widget_id == public_widget_id).first()
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
        
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    guest = db.query(GuestUser).filter(GuestUser.id == session.guest_id).first() # Should exist
    
    # Update last_message_at
    session.last_message_at = datetime.now(timezone.utc)
    db.commit()
    
    return await process_chat_message(db, widget, guest, session_id, chat_in.message)


async def process_chat_message(db: Session, widget: WidgetSettings, guest: GuestUser, session_id: str, message_text: str):
    # 1. Store guest message
    guest_msg = GuestMessage(
        guest_id=guest.id,
        session_id=session_id,
        sender="guest",
        message_text=message_text
    )
    db.add(guest_msg)
    db.commit()
    db.refresh(guest_msg)

    # 2. Get business context
    owner_user = db.query(User).filter(User.id == widget.user_id).first()
    if not owner_user or not owner_user.business:
        business_name = "Sten"
        instruction = None
    else:
        business_name = owner_user.business.business_name
        instruction = owner_user.business.custom_agent_instruction

    # 3. Call AI
    ai_response_text = await run_conversation(
        message=message_text,
        user_id=widget.user_id,
        business_name=business_name,
        custom_instruction=instruction,
        session_id=session_id # Use session_id for thread consistency
    )

    # 4. Store AI response
    ai_msg = GuestMessage(
        guest_id=guest.id,
        session_id=session_id,
        sender="ai",
        message_text=ai_response_text
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return WidgetChatResponse(
        message=GuestMessageSchema.model_validate(guest_msg),
        response=GuestMessageSchema.model_validate(ai_msg)
    )

@router.get("/sessions/{guest_id}/history", response_model=List[SessionHistoryResponse])
def get_guest_session_history(guest_id: str, db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).filter(ChatSession.guest_id == guest_id).order_by(ChatSession.created_at.desc()).all()
    return sessions

@router.get("/session/{session_id}/messages", response_model=List[GuestMessageSchema])
def get_session_messages(session_id: str, db: Session = Depends(get_db)):
    messages = db.query(GuestMessage).filter(GuestMessage.session_id == session_id).order_by(GuestMessage.created_at).all()
    return messages

from app.services.analysis_agent import analyze_session, persist_analysis

@router.post("/session/{session_id}/analyze", response_model=SessionHistoryResponse)
async def analyze_chat_session(session_id: str, db: Session = Depends(get_db)):
    # 1. Verify session exists
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # 2. Run analysis
    summary, intent = await analyze_session(db, session_id)
    
    # 3. Persist
    updated_session = await persist_analysis(db, session_id, summary, intent)
    
    if not updated_session:
        raise HTTPException(status_code=500, detail="Failed to persist analysis")
        
    return updated_session

# Deprecated or Legacy Support
@router.post("/chat/{public_widget_id}/{guest_id}", response_model=WidgetChatResponse)
async def chat_interaction(
    public_widget_id: str, 
    guest_id: str, 
    chat_in: WidgetChatRequest, 
    db: Session = Depends(get_db)
):
    # This endpoint is deprecated but kept for backward compatibility if needed.
    # It creates a temporary/ad-hoc session if none exists?
    # Or just maps to the new logic with a "default" session?
    # Ideally frontend should switch to /session/init and /session/{id}.
    # Implementing failover: Try to find latest active session or create one.
    
    # For now, let's just forward to init with auto-start if we want to be helpful, 
    # but strictly we should probably error or force frontend update.
    # Given we are updating frontend, we can leave this stub or redirect.
    # Let's implementation basic fallback: Create a session (auto-start) if none provided.
    
    return await init_guest_session(
        public_widget_id=public_widget_id,
        session_in=SessionStartRequest(
            guest_id=guest_id,
            message=chat_in.message,
            origin="auto-start" # Legacy default
        ),
        db=db
    )
