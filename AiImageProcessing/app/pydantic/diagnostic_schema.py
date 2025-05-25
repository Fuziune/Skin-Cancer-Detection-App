from pydantic import BaseModel, conint, EmailStr
from typing import Dict

class DiagnosticCreateFE(BaseModel):
    image_url: str
    user_id: int

    class Config:
        from_attributes = True

class DiagnosticCreateAI(BaseModel):
    image_url: str
    user_id: int
    result: str  # This will store the JSON string of class distribution

    class Config:
        from_attributes = True

class DiagnosticResponse(BaseModel):
    id: int
    image_url: str
    result: str  # This will store the JSON string of class distribution
    user_id: int