"""Configuration from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    google_api_key: str = ""
    gemini_api_key: str = "AIzaSyA4YQ2bsJcgO8B8lvdvrq5ht1Ds6xqOBaw"
    elevenlabs_api_key: str = "sk_c8898a0c2cf3f4decef71639c4e37a09244890bfcfb5c69e"
    elevenlabs_voice_id: str = "JBFqnCBsd6RMkjVDRZzb"

    def api_key_google(self) -> str:
        return self.google_api_key or self.gemini_api_key

    def api_key_elevenlabs(self) -> str:
        return self.elevenlabs_api_key


settings = Settings()
