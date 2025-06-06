import logging
import socket
import uvicorn

from fastapi import FastAPI, Depends, HTTPException, Request
from starlette.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.middleware.base import BaseHTTPMiddleware
import time

from app.databases.database import SessionLocal, engine, Base
from app.controller.UserController import router as user_controller_router
from app.controller.DiagnosticController import router as diagnostic_controller_router
from app.routers import auth_routes
from app.model import user_model

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title="MoleCancerDetector API", debug=True)

logging.basicConfig(level=logging.DEBUG)  # Enable debug logging

# Add request logging middleware
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        logging.debug(f"Request: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.2f}s")
        return response

app.add_middleware(RequestLoggingMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add validation error handler
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Include routers
app.include_router(user_controller_router)
app.include_router(diagnostic_controller_router)
app.include_router(auth_routes.router)

# Function to get local IPv4 address
def get_local_ip():
    """Finds the local IPv4 address of the machine."""
    return socket.gethostbyname(socket.gethostname())

@app.get("/auth/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    local_ip = get_local_ip()  # Get the current local IP
    print(f"Running on: http://{local_ip}:8001")
    uvicorn.run(app, host=local_ip, port=8001, reload=True)
