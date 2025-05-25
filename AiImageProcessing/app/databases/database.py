from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
from typing import Generator

# Database connection string
DATABASE_URL = "mssql+pyodbc://JOHNFUZIUNE\\SQLEXPRESS/MoleCancerDetector?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes"

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"driver": "ODBC Driver 17 for SQL Server"})

# Create a sessionmaker for interacting with the database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for your models
Base = declarative_base()

# Dependency to get DB session
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

