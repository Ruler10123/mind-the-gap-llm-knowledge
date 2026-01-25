"""Configuration from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # API Keys
    vultr_api_key: str = ""
    vultr_model: str = "llama-3.1-70b-instruct-fp8"  # Default model
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

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
    embedding_model: str = "all-MiniLM-L6-v2"

    def api_key_elevenlabs(self) -> str:
        return self.elevenlabs_api_key


settings = Settings()
