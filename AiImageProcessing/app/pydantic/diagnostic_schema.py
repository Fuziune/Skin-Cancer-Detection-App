from pydantic import BaseModel, conint, EmailStr, Field
from typing import Dict, Any, Optional

class DiagnosticCreateFE(BaseModel):
    image_url: Optional[str] = Field(None, description="Optional image URL")
    user_id: int
    image_data: Optional[str] = Field(None, description="Optional base64 image data")

    class Config:
        from_attributes = True

class DiagnosticSaveFE(BaseModel):
    image_url: str
    user_id: int
    result: Dict[str, Any]  # This will store the diagnostic result from frontend

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