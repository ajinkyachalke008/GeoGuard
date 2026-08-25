import json
import time
import base64
import re
from typing import List, Optional, Tuple
import httpx
from fastapi import HTTPException
from app.config.settings import settings
from app.schemas.analysis import LocationCandidate, AnalysisConfigRequest
from app.providers.base import BaseGeolocationProvider


class ClaudeGeolocationProvider(BaseGeolocationProvider):
    """
    Multimodal AI Visual Geolocation Provider powered directly by Anthropic Claude (Claude 3.5 Sonnet).
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        self.api_key = (api_key or settings.ANTHROPIC_API_KEY).strip()
        self.model = model or settings.ANTHROPIC_MODEL or "claude-3-5-sonnet-20241022"

    @property
    def provider_name(self) -> str:
        return f"Anthropic Claude ({self.model})"

    @property
    def is_mock(self) -> bool:
        return False

    def _extract_json(self, raw_text: str) -> dict:
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\n?```$", "", cleaned)
            cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"(\{[\s\S]*\})", cleaned)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass
            raise ValueError(f"Failed to parse model response as JSON: {raw_text[:250]}...")

    def _parse_candidates(self, data: dict) -> List[LocationCandidate]:
        raw_candidates = data.get("candidates") or data.get("locations") or []
        candidates: List[LocationCandidate] = []

        for idx, item in enumerate(raw_candidates):
            lat = float(item.get("latitude", item.get("lat", 0.0)))
            lng = float(item.get("longitude", item.get("lng", item.get("lon", 0.0))))
            conf = float(item.get("confidence", 0.85))
            conf = min(max(conf, 0.05), 0.99)
            conf_pct = int(item.get("confidence_percentage", round(conf * 100)))

            address = str(item.get("address", "Estimated Location"))
            country = item.get("country")
            state = item.get("state") or item.get("province") or item.get("region")
            city = item.get("city") or item.get("town")
            district = item.get("district")
            radius_km = item.get("radius_km")
            if radius_km is not None:
                radius_km = float(radius_km)
            else:
                radius_km = round(max(0.1, (1.0 - conf) * 12.0), 2)

            reasoning = item.get("reasoning", "")
            if isinstance(reasoning, list):
                reasoning = " • ".join(reasoning)

            candidates.append(
                LocationCandidate(
                    rank=idx + 1,
                    latitude=lat,
                    longitude=lng,
                    confidence=conf,
                    confidence_percentage=conf_pct,
                    address=address,
                    country=country,
                    state=state,
                    city=city,
                    district=district,
                    radius_km=radius_km,
                    reasoning=str(reasoning)
                )
            )

        return candidates

    async def analyze_image(
        self,
        image_bytes: bytes,
        filename: str,
        config: AnalysisConfigRequest
    ) -> Tuple[List[LocationCandidate], str, Optional[int]]:
        start_t = time.time()
        if not self.api_key:
            raise HTTPException(
                status_code=401,
                detail="Anthropic Claude API key not configured. Please enter your ANTHROPIC_API_KEY in backend/.env or in Settings."
            )

        lower_fn = filename.lower()
        if lower_fn.endswith(".png"):
            media_type = "image/png"
        elif lower_fn.endswith(".webp"):
            media_type = "image/webp"
        elif lower_fn.endswith(".gif"):
            media_type = "image/gif"
        else:
            media_type = "image/jpeg"

        base64_img = base64.b64encode(image_bytes).decode("utf-8")

        prompt = """You are GeoGuard's expert OSINT Geospatial Intelligence & Visual Triangulation Engine.
Perform exhaustive visual geolocation on this photograph across architecture, signage, road geometry, vegetation biome, and solar angles.

OUTPUT FORMAT:
Respond with STRICTLY valid JSON ONLY:
{
  "candidates": [
    {
      "rank": 1,
      "latitude": 48.8584,
      "longitude": 2.2945,
      "confidence": 0.94,
      "confidence_percentage": 94,
      "address": "Specific Landmark / Street, City, State, Country",
      "country": "Country",
      "state": "State",
      "city": "City",
      "district": "District",
      "radius_km": 0.5,
      "reasoning": "Detailed visual proof describing architecture, road markings, scripts, flora, and landmarks."
    }
  ]
}"""
        if config.user_context:
            prompt += f"\n\nContext Clues: {config.user_context}"

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

        payload = {
            "model": self.model,
            "max_tokens": 1500,
            "temperature": 0.1,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": base64_img
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        }

        async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
            response = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
            if response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=f"Claude API Error: {response.text}")

            res_json = response.json()
            content_blocks = res_json.get("content", [])
            text = "".join([b.get("text", "") for b in content_blocks if b.get("type") == "text"])
            parsed = self._extract_json(text)
            candidates = self._parse_candidates(parsed)
            return candidates, f"{time.time() - start_t:.2f}s", None

    async def analyze_event(
        self,
        event_text: str,
        config: AnalysisConfigRequest
    ) -> Tuple[List[LocationCandidate], str, Optional[int]]:
        start_t = time.time()
        if not self.api_key:
            raise HTTPException(status_code=401, detail="Anthropic Claude API key required.")

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

        prompt = f"""Extract geographic coordinates from this field incident report as JSON:
{event_text}

JSON format:
{{
  "candidates": [
    {{
      "rank": 1,
      "latitude": 48.8584,
      "longitude": 2.2945,
      "confidence": 0.92,
      "confidence_percentage": 92,
      "address": "Landmark / Street, City, State, Country",
      "country": "Country",
      "state": "State",
      "city": "City",
      "radius_km": 1.0,
      "reasoning": "Reasoning based on text analysis."
    }}
  ]
}}"""

        payload = {
            "model": self.model,
            "max_tokens": 1000,
            "temperature": 0.1,
            "messages": [{"role": "user", "content": prompt}]
        }

        async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
            response = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
            if response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=f"Claude API Error: {response.text}")

            res_json = response.json()
            text = "".join([b.get("text", "") for b in res_json.get("content", []) if b.get("type") == "text"])
            parsed = self._extract_json(text)
            candidates = self._parse_candidates(parsed)
            return candidates, f"{time.time() - start_t:.2f}s", None
