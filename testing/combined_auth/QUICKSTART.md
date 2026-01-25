# Quick Start Guide

Get the biometric authentication module running in 5 minutes.

## Step 1: Install Dependencies

```bash
cd testing/combined_auth
uv sync
```

## Step 2: Configure MongoDB

1. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

2. **Add your MongoDB URI** to `.env`:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   ```

3. **Verify Vector Index** in MongoDB Atlas:
   - Database: `access_control`
   - Collection: `passengers`
   - Index name: `face_vector_index`
   - Field: `security.face_embedding`
   - Dimensions: 512
   - Similarity: cosine

   **If index doesn't exist**, create it:
   - Go to Atlas → Search → Create Search Index
   - Use JSON Editor:
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

## Step 3: Run the Server

```bash
uv run uvicorn main:app --reload --port 8000
```

Wait for:
- "Connected to MongoDB: access_control.passengers"
- "All services initialized successfully"

## Step 4: Test the System

Open in your browser:
```
http://localhost:8000/static/index.html
```

### Test Flow:

1. **Allow camera access** when prompted

2. **Register a passenger**:
   - Fill in all fields (Name, Passenger ID, Flight, Seat, Group)
   - Click "Capture & Register"
   - Download the QR code

3. **Test Face Authentication**:
   - Click "Capture & Verify Face"
   - Should recognize you with high similarity score

4. **Test QR Authentication**:
   - Switch to "QR Code" tab
   - The QR code contains a UUID - you can extract it or use a QR scanner
   - Paste the token and click "Verify QR Code"

## Troubleshooting

### "No module named 'deepface'"
```bash
uv sync  # Reinstall dependencies
```

### "Failed to connect to MongoDB"
- Check your `MONGO_URI` in `.env`
- Verify IP whitelist in MongoDB Atlas
- Test connection in MongoDB Compass

### "Vector search failed"
- Ensure `face_vector_index` exists in Atlas
- Wait 2-3 minutes after creating the index
- Verify index is on correct collection

### Camera not working
- Use Chrome or Firefox
- Ensure HTTPS or localhost (required for camera access)
- Check browser camera permissions

### "Face could not be detected"
- Ensure good lighting
- Face should be clearly visible and centered
- Only one face in frame
- Remove glasses if detection fails

## API Documentation

Interactive API docs:
```
http://localhost:8000/docs
```

## Next Steps

- See `README.md` for complete documentation
- Check API endpoints at `/docs`
- Integrate into main backend (see README Integration Guide)

## Project Structure

```
testing/combined_auth/
├── main.py              # FastAPI app (START HERE)
├── config/
│   └── settings.py      # Configuration
├── models/
│   ├── schemas.py       # API models
│   └── mongodb.py       # Database schema
├── services/
│   ├── database.py      # MongoDB + vector search
│   ├── face_recognition.py  # DeepFace wrapper
│   └── qr_service.py    # QR generation
├── api/
│   └── routes.py        # Endpoints
└── static/
    └── index.html       # Testing UI
```

## Need Help?

- Check logs in terminal for error details
- Visit MongoDB Atlas for connection issues
- See README.md for detailed troubleshooting
