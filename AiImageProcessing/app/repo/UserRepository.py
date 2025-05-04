# repository.py
from sqlalchemy.orm import Session
from app.model.user_model import User
from app.pydantic.user_schema import UserCreate

from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def create_user(db: Session, user_create: UserCreate):
    hashed_password = hash_password(user_create.password)
    try:
        db_user = User(
            name=user_create.name,
            role=user_create.role,
            email=user_create.email,
            password=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except IntegrityError as e:
        db.rollback()  # Rollback transaction in case of error
        raise ValueError(f"Error in saving user: {str(e)}")
    except Exception as e:
        db.rollback()
        raise ValueError(f"An unexpected error occurred: {str(e)}")
    return db_user

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_all_users(db):
    return db.query(User).all()

