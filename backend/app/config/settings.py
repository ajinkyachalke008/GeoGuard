from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """GeoGuard Application Configuration"""
    GEOLOCATION_PROVIDER: str = Field(default="gemini", description="gemini, openrouter, openai, claude, geoseer, or mock")
    
    # Google Gemini API
    GEMINI_API_KEY: str = Field(default="", description="API key for Google AI Studio / Gemini")
    GEMINI_MODEL: str = Field(default="gemini-2.0-flash", description="Gemini model ID (e.g. gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash)")
    GEMINI_API_BASE: str = Field(default="https://generativelanguage.googleapis.com/v1beta", description="Google Gemini API base")

    # OpenRouter API (Access to GPT-4o, Claude, Gemini)
    OPENROUTER_API_KEY: str = Field(default="", description="API key for OpenRouter")
    OPENROUTER_MODEL: str = Field(default="openai/gpt-4o", description="OpenRouter Model ID")
    OPENROUTER_API_BASE: str = Field(default="https://openrouter.ai/api/v1", description="OpenRouter base URL")

    # Direct OpenAI API
    OPENAI_API_KEY: str = Field(default="", description="Direct OpenAI API key")
    OPENAI_MODEL: str = Field(default="gpt-4o", description="Direct OpenAI model ID")
    OPENAI_API_BASE: str = Field(default="https://api.openai.com/v1", description="OpenAI base URL")

    # Anthropic Claude API
    ANTHROPIC_API_KEY: str = Field(default="", description="Anthropic Claude API key")
    ANTHROPIC_MODEL: str = Field(default="claude-3-5-sonnet-20241022", description="Claude model ID")

    # GeoSeer API
    GEOSEER_API_KEY: str = Field(default="", description="API key for GeoSeer service")
    GEOSEER_API_URL: str = Field(default="https://geoseeer.com/api/v1", description="GeoSeer API base URL")
    
    # OpenStreetMap / Nominatim / Overpass Services
    NOMINATIM_USER_AGENT: str = Field(default="GeoGuard-OSINT-Platform/2.0", description="User agent for OpenStreetMap Nominatim")
    ENABLE_OSM_LOOKUP: bool = Field(default=True, description="Enable real OpenStreetMap reverse geocoding and Overpass lookup")
    ENABLE_SOLAR_CALCULATION: bool = Field(default=True, description="Enable NOAA astronomical solar & shadow vector calculations")

    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")
    ENVIRONMENT: str = Field(default="development", description="development / production")
    CORS_ORIGINS: str = Field(default="http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
    
    MAX_FILE_SIZE_MB: int = Field(default=15, description="Maximum image upload size in MB")
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
