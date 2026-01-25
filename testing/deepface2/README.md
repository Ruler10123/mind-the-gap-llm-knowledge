# Simple Face Recognition Demo

A minimal face recognition demo that captures photos from your webcam and either registers new people or checks their identity against previously registered faces.

## Features

- **Capture Photos**: Use your webcam to take photos
- **Register Mode**: Save a photo with a person's name
- **Check ID Mode**: Compare captured photo against all registered faces
- **Simple Storage**: All photos saved directly to the `faces/` folder
- **No Complex API**: Just Flask with 3 simple endpoints

## Installation

Dependencies are already installed via uv.

## Usage

### 1. Start the Server

```bash
cd testing/deepface2
uv run python app.py
```

First startup takes 10-20 seconds to load the face recognition models.

### 2. Open in Browser

Navigate to: http://127.0.0.1:5000

### 3. Use the System

1. **Start Camera**: Click "Start Camera" and grant permissions
2. **Register Someone**:
   - Enter their name in the text field
   - Click "Capture & Register"
   - Photo is saved to `faces/` folder
3. **Check ID**:
   - Click "Capture & Recognize"
   - System will compare against all registered faces
   - Shows match with confidence or "Unknown person"

## How It Works

- Photos are saved as `{name}_{timestamp}.jpg` in the `faces/` folder
- Face recognition uses DeepFace with Facenet512 model
- Cosine distance threshold: 0.4 (adjust in `app.py` if needed)
- Each capture validates that exactly one face is present

## File Structure

```
testing/deepface2/
├── app.py                 # Flask application (simple!)
├── templates/
│   └── index.html        # Web interface
└── faces/                # Stored face photos
    └── .gitkeep
```

## Troubleshooting

- **Camera not working**: Grant browser permissions, refresh page
- **Models not loading**: First run downloads ~100MB of models
- **No face detected**: Ensure your face is clearly visible and well-lit
- **Multiple faces error**: Make sure only one person is in frame

## Differences from deepface/

This simplified version:
- No FastAPI, just Flask
- No complex API structure
- No user management features
- Photos stored directly in folder (no subdirectories)
- Simpler UI with just two modes
- No thumbnail generation
- No metadata JSON file