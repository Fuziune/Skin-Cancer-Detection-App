
from pydantic import BaseModel, conint, EmailStr

class UserResponse(BaseModel):
    id: int
    name: str
    role: str
    email: str

    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    name: str
    role: str
    email: str
    password: str

    class Config:
        orm_mode = True  # Tells Pydantic to treat the SQLAlchemy model as an ORM model
