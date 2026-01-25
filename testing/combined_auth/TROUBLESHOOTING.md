# Troubleshooting Guide

## Issue: Getting 0% Similarity Scores

If you're getting 0% similarity scores even when using the same face, follow these steps:

### Step 1: Run Diagnostics

```bash
cd testing/combined_auth
uv run python diagnose.py
```

This will check:
- ✓ Vector search index exists and is READY
- ✓ Embeddings are properly stored (512 dimensions)
- ✓ Vector search returns high scores for identical embeddings

### Step 2: Check Vector Index Status

The diagnostics script will tell you if `face_vector_index` exists.

**If index doesn't exist**:
1. Go to MongoDB Atlas → Your Cluster → Search
2. Click "Create Search Index"
3. Choose "JSON Editor"
4. Use this exact configuration:

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

5. Name it exactly: `face_vector_index`
6. Wait 2-5 minutes for index to become READY

**If index status is not "READY"**:
- Wait a few more minutes
- Refresh the Atlas page
- Index must be READY before it will work

### Step 3: Clear and Re-register

After fixing the vector index:

1. **Delete existing passengers**:
   ```bash
   # In MongoDB Atlas or Compass
   # Delete all documents from access_control.users collection
   ```

2. **Restart the server**:
   ```bash
   uv run uvicorn main:app --reload --port 8000
   ```

3. **Register again** with the camera
4. **Wait 10 seconds** after registration before testing
5. **Test authentication**

### Step 4: Check Server Logs

When you register and authenticate, check the terminal for debug output:

**Registration should show**:
```
Extracted embedding: norm=X.XXXX, first 5 values: [...]
Registration: Extracted embedding for ABC123, embedding length: 512
```

**Authentication should show**:
```
Extracted embedding: norm=X.XXXX, first 5 values: [...]
Vector search returned 1 results
Top match: John Doe - Score: 0.XXX
Checking similarity: 0.XXX vs threshold 0.6
```

### Step 5: Test with Debug Endpoint

Use the debug endpoint to see raw search results:

```bash
curl -X POST "http://localhost:8000/api/debug/test-search" \
  -F "file=@test_photo.jpg"
```

This will show:
- Embedding details
- All matching results with scores
- Raw similarity scores

### Step 6: Verify Normalization

The embeddings should be normalized (L2 norm ≈ 1.0).

Run diagnostics and check:
```
L2 norm: 1.0000
```

If norm is not close to 1.0, embeddings aren't normalized properly.

## Common Issues and Solutions

### Issue: Index status is "PENDING"

**Solution**: Wait 2-5 minutes. Atlas needs time to build the index.

### Issue: Index doesn't exist

**Solution**: Create it manually in Atlas (see Step 2 above).

### Issue: Scores are low but not zero (e.g., 0.3-0.5)

**Possible causes**:
1. Poor lighting in photos
2. Face at different angles
3. Face detection cropping differently

**Solutions**:
- Use consistent lighting
- Look directly at camera
- Keep face centered
- Don't move between registration and authentication

### Issue: "Vector search failed" error

**Solution**:
1. Check index name is exactly `face_vector_index`
2. Verify index is on `security.face_embedding` field
3. Confirm 512 dimensions
4. Ensure similarity is "cosine"

### Issue: Different scores each time for same face

**Causes**:
- Face detection crops slightly differently each time
- Lighting changes
- Face angle changes

**Solutions**:
- This is normal - expect 0.7-0.95 for same person
- Adjust `SIMILARITY_THRESHOLD` in `.env` if needed:
  ```env
  SIMILARITY_THRESHOLD=0.65  # Lower = more lenient
  ```

### Issue: RetinaFace not available

**Not a problem**: System will fall back to OpenCV automatically.

**To install RetinaFace for better accuracy**:
```bash
uv pip install retina-face
```

## Debug Endpoints

### List registered passengers
```bash
curl http://localhost:8000/api/debug/users
```

### Test vector search with a photo
```bash
curl -X POST "http://localhost:8000/api/debug/test-search" \
  -F "file=@photo.jpg"
```

## Expected Similarity Scores

- **Same person, same conditions**: 0.85-0.99
- **Same person, different conditions**: 0.65-0.85
- **Different people**: 0.0-0.6
- **Default threshold**: 0.6

## Adjusting Threshold

Edit `.env`:
```env
# Stricter matching (fewer false positives)
SIMILARITY_THRESHOLD=0.75

# More lenient (fewer false negatives)
SIMILARITY_THRESHOLD=0.55
```

Restart server after changing.

## MongoDB Atlas Checklist

- [ ] Database name: `access_control`
- [ ] Collection name: `users`
- [ ] Vector index name: `face_vector_index`
- [ ] Index path: `security.face_embedding`
- [ ] Index dimensions: 512
- [ ] Index similarity: cosine
- [ ] Index status: READY
- [ ] IP address whitelisted (or allow from anywhere)

## Still Having Issues?

1. **Check MongoDB Atlas connection**:
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `"database": "connected"`

2. **Verify dependencies installed**:
   ```bash
   uv sync
   ```

3. **Check Python version**:
   ```bash
   python --version  # Should be 3.13 or 3.11-3.12
   ```

4. **Delete `.venv` and reinstall**:
   ```bash
   rm -rf .venv
   uv sync
   ```

5. **Check server logs** for detailed error messages

6. **Run diagnostics again**:
   ```bash
   uv run python diagnose.py
   ```

## Contact

If still experiencing issues after following this guide, provide:
- Output of `diagnose.py`
- Server logs during registration and authentication
- Screenshot of MongoDB Atlas vector index configuration
