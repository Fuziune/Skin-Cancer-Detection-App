from typing import Type, Optional
import json
from sqlalchemy.orm import Session

from ai_model.model_path import predict_image
from app.model import Diagnostic
from app.pydantic.diagnostic_schema import DiagnosticCreateAI, DiagnosticCreateFE


class DiagnosticService:
    def __init__(self, db: Session):
        self.db = db

    def post_diagnostic_with_mole_result(self, diagnostic_fe: DiagnosticCreateFE):
        try:
            # Get the class distribution from the model
            class_distribution = predict_image(diagnostic_fe.image_url)
            
            # Convert the distribution to a JSON string
            result_json = json.dumps(class_distribution)
            
            db_diagnostic = DiagnosticCreateAI(
                image_url=diagnostic_fe.image_url,
                user_id=diagnostic_fe.user_id,
                result=result_json
            )
            return db_diagnostic
        except Exception as e:
            db_diagnostic = DiagnosticCreateAI(
                image_url=diagnostic_fe.image_url,
                user_id=diagnostic_fe.user_id,
                result=json.dumps({"error": str(e)})
            )
            return db_diagnostic

    def find_diagnostic_by_id(self, diagnostic_id: int):
        diagnostic = self.db.query(Diagnostic).filter(Diagnostic.id == diagnostic_id).first()
        return diagnostic