"""Face recognition service using DeepFace and Facenet512."""
from typing import List
from pathlib import Path
from deepface import DeepFace


class FaceNotDetectedException(Exception):
    """Raised when no face is detected in the image."""
    pass


class MultipleFacesException(Exception):
    """Raised when multiple faces are detected in the image."""
    pass


class FaceRecognitionError(Exception):
    """Raised when face recognition processing fails."""
    pass


class FaceRecognitionService:
    """Service for facial recognition using DeepFace with Facenet512 model."""

    def __init__(self):
        """Initialize the face recognition service."""
        self.model_name = "Facenet512"
        self.detector_backend = "opencv"

    def extract_embedding(self, image_path: str | Path, enforce_detection: bool = True) -> List[float]:
        """Extract a 512-dimensional face embedding from an image.

        Args:
            image_path: Path to the image file
            enforce_detection: If True, raise exception if face not detected

        Returns:
            512-dimensional embedding as a list of floats

        Raises:
            FaceNotDetectedException: No face detected in image
            MultipleFacesException: Multiple faces detected (ambiguous)
            FaceRecognitionError: Other processing errors
        """
        try:
            # Use DeepFace to extract embedding
            result = DeepFace.represent(
                img_path=str(image_path),
                model_name=self.model_name,
                enforce_detection=enforce_detection,
                detector_backend=self.detector_backend,
            )

            # DeepFace returns a list of detected faces
            if not result:
                raise FaceNotDetectedException("No face detected in the image")

            if len(result) > 1:
                raise MultipleFacesException(
                    f"Multiple faces detected ({len(result)}). Please provide an image with a single face."
                )

            # Extract the embedding (512-dim vector)
            embedding = result[0]["embedding"]

            # Validate dimensions
            if len(embedding) != 512:
                raise FaceRecognitionError(
                    f"Expected 512-dimensional embedding, got {len(embedding)} dimensions"
                )

            return embedding

        except (FaceNotDetectedException, MultipleFacesException):
            # Re-raise custom exceptions
            raise

        except ValueError as e:
            # DeepFace raises ValueError when no face is detected
            if "Face could not be detected" in str(e) or "no face" in str(e).lower():
                raise FaceNotDetectedException(str(e))
            raise FaceRecognitionError(f"Face recognition failed: {str(e)}")

        except Exception as e:
            # Catch all other errors
            raise FaceRecognitionError(f"Face recognition processing error: {str(e)}")
