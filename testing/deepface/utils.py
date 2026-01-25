"""Utility functions for image processing and file handling."""
import base64
import shutil
from pathlib import Path
from typing import BinaryIO
from PIL import Image
import config


def save_upload_file(upload_file: BinaryIO, destination: Path) -> Path:
    """Save an uploaded file to the specified destination.

    Args:
        upload_file: File-like object from upload
        destination: Path where file should be saved

    Returns:
        Path to the saved file
    """
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload_file, buffer)
    return destination


def image_to_base64(image_path: Path) -> str:
    """Convert an image file to base64 string.

    Args:
        image_path: Path to the image file

    Returns:
        Base64 encoded string
    """
    with image_path.open("rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def base64_to_image(base64_string: str, output_path: Path) -> Path:
    """Convert a base64 string to an image file.

    Args:
        base64_string: Base64 encoded image string
        output_path: Path where image should be saved

    Returns:
        Path to the saved image
    """
    image_data = base64.b64decode(base64_string)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("wb") as image_file:
        image_file.write(image_data)
    return output_path


def create_thumbnail(image_path: Path, thumbnail_path: Path, size: tuple = None) -> Path:
    """Create a thumbnail from an image.

    Args:
        image_path: Path to the original image
        thumbnail_path: Path where thumbnail should be saved
        size: Thumbnail size (width, height), defaults to config.THUMBNAIL_SIZE

    Returns:
        Path to the saved thumbnail
    """
    if size is None:
        size = config.THUMBNAIL_SIZE

    thumbnail_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(image_path) as img:
        img.thumbnail(size, Image.Resampling.LANCZOS)
        img.save(thumbnail_path, "JPEG", quality=85)

    return thumbnail_path


def validate_image_file(file_path: Path) -> bool:
    """Validate that a file is a valid image.

    Args:
        file_path: Path to the file to validate

    Returns:
        True if valid image, False otherwise
    """
    if not file_path.exists():
        return False

    if file_path.suffix.lower() not in config.ALLOWED_EXTENSIONS:
        return False

    try:
        with Image.open(file_path) as img:
            img.verify()
        return True
    except Exception:
        return False


def resize_image_if_needed(image_path: Path, max_size: tuple = None) -> Path:
    """Resize image if it exceeds maximum dimensions.

    Args:
        image_path: Path to the image
        max_size: Maximum dimensions (width, height), defaults to config.MAX_IMAGE_SIZE

    Returns:
        Path to the image (same path, potentially modified)
    """
    if max_size is None:
        max_size = config.MAX_IMAGE_SIZE

    with Image.open(image_path) as img:
        if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            img.save(image_path, "JPEG", quality=90)

    return image_path


def cleanup_temp_file(file_path: Path) -> None:
    """Delete a temporary file.

    Args:
        file_path: Path to the file to delete
    """
    try:
        if file_path.exists():
            file_path.unlink()
    except Exception:
        pass  # Ignore errors during cleanup
