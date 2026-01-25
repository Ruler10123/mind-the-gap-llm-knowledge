"""Document ingestion pipeline for RAG."""
import os
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    UnstructuredWordDocumentLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import settings
from rag.schemas import DocumentChunk, IngestionResult
from rag.embeddings import EmbeddingService
from rag.database import RAGDatabaseService


class IngestionPipeline:
    """Pipeline for processing and ingesting documents."""

    def __init__(self, embedding_service: EmbeddingService, database_service: RAGDatabaseService):
        """Initialize ingestion pipeline.

        Args:
            embedding_service: Service for generating embeddings
            database_service: Service for database operations
        """
        self.embedding_service = embedding_service
        self.database_service = database_service
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.rag_chunk_size,
            chunk_overlap=settings.rag_chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
            length_function=len
        )

    def load_document(self, file_path: Path) -> str:
        """Load document from file.

        Args:
            file_path: Path to document file

        Returns:
            Document text content

        Raises:
            ValueError: If file format is unsupported
            Exception: If loading fails
        """
        suffix = file_path.suffix.lower()

        try:
            if suffix in ['.txt', '.md']:
                loader = TextLoader(str(file_path), encoding='utf-8')
                documents = loader.load()
                return "\n\n".join([doc.page_content for doc in documents])

            elif suffix == '.pdf':
                loader = PyPDFLoader(str(file_path))
                documents = loader.load()
                return "\n\n".join([doc.page_content for doc in documents])

            elif suffix in ['.doc', '.docx']:
                loader = UnstructuredWordDocumentLoader(str(file_path))
                documents = loader.load()
                return "\n\n".join([doc.page_content for doc in documents])

            else:
                raise ValueError(f"Unsupported file format: {suffix}")

        except Exception as e:
            raise Exception(f"Failed to load {file_path.name}: {str(e)}")

    def chunk_text(self, text: str) -> List[str]:
        """Split text into chunks.

        Args:
            text: Text to split

        Returns:
            List of text chunks
        """
        if not text or not text.strip():
            return []

        chunks = self.text_splitter.split_text(text)
        return [chunk.strip() for chunk in chunks if chunk.strip()]

    def process_file(
        self,
        file_path: Path,
        category: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[DocumentChunk]:
        """Process a single file into document chunks.

        Args:
            file_path: Path to file
            category: Optional category label
            metadata: Optional additional metadata

        Returns:
            List of DocumentChunk objects ready for insertion

        Raises:
            Exception: If processing fails
        """
        print(f"Processing: {file_path.name}")

        # Load document
        text = self.load_document(file_path)

        # Chunk text
        chunks = self.chunk_text(text)
        if not chunks:
            print(f"  Warning: No chunks created from {file_path.name}")
            return []

        print(f"  Created {len(chunks)} chunks")

        # Generate embeddings
        print(f"  Generating embeddings...")
        embeddings = self.embedding_service.embed_batch(chunks, show_progress=False)

        # Create DocumentChunk objects
        document_chunks = []
        for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
            chunk = DocumentChunk(
                chunk_id=str(uuid.uuid4()),
                content=chunk_text,
                embedding=embedding,
                source=file_path.name,
                category=category,
                metadata=metadata or {},
                chunk_index=i,
                created_at=datetime.utcnow()
            )
            document_chunks.append(chunk)

        print(f"  ✓ Processed {len(document_chunks)} chunks")
        return document_chunks

    def ingest_directory(
        self,
        directory_path: Path,
        category: Optional[str] = None,
        recursive: bool = False
    ) -> IngestionResult:
        """Ingest all supported documents from a directory.

        Args:
            directory_path: Path to directory
            category: Optional category for all documents
            recursive: Search subdirectories

        Returns:
            IngestionResult with statistics and errors
        """
        if not directory_path.exists():
            return IngestionResult(
                success=False,
                documents_processed=0,
                chunks_created=0,
                chunks_inserted=0,
                errors=[f"Directory not found: {directory_path}"]
            )

        # Find all supported files
        supported_extensions = {'.txt', '.md', '.pdf', '.doc', '.docx'}
        pattern = "**/*" if recursive else "*"

        files = [
            f for f in directory_path.glob(pattern)
            if f.is_file() and f.suffix.lower() in supported_extensions
        ]

        if not files:
            return IngestionResult(
                success=True,
                documents_processed=0,
                chunks_created=0,
                chunks_inserted=0,
                errors=[f"No supported files found in {directory_path}"]
            )

        print(f"\nFound {len(files)} file(s) to process")
        print("=" * 50)

        all_chunks = []
        errors = []
        processed = 0

        for file_path in files:
            try:
                chunks = self.process_file(file_path, category=category)
                all_chunks.extend(chunks)
                processed += 1
            except Exception as e:
                error_msg = f"{file_path.name}: {str(e)}"
                errors.append(error_msg)
                print(f"  ✗ Error: {error_msg}")

        # Insert all chunks
        chunks_inserted = 0
        if all_chunks:
            print("\n" + "=" * 50)
            print(f"Inserting {len(all_chunks)} chunks into MongoDB...")
            try:
                chunk_dicts = [chunk.model_dump() for chunk in all_chunks]
                chunks_inserted = self.database_service.insert_chunks(chunk_dicts)
                print(f"✓ Inserted {chunks_inserted} chunks")
            except Exception as e:
                error_msg = f"Database insertion failed: {str(e)}"
                errors.append(error_msg)
                print(f"✗ {error_msg}")

        result = IngestionResult(
            success=len(errors) == 0,
            documents_processed=processed,
            chunks_created=len(all_chunks),
            chunks_inserted=chunks_inserted,
            errors=errors
        )

        return result
