import os
import json
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.widget import GuestMessage, GuestUser
from app.models.chat_session import ChatSession

# Using hypothetical google.generativeai for the agent as per project patterns
import google.generativeai as genai

# For simplicity, assuming environment key is set
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

INTENT_ENUM = ["Support", "Sales", "Feedback", "Bug Report", "General"]

async def analyze_session(db: Session, session_id: str) -> Tuple[str, str]:
    """
    Analyzes a chat session to generate a summary and determine intent.
    Returns (summary, intent).
    """
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise ValueError("Session not found")
        
    messages = db.query(GuestMessage).filter(GuestMessage.session_id == session_id).order_by(GuestMessage.created_at).all()
    
    if not messages:
        return "No messages in session", "General"
        
    conversation_text = ""
    for msg in messages:
        role = "User" if msg.sender == "guest" else "Agent"
        conversation_text += f"{role}: {msg.message_text}\n"
        
    # Construct Prompt
    prompt = f"""
    You are an expert Conversation Analyst. Your task is to analyze the following chat transcript between a User and an AI Agent.
    
    Existing Summary: {session.summary or "None"}
    Existing Intent: {session.top_intent or "None"}
    
    TRANSCRIPT:
    {conversation_text}
    
    INSTRUCTIONS:
    1. Generate a concise summary of the conversation (max 2-3 sentences). usage: "User asked about X, Agent provided Y."
    2. Determine the Top Intent from this list: {INTENT_ENUM}.
    3. If an existing summary exists, use it as context but update it to reflect the full conversation.
    
    Output correctly formatted JSON only:
    {{
        "summary": "...",
        "intent": "..."
    }}
    """
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash") # Or pro
        response = model.generate_content(prompt)
        
        # Simple parsing logic (assuming well-behaved model or using response_schema in future)
        content = response.text
        # Strip code blocks if present
        if "```json" in content:
            content = content.replace("```json", "").replace("```", "")
        elif "```" in content:
            content = content.replace("```", "")
            
        data = json.loads(content)
        
        summary = data.get("summary", "Unable to generate summary")
        intent = data.get("intent", "Unable to get Intent")
        
        # specific validation
        if intent not in INTENT_ENUM:
            intent = "General"
            
        return summary, intent
        
    except Exception as e:
        print(f"Error in analysis agent: {e}")
        return session.summary or "Error generating summary", session.top_intent or "General"

async def persist_analysis(db: Session, session_id: str, summary: str, intent: str):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if session:
        session.summary = summary
        session.top_intent = intent
        session.summary_generated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(session)
        return session
    return None
