from pydantic import BaseModel, conint, EmailStr

class DiagnosticCreateFE(BaseModel):
    image_url: str
    user_id: int

    class Config:
        from_attributes = True

class DiagnosticCreateAI(BaseModel):
    image_url: str
    user_id: int
    result: str

    class Config:
        from_attributes = True

class DiagnosticResponse(BaseModel):
    id: int
    image_url: str
    result: str
    user_id: int