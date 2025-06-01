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
            if diagnostic_fe.image_url.startswith('data:image'):
                # If the image_url is already a base64 data URL, use it directly
                class_distribution = predict_image(diagnostic_fe.image_url)
            else:
                # If it's a file path, use it directly
                class_distribution = predict_image(diagnostic_fe.image_url)
            
            # Convert the distribution to a JSON string
            result_json = json.dumps(class_distribution)
            
            # Create the response object with the original image_url
            db_diagnostic = DiagnosticCreateAI(
                image_url=diagnostic_fe.image_url,  # Use the original image_url
                user_id=diagnostic_fe.user_id,
                result=result_json
            )
            return db_diagnostic
        except Exception as e:
            # Log the error for debugging
            print(f"Error in post_diagnostic_with_mole_result: {str(e)}")
            print(f"Image URL: {diagnostic_fe.image_url}")
            
            # Create error response
            error_response = {
                "error": str(e),
                "predicted_class": "error",
                "probabilities": {}
            }
            
            db_diagnostic = DiagnosticCreateAI(
                image_url=diagnostic_fe.image_url,
                user_id=diagnostic_fe.user_id,
                result=json.dumps(error_response)
            )
            return db_diagnostic

    def find_diagnostic_by_id(self, diagnostic_id: int):
        diagnostic = self.db.query(Diagnostic).filter(Diagnostic.id == diagnostic_id).first()
        return diagnostic