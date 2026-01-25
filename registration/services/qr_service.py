"""QR code generation service."""
import uuid
from pathlib import Path
import qrcode
from config.settings import get_settings


class QRService:
    """Service for generating QR codes."""

    def __init__(self):
        self.settings = get_settings()

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
        filepath = self.settings.QR_DIR / f"{filename}.png"
        img.save(str(filepath))

        return filepath
