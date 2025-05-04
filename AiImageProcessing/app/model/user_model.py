from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.databases.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'patient', 'doctor', 'admin'
    email = Column(String, nullable=False)
    password = Column(String, nullable=False)

    diagnostics = relationship("Diagnostic", back_populates="user")
