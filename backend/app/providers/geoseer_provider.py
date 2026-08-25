import time
import httpx
from typing import List, Optional
from fastapi import HTTPException
from app.config.settings import settings
from app.schemas.analysis import LocationCandidate, AnalysisConfigRequest
from app.providers.base import BaseGeolocationProvider


class GeoSeerGeolocationProvider(BaseGeolocationProvider):
    """
    Live API client integrating with the external GeoSeer REST API according to API.md specification.
    """

    def __init__(self, api_key: Optional[str] = None, api_url: Optional[str] = None):
        self.api_key = api_key or settings.GEOSEER_API_KEY
        self.api_url = (api_url or settings.GEOSEER_API_URL).rstrip("/")

    @property
    def provider_name(self) -> str:
        return "geoseer"

    @property
    def is_mock(self) -> bool:
        return False

    def _get_headers(self) -> dict:
        if not self.api_key:
            raise HTTPException(
                status_code=401,
                detail="GeoSeer API key is not configured. Please set GEOSEER_API_KEY in backend/.env or configure it in GeoGuard Settings."
            )
        return {
            "X-API-Key": self.api_key
        }

    def _parse_locations(self, locations_raw: list) -> List[LocationCandidate]:
        candidates: List[LocationCandidate] = []
        for idx, loc in enumerate(locations_raw):
            confidence_val = float(loc.get("confidence", 0.5))
            address_str = loc.get("address", "Unknown Location")
            
            # Simple address part splitting
            parts = [p.strip() for p in address_str.split(",")]
            country = parts[-1] if len(parts) >= 1 else None
            state = parts[-2] if len(parts) >= 2 else None
            city = parts[-3] if len(parts) >= 3 else (parts[0] if parts else None)

            candidate = LocationCandidate(
                rank=idx + 1,
                latitude=float(loc.get("latitude", 0.0)),
                longitude=float(loc.get("longitude", 0.0)),
                confidence=confidence_val,
                confidence_percentage=int(round(confidence_val * 100)),
                address=address_str,
                country=country,
                state=state,
                city=city,
                radius_km=round(max(0.5, (1.0 - confidence_val) * 20.0), 1),
                reasoning=loc.get("reasoning", "")
            )
            candidates.append(candidate)
        return candidates

    async def analyze_image(
        self,
        image_bytes: bytes,
        filename: str,
        config: AnalysisConfigRequest
    ) -> tuple[List[LocationCandidate], str, Optional[int]]:
        headers = self._get_headers()
        url = f"{self.api_url}/analyze"

        data = {
            "analysis_mode": config.analysis_mode or "fast"
        }
        if config.user_context:
            data["user_context"] = config.user_context

        files = {
            "file": (filename, image_bytes, "image/jpeg")
        }

        try:
            async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
                response = await client.post(url, headers=headers, data=data, files=files)
                
                if response.status_code == 401:
                    raise HTTPException(status_code=401, detail="Invalid GeoSeer API Key.")
                elif response.status_code == 402:
                    raise HTTPException(status_code=402, detail="GeoSeer account usage quota exceeded.")
                elif response.status_code == 403:
                    raise HTTPException(status_code=403, detail="Free plan supports 'fast' mode only. Upgrade or switch to fast mode.")
                elif response.status_code == 413:
                    raise HTTPException(status_code=413, detail="File too large for GeoSeer API.")
                elif response.status_code == 429:
                    raise HTTPException(status_code=429, detail="GeoSeer API queue is currently full. Please retry shortly.")
                elif response.status_code >= 400:
                    raise HTTPException(status_code=response.status_code, detail=f"GeoSeer API error: {response.text}")

                res_json = response.json()
                locations_raw = res_json.get("locations", [])
                processing_time = str(res_json.get("processing_time", "0.0s"))
                remaining = res_json.get("API_Requests_remaining")

                candidates = self._parse_locations(locations_raw)
                return candidates, processing_time, remaining

        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="GeoSeer API request timed out. Please try again.")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to GeoSeer API: {str(e)}")

    async def analyze_event(
        self,
        event_text: str,
        config: AnalysisConfigRequest
    ) -> tuple[List[LocationCandidate], str, Optional[int]]:
        headers = self._get_headers()
        headers["Content-Type"] = "application/json"
        url = f"{self.api_url}/analyze"

        payload = {
            "analysis_mode": "event",
            "event_text": event_text,
            "stream": False
        }

        try:
            async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code >= 400:
                    raise HTTPException(status_code=response.status_code, detail=f"GeoSeer API error: {response.text}")

                res_json = response.json()
                locations_raw = res_json.get("locations", [])
                processing_time = str(res_json.get("processing_time", "0.0s"))
                remaining = res_json.get("API_Requests_remaining")

                candidates = self._parse_locations(locations_raw)
                return candidates, processing_time, remaining
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=502, detail=f"GeoSeer API Event analysis error: {str(e)}")
