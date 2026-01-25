"""FastAPI application entry point for biometric & QR authentication."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config.settings import get_settings
from services.database import DatabaseService
from services.face_recognition import FaceRecognitionService
from services.qr_service import QRService
from api.routes import router, set_services


# Global service instances
db_service: DatabaseService = None
face_service: FaceRecognitionService = None
qr_service: QRService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown events."""
    # Startup
    global db_service, face_service, qr_service

    print("Starting Combined Auth API...")

    # Load settings (creates directories)
    settings = get_settings()
    print(f"Configuration loaded: {settings.DATABASE_NAME}.{settings.COLLECTION_NAME}")

    # Initialize services
    try:
        db_service = DatabaseService()
        face_service = FaceRecognitionService()
        qr_service = QRService()

        # Set services in router
        set_services(db_service, face_service, qr_service)

        print("All services initialized successfully")
        print(f"Face recognition threshold: {settings.SIMILARITY_THRESHOLD}")
        print(f"Temp directory: {settings.TEMP_DIR}")
        print(f"QR code directory: {settings.QR_DIR}")

    except Exception as e:
        print(f"Error initializing services: {str(e)}")
        raise

    yield

    # Shutdown
    print("Shutting down Combined Auth API...")
    if db_service:
        db_service.close()


# Create FastAPI app
app = FastAPI(
    title="Combined Auth API",
    description="Biometric & QR Authentication Module for Smart Kiosks",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS (allow all for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api", tags=["Authentication"])

# Mount static files for testing frontend
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    """Root endpoint - redirect to testing frontend."""
    return {
        "message": "Combined Auth API",
        "version": "1.0.0",
        "endpoints": {
            "testing_ui": "/static/index.html",
            "api_docs": "/docs",
            "register": "/api/register",
            "face_auth": "/api/auth/face",
            "qr_auth": "/api/auth/qr"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected" if db_service and db_service.client else "disconnected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
