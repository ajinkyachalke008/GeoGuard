from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """GeoGuard Application Configuration"""
    GEOLOCATION_PROVIDER: str = Field(default="openrouter", description="openrouter, openai, geoseer, or mock")
    
    # OpenRouter API (Access to GPT-4o, GPT-4o-mini, Gemini, Claude)
    OPENROUTER_API_KEY: str = Field(default="", description="API key for OpenRouter")
    OPENROUTER_MODEL: str = Field(default="openai/gpt-4o", description="OpenRouter Model ID (e.g. openai/gpt-4o, openai/gpt-4o-mini)")
    OPENROUTER_API_BASE: str = Field(default="https://openrouter.ai/api/v1", description="OpenRouter base URL")

    # Direct OpenAI API
    OPENAI_API_KEY: str = Field(default="", description="Direct OpenAI API key")
    OPENAI_MODEL: str = Field(default="gpt-4o", description="Direct OpenAI model ID")
    OPENAI_API_BASE: str = Field(default="https://api.openai.com/v1", description="OpenAI base URL")

    # GeoSeer API
    GEOSEER_API_KEY: str = Field(default="", description="API key for GeoSeer service")
    GEOSEER_API_URL: str = Field(default="https://geoseeer.com/api/v1", description="GeoSeer API base URL")
    
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")
    ENVIRONMENT: str = Field(default="development", description="development / production")
    CORS_ORIGINS: str = Field(default="http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
    
    MAX_FILE_SIZE_MB: int = Field(default=10, description="Maximum image upload size in MB")
    ALLOWED_EXTENSIONS: str = Field(default="jpg,jpeg,png,webp,heic")
    API_TIMEOUT_SECONDS: int = Field(default=60)

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip().lower().lstrip(".") for ext in self.ALLOWED_EXTENSIONS.split(",") if ext.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
