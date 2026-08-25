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


class GeminiGeolocationProvider(BaseGeolocationProvider):
    """
    Multimodal AI Visual Geolocation Provider powered directly by Google Gemini (Gemini 3.6 Flash / Gemini Flash).
    Performs forensic OSINT visual intelligence extraction across architecture, signage,
    road markings, vegetation, sun angle, and topography.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        api_base: Optional[str] = None
    ):
        self.api_key = (api_key or settings.GEMINI_API_KEY).strip()
        self.model = model or settings.GEMINI_MODEL or "gemini-3.6-flash"
        self.api_base = (api_base or settings.GEMINI_API_BASE).rstrip("/")

    @property
    def provider_name(self) -> str:
        return f"Google Gemini ({self.model})"

    @property
    def is_mock(self) -> bool:
        return False

    def _extract_json(self, raw_text: str) -> dict:
        """Extract and parse structured JSON from Gemini output."""
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
                    reasoning=str(data.get("reasoning", "Google Gemini OSINT Visual Triangulation Result"))
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
                detail="Google Gemini API key not configured. Please enter your GEMINI_API_KEY in backend/.env or in Settings."
            )

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

        system_instruction = """You are GeoGuard's expert OSINT Geospatial Intelligence & Visual Triangulation Engine.
Your mission is to perform rigorous, forensic-level visual geolocation on the provided photograph.

Carefully inspect and triangulate based on all visible clues:
1. Architecture & Infrastructure: Facade materials, roof lines (mansard, clay tile, corbel), window styles, utility poles/transformers, bollards, guardrails.
2. Roads, Traffic & Driving Side: Road markings, solid/dashed lines, curb colors, vehicle models, steering wheel side, driving side, license plate dimensions and color bands.
3. Signage, Typography & Language: Street name signs, commercial shopfronts, alphabet/scripts (Devanagari, Cyrillic, Latin, Kanji/Katakana, Hangul, Arabic, Thai), telephone prefixes, web domains (.fr, .in, .jp, .de, etc.).
4. Flora, Soil & Biome: Tree species (palms, conifers, eucalyptus, birch), foliage density, soil coloration (laterite red, black cotton, sandy, calcic), terrain topography and mountain profiles.
5. Solar & Climate: Sun angle, shadow orientation, climate zone.
6. Specific Landmarks & Geospatial Features: Distinctive towers, monuments, bridges, recognizable mountain ridges.

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
      "address": "Specific Landmark / Street, City, State/Province, Country",
      "country": "Country Name",
      "state": "State or Province",
      "city": "City or Town",
      "district": "Neighborhood / District",
      "radius_km": 0.5,
      "reasoning": "Exhaustive forensic visual explanation detailing architectural signatures, road geometry, vegetation biome, signage scripts, and solar clues observed."
    }
  ]
}"""

        prompt_text = "Perform deep forensic OSINT visual geolocation on this photograph and determine the exact geographic coordinates."
        if config.user_context:
            prompt_text += f"\nInvestigator Clue/Context: {config.user_context}"
        if config.analysis_mode == "agent":
            prompt_text += "\nDeep Analysis Mode: Exhaustively scrutinize micro-clues in the background, distant skyline, road signs, and vegetation."

        # Model fallback list for Google Gemini
        models_to_try = [self.model]
        if self.model not in ("gemini-3.6-flash", "gemini-flash-latest"):
            models_to_try.extend(["gemini-3.6-flash", "gemini-flash-latest"])
        else:
            models_to_try.extend(["gemini-3.5-flash", "gemini-flash-latest"])

        # Deduplicate while preserving order
        unique_models = []
        for m in models_to_try:
            cleaned_m = m.replace("models/", "")
            if cleaned_m not in unique_models:
                unique_models.append(cleaned_m)

        async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
            last_error = None
            for model_id in unique_models:
                url = f"{self.api_base}/models/{model_id}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"text": f"{system_instruction}\n\n{prompt_text}"},
                                {
                                    "inline_data": {
                                        "mime_type": mime_type,
                                        "data": base64_img
                                    }
                                }
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.1,
                        "maxOutputTokens": 2048
                    }
                }

                try:
                    response = await client.post(url, json=payload)
                    if response.status_code == 400 and "API_KEY_INVALID" in response.text:
                        raise HTTPException(
                            status_code=401,
                            detail="Invalid Google Gemini API Key. Please verify your API key from Google AI Studio."
                        )
                    elif response.status_code == 429:
                        if model_id != unique_models[-1]:
                            continue
                        raise HTTPException(
                            status_code=429,
                            detail="Google Gemini rate limit exceeded. Please wait a few seconds or try another model."
                        )
                    elif response.status_code >= 400:
                        if model_id != unique_models[-1]:
                            continue
                        raise HTTPException(
                            status_code=response.status_code,
                            detail=f"Google Gemini Error ({response.status_code}): {response.text}"
                        )

                    res_json = response.json()
                    candidates_data = res_json.get("candidates", [])
                    if not candidates_data:
                        raise HTTPException(status_code=502, detail="No output generated by Google Gemini model.")

                    text_output = ""
                    parts = candidates_data[0].get("content", {}).get("parts", [])
                    for p in parts:
                        if "text" in p:
                            text_output += p["text"]

                    parsed_data = self._extract_json(text_output)
                    candidates = self._parse_candidates(parsed_data)

                    elapsed_str = f"{time.time() - start_t:.2f}s"
                    return candidates, elapsed_str, None

                except HTTPException as he:
                    last_error = he
                    if he.status_code in (401, 403):
                        raise he
                except Exception as ex:
                    last_error = ex

            if isinstance(last_error, HTTPException):
                raise last_error
            raise HTTPException(status_code=500, detail=f"Gemini Visual Geolocation failed: {str(last_error)}")

    async def analyze_event(
        self,
        event_text: str,
        config: AnalysisConfigRequest
    ) -> Tuple[List[LocationCandidate], str, Optional[int]]:
        start_t = time.time()
        if not self.api_key:
            raise HTTPException(
                status_code=401,
                detail="Google Gemini API key not configured for Incident Text Geolocation."
            )

        system_instruction = """You are GeoGuard's expert OSINT Text & Incident Geolocation Engine.
Given a field dispatch, eyewitness report, news excerpt, or social media incident report, extract the precise geographic coordinates and named administrative hierarchy.

OUTPUT FORMAT:
Respond with STRICTLY valid JSON ONLY:
{
  "candidates": [
    {
      "rank": 1,
      "latitude": 48.8584,
      "longitude": 2.2945,
      "confidence": 0.92,
      "confidence_percentage": 92,
      "address": "Exact Street / Landmark, City, State, Country",
      "country": "Country",
      "state": "State/Province",
      "city": "City",
      "radius_km": 1.0,
      "reasoning": "Comprehensive breakdown of named geographic entities, intersections, topographic references, and cross-correlated landmarks."
    }
  ]
}"""

        url = f"{self.api_base}/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_instruction}\n\nIncident / Field Dispatch:\n{event_text}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 1500
            }
        }

        async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
            response = await client.post(url, json=payload)
            if response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=f"Gemini text analysis error: {response.text}")

            res_json = response.json()
            parts = res_json.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            text_output = "".join([p.get("text", "") for p in parts])
            parsed = self._extract_json(text_output)
            candidates = self._parse_candidates(parsed)
            return candidates, f"{time.time() - start_t:.2f}s", None
