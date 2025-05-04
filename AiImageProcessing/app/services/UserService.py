from typing import Optional, Type

from sqlalchemy.orm import Session
from app.model.user_model import User

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def find_by_id(self, user_id: int) -> Optional[Type[User]]:
        """Find a user by their ID."""
        user = self.db.query(User).filter(User.id == user_id).first()
        return user

    def get_all_users(self):
        from app.repo.UserRepository import get_all_users
        return get_all_users(self.db)

    def delete_user_by_id(self, user_id: int):
        user = self.find_by_id(user_id)
        if user:
            self.db.delete(user)
            self.db.commit()
            return user
        else:
            return None