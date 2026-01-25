"""Face recognition service using DeepFace."""
import json
import shutil
import time
from pathlib import Path
from typing import Optional, Dict, List
import numpy as np
from deepface import DeepFace
import config


class NoFaceDetectedError(Exception):
    """Raised when no face is detected in the image."""
    pass


class MultipleFacesError(Exception):
    """Raised when multiple faces are detected in the image."""
    pass


class ModelLoadError(Exception):
    """Raised when face recognition models fail to load."""
    pass


class StorageError(Exception):
    """Raised when file system operations fail."""
    pass


class FaceRecognitionService:
    """Singleton service for face recognition operations."""

    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize the service (only once)."""
        if not FaceRecognitionService._initialized:
            self._load_models()
            FaceRecognitionService._initialized = True

    def _load_models(self) -> None:
        """Pre-load DeepFace models to avoid cold start delays.

        This method creates a dummy image and runs face detection/recognition
        to force model downloads and loading into memory.
        """
        print("Loading face recognition models...")
        try:
            # Create a dummy image for model warmup
            dummy_image = np.zeros((224, 224, 3), dtype=np.uint8)
            dummy_path = config.TEMP_DIR / "dummy_warmup.jpg"

            # Save dummy image
            from PIL import Image
            Image.fromarray(dummy_image).save(dummy_path)

            # Force model loading by running a detection
            try:
                DeepFace.extract_faces(
                    img_path=str(dummy_path),
                    detector_backend=config.DEEPFACE_DETECTOR,
                    enforce_detection=False
                )
            except Exception:
                pass  # Dummy image may not have faces, that's OK

            # Clean up
            if dummy_path.exists():
                dummy_path.unlink()

            print(f"Models loaded successfully: {config.DEEPFACE_MODEL}")

        except Exception as e:
            raise ModelLoadError(f"Failed to load face recognition models: {str(e)}")

    def _validate_face_in_image(self, image_path: Path) -> None:
        """Validate that exactly one face exists in the image.

        Args:
            image_path: Path to the image file

        Raises:
            NoFaceDetectedError: If no face is found
            MultipleFacesError: If multiple faces are found
        """
        try:
            faces = DeepFace.extract_faces(
                img_path=str(image_path),
                detector_backend=config.DEEPFACE_DETECTOR,
                enforce_detection=True
            )

            if len(faces) == 0:
                raise NoFaceDetectedError("No face detected in the image")
            elif len(faces) > 1:
                raise MultipleFacesError(f"Multiple faces detected ({len(faces)}). Please ensure only one face is visible.")

        except ValueError as e:
            # DeepFace raises ValueError when no face is detected
            if "Face could not be detected" in str(e):
                raise NoFaceDetectedError("No face detected in the image")
            raise

    def _load_metadata(self) -> Dict:
        """Load metadata from JSON file.

        Returns:
            Dictionary containing user metadata
        """
        if not config.METADATA_FILE.exists():
            return {}

        try:
            with config.METADATA_FILE.open("r") as f:
                return json.load(f)
        except Exception:
            return {}

    def _save_metadata(self, metadata: Dict) -> None:
        """Save metadata to JSON file.

        Args:
            metadata: Dictionary containing user metadata
        """
        try:
            with config.METADATA_FILE.open("w") as f:
                json.dump(metadata, f, indent=2)
        except Exception as e:
            raise StorageError(f"Failed to save metadata: {str(e)}")

    def _clear_deepface_cache(self) -> None:
        """Clear DeepFace's pickle cache to force re-indexing."""
        pkl_files = list(config.FACE_DB_DIR.glob("representations_*.pkl"))
        for pkl_file in pkl_files:
            try:
                pkl_file.unlink()
            except Exception:
                pass

    def recognize_face(self, image_path: Path) -> Optional[Dict]:
        """Recognize a face in the given image.

        Args:
            image_path: Path to the image containing a face

        Returns:
            Dictionary with recognition results or None if no match found
            {
                'user_id': str,
                'user_name': str,
                'distance': float,
                'confidence': float
            }

        Raises:
            NoFaceDetectedError: If no face is found
            MultipleFacesError: If multiple faces are found
        """
        # Validate exactly one face exists
        self._validate_face_in_image(image_path)

        # Check if database is empty
        metadata = self._load_metadata()
        if not metadata:
            return None

        try:
            # Perform face recognition
            results = DeepFace.find(
                img_path=str(image_path),
                db_path=str(config.FACE_DB_DIR),
                model_name=config.DEEPFACE_MODEL,
                detector_backend=config.DEEPFACE_DETECTOR,
                distance_metric=config.DEEPFACE_DISTANCE_METRIC,
                enforce_detection=True,
                silent=True
            )

            # DeepFace.find returns a list of DataFrames (one per input image)
            if not results or len(results) == 0:
                return None

            df = results[0]

            # Check if any matches found
            if df.empty:
                return None

            # Get the best match (first row, already sorted by distance)
            best_match = df.iloc[0]
            distance = float(best_match[f"{config.DEEPFACE_MODEL}_{config.DEEPFACE_DISTANCE_METRIC}"])

            # Check if distance is within threshold
            if distance > config.RECOGNITION_THRESHOLD:
                return None

            # Extract user_id from the identity path
            identity_path = Path(best_match["identity"])
            user_id = identity_path.parent.name

            # Get user info from metadata
            if user_id not in metadata:
                return None

            user_info = metadata[user_id]

            # Calculate confidence (inverse of distance, normalized to 0-1)
            confidence = 1.0 - min(distance / config.RECOGNITION_THRESHOLD, 1.0)

            return {
                "user_id": user_id,
                "user_name": user_info["user_name"],
                "distance": distance,
                "confidence": confidence
            }

        except ValueError as e:
            if "Face could not be detected" in str(e):
                raise NoFaceDetectedError("No face detected in the image")
            raise
        except Exception as e:
            print(f"Recognition error: {str(e)}")
            return None

    def register_face(self, image_path: Path, user_name: str) -> str:
        """Register a new face in the database.

        Args:
            image_path: Path to the image containing the face
            user_name: Name of the user to register

        Returns:
            user_id: Unique identifier for the registered user

        Raises:
            NoFaceDetectedError: If no face is found
            MultipleFacesError: If multiple faces are found
            StorageError: If file operations fail
        """
        # Validate exactly one face exists
        self._validate_face_in_image(image_path)

        # Generate unique user_id
        timestamp = int(time.time())
        user_id = f"{user_name.lower().replace(' ', '_')}_{timestamp}"

        # Create user directory
        user_dir = config.FACE_DB_DIR / user_id
        try:
            user_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            raise StorageError(f"Failed to create user directory: {str(e)}")

        # Copy image to user directory
        dest_path = user_dir / "face.jpg"
        try:
            shutil.copy2(image_path, dest_path)
        except Exception as e:
            # Clean up on failure
            if user_dir.exists():
                shutil.rmtree(user_dir, ignore_errors=True)
            raise StorageError(f"Failed to save face image: {str(e)}")

        # Update metadata
        metadata = self._load_metadata()
        metadata[user_id] = {
            "user_name": user_name,
            "registered_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "timestamp": timestamp
        }
        self._save_metadata(metadata)

        # Clear DeepFace cache to force re-indexing
        self._clear_deepface_cache()

        return user_id

    def get_all_faces(self) -> List[Dict]:
        """Get list of all registered faces.

        Returns:
            List of dictionaries containing user information
        """
        metadata = self._load_metadata()
        faces = []

        for user_id, user_info in metadata.items():
            user_dir = config.FACE_DB_DIR / user_id
            if user_dir.exists():
                faces.append({
                    "user_id": user_id,
                    "user_name": user_info["user_name"],
                    "registered_at": user_info["registered_at"]
                })

        # Sort by registration time (newest first)
        faces.sort(key=lambda x: x["registered_at"], reverse=True)
        return faces

    def delete_face(self, user_id: str) -> bool:
        """Delete a registered face from the database.

        Args:
            user_id: ID of the user to delete

        Returns:
            True if deleted successfully, False if user not found

        Raises:
            StorageError: If file operations fail
        """
        metadata = self._load_metadata()

        if user_id not in metadata:
            return False

        # Remove user directory
        user_dir = config.FACE_DB_DIR / user_id
        try:
            if user_dir.exists():
                shutil.rmtree(user_dir)
        except Exception as e:
            raise StorageError(f"Failed to delete user directory: {str(e)}")

        # Update metadata
        del metadata[user_id]
        self._save_metadata(metadata)

        # Clear DeepFace cache to force re-indexing
        self._clear_deepface_cache()

        return True
