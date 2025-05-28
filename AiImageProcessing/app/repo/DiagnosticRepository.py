from sqlite3 import IntegrityError
from typing import List
from sqlalchemy.orm import Session
from sympy.codegen.cnodes import void

from app.model import Diagnostic
from app.pydantic.diagnostic_schema import DiagnosticCreateAI


def create_diagnostic(db: Session, diagnostic: Diagnostic):
    db_diagnostic = Diagnostic(
        image_url=diagnostic.image_url,
        result=diagnostic.result,
        user_id=diagnostic.user_id
    )
    db.add(db_diagnostic)
    db.commit()
    db.refresh(db_diagnostic)
    return db_diagnostic

def get_diagnostics(db: Session, diagnostic_id: int):
    return db.query(Diagnostic).filter(Diagnostic.id == diagnostic_id).first()

def get_user_diagnostics(db: Session, user_id: int):
    return db.query(Diagnostic).filter(Diagnostic.user_id == user_id).all()

def delete_diagnostic(db: Session, diagnostic_id: int):
    diagnostic = db.query(Diagnostic).filter(Diagnostic.id == diagnostic_id).first()
    if diagnostic:
        db.delete(diagnostic)
        db.commit()
        return True
    return False
