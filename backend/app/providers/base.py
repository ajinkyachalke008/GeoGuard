from abc import ABC, abstractmethod
from typing import Optional, List
from app.schemas.analysis import LocationCandidate, AnalysisConfigRequest


class BaseGeolocationProvider(ABC):
    """Abstract base class for all AI Geolocation intelligence engines."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def is_mock(self) -> bool:
        pass

    @abstractmethod
    async def analyze_image(
        self,
        image_bytes: bytes,
        filename: str,
        config: AnalysisConfigRequest
    ) -> tuple[List[LocationCandidate], str, Optional[int]]:
        """
        Analyzes image bytes and returns:
        - List of ranked LocationCandidate objects
        - Processing time string (e.g. "12.4s")
        - API requests remaining (or None)
        """
        pass

    @abstractmethod
    async def analyze_event(
        self,
        event_text: str,
        config: AnalysisConfigRequest
    ) -> tuple[List[LocationCandidate], str, Optional[int]]:
        """
        Analyzes text event description and returns:
        - List of ranked LocationCandidate objects
        - Processing time string
        - API requests remaining
        """
        pass
