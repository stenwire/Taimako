from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BusinessBase(BaseModel):
    business_name: str
    description: Optional[str] = None
    website: Optional[str] = None
    custom_agent_instruction: Optional[str] = None
    intents: Optional[List[str]] = None
    logo_url: Optional[str] = None

class BusinessCreate(BusinessBase):
    gemini_api_key: Optional[str] = None

class BusinessUpdate(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    custom_agent_instruction: Optional[str] = None
    intents: Optional[List[str]] = None
    logo_url: Optional[str] = None
    gemini_api_key: Optional[str] = None

class BusinessResponse(BusinessBase):
    id: str
    user_id: str
    # gemini_api_key is not in Base, so safe.
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
