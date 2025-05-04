from requests import Session

from app.databases.database import Base,DATABASE_URL,SessionLocal
from fastapi import FastAPI, Depends, HTTPException, APIRouter
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.pydantic import user_schema
from app import pydantic, model, repo
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.repo.UserRepository import create_user, get_user

from app.repo.UserRepository import get_all_users
from app.services.UserService import UserService

router = APIRouter()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/users/", response_model=user_schema.UserCreate)
def create_user_route(user: user_schema.UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = create_user(db=db, user_create=user)  # Call repository function to create user
        return db_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


# Get user route (for testing if it shows in Swagger)
@router.get("/users/{user_id}", response_model=user_schema.UserResponse)
def get_user_route(user_id: int, db: Session = Depends(get_db)):
    db_user = get_user(db, user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/users", response_model=list[user_schema.UserResponse])
def get_all_users_route(db: Session = Depends(get_db)):
    user_service = UserService(db)
    users = user_service.get_all_users()
    if not users:
        raise HTTPException(status_code=404, detail="No users found")
    return users

@router.delete("/users/{user_id}", response_model=user_schema.UserResponse)
def delete_user_route(user_id: int, db: Session = Depends(get_db)):
    user_service = UserService(db)
    user = user_service.delete_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user
