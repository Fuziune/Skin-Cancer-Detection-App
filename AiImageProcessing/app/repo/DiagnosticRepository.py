from sqlite3 import IntegrityError

from sqlalchemy.orm import Session
from sympy.codegen.cnodes import void

from app.model import Diagnostic
from app.pydantic.diagnostic_schema import DiagnosticCreateAI


def create_diagnostic(db: Session, diagnostic_create: DiagnosticCreateAI):
    try:
        db_diagnostic = Diagnostic(
            image_url = diagnostic_create.image_url,
            result = diagnostic_create.result,
            user_id=diagnostic_create.user_id,
        )
        db.add(db_diagnostic)
        db.commit()
        db.refresh(db_diagnostic)
    except IntegrityError as e:
        db.rollback()  # Rollback transaction in case of error
        raise ValueError(f"Error in saving diagnostic: {str(e)}")
    except Exception as e:
        db.rollback()
        raise ValueError(f"An unexpected error occurred: {str(e)}")
    return db_diagnostic

def get_diagnostics(db: Session, diagnostic_id: int):
    return db.query(Diagnostic).filter(Diagnostic.id == diagnostic_id).first()

def delete_diagnostic(db: Session, diagnostic: Diagnostic):
    diagnostic_copy = diagnostic
    db.delete(diagnostic)
    db.commit()

    return diagnostic_copy
