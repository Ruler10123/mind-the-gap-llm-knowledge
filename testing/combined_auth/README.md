# Biometric & QR Authentication Module

Self-contained FastAPI module for smart kiosk authentication using facial recognition (DeepFace/Facenet512) and QR codes, backed by MongoDB Atlas vector search.

## Features

- **Facial Recognition**: Uses DeepFace with Facenet512 for 512-dimensional embeddings
- **QR Code Generation**: Automatic QR code generation for each passenger
- **Vector Search**: MongoDB Atlas vector search for fast face matching
- **Dual Authentication**: Support for both face and QR code verification
- **Testing Frontend**: Complete web interface with camera access

## Prerequisites

- **Python**: 3.13 (specified in `.python-version`)
- **uv**: Python package manager ([installation guide](https://github.com/astral-sh/uv))
- **MongoDB Atlas**: Account with a configured cluster

## MongoDB Atlas Setup

### 1. Create Database and Collection

In MongoDB Atlas, create:
- Database: `access_control`
- Collection: `passengers`

### 2. Create Vector Search Index

**CRITICAL**: Create a vector search index named `face_vector_index` on the `passengers` collection:

1. Go to Atlas → Your Cluster → Search
2. Click "Create Search Index"
3. Choose "JSON Editor"
4. Use this configuration:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "security.face_embedding",
      "numDimensions": 512,
      "similarity": "cosine"
    }
  ]
}
```

5. Name the index: `face_vector_index`

### 3. Get Connection String

1. Go to Atlas → Database → Connect
2. Choose "Connect your application"
3. Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/...`)

## Installation

### 1. Clone and Navigate

```bash
cd testing/combined_auth
```

### 2. Install Dependencies

```bash
uv sync
```

This will install all required packages:
- FastAPI & Uvicorn
- DeepFace & TF-Keras
- PyMongo
- QRCode & Pillow
- Pydantic Settings

### 3. Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB connection string:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

Optional configuration:
```env
SIMILARITY_THRESHOLD=0.6  # Face match threshold (0.0-1.0)
DATABASE_NAME=access_control
COLLECTION_NAME=passengers
```

## Running the Server

### Development Mode

```bash
uv run uvicorn main:app --reload --port 8000
```

### Production Mode

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Usage

### Access Points

- **Testing Frontend**: http://localhost:8000/static/index.html
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Testing Frontend

1. Open http://localhost:8000/static/index.html
2. Camera will auto-start (allow permissions)

#### Registration Flow

1. Fill in passenger details:
   - Name
   - Passenger ID
   - Flight Number
   - Seat
   - Boarding Group
2. Click "Capture & Register"
3. Download the generated QR code

#### Face Authentication

1. Switch to "Authentication" panel
2. Click "Capture & Verify Face"
3. System will match your face and display flight information

#### QR Authentication

1. Switch to "QR Code" tab in Authentication panel
2. Paste QR token (UUID from QR code)
3. Click "Verify QR Code"

## API Endpoints

### POST /api/register

Register a new passenger with face biometric.

**Request**: Multipart form data
- `file`: Photo file (JPEG/PNG)
- `name`: Passenger name
- `passenger_id`: Unique ID
- `flight_number`: Flight number
- `seat`: Seat assignment
- `group`: Boarding group

**Response**: QR code PNG image (download)

**Example**:
```bash
curl -X POST "http://localhost:8000/api/register" \
  -F "file=@photo.jpg" \
  -F "name=John Doe" \
  -F "passenger_id=ABC123" \
  -F "flight_number=AA100" \
  -F "seat=12A" \
  -F "group=Group 2" \
  --output qr_code.png
```

### POST /api/auth/face

Authenticate using facial recognition.

**Request**: Multipart form data
- `file`: Live photo file

**Response**: JSON
```json
{
  "status": "success",
  "user": {
    "name": "John Doe",
    "passenger_id": "ABC123",
    "ticket_info": {
      "flight_number": "AA100",
      "seat": "12A",
      "group": "Group 2"
    },
    "status": {
      "boarded": false
    }
  },
  "message": "Face recognized successfully (score: 0.892)",
  "similarity_score": 0.892
}
```

### POST /api/auth/qr

Authenticate using QR code.

**Request**: JSON
```json
{
  "qr_token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**: JSON (same structure as face auth)

## Architecture

```
testing/combined_auth/
├── config/
│   └── settings.py         # Configuration management
├── models/
│   ├── schemas.py          # Pydantic models
│   └── mongodb.py          # MongoDB document schema
├── services/
│   ├── database.py         # MongoDB operations
│   ├── face_recognition.py # DeepFace wrapper
│   └── qr_service.py       # QR generation
├── api/
│   └── routes.py           # API endpoints
├── static/
│   └── index.html          # Testing frontend
├── main.py                 # FastAPI app
└── pyproject.toml          # Dependencies
```

## Configuration Options

### Face Recognition Settings

- `SIMILARITY_THRESHOLD`: Minimum cosine similarity for face match (default: 0.6)
  - Higher values = more strict matching
  - Recommended range: 0.5 - 0.7

### Model Information

- **Model**: Facenet512
- **Embedding Size**: 512 dimensions
- **Similarity Metric**: Cosine similarity
- **Detector**: OpenCV

## Troubleshooting

### Camera Not Working

- Ensure browser has camera permissions
- Use HTTPS or localhost (camera access restriction)
- Check if camera is already in use by another app

### Face Not Detected

- Ensure good lighting
- Face should be clearly visible and centered
- Remove glasses or obstructions if possible
- Only one face should be in the frame

### MongoDB Connection Issues

- Verify `MONGO_URI` in `.env`
- Check network connectivity to Atlas
- Ensure IP address is whitelisted in Atlas
- Verify username/password are correct

### Vector Search Fails

- Ensure `face_vector_index` is created in Atlas
- Index must be on `security.face_embedding` field
- Verify 512 dimensions and cosine similarity
- Wait a few minutes after index creation

### Python Version Issues

If TensorFlow doesn't support Python 3.13:
1. Use Python 3.11 or 3.12
2. Update `.python-version` file
3. Reinstall dependencies: `uv sync`

## Performance Notes

### First Run

- DeepFace downloads Facenet512 model (~100MB) on first use
- Subsequent runs use cached model
- First embedding extraction takes 2-5 seconds

### Typical Performance

- Registration: 2-3 seconds
- Face authentication: 1-2 seconds
- QR authentication: <100ms

## Security Considerations

### Development vs Production

This module is configured for development with:
- CORS: Allow all origins (`*`)
- Static file serving enabled

**For production**:
1. Configure specific CORS origins
2. Use HTTPS
3. Add rate limiting
4. Implement authentication for API
5. Add request validation
6. Use environment-specific settings

### Data Privacy

- Face embeddings are stored (not raw images)
- QR secrets are UUIDs (not predictable)
- Security fields excluded from API responses

## Integration Guide

To integrate into main backend:

1. **Copy Services**:
   ```bash
   cp -r services/ ../backend/src/
   cp -r models/ ../backend/src/
   ```

2. **Merge Configuration**:
   - Add MongoDB settings to main config
   - Import `get_settings()` in main app

3. **Include Router**:
   ```python
   from api.routes import router as auth_router
   app.include_router(auth_router, prefix="/auth")
   ```

4. **Add Dependencies**:
   - Update main `pyproject.toml`
   - Run `uv sync`

5. **Frontend Integration** (optional):
   - Migrate to React components
   - Use TanStack Query for API calls

## Testing Checklist

- [ ] Register new passenger
- [ ] Verify QR code downloads
- [ ] Check MongoDB document created
- [ ] Authenticate with same face (success)
- [ ] Authenticate with different face (failure)
- [ ] Authenticate with QR code (success)
- [ ] Try invalid QR code (failure)
- [ ] Test with no face in photo (error)
- [ ] Test with multiple faces (error)

## License

Part of TAMUHack26 project.
