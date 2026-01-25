"""MongoDB database service for RAG."""
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from config import settings


class RAGDatabaseService:
    """Service for MongoDB RAG operations."""

    def __init__(self):
        """Initialize database connection."""
        self.settings = settings
        self.client: Optional[MongoClient] = None
        self.db: Optional[Database] = None
        self.collection: Optional[Collection] = None
        self._connect()

    def _connect(self):
        """Establish connection to MongoDB."""
        # Use rag_mongo_uri if set, otherwise fall back to auth_mongo_uri
        uri = (self.settings.rag_mongo_uri or self.settings.auth_mongo_uri or "").strip()
        if not uri:
            raise ConnectionError(
                "Neither RAG_MONGO_URI nor AUTH_MONGO_URI is set. "
                "Add AUTH_MONGO_URI to .env (see .env.example)."
            )
        try:
            self.client = MongoClient(uri)
            self.db = self.client[self.settings.rag_database_name]
            self.collection = self.db[self.settings.rag_collection_name]

            # Test connection
            self.client.admin.command('ping')
            print(f"Connected to MongoDB: {self.settings.rag_database_name}.{self.settings.rag_collection_name}")

        except Exception as e:
            raise ConnectionError(f"Failed to connect to MongoDB: {str(e)}")

    def insert_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """Bulk insert document chunks.

        Args:
            chunks: List of chunk documents to insert

        Returns:
            Number of chunks inserted

        Raises:
            Exception: If insertion fails
        """
        if not chunks:
            return 0

        try:
            result = self.collection.insert_many(chunks, ordered=False)
            return len(result.inserted_ids)
        except Exception as e:
            raise Exception(f"Failed to insert chunks: {str(e)}")

    def vector_search(
        self,
        query_embedding: List[float],
        limit: int = 5,
        category_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Perform vector search using MongoDB Atlas Vector Search.

        Args:
            query_embedding: Query vector (dims must match index, e.g. 768 or 384)
            limit: Maximum number of results
            category_filter: Optional category filter

        Returns:
            List of matching documents with scores

        Raises:
            Exception: If search fails
        """
        try:
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": self.settings.rag_vector_index_name,
                        "path": "embedding",
                        "queryVector": query_embedding,
                        "numCandidates": limit * 10,
                        "limit": limit
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "chunk_id": 1,
                        "content": 1,
                        "source": 1,
                        "category": 1,
                        "metadata": 1,
                        "chunk_index": 1,
                        "score": {"$meta": "vectorSearchScore"}
                    }
                }
            ]

            # Add category filter if specified
            if category_filter:
                pipeline.insert(1, {
                    "$match": {"category": category_filter}
                })

            results = list(self.collection.aggregate(pipeline))
            return results

        except Exception as e:
            raise Exception(f"Vector search failed: {str(e)}")

    def count_documents(self, filter_query: Optional[Dict[str, Any]] = None) -> int:
        """Count documents in collection.

        Args:
            filter_query: Optional filter for counting

        Returns:
            Document count
        """
        try:
            return self.collection.count_documents(filter_query or {})
        except Exception as e:
            raise Exception(f"Failed to count documents: {str(e)}")

    def clear_collection(self) -> int:
        """Delete all documents from collection.

        Returns:
            Number of documents deleted
        """
        try:
            result = self.collection.delete_many({})
            return result.deleted_count
        except Exception as e:
            raise Exception(f"Failed to clear collection: {str(e)}")

    def close(self):
        """Close the database connection."""
        if self.client:
            self.client.close()
            print("MongoDB connection closed (RAG)")
