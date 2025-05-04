from http.client import HTTPException

from fastapi import APIRouter, Depends
from requests import Session

from app.databases.database import SessionLocal
from app.pydantic.diagnostic_schema import DiagnosticCreateFE, DiagnosticResponse, DiagnosticCreateAI
from app.repo.DiagnosticRepository import create_diagnostic, get_diagnostics, delete_diagnostic
from app.services.DiagnosticService import DiagnosticService
from app.services.UserService import UserService



router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/diagnostic/post", response_model=DiagnosticCreateFE)
def create_diagnostic_route(diagnostic_create: DiagnosticCreateFE, db : Session = Depends(get_db)):
    user_service = UserService(db)
    diagnostic_service = DiagnosticService(db)
    if user_service.find_by_id(diagnostic_create.user_id) is None:
        raise HTTPException(status_code=404, detail="User does not exist or incorrect")
    else:
        db_diagnostic = create_diagnostic(db,diagnostic_service.post_diagnostic_with_mole_result(diagnostic_create))
        return db_diagnostic
@router.get("/diagnostics/{diagnostic_id}", response_model=DiagnosticResponse)
def get_diagnostics_route(diagnostic_id: int,db: Session = Depends(get_db)):
    db_diagnostic = get_diagnostics(db,diagnostic_id)
    if db_diagnostic is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_diagnostic

@router.delete("/diagnostics/{diagnostic_id}", response_model=DiagnosticResponse)
def delete_diagnostic_route(diagnostic_id: int, db: Session = Depends(get_db)):
    diagnostic_service = DiagnosticService(db)
    diagnostic = diagnostic_service.find_diagnostic_by_id(diagnostic_id)
    if diagnostic is None:
        raise HTTPException(status_code=404, detail="Diagnostic does not exist or is incorrect")
    db_diagnostic = delete_diagnostic(db,diagnostic)
    return db_diagnostic

@router.post("/diagnostic/get_diagnosis", response_model=DiagnosticCreateAI)
def set_diagnosis_route(diagnostic_create: DiagnosticCreateFE, db : Session = Depends(get_db)):
    diagnosis_service = DiagnosticService(db)
    result = diagnosis_service.post_diagnostic_with_mole_result(diagnostic_create)
    return result