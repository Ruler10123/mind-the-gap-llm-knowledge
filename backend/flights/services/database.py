"""MongoDB database service for Flight Management."""
from typing import List, Optional, Dict, Any
from pymongo import MongoClient, ASCENDING
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from config import settings


class DatabaseService:
    """Service for MongoDB flight operations."""

    def __init__(self):
        """Initialize database connection."""
        self.settings = settings
        self.client: Optional[MongoClient] = None
        self.db: Optional[Database] = None
        self.collection: Optional[Collection] = None
        self._connect()
        self._ensure_indexes()

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
            self.db = self.client[self.settings.flights_database_name]
            self.collection = self.db[self.settings.flights_collection_name]

            # Test connection
            self.client.admin.command('ping')
            print(f"Connected to MongoDB: {self.settings.flights_database_name}.{self.settings.flights_collection_name}")

        except Exception as e:
            raise ConnectionError(f"Failed to connect to MongoDB: {str(e)}")

    def _ensure_indexes(self):
        """Create required indexes."""
        try:
            # Unique index on flight_number
            self.collection.create_index(
                [("flight_number", ASCENDING)],
                unique=True,
                name="flight_number_unique"
            )
            print("Flight indexes created/verified")
        except Exception as e:
            print(f"Warning: Could not create indexes: {str(e)}")

    def _serialize_flight(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Convert MongoDB document to API-friendly format.

        Args:
            doc: MongoDB document

        Returns:
            Serialized document with ObjectId as string and datetime as ISO strings
        """
        if not doc:
            return None

        # Convert ObjectId to string
        doc["id"] = str(doc.pop("_id"))

        # Convert datetime objects to ISO strings
        if isinstance(doc.get("departure_time"), datetime):
            doc["departure_time"] = doc["departure_time"].isoformat()
        if isinstance(doc.get("arrival_time"), datetime):
            doc["arrival_time"] = doc["arrival_time"].isoformat()

        return doc

    def create_flight(self, data: Dict[str, Any]) -> str:
        """Insert a new flight document.

        Args:
            data: Flight document data (with datetime objects)

        Returns:
            Inserted document ID as string

        Raises:
            DuplicateKeyError: If flight_number already exists
            Exception: If insertion fails
        """
        try:
            result = self.collection.insert_one(data)
            return str(result.inserted_id)
        except DuplicateKeyError:
            raise DuplicateKeyError(f"Flight number {data.get('flight_number')} already exists")
        except Exception as e:
            raise Exception(f"Failed to insert flight: {str(e)}")

    def get_all_flights(self) -> List[Dict[str, Any]]:
        """Get all flights sorted by departure time.

        Returns:
            List of flight documents
        """
        try:
            flights = list(self.collection.find().sort("departure_time", ASCENDING))
            return [self._serialize_flight(flight) for flight in flights]
        except Exception as e:
            raise Exception(f"Failed to retrieve flights: {str(e)}")

    def get_flight_by_id(self, flight_id: str) -> Optional[Dict[str, Any]]:
        """Find a flight by its ObjectId.

        Args:
            flight_id: The flight ObjectId as string

        Returns:
            Flight document or None if not found

        Raises:
            InvalidId: If flight_id is not a valid ObjectId
        """
        try:
            doc = self.collection.find_one({"_id": ObjectId(flight_id)})
            return self._serialize_flight(doc) if doc else None
        except InvalidId:
            raise InvalidId(f"Invalid flight ID format: {flight_id}")
        except Exception as e:
            raise Exception(f"Failed to query flight by ID: {str(e)}")

    def update_flight(self, flight_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a flight document.

        Args:
            flight_id: The flight ObjectId as string
            update_data: Fields to update

        Returns:
            True if updated successfully, False if not found

        Raises:
            InvalidId: If flight_id is not a valid ObjectId
            DuplicateKeyError: If flight_number update causes duplicate
        """
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(flight_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except InvalidId:
            raise InvalidId(f"Invalid flight ID format: {flight_id}")
        except DuplicateKeyError:
            raise DuplicateKeyError(f"Flight number {update_data.get('flight_number')} already exists")
        except Exception as e:
            raise Exception(f"Failed to update flight: {str(e)}")

    def delete_flight(self, flight_id: str) -> bool:
        """Delete a flight document.

        Args:
            flight_id: The flight ObjectId as string

        Returns:
            True if deleted successfully, False if not found

        Raises:
            InvalidId: If flight_id is not a valid ObjectId
        """
        try:
            result = self.collection.delete_one({"_id": ObjectId(flight_id)})
            return result.deleted_count > 0
        except InvalidId:
            raise InvalidId(f"Invalid flight ID format: {flight_id}")
        except Exception as e:
            raise Exception(f"Failed to delete flight: {str(e)}")

    def close(self):
        """Close the database connection."""
        if self.client:
            self.client.close()
            print("MongoDB connection closed (Flights)")
