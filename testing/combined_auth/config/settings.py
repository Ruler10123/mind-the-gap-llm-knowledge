"""Configuration management using Pydantic Settings."""
import os
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # MongoDB Configuration (required)
    MONGO_URI: str = Field(..., description="MongoDB Atlas connection string")

    # Database Configuration
    DATABASE_NAME: str = Field(default="access_control", description="MongoDB database name")
    COLLECTION_NAME: str = Field(default="users", description="MongoDB collection name")
    VECTOR_INDEX_NAME: str = Field(default="face_vector_index", description="Vector search index name")

    # Face Recognition Configuration
    SIMILARITY_THRESHOLD: float = Field(default=0.6, ge=0.0, le=1.0, description="Face match threshold")
    EMBEDDING_DIMENSIONS: int = Field(default=512, description="Facenet512 embedding dimensions")

    # File Paths
    TEMP_DIR: Path = Field(default=Path("temp"), description="Temporary file storage")
    QR_DIR: Path = Field(default=Path("qr_codes"), description="QR code storage")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create directories if they don't exist
        self.TEMP_DIR.mkdir(parents=True, exist_ok=True)
        self.QR_DIR.mkdir(parents=True, exist_ok=True)


# Singleton instance
_settings: Settings | None = None


def get_settings() -> Settings:
    """Get or create settings singleton instance."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
