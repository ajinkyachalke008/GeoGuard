from typing import Optional
from app.config.settings import settings
from app.providers.base import BaseGeolocationProvider
from app.providers.mock_provider import MockGeolocationProvider
from app.providers.geoseer_provider import GeoSeerGeolocationProvider
from app.providers.openai_provider import OpenAIGeolocationProvider


def get_provider(
    provider_name: Optional[str] = None,
    api_key_override: Optional[str] = None
) -> BaseGeolocationProvider:
    """
    Instantiates the requested Geolocation provider.
    Priority:
    1. openrouter (OpenRouter GPT-4o Vision)
    2. openai (Direct OpenAI API)
    3. geoseer (GeoSeer API)
    4. mock (Offline demo mode)
    """
    name = (provider_name or settings.GEOLOCATION_PROVIDER).strip().lower()

    if name in ("openrouter", "openai_openrouter"):
        key = api_key_override or settings.OPENROUTER_API_KEY
        return OpenAIGeolocationProvider(
            api_key=key,
            model=settings.OPENROUTER_MODEL,
            api_base=settings.OPENROUTER_API_BASE,
            provider_type="openrouter"
        )

    if name in ("openai", "gpt4o", "gpt-4o"):
        key = api_key_override or settings.OPENAI_API_KEY
        return OpenAIGeolocationProvider(
            api_key=key,
            model=settings.OPENAI_MODEL,
            api_base=settings.OPENAI_API_BASE,
            provider_type="openai"
        )

    if name == "geoseer":
        key = api_key_override or settings.GEOSEER_API_KEY
        return GeoSeerGeolocationProvider(api_key=key)

    # If provider is explicitly mock or unknown, check if OpenRouter key exists before falling back to mock
    if settings.OPENROUTER_API_KEY.strip() and name != "mock":
        return OpenAIGeolocationProvider(
            api_key=settings.OPENROUTER_API_KEY,
            model=settings.OPENROUTER_MODEL,
            api_base=settings.OPENROUTER_API_BASE,
            provider_type="openrouter"
        )

    return MockGeolocationProvider()
