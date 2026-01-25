import os
import glob
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
import shutil

app = FastAPI()

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
FACE_DB_PATH = "face_db"
TEMP_RECOGNIZE_FILE = "temp_recognize.jpg"
DISTANCE_THRESHOLD = 0.6

def ensure_face_db_exists():
    """Create face_db directory if it doesn't exist"""
    Path(FACE_DB_PATH).mkdir(exist_ok=True)

def delete_pkl_files():
    """Remove all .pkl files in face_db to force DeepFace cache refresh"""
    pkl_files = glob.glob(os.path.join(FACE_DB_PATH, "**", "*.pkl"), recursive=True)
    for pkl_file in pkl_files:
        try:
            os.remove(pkl_file)
        except Exception as e:
            print(f"Error deleting {pkl_file}: {e}")

def parse_folder_name(path: str) -> dict:
    """
    Extract name and ID from match path
    Input: face_db/john_doe_8821/capture.jpg
    Output: {"name": "john_doe", "id": "8821"}
    """
    folder_path = os.path.dirname(path)
    folder_name = os.path.basename(folder_path)

    # Split by last underscore to separate ID
    parts = folder_name.rsplit('_', 1)
    if len(parts) == 2:
        return {"name": parts[0], "id": parts[1]}
    else:
        # If format doesn't match, return the whole name
        return {"name": folder_name, "id": "unknown"}

@app.on_event("startup")
async def startup_event():
    """Initialize face_db directory on startup"""
    ensure_face_db_exists()
    # Create static directory if it doesn't exist
    Path("static").mkdir(exist_ok=True)

@app.post("/register")
async def register(
    file: UploadFile = File(...),
    name: str = Form(...),
    user_id: str = Form(...)
):
    """
    Register a new face in the database

    Args:
        file: Image file containing the face to register
        name: User's name
        user_id: Unique user identifier

    Returns:
        Success message with folder path
    """
    # Validate inputs
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    if not user_id or not user_id.strip():
        raise HTTPException(status_code=400, detail="User ID cannot be empty")

    # Create folder name
    folder_name = f"{name.strip()}_{user_id.strip()}"
    folder_path = os.path.join(FACE_DB_PATH, folder_name)

    # Create directory
    Path(folder_path).mkdir(parents=True, exist_ok=True)

    # Save uploaded file
    file_path = os.path.join(folder_path, "capture.jpg")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Delete all .pkl files to force cache refresh
    delete_pkl_files()

    return {
        "status": "success",
        "message": f"User registered successfully",
        "folder": folder_path,
        "name": name.strip(),
        "id": user_id.strip()
    }

@app.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    """
    Recognize a face from uploaded image

    Args:
        file: Image file containing the face to recognize

    Returns:
        Recognition result with name, ID, and distance
    """
    try:
        # Save uploaded file to temp location
        with open(TEMP_RECOGNIZE_FILE, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Try to find matching face
        try:
            results = DeepFace.find(
                img_path=TEMP_RECOGNIZE_FILE,
                db_path=FACE_DB_PATH,
                model_name="Facenet512",
                enforce_detection=False
            )

            # Check if results are empty
            if not results or len(results) == 0 or results[0].empty:
                return {
                    "status": "unknown",
                    "name": None,
                    "id": None,
                    "message": "No matching face found"
                }

            # Get the top match
            top_match = results[0].iloc[0]
            distance = top_match.get('distance', top_match.get('Facenet512_cosine', 1.0))

            # Check distance threshold
            if distance > DISTANCE_THRESHOLD:
                return {
                    "status": "unknown",
                    "name": None,
                    "id": None,
                    "distance": float(distance),
                    "message": "Face detected but no confident match"
                }

            # Parse folder name to extract user info
            match_path = top_match['identity']
            user_info = parse_folder_name(match_path)

            return {
                "status": "recognized",
                "name": user_info["name"],
                "id": user_info["id"],
                "distance": float(distance)
            }

        except Exception as e:
            print(f"DeepFace error: {e}")
            return {
                "status": "unknown",
                "name": None,
                "id": None,
                "message": "Error during face recognition"
            }

    finally:
        # Clean up temp file
        if os.path.exists(TEMP_RECOGNIZE_FILE):
            try:
                os.remove(TEMP_RECOGNIZE_FILE)
            except Exception as e:
                print(f"Error deleting temp file: {e}")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
