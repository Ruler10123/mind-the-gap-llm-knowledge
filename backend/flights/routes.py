"""API route handlers for Flight Management endpoints."""
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pymongo.errors import DuplicateKeyError
from bson.errors import InvalidId

from flights.models import FlightCreate, FlightUpdate, FlightResponse
from flights.services.database import DatabaseService

router = APIRouter(prefix="/flights", tags=["Flights"])

# Global service instance (initialized in main.py)
db_service: Optional[DatabaseService] = None


@router.get("", response_model=List[FlightResponse])
async def get_all_flights():
    """Get all flights sorted by departure time.

    Returns:
        List of all flights

    Raises:
        500: Database error
    """
    try:
        flights = db_service.get_all_flights()
        return flights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve flights: {str(e)}")


@router.post("", response_model=FlightResponse, status_code=201)
async def create_flight(flight: FlightCreate):
    """Create a new flight.

    Args:
        flight: Flight creation data

    Returns:
        Created flight with ID

    Raises:
        400: Duplicate flight number or validation error
        500: Database error
    """
    try:
        # Convert Pydantic model to dict for MongoDB
        flight_data = flight.model_dump()

        # Insert flight
        flight_id = db_service.create_flight(flight_data)

        # Retrieve and return created flight
        created_flight = db_service.get_flight_by_id(flight_id)
        return created_flight

    except DuplicateKeyError as e:
        raise HTTPException(status_code=400, detail=f"Flight number already exists: {flight.flight_number}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create flight: {str(e)}")


@router.get("/{flight_id}", response_model=FlightResponse)
async def get_flight(flight_id: str):
    """Get a specific flight by ID.

    Args:
        flight_id: Flight ObjectId

    Returns:
        Flight data

    Raises:
        400: Invalid ID format
        404: Flight not found
        500: Database error
    """
    try:
        flight = db_service.get_flight_by_id(flight_id)

        if not flight:
            raise HTTPException(status_code=404, detail=f"Flight not found: {flight_id}")

        return flight

    except InvalidId:
        raise HTTPException(status_code=400, detail=f"Invalid flight ID format: {flight_id}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve flight: {str(e)}")


@router.put("/{flight_id}", response_model=FlightResponse)
async def update_flight(flight_id: str, flight_update: FlightUpdate):
    """Update a flight.

    Args:
        flight_id: Flight ObjectId
        flight_update: Fields to update (all optional)

    Returns:
        Updated flight data

    Raises:
        400: Invalid ID format or duplicate flight number
        404: Flight not found
        500: Database error
    """
    try:
        # Convert to dict and exclude unset fields
        update_data = flight_update.model_dump(exclude_unset=True)

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Update flight
        success = db_service.update_flight(flight_id, update_data)

        if not success:
            raise HTTPException(status_code=404, detail=f"Flight not found: {flight_id}")

        # Retrieve and return updated flight
        updated_flight = db_service.get_flight_by_id(flight_id)
        return updated_flight

    except InvalidId:
        raise HTTPException(status_code=400, detail=f"Invalid flight ID format: {flight_id}")
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail=f"Flight number already exists: {flight_update.flight_number}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update flight: {str(e)}")


@router.delete("/{flight_id}", status_code=204)
async def delete_flight(flight_id: str):
    """Delete a flight.

    Args:
        flight_id: Flight ObjectId

    Raises:
        400: Invalid ID format
        404: Flight not found
        500: Database error
    """
    try:
        success = db_service.delete_flight(flight_id)

        if not success:
            raise HTTPException(status_code=404, detail=f"Flight not found: {flight_id}")

    except InvalidId:
        raise HTTPException(status_code=400, detail=f"Invalid flight ID format: {flight_id}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete flight: {str(e)}")
