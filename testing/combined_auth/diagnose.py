"""Diagnostic script to verify MongoDB vector index and test embeddings."""
import sys
from config.settings import get_settings
from services.database import DatabaseService
from services.face_recognition import FaceRecognitionService
import numpy as np


def check_vector_index(db_service: DatabaseService):
    """Check if vector search index exists."""
    print("\n=== Checking Vector Search Index ===")
    try:
        indexes = list(db_service.collection.list_search_indexes())
        print(f"Found {len(indexes)} search indexes:")

        for idx in indexes:
            print(f"\nIndex: {idx.get('name')}")
            print(f"  Type: {idx.get('type')}")
            print(f"  Status: {idx.get('status')}")

            if 'latestDefinition' in idx:
                defn = idx['latestDefinition']
                print(f"  Definition: {defn}")

        # Check for our specific index
        our_index = next((i for i in indexes if i.get('name') == 'face_vector_index'), None)

        if our_index:
            print("\n✓ face_vector_index found!")
            if our_index.get('status') != 'READY':
                print(f"⚠ Warning: Index status is {our_index.get('status')}, not READY")
        else:
            print("\n✗ face_vector_index NOT found!")
            print("You need to create this index in MongoDB Atlas.")

    except Exception as e:
        print(f"Error checking indexes: {str(e)}")


def check_stored_embeddings(db_service: DatabaseService):
    """Check stored embeddings in database."""
    print("\n=== Checking Stored Embeddings ===")
    try:
        # Get one passenger with embedding
        passenger = db_service.collection.find_one(
            {"security.face_embedding": {"$exists": True}},
            {"name": 1, "passenger_id": 1, "security.face_embedding": 1}
        )

        if not passenger:
            print("No passengers with embeddings found in database")
            return

        print(f"Passenger: {passenger.get('name')} ({passenger.get('passenger_id')})")

        embedding = passenger.get('security', {}).get('face_embedding', [])
        if embedding:
            arr = np.array(embedding)
            print(f"  Embedding length: {len(embedding)}")
            print(f"  Embedding type: {type(embedding[0])}")
            print(f"  First 5 values: {embedding[:5]}")
            print(f"  L2 norm: {np.linalg.norm(arr):.4f}")
            print(f"  Min value: {np.min(arr):.4f}")
            print(f"  Max value: {np.max(arr):.4f}")
            print(f"  Mean value: {np.mean(arr):.4f}")
        else:
            print("  No embedding found!")

    except Exception as e:
        print(f"Error checking embeddings: {str(e)}")


def test_vector_search(db_service: DatabaseService):
    """Test vector search with a known embedding."""
    print("\n=== Testing Vector Search ===")
    try:
        # Get a passenger's embedding
        passenger = db_service.collection.find_one(
            {"security.face_embedding": {"$exists": True}},
            {"name": 1, "passenger_id": 1, "security.face_embedding": 1}
        )

        if not passenger:
            print("No passengers to test with")
            return

        print(f"Testing with: {passenger.get('name')} ({passenger.get('passenger_id')})")

        embedding = passenger.get('security', {}).get('face_embedding', [])

        # Search with the same embedding (should get perfect match)
        results = db_service.vector_search(embedding, limit=3)

        print(f"Search returned {len(results)} results:")
        for i, result in enumerate(results, 1):
            print(f"  {i}. {result.get('name')} - Score: {result.get('score', 0.0):.4f}")

        if results and results[0].get('score', 0) > 0.99:
            print("✓ Vector search working correctly (perfect match found)")
        elif results:
            print(f"⚠ Warning: Best match score is only {results[0].get('score', 0):.4f}")
            print("  Expected ~1.0 for identical embedding")
        else:
            print("✗ No results returned from vector search!")

    except Exception as e:
        print(f"Error testing vector search: {str(e)}")
        import traceback
        traceback.print_exc()


def main():
    """Run all diagnostics."""
    print("=== MongoDB Vector Search Diagnostics ===")

    try:
        settings = get_settings()
        print(f"Database: {settings.DATABASE_NAME}")
        print(f"Collection: {settings.COLLECTION_NAME}")
        print(f"Similarity Threshold: {settings.SIMILARITY_THRESHOLD}")

        # Connect to database
        db_service = DatabaseService()

        # Check passenger count
        count = db_service.collection.count_documents({})
        print(f"Total passengers in database: {count}")

        if count == 0:
            print("\nℹ No passengers registered yet. Register one first, then run diagnostics.")
            return

        # Run checks
        check_vector_index(db_service)
        check_stored_embeddings(db_service)
        test_vector_search(db_service)

        print("\n=== Diagnostic Summary ===")
        print("1. Check if 'face_vector_index' exists and is READY")
        print("2. Verify embeddings are 512 dimensions")
        print("3. Vector search should return high scores (>0.99) for identical embeddings")

        db_service.close()

    except Exception as e:
        print(f"\nError running diagnostics: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
