from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.databases.database import Base

class Diagnostic(Base):
    __tablename__ = "diagnostics"
    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String, nullable=False)
    result = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="diagnostics")