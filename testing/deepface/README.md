# Face Recognition Access System

A functional face recognition prototype using DeepFace (Facenet512 model), FastAPI, and vanilla HTML/JS frontend.

## Features

- **Live Face Recognition**: Real-time face recognition via webcam with auto-recognition mode
- **Face Registration**: Register new faces from webcam capture or file upload
- **User Management**: View all registered users with thumbnails and delete functionality
- **High Accuracy**: Uses Facenet512 model for robust face recognition
- **Fast Performance**: Model pre-loading at startup for low-latency recognition

## Tech Stack

- **Backend**: FastAPI + Python 3.13
- **Face Recognition**: DeepFace + tf-keras
- **Frontend**: Vanilla HTML/JavaScript
- **Package Manager**: uv
- **Storage**: Local file system

## Installation

All dependencies are already installed. The project uses uv for package management.

## Usage

### Start the Server

```bash
cd testing/deepface
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The server will take 10-20 seconds to start as it loads the face recognition models.

### Access the Application

Open your browser to: http://127.0.0.1:8000

### Using the System

#### 1. Live Recognition

1. Click "Start Camera" to activate your webcam
2. Enable "Auto-recognize" to automatically detect faces every 2 seconds
3. Registered faces will show with a green overlay and name
4. Unknown faces will show with a red overlay and "Unknown" label

#### 2. Register a New Face

**Option A: From Webcam**
1. Start the camera
2. Enter the person's name in the "Full Name" field
3. Click "Capture & Register Current Face"
4. The current frame will be captured and registered

**Option B: From File**
1. Enter the person's name
2. Click "Choose File" and select an image
3. Click "Register from File"

**Requirements:**
- Image must contain exactly ONE face
- Supported formats: JPG, JPEG, PNG

#### 3. Manage Users

- View all registered users in the "Registered Users" section
- Click "Delete" to remove a user
- Click "Refresh List" to update the user list

## API Documentation

Access the auto-generated API docs at:
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

### Endpoints

- `POST /api/recognize` - Recognize face in uploaded image
- `POST /api/register` - Register new face with name
- `GET /api/faces` - List all registered faces
- `DELETE /api/faces/{user_id}` - Delete a registered face
- `GET /api/thumbnail/{user_id}` - Get face thumbnail
- `GET /api/health` - Health check

## Configuration

Edit `config.py` to adjust settings:

- `RECOGNITION_THRESHOLD`: Face matching threshold (default: 0.4)
- `DEEPFACE_MODEL`: Face recognition model (default: "Facenet512")
- `DEEPFACE_DETECTOR`: Face detector backend (default: "opencv")
- `MAX_IMAGE_SIZE`: Maximum image dimensions
- `HOST` and `PORT`: Server settings

## Project Structure

```
testing/deepface/
├── config.py              # Configuration settings
├── service.py             # Face recognition service (DeepFace)
├── models.py              # Pydantic request/response models
├── utils.py               # Image processing utilities
├── main.py                # FastAPI application
├── face_db/               # User face images storage
├── temp/                  # Temporary upload storage
└── static/
    └── index.html        # Frontend UI
```

## How It Works

1. **Model Loading**: On startup, DeepFace models are pre-loaded into memory for fast recognition
2. **Registration**: User faces are saved to `face_db/{user_id}/face.jpg` with metadata
3. **Recognition**: DeepFace compares input face against all registered faces using cosine distance
4. **Caching**: DeepFace automatically creates embedding cache for faster lookups

## Limitations

- Only detects one face per image (will error on multiple faces)
- No liveness detection (can be fooled by photos)
- File-based storage (best for ~100 users)
- No authentication (anyone can register/delete)
- Synchronous processing (recognition blocks request)

## Troubleshooting

### Models not loading
- First startup downloads models (~100MB), which takes time
- Check internet connection if models fail to download

### Camera not working
- Grant camera permissions in your browser
- Check if another application is using the camera
- Try refreshing the page

### Recognition not accurate
- Adjust `RECOGNITION_THRESHOLD` in `config.py` (lower = stricter)
- Ensure good lighting when registering faces
- Use clear, front-facing images

### Server errors
- Check console output for detailed error messages
- Verify all dependencies are installed: `uv sync`
- Ensure Python 3.13+ is installed

## License

This is a prototype/demo project for TAMUHack26.
