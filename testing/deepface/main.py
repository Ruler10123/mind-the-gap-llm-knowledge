"""FastAPI application for face recognition system."""
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional
import uuid

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

import config
import utils
from models import (
    RecognitionResponse,
    RegistrationResponse,
    FaceListResponse,
    FaceInfo,
    DeleteResponse,
    ErrorResponse
)
from service import (
    FaceRecognitionService,
    NoFaceDetectedError,
    MultipleFacesError,
    ModelLoadError,
    StorageError
)


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    print("Starting face recognition system...")
    try:
        # Initialize service (loads models)
        FaceRecognitionService()
        print("Face recognition system ready!")
    except ModelLoadError as e:
        print(f"ERROR: Failed to initialize: {str(e)}")
        raise

    yield

    # Shutdown
    print("Shutting down face recognition system...")


# Create FastAPI app
app = FastAPI(
    title="Face Recognition Access System",
    description="Face recognition system using DeepFace and Facenet512",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory=str(config.STATIC_DIR)), name="static")


# Exception handlers
@app.exception_handler(NoFaceDetectedError)
async def no_face_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content=ErrorResponse(
            error="No face detected",
            details=str(exc)
        ).model_dump()
    )


@app.exception_handler(MultipleFacesError)
async def multiple_faces_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content=ErrorResponse(
            error="Multiple faces detected",
            details=str(exc)
        ).model_dump()
    )


@app.exception_handler(ModelLoadError)
async def model_load_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Model loading failed",
            details=str(exc)
        ).model_dump()
    )


@app.exception_handler(StorageError)
async def storage_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Storage operation failed",
            details=str(exc)
        ).model_dump()
    )


# Root endpoint - serve frontend
@app.get("/")
async def root():
    """Serve the frontend HTML page."""
    html_path = config.STATIC_DIR / "index.html"
    if not html_path.exists():
        raise HTTPException(status_code=404, detail="Frontend not found")
    return FileResponse(html_path)


# API Endpoints
@app.post("/api/recognize", response_model=RecognitionResponse)
async def recognize_face(image: UploadFile = File(...)):
    """Recognize a face in the uploaded image.

    Args:
        image: Image file containing a face

    Returns:
        Recognition result with user information or "Unknown" message
    """
    service = FaceRecognitionService()
    temp_path = None

    try:
        # Save uploaded file to temp directory
        temp_filename = f"{uuid.uuid4()}{Path(image.filename).suffix}"
        temp_path = config.TEMP_DIR / temp_filename

        await image.seek(0)
        utils.save_upload_file(image.file, temp_path)

        # Validate image
        if not utils.validate_image_file(temp_path):
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Resize if needed
        utils.resize_image_if_needed(temp_path)

        # Perform recognition
        result = service.recognize_face(temp_path)

        if result:
            return RecognitionResponse(
                success=True,
                user_id=result["user_id"],
                user_name=result["user_name"],
                confidence=result["confidence"],
                distance=result["distance"],
                message=f"Recognized: {result['user_name']}"
            )
        else:
            return RecognitionResponse(
                success=True,
                message="Unknown person"
            )

    except (NoFaceDetectedError, MultipleFacesError):
        raise  # Let exception handlers deal with these

    except Exception as e:
        print(f"Recognition error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")

    finally:
        # Cleanup temp file
        if temp_path:
            utils.cleanup_temp_file(temp_path)


@app.post("/api/register", response_model=RegistrationResponse)
async def register_face(
    image: UploadFile = File(...),
    user_name: str = Form(...)
):
    """Register a new face in the database.

    Args:
        image: Image file containing the face
        user_name: Name of the user

    Returns:
        Registration result with user_id
    """
    service = FaceRecognitionService()
    temp_path = None

    try:
        # Validate user_name
        if not user_name or len(user_name.strip()) == 0:
            raise HTTPException(status_code=400, detail="User name is required")

        user_name = user_name.strip()

        # Save uploaded file to temp directory
        temp_filename = f"{uuid.uuid4()}{Path(image.filename).suffix}"
        temp_path = config.TEMP_DIR / temp_filename

        await image.seek(0)
        utils.save_upload_file(image.file, temp_path)

        # Validate image
        if not utils.validate_image_file(temp_path):
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Resize if needed
        utils.resize_image_if_needed(temp_path)

        # Register the face
        user_id = service.register_face(temp_path, user_name)

        return RegistrationResponse(
            success=True,
            user_id=user_id,
            message=f"Successfully registered {user_name}"
        )

    except (NoFaceDetectedError, MultipleFacesError, StorageError):
        raise  # Let exception handlers deal with these

    except HTTPException:
        raise

    except Exception as e:
        print(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

    finally:
        # Cleanup temp file
        if temp_path:
            utils.cleanup_temp_file(temp_path)


@app.get("/api/faces", response_model=FaceListResponse)
async def list_faces():
    """Get list of all registered faces.

    Returns:
        List of registered users with their information
    """
    service = FaceRecognitionService()

    try:
        faces = service.get_all_faces()

        face_info_list = [
            FaceInfo(
                user_id=face["user_id"],
                user_name=face["user_name"],
                registered_at=face["registered_at"],
                thumbnail_url=f"/api/thumbnail/{face['user_id']}"
            )
            for face in faces
        ]

        return FaceListResponse(
            success=True,
            faces=face_info_list,
            count=len(face_info_list)
        )

    except Exception as e:
        print(f"List faces error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list faces: {str(e)}")


@app.delete("/api/faces/{user_id}", response_model=DeleteResponse)
async def delete_face(user_id: str):
    """Delete a registered face.

    Args:
        user_id: ID of the user to delete

    Returns:
        Deletion result
    """
    service = FaceRecognitionService()

    try:
        success = service.delete_face(user_id)

        if success:
            return DeleteResponse(
                success=True,
                message=f"Successfully deleted user {user_id}"
            )
        else:
            raise HTTPException(status_code=404, detail="User not found")

    except StorageError:
        raise  # Let exception handler deal with this

    except HTTPException:
        raise

    except Exception as e:
        print(f"Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")


@app.get("/api/thumbnail/{user_id}")
async def get_thumbnail(user_id: str):
    """Get thumbnail image for a registered user.

    Args:
        user_id: ID of the user

    Returns:
        Image file
    """
    user_dir = config.FACE_DB_DIR / user_id
    image_path = user_dir / "face.jpg"

    if not image_path.exists():
        raise HTTPException(status_code=404, detail="User image not found")

    return FileResponse(
        image_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "max-age=3600"}
    )


# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "model": config.DEEPFACE_MODEL}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG
    )
