# RAG Documents Directory

This directory contains documents that will be ingested into the RAG knowledge base.

## Supported File Formats

- `.txt` - Plain text files
- `.md` - Markdown files
- `.pdf` - PDF documents
- `.doc` / `.docx` - Microsoft Word documents

## How to Add Documents

1. Place your document files in this directory (or subdirectories)
2. Run the ingestion script:
   ```bash
   uv run python rag/ingest_documents.py
   ```
3. The script will:
   - Load each document
   - Split into chunks (500 chars with 50 char overlap)
   - Generate embeddings (384-dim vectors)
   - Store in MongoDB Atlas

## Document Organization

You can organize documents by:
- Creating subdirectories (e.g., `policies/`, `procedures/`, `faq/`)
- Using descriptive filenames
- The ingestion script searches recursively

## What to Include

For an airport kiosk assistant, consider including:
- **Policies**: Baggage policies, check-in procedures, security rules
- **Services**: Lounge access, dining options, shopping, WiFi
- **Facilities**: Gate locations, restrooms, help desks, charging stations
- **FAQ**: Common questions and answers
- **Procedures**: Lost baggage, flight changes, special assistance

## Re-ingestion

To update the knowledge base:
1. Add/modify documents in this directory
2. Run ingestion script again
3. Choose whether to clear existing data or append

## Example Documents

See `airport_faq.md` for a sample FAQ document format.
