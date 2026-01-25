"""Pydantic models for request/response validation."""
from typing import Optional, List
from pydantic import BaseModel


class RecognitionResponse(BaseModel):
    """Response for face recognition requests."""
    success: bool
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    confidence: Optional[float] = None
    distance: Optional[float] = None
    message: str


class RegistrationResponse(BaseModel):
    """Response for face registration requests."""
    success: bool
    user_id: Optional[str] = None
    message: str


class FaceInfo(BaseModel):
    """Information about a registered face."""
    user_id: str
    user_name: str
    registered_at: str
    thumbnail_url: str


class FaceListResponse(BaseModel):
    """Response for listing all registered faces."""
    success: bool
    faces: List[FaceInfo]
    count: int


class DeleteResponse(BaseModel):
    """Response for face deletion requests."""
    success: bool
    message: str


class ErrorResponse(BaseModel):
    """Generic error response."""
    success: bool = False
    error: str
    details: Optional[str] = None
