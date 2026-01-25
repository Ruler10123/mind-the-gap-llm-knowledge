# MongoDB Atlas Vector Search Index Setup

This guide explains how to create the vector search index required for RAG functionality.

## Prerequisites

- MongoDB Atlas account with a deployed cluster
- Database: `RAG` (or value from `AUTH_DATABASE_NAME` in .env)
- Collection: `RAG_collection` (or value from `AUTH_COLLECTION_NAME` in .env)
- Documents ingested into the collection (run `rag/ingest_documents.py` first)

## Step-by-Step Instructions

### 1. Access MongoDB Atlas

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select your cluster
3. Click "Browse Collections"

### 2. Navigate to Search Indexes

1. Click the "Search Indexes" tab (not "Indexes")
2. Click "Create Search Index"
3. Select "JSON Editor" (not the visual editor)

### 3. Configure the Index

**Index Name:** `RAG_vector_index`

**Database:** `RAG` (match your `AUTH_DATABASE_NAME` setting)

**Collection:** `RAG_collection` (match your `AUTH_COLLECTION_NAME` setting)

**Index Definition (JSON):**

Use `numDimensions` that matches your `EMBEDDING_MODEL`:
- **768** — default, `all-mpnet-base-v2`
- **384** — `all-MiniLM-L6-v2` (set `EMBEDDING_MODEL=all-MiniLM-L6-v2` in .env)

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "category"
    },
    {
      "type": "filter",
      "path": "source"
    }
  ]
}
```

### 4. Create and Wait

1. Click "Next" then "Create Search Index"
2. Wait for index status to change from "Building" to "Active"
3. This typically takes 1-5 minutes depending on collection size

## Index Configuration Explained

### Vector Field
- **path**: `embedding` - The field containing the embedding vectors
- **numDimensions**: Must match `EMBEDDING_MODEL` — **768** for `all-mpnet-base-v2` (default), **384** for `all-MiniLM-L6-v2`
- **similarity**: `cosine` - Cosine similarity metric for vector comparisons

### Filter Fields
- **category**: Optional categorical filter (e.g., "policies", "faq", "procedures")
- **source**: Filter by source document filename

## Verification

### Check Index Status

In MongoDB Atlas:
1. Go to "Search Indexes" tab
2. Verify `RAG_vector_index` status is "Active"
3. Note the index size and document count

### Test Vector Search

Run a test query using the MongoDB Atlas UI or via the Python shell:

```python
from rag.database import RAGDatabaseService
from rag.embeddings import EmbeddingService

# Initialize services
db = RAGDatabaseService()
emb = EmbeddingService()

# Generate test query embedding
query_vec = emb.embed_text("What is the baggage policy?")

# Search
results = db.vector_search(query_vec, limit=3)

# Print results
for r in results:
    print(f"Score: {r.get('score', 0):.4f}")
    print(f"Source: {r.get('source', 'unknown')}")
    print(f"Content: {r.get('content', '')[:100]}...")
    print("-" * 50)
```

Expected output: 3 results with similarity scores > 0.5 for relevant matches.

## Troubleshooting

### Index Creation Fails

**Error:** "Field path must exist in collection"
- **Solution:** Ensure documents are ingested before creating the index. Run `ingest_documents.py` first.

**Error:** "Invalid index definition"
- **Solution:** Verify JSON syntax is correct. Copy the exact JSON from above.

### Vector Search Returns Empty Results

**Possible Causes:**
1. **Index not active:** Check status in Atlas UI
2. **No documents:** Verify collection has documents with `embedding` field
3. **Wrong index name:** Ensure `RAG_VECTOR_INDEX_NAME` in .env matches `RAG_vector_index`
4. **Dimension mismatch:** `numDimensions` in the index must equal the embedding model output (768 for all-mpnet-base-v2, 384 for all-MiniLM-L6-v2). Set `EMBEDDING_MODEL` in .env to match your index.

### Vector Search Error

**Error:** "Index not found"
- **Solution:** Verify index name in config matches the created index exactly (case-sensitive)

**Error:** "$vectorSearch is only valid for Atlas"
- **Solution:** Vector search requires MongoDB Atlas, not local MongoDB. Update `AUTH_MONGO_URI` to point to Atlas cluster.

## Index Maintenance

### Rebuilding the Index

If you re-ingest all documents:
1. No need to recreate the index
2. Index automatically updates as documents change
3. Monitor index size in Atlas UI to confirm updates

### Deleting the Index

1. Go to "Search Indexes" tab in Atlas
2. Click "..." next to `RAG_vector_index`
3. Select "Delete Search Index"
4. Confirm deletion

## Configuration Reference

### Environment Variables (.env)

```bash
# MongoDB Connection (Atlas cluster)
AUTH_MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Database and Collection
AUTH_DATABASE_NAME=RAG
AUTH_COLLECTION_NAME=RAG_collection

# Vector Index Name
AUTH_VECTOR_INDEX_NAME=RAG_vector_index
```

### Default Values (config.py)

If not set in .env, these defaults are used:
- `rag_database_name`: `"RAG"`
- `rag_collection_name`: `"RAG_collection"`
- `rag_vector_index_name`: `"RAG_vector_index"`

## Next Steps

After creating the index:

1. **Verify Index:** Check status is "Active" in Atlas UI
2. **Test Retrieval:** Run test query (see Verification section)
3. **Start Backend:** `uv run main.py`
4. **Test Agent:** Send queries via WebSocket
5. **Monitor Performance:** Check query latency and result quality

## Additional Resources

- [MongoDB Atlas Vector Search Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/)
- [Atlas Search Index Management](https://www.mongodb.com/docs/atlas/atlas-search/manage-indexes/)
- [Vector Search Tutorial](https://www.mongodb.com/docs/atlas/atlas-vector-search/tutorials/)
