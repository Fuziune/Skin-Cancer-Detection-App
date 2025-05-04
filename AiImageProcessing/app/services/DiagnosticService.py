from typing import Type, Optional

from sqlalchemy.orm import Session

from ai_model.clasify_img_func import classify_mole
from app.model import Diagnostic
from app.pydantic.diagnostic_schema import DiagnosticCreateAI, DiagnosticCreateFE


class DiagnosticService:
    def __init__(self, db: Session):
        self.db = db

    def post_diagnostic_with_mole_result(self,diagnostic_fe:DiagnosticCreateFE):
        result = classify_mole(diagnostic_fe.image_url)
        if result["status"] == "success":
            db_diagnostic = DiagnosticCreateAI(
               image_url=diagnostic_fe.image_url,
               user_id=diagnostic_fe.user_id,
               result=result["diagnosis"]
            )
        else:
            db_diagnostic = DiagnosticCreateAI(
                image_url=diagnostic_fe.image_url,
                user_id=diagnostic_fe.user_id,
                result="No response available"
            )
        return db_diagnostic

    def find_diagnostic_by_id(self,diagnostic_id: int):
        diagnostic = self.db.query(Diagnostic).filter(Diagnostic.id == diagnostic_id).first()
        return diagnostic