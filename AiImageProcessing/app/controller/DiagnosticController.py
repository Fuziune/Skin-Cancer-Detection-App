from http.client import HTTPException
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import json
from typing import List

from app.databases.database import SessionLocal
from app.pydantic.diagnostic_schema import DiagnosticCreateFE, DiagnosticResponse, DiagnosticCreateAI, DiagnosticSaveFE
from app.repo.DiagnosticRepository import create_diagnostic, get_diagnostics, delete_diagnostic, get_user_diagnostics
from app.services.DiagnosticService import DiagnosticService
from app.services.UserService import UserService
from app.model import Diagnostic

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/diagnostic/post", response_model=DiagnosticResponse)
def create_diagnostic_route(diagnostic_create: DiagnosticSaveFE, db: Session = Depends(get_db)):
    try:
        user_service = UserService(db)
        diagnostic_service = DiagnosticService(db)
        
        # Check if user exists
        if user_service.find_by_id(diagnostic_create.user_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User does not exist or incorrect"
            )
        
        # Convert the result to a JSON string
        result_json = json.dumps(diagnostic_create.result)
        
        # Create the diagnostic record
        db_diagnostic = create_diagnostic(
            db,
            DiagnosticCreateAI(
                image_url=diagnostic_create.image_url,
                user_id=diagnostic_create.user_id,
                result=result_json
            )
        )
        
        return db_diagnostic
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/diagnostics/user/{user_id}", response_model=List[DiagnosticResponse])
def get_user_diagnostics_route(user_id: int, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        user_service = UserService(db)
        if user_service.find_by_id(user_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get all diagnostics for the user
        diagnostics = get_user_diagnostics(db, user_id)
        return diagnostics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/diagnostics/{diagnostic_id}", response_model=DiagnosticResponse)
def get_diagnostics_route(diagnostic_id: int, db: Session = Depends(get_db)):
    db_diagnostic = get_diagnostics(db, diagnostic_id)
    if db_diagnostic is None:
        raise HTTPException(status_code=404, detail="Diagnostic not found")
    return db_diagnostic

@router.delete("/diagnostic/{diagnostic_id}")
def delete_diagnostic_route(diagnostic_id: int, db: Session = Depends(get_db)):
    try:
        # Check if diagnostic exists
        db_diagnostic = get_diagnostics(db, diagnostic_id)
        if db_diagnostic is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Diagnostic not found"
            )
        
        # Delete the diagnostic
        delete_diagnostic(db, diagnostic_id)
        return {"message": "Diagnostic deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/diagnostic/get_diagnosis", response_model=DiagnosticCreateAI)
def set_diagnosis_route(diagnostic_create: DiagnosticCreateFE, db: Session = Depends(get_db)):
    diagnosis_service = DiagnosticService(db)
    result = diagnosis_service.post_diagnostic_with_mole_result(diagnostic_create)
    return result

@router.post("/post")
async def create_diagnostic_endpoint(
    file: UploadFile = File(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    try:
        # Save the uploaded file
        file_location = f"uploads/{file.filename}"
        with open(file_location, "wb+") as file_object:
            file_object.write(await file.read())
        
        # Create diagnostic record
        diagnostic = Diagnostic(
            image_url=file_location,
            result="{}",  # Empty result initially
            user_id=user_id
        )
        
        return create_diagnostic(db, diagnostic)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/diagnostic/{diagnostic_id}")
def read_diagnostic(diagnostic_id: int, db: Session = Depends(get_db)):
    db_diagnostic = get_diagnostics(db, diagnostic_id)
    if db_diagnostic is None:
        raise HTTPException(status_code=404, detail="Diagnostic not found")
    return db_diagnostic

@router.get("/user/{user_id}")
def read_user_diagnostics(user_id: int, db: Session = Depends(get_db)):
    return get_user_diagnostics(db, user_id)

@router.delete("/diagnostic/{diagnostic_id}")
def delete_diagnostic_endpoint(diagnostic_id: int, db: Session = Depends(get_db)):
    success = delete_diagnostic(db, diagnostic_id)
    if not success:
        raise HTTPException(status_code=404, detail="Diagnostic not found")
    return {"message": "Diagnostic deleted successfully"}

@router.post("/get_diagnosis")
async def get_diagnosis(image_data: dict, db: Session = Depends(get_db)):
    try:
        # Extract image URL and user ID from the request
        image_url = image_data.get("image_url")
        user_id = image_data.get("user_id")
        
        if not image_url or not user_id:
            raise HTTPException(status_code=400, detail="Missing image_url or user_id")
        
        # Get diagnosis from the service
        result = await diagnostic_service.get_diagnosis(image_url)
        
        # Create diagnostic record
        diagnostic = Diagnostic(
            image_url=image_url,
            result=json.dumps(result),
            user_id=user_id
        )
        
        # Save to database
        db_diagnostic = create_diagnostic(db, diagnostic)
        
        return {
            "diagnostic_id": db_diagnostic.id,
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))