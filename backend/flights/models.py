"""Pydantic models for Flight Management API."""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class LuggageState(str, Enum):
    """Luggage handling state."""
    UNLOADING = "Unloading luggage"
    LOADING = "Loading luggage"
    IDLE = "Idle"


class FlightStatus(str, Enum):
    """Flight status."""
    ARRIVING = "Arriving"
    LANDING = "Landing"
    TAXIING = "Taxiing"
    BOARDING_GROUP_A = "Boarding Group A"
    BOARDING_GROUP_B = "Boarding Group B"
    BOARDING_GROUP_C = "Boarding Group C"
    BOARDING = "Boarding"
    DELAYED = "Delayed"
    DEPARTED = "Departed"
    CANCELLED = "Cancelled"
    ON_TIME = "On Time"


class FlightCreate(BaseModel):
    """Flight creation request."""
    flight_number: str = Field(..., description="Flight number (e.g., AA1234)")
    departure_time: datetime = Field(..., description="Departure datetime")
    arrival_time: datetime = Field(..., description="Arrival datetime")
    departure_location: str = Field(..., description="Departure airport code")
    destination: str = Field(..., description="Destination airport code")
    luggage_state: LuggageState = Field(default=LuggageState.IDLE, description="Luggage handling state")
    flight_status: FlightStatus = Field(default=FlightStatus.ON_TIME, description="Flight status")


class FlightUpdate(BaseModel):
    """Flight update request (all fields optional)."""
    flight_number: Optional[str] = Field(None, description="Flight number")
    departure_time: Optional[datetime] = Field(None, description="Departure datetime")
    arrival_time: Optional[datetime] = Field(None, description="Arrival datetime")
    departure_location: Optional[str] = Field(None, description="Departure airport code")
    destination: Optional[str] = Field(None, description="Destination airport code")
    luggage_state: Optional[LuggageState] = Field(None, description="Luggage handling state")
    flight_status: Optional[FlightStatus] = Field(None, description="Flight status")


class FlightResponse(BaseModel):
    """Flight response."""
    id: str = Field(..., description="Flight ID")
    flight_number: str = Field(..., description="Flight number")
    departure_time: datetime = Field(..., description="Departure datetime")
    arrival_time: datetime = Field(..., description="Arrival datetime")
    departure_location: str = Field(..., description="Departure airport code")
    destination: str = Field(..., description="Destination airport code")
    luggage_state: LuggageState = Field(..., description="Luggage handling state")
    flight_status: FlightStatus = Field(..., description="Flight status")
