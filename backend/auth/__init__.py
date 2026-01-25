"""Biometric and QR code authentication module."""

from .routes import router as auth_router
from .services.database import DatabaseService
from .services.face_recognition import FaceRecognitionService
from .services.qr_service import QRService

__all__ = [
    "auth_router",
    "DatabaseService",
    "FaceRecognitionService",
    "QRService",
]
