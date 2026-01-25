"""Pydantic models for API requests and responses."""
from typing import Optional
from pydantic import BaseModel, Field


class TicketInfo(BaseModel):
    """Flight ticket information."""
    flight_number: str = Field(..., description="Flight number")
    seat: str = Field(..., description="Seat assignment")
    group: str = Field(..., description="Boarding group")


class RegisterRequest(BaseModel):
    """Registration request model."""
    name: str = Field(..., description="Passenger name")
    passenger_id: str = Field(..., description="Unique passenger identifier")
    flight_number: str = Field(..., description="Flight number")
    seat: str = Field(..., description="Seat assignment")
    group: str = Field(..., description="Boarding group")


class QRAuthRequest(BaseModel):
    """QR code authentication request."""
    qr_token: str = Field(..., description="QR token/secret")


class StatusInfo(BaseModel):
    """Passenger status information."""
    boarded: bool = Field(default=False, description="Boarding status")


class UserResponse(BaseModel):
    """User data response (excludes security fields)."""
    name: str
    passenger_id: str
    ticket_info: TicketInfo
    status: StatusInfo


class AuthResponse(BaseModel):
    """Authentication response."""
    status: str = Field(..., description="Authentication status: 'success' or 'failure'")
    user: Optional[UserResponse] = Field(None, description="User data if authenticated")
    message: str = Field(..., description="Human-readable message")
    similarity_score: Optional[float] = Field(None, description="Face match score (0-1)")
