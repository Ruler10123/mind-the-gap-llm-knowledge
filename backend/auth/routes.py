"""API route handlers for authentication endpoints."""
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse

from auth.models import QRAuthRequest, AuthResponse, UserResponse, TicketInfo, StatusInfo
from auth.services.database import DatabaseService
from auth.services.face_recognition import (
    FaceRecognitionService,
    FaceNotDetectedException,
    MultipleFacesException,
    FaceRecognitionError
)
from auth.services.qr_service import QRService
from config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Global service instances (initialized in main.py)
db_service: Optional[DatabaseService] = None
face_service: Optional[FaceRecognitionService] = None
qr_service: Optional[QRService] = None


@router.post("/register", response_class=FileResponse)
async def register_passenger(
    file: UploadFile = File(..., description="Passenger photo for face recognition"),
    name: str = Form(..., description="Passenger name"),
    passenger_id: str = Form(..., description="Unique passenger ID"),
    flight_number: str = Form(..., description="Flight number"),
    seat: str = Form(..., description="Seat assignment"),
    group: str = Form(..., description="Boarding group"),
):
    """Register a new passenger with face biometric and generate QR code.

    Args:
        file: Photo of passenger's face
        name: Passenger name
        passenger_id: Unique passenger identifier
        flight_number: Flight number
        seat: Seat assignment
        group: Boarding group

    Returns:
        QR code PNG image for download

    Raises:
        400: No face or multiple faces detected
        500: Database or processing error
    """
    temp_file_path: Optional[Path] = None

    try:
        # Save uploaded file temporarily
        file_extension = Path(file.filename).suffix if file.filename else ".jpg"
        temp_filename = f"{uuid.uuid4()}{file_extension}"
        temp_file_path = settings.auth_temp_dir / temp_filename

        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Extract face embedding
        try:
            embedding = face_service.extract_embedding(temp_file_path, enforce_detection=True)
        except FaceNotDetectedException as e:
            raise HTTPException(status_code=400, detail=f"No face detected: {str(e)}")
        except MultipleFacesException as e:
            raise HTTPException(status_code=400, detail=f"Multiple faces detected: {str(e)}")
        except FaceRecognitionError as e:
            raise HTTPException(status_code=500, detail=f"Face recognition error: {str(e)}")

        # Generate QR secret
        qr_secret = qr_service.generate_qr_secret()

        # Create passenger document
        passenger_doc = {
            "name": name,
            "passenger_id": passenger_id,
            "ticket_info": {
                "flight_number": flight_number,
                "seat": seat,
                "group": group
            },
            "security": {
                "qr_secret": qr_secret,
                "face_embedding": embedding
            },
            "status": {
                "boarded": False
            }
        }

        # Insert into database
        try:
            doc_id = db_service.insert_passenger(passenger_doc)
            print(f"Passenger registered: {passenger_id} (ID: {doc_id})")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

        # Generate QR code
        qr_filename = f"{passenger_id}_{uuid.uuid4().hex[:8]}"
        qr_path = qr_service.create_qr_code(qr_secret, qr_filename)

        # Return QR code as downloadable file
        return FileResponse(
            path=str(qr_path),
            media_type="image/png",
            filename=f"{passenger_id}_qr.png"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

    finally:
        # Cleanup temporary file
        if temp_file_path and temp_file_path.exists():
            temp_file_path.unlink()


@router.post("/face", response_model=AuthResponse)
async def authenticate_face(
    file: UploadFile = File(..., description="Live photo for face verification")
):
    """Authenticate passenger using facial recognition.

    Args:
        file: Live photo of passenger's face

    Returns:
        Authentication result with user data if successful

    Raises:
        400: No face or multiple faces detected
        500: Processing error
    """
    temp_file_path: Optional[Path] = None

    try:
        # Save uploaded file temporarily
        file_extension = Path(file.filename).suffix if file.filename else ".jpg"
        temp_filename = f"{uuid.uuid4()}{file_extension}"
        temp_file_path = settings.auth_temp_dir / temp_filename

        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Extract face embedding
        try:
            embedding = face_service.extract_embedding(temp_file_path, enforce_detection=True)
        except FaceNotDetectedException as e:
            raise HTTPException(status_code=400, detail=f"No face detected: {str(e)}")
        except MultipleFacesException as e:
            raise HTTPException(status_code=400, detail=f"Multiple faces detected: {str(e)}")
        except FaceRecognitionError as e:
            raise HTTPException(status_code=500, detail=f"Face recognition error: {str(e)}")

        # Perform vector search
        try:
            results = db_service.vector_search(embedding, limit=1)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database search error: {str(e)}")

        # Check if match found
        if not results:
            return AuthResponse(
                status="failure",
                message="No matching face found in database",
                similarity_score=0.0
            )

        # Get top match
        match = results[0]
        similarity_score = match.get("score", 0.0)

        # Check against threshold
        if similarity_score < settings.face_similarity_threshold:
            return AuthResponse(
                status="failure",
                message=f"Face similarity too low (score: {similarity_score:.3f}, threshold: {settings.face_similarity_threshold})",
                similarity_score=similarity_score
            )

        # Success - return user data
        user_response = UserResponse(
            name=match["name"],
            passenger_id=match["passenger_id"],
            ticket_info=TicketInfo(**match["ticket_info"]),
            status=StatusInfo(**match["status"])
        )

        return AuthResponse(
            status="success",
            user=user_response,
            message=f"Face recognized successfully (score: {similarity_score:.3f})",
            similarity_score=similarity_score
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

    finally:
        # Cleanup temporary file
        if temp_file_path and temp_file_path.exists():
            temp_file_path.unlink()


@router.post("/qr", response_model=AuthResponse)
async def authenticate_qr(request: QRAuthRequest):
    """Authenticate passenger using QR code.

    Args:
        request: QR authentication request with token

    Returns:
        Authentication result with user data if successful
    """
    try:
        # Query database by QR secret
        user_doc = db_service.find_by_qr_secret(request.qr_token)

        # Check if found
        if not user_doc:
            return AuthResponse(
                status="failure",
                message="Invalid QR code - no matching passenger found"
            )

        # Success - return user data
        user_response = UserResponse(
            name=user_doc["name"],
            passenger_id=user_doc["passenger_id"],
            ticket_info=TicketInfo(**user_doc["ticket_info"]),
            status=StatusInfo(**user_doc["status"])
        )

        return AuthResponse(
            status="success",
            user=user_response,
            message="QR code verified successfully"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QR authentication failed: {str(e)}")
