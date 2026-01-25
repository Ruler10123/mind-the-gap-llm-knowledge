# Face Recognition Prototype

A minimal face recognition system using FastAPI, DeepFace (Facenet512 model), and a filesystem-based database.

## Features

- **Face Registration**: Capture and register faces with name and ID
- **Face Recognition**: Identify registered users in real-time
- **Webcam Interface**: Browser-based UI with live video feed
- **No Database**: Simple filesystem storage structure

## Setup

### Prerequisites
- Python >=3.10, <3.11
- uv package manager
- Webcam access

### Installation

```bash
cd testing/deepface4
uv sync
```

## Running the Application

Start the FastAPI server:

```bash
uv run uvicorn main:app --reload --port 8000
```

Or run directly:

```bash
uv run python main.py
```

Then open your browser to: http://localhost:8000/static/index.html

## Usage

### 1. Start Camera
- Click "Start Camera" button
- Grant camera permissions when prompted

### 2. Register a New User
- Enter name (e.g., "John Smith")
- Enter unique ID (e.g., "1001")
- Click "Capture & Register"
- Face will be saved to `face_db/john_smith_1001/capture.jpg`

### 3. Recognize Face
- Position your face in the camera view
- Click "Scan Face"
- System will display recognized name/ID or "Unknown"

## Project Structure

```
testing/deepface4/
├── main.py                 # FastAPI backend
├── pyproject.toml          # Dependencies
├── README.md               # This file
├── static/
│   └── index.html          # Frontend interface
└── face_db/                # Created at runtime
    └── {name}_{id}/        # User folders
        └── capture.jpg     # Stored face images
```

## How It Works

### Backend (`main.py`)

**Endpoints:**
- `POST /register` - Register new face with name and ID
- `POST /recognize` - Identify face from uploaded image

**Recognition Process:**
1. DeepFace.find() searches `face_db/` using Facenet512 model
2. Returns best match with cosine distance
3. Distance threshold: 0.6 (lower = better match)
4. Folder naming: `{name}_{id}/capture.jpg`

**Cache Management:**
- DeepFace creates `.pkl` cache files for faster searches
- Cache deleted on each registration to include new faces

### Frontend (`static/index.html`)

**Features:**
- MediaDevices API for webcam access
- Canvas API for frame capture
- Fetch API for backend communication
- Responsive design with clean UI

## Configuration

Edit `main.py` to adjust:

```python
DISTANCE_THRESHOLD = 0.6  # Recognition confidence (0.0-1.0)
```

Lower threshold = stricter matching
Higher threshold = more lenient matching

## Troubleshooting

**Camera not working:**
- Ensure browser has camera permissions
- Use HTTPS or localhost (required for camera access)

**Recognition fails:**
- Check lighting conditions
- Ensure face is clearly visible
- Try registering with better quality image

**Model download:**
- First run will download Facenet512 model (~100MB)
- Stored in `~/.deepface/weights/`

## Technical Details

- **Model**: Facenet512 (high accuracy, balanced speed)
- **Distance Metric**: Cosine similarity
- **Detection**: Face detection not enforced (more lenient)
- **Image Format**: JPEG via canvas capture

## Dependencies

- fastapi - Web framework
- uvicorn - ASGI server
- deepface - Face recognition library
- python-multipart - File upload handling
- pillow - Image processing
