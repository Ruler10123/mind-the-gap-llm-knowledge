"""Configuration from environment variables."""

from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # LLM provider selection. "vultr" | "openai" | "local" | "stub".
    # "stub" lets the app boot and stream responses with no API keys (echoes a placeholder).
    # "local" runs a HuggingFace causal LM on-device (requires the `local` optional deps).
    llm_provider: str = "stub"

    # Vultr Serverless Inference (used when llm_provider == "vultr")
    vultr_api_key: str = ""
    vultr_model: str = "llama-3.1-70b-instruct-fp8"

    # Generic OpenAI-compatible endpoint (used when llm_provider == "openai")
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"

    # Local HuggingFace model (used when llm_provider == "local")
    # Install deps: `uv sync --extra local` (adds transformers + accelerate).
    local_model_id: str = "Qwen/Qwen2.5-0.5B-Instruct"
    local_model_device: str = "auto"  # "auto" | "cpu" | "cuda" | "cuda:0" | "mps"
    local_model_max_new_tokens: int = 256
    local_model_temperature: float = 0.0

    # Experiment mode. "agent" runs the full LangGraph tool-using loop.
    # "base_only" calls the LLM once with no tools and no RAG — the baseline
    # for the knowledge-strategy comparison in docs/experiment_plan.md.
    experiment_mode: str = "agent"

    # TTS provider selection. One of: "kokoro" | "elevenlabs" | "disabled".
    # Empty string is treated as auto: elevenlabs if keys present, else disabled.
    tts_provider: str = ""

    # ElevenLabs (cloud TTS, used when tts_provider == "elevenlabs")
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

    # Kokoro (local TTS, used when tts_provider == "kokoro")
    # Voice options depend on installed model weights (see kokoro README).
    kokoro_voice: str = "af_heart"
    kokoro_lang_code: str = "a"  # 'a' = American English; see kokoro docs
    kokoro_speed: float = 1.0
    kokoro_sample_rate: int = 24000

    # Weather (optional). Empty key disables the integration.
    openweather_api_key: str = ""

    # Optional kiosk demo features (face auth + flights REST API).
    # Disabled by default so the app boots without MongoDB or DeepFace.
    enable_kiosk_demo: bool = False

    # RAG backend: "local" (in-memory, default) | "mongo" (Atlas Vector Search)
    rag_backend: str = "local"

    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database: str = "customer_service"
    mongodb_collection: str = "knowledge_base"

    # Timeouts (seconds)
    tool_execution_timeout_seconds: int = 30
    llm_call_timeout_seconds: int = 60
    agent_max_execution_time_seconds: int = 300

    # Retry
    agent_max_retries: int = 3
    tool_max_retries: int = 1

    # RAG
    rag_top_k: int = 5
    embedding_model: str = Field(
        default="all-mpnet-base-v2",
        description="Sentence-transformers model. Must match Atlas index numDimensions: all-mpnet-base-v2=768, all-MiniLM-L6-v2=384.",
    )
    rag_mongo_uri: str = Field(default="", description="MongoDB URI for RAG (uses auth_mongo_uri if empty)")
    rag_database_name: str = Field(default="RAG", description="RAG database name")
    rag_collection_name: str = Field(default="RAG_collection", description="RAG collection name")
    rag_vector_index_name: str = Field(default="RAG_vector_index", description="Vector search index name")
    rag_chunk_size: int = Field(default=500, description="Document chunk size")
    rag_chunk_overlap: int = Field(default=50, description="Chunk overlap")

    # Authentication Settings
    auth_mongo_uri: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection string for auth (local dev default)",
    )
    auth_database_name: str = Field(default="access_control", description="Auth database name")
    auth_collection_name: str = Field(default="users", description="Auth collection name")
    auth_vector_index_name: str = Field(default="face_vector_index", description="Vector index name")
    face_similarity_threshold: float = Field(default=0.6, ge=0.0, le=1.0, description="Face match threshold")
    face_embedding_dimensions: int = Field(default=512, description="Facenet512 dimensions")
    auth_temp_dir: Path = Field(default=Path("temp"), description="Temp files for auth")
    auth_qr_dir: Path = Field(default=Path("qr_codes"), description="QR code storage")

    # Flight Management Settings (reuses auth_mongo_uri for same cluster)
    flights_database_name: str = Field(default="flights", description="Flights database name")
    flights_collection_name: str = Field(default="flights_collection", description="Flights collection name")

    def api_key_elevenlabs(self) -> str:
        return self.elevenlabs_api_key


settings = Settings()
