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
    try:
        # Initialize the diagnostic service
        diagnostic_service = DiagnosticService(db)
        temp_path = None
        
        try:
            # We require base64 data
            if not diagnostic_create.image_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Image data in base64 format is required"
                )
            
            import base64
            import tempfile
            import os
            
            # Decode base64 data
            image_data = base64.b64decode(diagnostic_create.image_data)
            
            # Create a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                temp_file.write(image_data)
                temp_path = temp_file.name
            
            # Create a new diagnostic object with the temporary file path
            diagnostic_create = DiagnosticCreateFE(
                image_url=temp_path,  # Use the temporary file path
                user_id=diagnostic_create.user_id,
                image_data=None  # Clear the base64 data since we're using the file
            )
            
            # Get diagnosis using the updated diagnostic_create object
            result = diagnostic_service.post_diagnostic_with_mole_result(diagnostic_create)
            
            # Update the result's image_url to be the original URL
            result.image_url = diagnostic_create.image_url
            
            return result
            
        finally:
            # Clean up the temporary file if it was created
            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except Exception as e:
                    print(f"Error cleaning up temporary file: {e}")
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

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

@router.post("/get_diagnosis", response_model=DiagnosticCreateAI)
async def get_diagnosis(diagnostic_create: DiagnosticCreateFE, db: Session = Depends(get_db)):
    try:
        # Initialize the diagnostic service
        diagnostic_service = DiagnosticService(db)
        
        if not diagnostic_create.image_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image data in base64 format is required"
            )
        
        # Create the diagnostic request object with base64 data
        diagnostic_create = DiagnosticCreateFE(
            image_url=f"data:image/jpeg;base64,{diagnostic_create.image_data}",  # Use base64 data as image_url
            user_id=diagnostic_create.user_id,
            image_data=None  # Clear the base64 data since we're using it as image_url
        )
        
        # Get diagnosis using the existing function
        result = diagnostic_service.post_diagnostic_with_mole_result(diagnostic_create)
        
        # Create diagnostic record with original image_url
        diagnostic = Diagnostic(
            image_url=diagnostic_create.image_url,  # Store the original image_url
            result=result.result,  # result is already a JSON string
            user_id=diagnostic_create.user_id
        )
        
        # Save to database
        db_diagnostic = create_diagnostic(db, diagnostic)
        
        return {
            "diagnostic_id": db_diagnostic.id,
            "result": result.result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )