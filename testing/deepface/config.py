"""Configuration settings for the face recognition system."""
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).parent
FACE_DB_DIR = BASE_DIR / "face_db"
STATIC_DIR = BASE_DIR / "static"
TEMP_DIR = BASE_DIR / "temp"

# Ensure directories exist
FACE_DB_DIR.mkdir(exist_ok=True)
STATIC_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)

# DeepFace settings
DEEPFACE_MODEL = "Facenet512"
DEEPFACE_DETECTOR = "opencv"
DEEPFACE_DISTANCE_METRIC = "cosine"

# Recognition threshold (cosine distance)
# Lower values = stricter matching
RECOGNITION_THRESHOLD = 0.4

# Image processing
MAX_IMAGE_SIZE = (1920, 1080)  # Max dimensions for uploaded images
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
THUMBNAIL_SIZE = (200, 200)

# Server settings
HOST = "127.0.0.1"
PORT = 8000
DEBUG = True

# Metadata file
METADATA_FILE = FACE_DB_DIR / "metadata.json"
