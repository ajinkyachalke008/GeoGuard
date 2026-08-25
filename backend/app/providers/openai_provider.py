import json
import time
import base64
import re
from typing import List, Optional
import httpx
from fastapi import HTTPException
from app.config.settings import settings
from app.schemas.analysis import LocationCandidate, AnalysisConfigRequest
from app.providers.base import BaseGeolocationProvider


class OpenAIGeolocationProvider(BaseGeolocationProvider):
    """
    Multimodal AI Visual Geolocation Provider powered by OpenRouter / OpenAI (GPT-4o / GPT-4o-mini Vision).
    Performs forensic OSINT visual intelligence extraction across architecture, signage,
    road markings, vegetation, sun angle, and topography.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        api_base: Optional[str] = None,
        provider_type: str = "openrouter"
    ):
        self.provider_type = provider_type.lower()
        if self.provider_type == "openai":
            self.api_key = api_key or settings.OPENAI_API_KEY or settings.OPENROUTER_API_KEY
            self.model = model or settings.OPENAI_MODEL or "gpt-4o-mini"
            self.api_base = (api_base or settings.OPENAI_API_BASE).rstrip("/")
        else:
            self.api_key = api_key or settings.OPENROUTER_API_KEY
            self.model = model or settings.OPENROUTER_MODEL or "openai/gpt-4o-mini"
            self.api_base = (api_base or settings.OPENROUTER_API_BASE).rstrip("/")

    @property
    def provider_name(self) -> str:
        return f"OpenRouter ({self.model})" if "openrouter" in self.api_base else f"OpenAI ({self.model})"

    @property
    def is_mock(self) -> bool:
        return False

    def _get_headers(self) -> dict:
        if not self.api_key or not self.api_key.strip():
            raise HTTPException(
                status_code=401,
                detail=f"API key not configured for {self.provider_type.upper()}. Please set OPENROUTER_API_KEY in backend/.env or configure it in Settings."
            )
        headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json",
        }
        if "openrouter" in self.api_base:
            headers["HTTP-Referer"] = "https://geoguard.local"
            headers["X-Title"] = "GeoGuard OSINT Geolocation Engine"
        return headers

    def _extract_json(self, raw_text: str) -> dict:
        """Extract and parse structured JSON from LLM output."""
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\n?```$", "", cleaned)
            cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass
            raise ValueError(f"Failed to parse model response as JSON: {raw_text[:200]}...")

    def _parse_candidates(self, data: dict) -> List[LocationCandidate]:
        raw_candidates = data.get("candidates") or data.get("locations") or []
        candidates: List[LocationCandidate] = []

        for idx, item in enumerate(raw_candidates):
            lat = float(item.get("latitude", item.get("lat", 0.0)))
            lng = float(item.get("longitude", item.get("lng", item.get("lon", 0.0))))
            conf = float(item.get("confidence", 0.8))
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
                radius_km = round(max(0.2, (1.0 - conf) * 15.0), 1)

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

        if not candidates and ("latitude" in data or "lat" in data):
            lat = float(data.get("latitude", data.get("lat", 0.0)))
            lng = float(data.get("longitude", data.get("lng", 0.0)))
            conf = float(data.get("confidence", 0.85))
            candidates.append(
                LocationCandidate(
                    rank=1,
                    latitude=lat,
                    longitude=lng,
                    confidence=conf,
                    confidence_percentage=int(round(conf * 100)),
                    address=str(data.get("address", "Estimated Location")),
                    country=data.get("country"),
                    state=data.get("state"),
                    city=data.get("city"),
                    radius_km=float(data.get("radius_km", 1.0)),
                    reasoning=str(data.get("reasoning", "OSINT Multimodal Geolocation Visual Estimate"))
                )
            )

        return candidates

    async def analyze_image(
        self,
        image_bytes: bytes,
        filename: str,
        config: AnalysisConfigRequest
    ) -> tuple[List[LocationCandidate], str, Optional[int]]:
        start_t = time.time()
        headers = self._get_headers()
        url = f"{self.api_base}/chat/completions"

        lower_fn = filename.lower()
        if lower_fn.endswith(".png"):
            mime_type = "image/png"
        elif lower_fn.endswith(".webp"):
            mime_type = "image/webp"
        elif lower_fn.endswith(".gif"):
            mime_type = "image/gif"
        else:
            mime_type = "image/jpeg"

        base64_img = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{mime_type};base64,{base64_img}"

        system_prompt = """You are GeoGuard's expert OSINT Geospatial Intelligence & Visual Triangulation Engine.
Your mission is to perform rigorous, forensic-level visual geolocation on the provided photograph.

Thoroughly analyze every visible clue:
1. Architecture & Infrastructure: Facade materials, window styles, masonry, roofing styles, utility poles/transformers, guardrails.
2. Roads, Traffic & Driving Side: Road markings, driving side, curb colors, license plate format, road signage.
3. Signage, Typography & Language: Any visible scripts, alphabet, language, business names, street signs, telephone codes, top-level domains.
4. Flora, Soil & Biome: Tree species, vegetation density, soil color, terrain topography.
5. Solar & Climate: Sun angle, shadow orientation, climate zone.
6. Specific Landmarks & Geospatial Features: Distinctive monuments, towers, skylines.

OUTPUT FORMAT:
Respond with STRICTLY valid JSON ONLY (no extra markdown explanation outside JSON):
{
  "candidates": [
    {
      "rank": 1,
      "latitude": 48.8584,
      "longitude": 2.2945,
      "confidence": 0.92,
      "confidence_percentage": 92,
      "address": "Specific Street Address or Landmark, City, State, Country",
      "country": "Country Name",
      "state": "State/Province",
      "city": "City",
      "district": "Neighborhood",
      "radius_km": 0.5,
      "reasoning": "Detailed forensic explanation of visual evidence observed (architecture, signage, roads, flora, terrain)."
    }
  ]
}
"""

        user_content = [
            {"type": "text", "text": "Analyze this photograph and determine the precise geographic coordinates and location."}
        ]
        if config.user_context:
            user_content.append({
                "type": "text",
                "text": f"Investigator Context / Clues: {config.user_context}"
            })
        if config.analysis_mode == "agent":
            user_content.append({
                "type": "text",
                "text": "Deep forensic mode: Perform exhaustive multi-pass examination of background details, distant terrain, and subtle markings."
            })

        user_content.append({
            "type": "image_url",
            "image_url": {
                "url": data_url,
                "detail": "high"
            }
        })

        models_to_try = [self.model]
        if "gpt-4o" in self.model and "mini" not in self.model and "openrouter" in self.api_base:
            models_to_try.append("openai/gpt-4o-mini")

        async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
            last_error = None
            for model_candidate in models_to_try:
                payload = {
                    "model": model_candidate,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 800,
                }

                try:
                    response = await client.post(url, headers=headers, json=payload)
                    
                    # If 402 on primary model due to credit limit and another model is available, fall through
                    if response.status_code == 402 and model_candidate != models_to_try[-1]:
                        continue

                    if response.status_code == 401:
                        raise HTTPException(
                            status_code=401,
                            detail=f"Invalid API Key for {self.provider_type.upper()}. Please check your API key."
                        )
                    elif response.status_code == 402:
                        raise HTTPException(
                            status_code=402,
                            detail="OpenRouter account has insufficient credits. Please top up or use an API key with active balance."
                        )
                    elif response.status_code == 429:
                        raise HTTPException(
                            status_code=429,
                            detail="Rate limit reached on AI Provider. Please retry in a few moments."
                        )
                    elif response.status_code >= 400:
                        raise HTTPException(
                            status_code=response.status_code,
                            detail=f"AI Provider error ({response.status_code}): {response.text}"
                        )

                    res_json = response.json()
                    choices = res_json.get("choices", [])
                    if not choices:
                        raise HTTPException(status_code=502, detail="No completion choices returned by AI vision provider.")

                    assistant_msg = choices[0].get("message", {}).get("content", "")
                    parsed_data = self._extract_json(assistant_msg)
                    candidates = self._parse_candidates(parsed_data)

                    elapsed_str = f"{time.time() - start_t:.2f}s"
                    return candidates, elapsed_str, None

                except HTTPException as he:
                    last_error = he
                except Exception as ex:
                    last_error = ex

            if isinstance(last_error, HTTPException):
                raise last_error
            raise HTTPException(status_code=500, detail=f"Visual geolocation analysis failed: {str(last_error)}")

    async def analyze_event(
        self,
        event_text: str,
        config: AnalysisConfigRequest
    ) -> tuple[List[LocationCandidate], str, Optional[int]]:
        start_t = time.time()
        headers = self._get_headers()
        url = f"{self.api_base}/chat/completions"

        system_prompt = """You are GeoGuard's expert OSINT Text Event Geolocation Engine.
Given a text description, news report, or incident report, determine the exact geographic location and coordinates.

OUTPUT FORMAT:
Respond with STRICTLY valid JSON ONLY:
{
  "candidates": [
    {
      "rank": 1,
      "latitude": 48.8584,
      "longitude": 2.2945,
      "confidence": 0.90,
      "confidence_percentage": 90,
      "address": "Exact Address / Landmark, City, State, Country",
      "country": "Country",
      "state": "State",
      "city": "City",
      "radius_km": 1.0,
      "reasoning": "Detailed breakdown of mentioned named entities, geographic references, and cross-correlation."
    }
  ]
}
"""

        models_to_try = [self.model]
        if "gpt-4o" in self.model and "mini" not in self.model and "openrouter" in self.api_base:
            models_to_try.append("openai/gpt-4o-mini")

        async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
            last_error = None
            for model_candidate in models_to_try:
                payload = {
                    "model": model_candidate,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Analyze this event report and extract geographic coordinates:\n\n{event_text}"}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 700,
                }

                try:
                    response = await client.post(url, headers=headers, json=payload)
                    if response.status_code == 402 and model_candidate != models_to_try[-1]:
                        continue
                    if response.status_code >= 400:
                        raise HTTPException(status_code=response.status_code, detail=f"AI Provider error: {response.text}")

                    res_json = response.json()
                    assistant_msg = res_json.get("choices", [{}])[0].get("message", {}).get("content", "")
                    parsed_data = self._extract_json(assistant_msg)
                    candidates = self._parse_candidates(parsed_data)
                    return candidates, f"{time.time() - start_t:.2f}s", None
                except Exception as e:
                    last_error = e

            if isinstance(last_error, HTTPException):
                raise last_error
            raise HTTPException(status_code=500, detail=f"Event geolocation analysis error: {str(last_error)}")
