"""Configuration from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    google_api_key: str = ""
    gemini_api_key: str = ""
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

    def api_key_google(self) -> str:
        return self.google_api_key or self.gemini_api_key

    def api_key_elevenlabs(self) -> str:
        return self.elevenlabs_api_key


settings = Settings()
