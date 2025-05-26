from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    role: str
    access_token: str
    token_type: str

    class Config:
        from_attributes = True

class UserInToken(BaseModel):
    id: int
    email: str
    name: str
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserInToken

class TokenData(BaseModel):
    email: Optional[str] = None 