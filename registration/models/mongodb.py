"""MongoDB document schema constants and utilities."""
from typing import List, TypedDict


class SecurityData(TypedDict):
    """Security-related data structure."""
    qr_secret: str  # UUID4 string
    face_embedding: List[float]  # 512-dimensional vector


class TicketInfoData(TypedDict):
    """Flight ticket information structure."""
    flight_number: str
    seat: str
    group: str


class StatusData(TypedDict):
    """Passenger status structure."""
    boarded: bool


class PassengerDocument(TypedDict):
    """Complete passenger document structure for MongoDB.

    Example:
    {
        "name": "John Doe",
        "passenger_id": "ABC123",
        "ticket_info": {
            "flight_number": "AA100",
            "seat": "12A",
            "group": "Group 2"
        },
        "security": {
            "qr_secret": "550e8400-e29b-41d4-a716-446655440000",
            "face_embedding": [0.1, 0.2, ..., 0.512]  # 512 floats
        },
        "status": {
            "boarded": false
        }
    }
    """
    name: str
    passenger_id: str
    ticket_info: TicketInfoData
    security: SecurityData
    status: StatusData


# MongoDB collection indexes
REQUIRED_INDEXES = [
    {"key": "passenger_id", "unique": True},
    {"key": "security.qr_secret", "unique": True},
]

# Vector search index configuration (must be created in MongoDB Atlas)
VECTOR_INDEX_CONFIG = {
    "name": "face_vector_index",
    "type": "vectorSearch",
    "definition": {
        "fields": [
            {
                "type": "vector",
                "path": "security.face_embedding",
                "numDimensions": 512,
                "similarity": "cosine"
            }
        ]
    }
}
