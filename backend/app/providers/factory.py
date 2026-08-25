from typing import Optional
from app.config.settings import settings
from app.providers.base import BaseGeolocationProvider
from app.providers.gemini_provider import GeminiGeolocationProvider
from app.providers.claude_provider import ClaudeGeolocationProvider
from app.providers.openai_provider import OpenAIGeolocationProvider
from app.providers.geoseer_provider import GeoSeerGeolocationProvider
from app.providers.mock_provider import MockGeolocationProvider


def get_provider(
    provider_name: Optional[str] = None,
    api_key_override: Optional[str] = None
) -> BaseGeolocationProvider:
    """
    Instantiates the requested Geolocation provider.
    Priority:
    1. gemini / google (Google Gemini 2.0 Flash / 1.5 Pro)
    2. openrouter (OpenRouter GPT-4o / Claude Vision)
    3. openai (Direct OpenAI GPT-4o Vision)
    4. claude / anthropic (Anthropic Claude 3.5 Sonnet)
    5. geoseer (GeoSeer API)
    6. mock (Offline demo mode)
    """
    name = (provider_name or settings.GEOLOCATION_PROVIDER).strip().lower()

    # 1. Google Gemini
    if name in ("gemini", "google", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash", "google-ai"):
        key = api_key_override or settings.GEMINI_API_KEY
        return GeminiGeolocationProvider(
            api_key=key,
            model=settings.GEMINI_MODEL,
            api_base=settings.GEMINI_API_BASE
        )

    # 2. Anthropic Claude
    if name in ("claude", "anthropic", "claude-3-5-sonnet"):
        key = api_key_override or settings.ANTHROPIC_API_KEY
        return ClaudeGeolocationProvider(
            api_key=key,
            model=settings.ANTHROPIC_MODEL
        )

    # 3. OpenRouter
    if name in ("openrouter", "openai_openrouter"):
        key = api_key_override or settings.OPENROUTER_API_KEY
        return OpenAIGeolocationProvider(
            api_key=key,
            model=settings.OPENROUTER_MODEL,
            api_base=settings.OPENROUTER_API_BASE,
            provider_type="openrouter"
        )

    # 4. OpenAI Direct
    if name in ("openai", "gpt4o", "gpt-4o", "gpt-4o-mini"):
        key = api_key_override or settings.OPENAI_API_KEY
        return OpenAIGeolocationProvider(
            api_key=key,
            model=settings.OPENAI_MODEL,
            api_base=settings.OPENAI_API_BASE,
            provider_type="openai"
        )

    # 5. GeoSeer
    if name == "geoseer":
        key = api_key_override or settings.GEOSEER_API_KEY
        return GeoSeerGeolocationProvider(api_key=key)

    # If provider is explicitly mock, return mock
    if name == "mock":
        return MockGeolocationProvider()

    # Automatic fallback order if unknown or default:
    if settings.GEMINI_API_KEY.strip():
        return GeminiGeolocationProvider(api_key=settings.GEMINI_API_KEY)
    if settings.OPENROUTER_API_KEY.strip():
        return OpenAIGeolocationProvider(api_key=settings.OPENROUTER_API_KEY, provider_type="openrouter")
    if settings.OPENAI_API_KEY.strip():
        return OpenAIGeolocationProvider(api_key=settings.OPENAI_API_KEY, provider_type="openai")
    if settings.ANTHROPIC_API_KEY.strip():
        return ClaudeGeolocationProvider(api_key=settings.ANTHROPIC_API_KEY)

    return MockGeolocationProvider()
