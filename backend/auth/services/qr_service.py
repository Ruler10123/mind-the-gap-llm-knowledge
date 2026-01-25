"""QR code generation service."""
import uuid
from pathlib import Path
from typing import Optional
import qrcode
from config import settings


class QRService:
    """Service for generating QR codes."""

    def __init__(self):
        self.settings = settings

    def generate_qr_secret(self) -> str:
        """Generate a unique QR secret token.

        Returns:
            UUID4 string
        """
        return str(uuid.uuid4())

    def create_qr_code(self, data: str, filename: str) -> Path:
        """Generate a QR code image and save it to disk.

        Args:
            data: Data to encode in the QR code
            filename: Filename (without extension) for the QR code

        Returns:
            Path to the saved QR code PNG file
        """
        # Create QR code instance with configuration
        qr = qrcode.QRCode(
            version=1,  # Size of QR code (1 = 21x21)
            error_correction=qrcode.constants.ERROR_CORRECT_L,  # ~7% error correction
            box_size=10,  # Pixels per box
            border=4,  # Minimum border size (4 boxes)
        )

        # Add data and generate
        qr.add_data(data)
        qr.make(fit=True)

        # Create image
        img = qr.make_image(fill_color="black", back_color="white")

        # Save to file
        filepath = self.settings.auth_qr_dir / f"{filename}.png"
        img.save(str(filepath))

        return filepath

    def decode_qr_from_image(self, image_path: Path) -> Optional[str]:
        """Decode QR code from an image file.

        Args:
            image_path: Path to image file containing QR code

        Returns:
            Decoded QR data string, or None if no QR code found

        Raises:
            Exception: If image cannot be read
        """
        import cv2

        # Read image
        img = cv2.imread(str(image_path))
        if img is None:
            raise Exception(f"Failed to read image: {image_path}")

        # Create QR detector (uses OpenCV's built-in QR detector)
        detector = cv2.QRCodeDetector()

        # Detect and decode
        data, bbox, straight_qrcode = detector.detectAndDecode(img)

        # Return decoded data (empty string if no QR found)
        return data if data else None
