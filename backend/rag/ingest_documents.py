"""CLI script for ingesting documents into RAG knowledge base."""
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from rag.database import RAGDatabaseService
from rag.embeddings import EmbeddingService
from rag.ingestion import IngestionPipeline


def main():
    """Ingest documents from the documents directory."""
    print("=" * 70)
    print("RAG DOCUMENT INGESTION")
    print("=" * 70)

    # Define paths
    script_dir = Path(__file__).parent
    documents_dir = script_dir / "documents"

    # Check if documents directory exists
    if not documents_dir.exists():
        print(f"\nError: Documents directory not found: {documents_dir}")
        print("Create the directory and add .txt, .md, .pdf, or .docx files.")
        return 1

    # Initialize services
    print("\nInitializing services...")
    try:
        db_service = RAGDatabaseService()
        embedding_service = EmbeddingService()
        pipeline = IngestionPipeline(embedding_service, db_service)
    except Exception as e:
        print(f"\nError initializing services: {e}")
        print("\nPossible issues:")
        print("  - MongoDB connection failed (check AUTH_MONGO_URI in .env)")
        print("  - Embedding model download failed (requires internet connection)")
        return 1

    # Show current document count
    try:
        current_count = db_service.count_documents()
        print(f"\nCurrent chunks in database: {current_count}")
    except Exception as e:
        print(f"\nWarning: Could not count existing documents: {e}")

    # Ask user if they want to clear existing data
    if current_count > 0:
        response = input("\nClear existing data before ingestion? (y/N): ").strip().lower()
        if response == 'y':
            print("Clearing collection...")
            deleted = db_service.clear_collection()
            print(f"Deleted {deleted} chunks")

    # Ingest documents
    print(f"\nScanning for documents in: {documents_dir}")
    result = pipeline.ingest_directory(documents_dir, recursive=True)

    # Display results
    print("\n" + "=" * 70)
    print("INGESTION COMPLETE")
    print("=" * 70)
    print(f"Success: {result.success}")
    print(f"Documents processed: {result.documents_processed}")
    print(f"Chunks created: {result.chunks_created}")
    print(f"Chunks inserted: {result.chunks_inserted}")

    if result.errors:
        print(f"\nErrors ({len(result.errors)}):")
        for error in result.errors:
            print(f"  - {error}")

    # Show final count
    try:
        final_count = db_service.count_documents()
        print(f"\nTotal chunks in database: {final_count}")
    except Exception as e:
        print(f"\nWarning: Could not count final documents: {e}")

    # Cleanup
    db_service.close()

    print("\n" + "=" * 70)
    print("Next steps:")
    print("  1. Verify chunks in MongoDB Atlas (RAG.RAG_collection)")
    print("  2. Ensure vector index 'RAG_vector_index' is created (see VECTOR_INDEX_SETUP.md)")
    print("  3. Start backend: uv run main.py")
    print("  4. Test queries via WebSocket")
    print("=" * 70 + "\n")

    return 0 if result.success else 1


if __name__ == "__main__":
    exit(main())
