"""MongoDB database service with vector search support."""
from typing import List, Optional, Dict, Any
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from config import settings


class DatabaseService:
    """Service for MongoDB operations including vector search."""

    def __init__(self):
        """Initialize database connection."""
        self.settings = settings
        self.client: Optional[MongoClient] = None
        self.db: Optional[Database] = None
        self.collection: Optional[Collection] = None
        self._connect()

    def _connect(self):
        """Establish connection to MongoDB."""
        uri = (self.settings.auth_mongo_uri or "").strip()
        if not uri:
            raise ConnectionError(
                "AUTH_MONGO_URI is not set or is empty. "
                "Add it to .env (see .env.example), e.g. mongodb://localhost:27017 for local dev."
            )
        try:
            self.client = MongoClient(uri)
            self.db = self.client[self.settings.auth_database_name]
            self.collection = self.db[self.settings.auth_collection_name]

            # Test connection
            self.client.admin.command('ping')
            print(f"Connected to MongoDB: {self.settings.auth_database_name}.{self.settings.auth_collection_name}")

        except Exception as e:
            raise ConnectionError(f"Failed to connect to MongoDB: {str(e)}")

    def insert_passenger(self, data: Dict[str, Any]) -> str:
        """Insert a new passenger document.

        Args:
            data: Passenger document data

        Returns:
            Inserted document ID as string

        Raises:
            Exception: If insertion fails
        """
        try:
            result = self.collection.insert_one(data)
            return str(result.inserted_id)
        except Exception as e:
            raise Exception(f"Failed to insert passenger: {str(e)}")

    def find_by_qr_secret(self, qr_secret: str) -> Optional[Dict[str, Any]]:
        """Find a passenger by their QR secret token.

        Args:
            qr_secret: The QR secret UUID string

        Returns:
            Passenger document or None if not found
        """
        try:
            document = self.collection.find_one(
                {"security.qr_secret": qr_secret},
                # Exclude security fields from response
                {"security.qr_secret": 0, "security.face_embedding": 0}
            )
            return document
        except Exception as e:
            raise Exception(f"Failed to query by QR secret: {str(e)}")

    def vector_search(self, embedding: List[float], limit: int = 1) -> List[Dict[str, Any]]:
        """Perform vector similarity search for face matching.

        Args:
            embedding: 512-dimensional face embedding
            limit: Maximum number of results to return

        Returns:
            List of matched documents with similarity scores

        Raises:
            Exception: If vector search fails
        """
        try:
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": self.settings.auth_vector_index_name,
                        "path": "security.face_embedding",
                        "queryVector": embedding,
                        "numCandidates": 50,  # Number of candidates to consider
                        "limit": limit
                    }
                },
                {
                    "$project": {
                        "name": 1,
                        "passenger_id": 1,
                        "ticket_info": 1,
                        "status": 1,
                        "score": {"$meta": "vectorSearchScore"}
                    }
                }
            ]

            results = list(self.collection.aggregate(pipeline))
            return results

        except Exception as e:
            raise Exception(f"Vector search failed: {str(e)}")

    def find_by_passenger_id(self, passenger_id: str) -> Optional[Dict[str, Any]]:
        """Find a passenger by their passenger ID.

        Args:
            passenger_id: The passenger ID

        Returns:
            Passenger document or None if not found
        """
        try:
            document = self.collection.find_one(
                {"passenger_id": passenger_id},
                {"security.qr_secret": 0, "security.face_embedding": 0}
            )
            return document
        except Exception as e:
            raise Exception(f"Failed to query by passenger ID: {str(e)}")

    def update_boarding_status(self, passenger_id: str, boarded: bool = True) -> bool:
        """Update passenger boarding status.

        Args:
            passenger_id: The passenger ID
            boarded: Boarding status

        Returns:
            True if updated successfully, False otherwise
        """
        try:
            result = self.collection.update_one(
                {"passenger_id": passenger_id},
                {"$set": {"status.boarded": boarded}}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Failed to update boarding status: {str(e)}")

    def close(self):
        """Close the database connection."""
        if self.client:
            self.client.close()
            print("MongoDB connection closed")
