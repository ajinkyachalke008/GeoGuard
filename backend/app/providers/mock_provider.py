import asyncio
import hashlib
import time
from typing import List, Optional
from app.schemas.analysis import LocationCandidate, AnalysisConfigRequest
from app.providers.base import BaseGeolocationProvider

MOCK_SCENARIOS = [
    {
        "primary": {
            "latitude": 16.7050,
            "longitude": 74.2433,
            "confidence": 0.78,
            "confidence_percentage": 78,
            "address": "Kolhapur, Maharashtra, India",
            "country": "India",
            "state": "Maharashtra",
            "city": "Kolhapur",
            "district": "Kolhapur District",
            "radius_km": 4.5,
            "reasoning": "Basalt stone architectural morphology, red laterite soil characteristics, Devanagari/Marathi script patterns, and Western Ghats foothill topography correlate strongly with southwestern Maharashtra."
        },
        "candidates": [
            {
                "rank": 1,
                "latitude": 16.7050,
                "longitude": 74.2433,
                "confidence": 0.78,
                "confidence_percentage": 78,
                "address": "Kolhapur, Maharashtra, India",
                "country": "India",
                "state": "Maharashtra",
                "city": "Kolhapur",
                "district": "Kolhapur District",
                "radius_km": 4.5,
                "reasoning": "High-density correlation with Deccan architectural style and local road boundary infrastructure."
            },
            {
                "rank": 2,
                "latitude": 18.5204,
                "longitude": 73.8567,
                "confidence": 0.14,
                "confidence_percentage": 14,
                "address": "Pune, Maharashtra, India",
                "country": "India",
                "state": "Maharashtra",
                "city": "Pune",
                "district": "Pune District",
                "radius_km": 15.0,
                "reasoning": "Shared Marathi language markers and urban-suburban transit density patterns."
            },
            {
                "rank": 3,
                "latitude": 17.6805,
                "longitude": 74.0183,
                "confidence": 0.08,
                "confidence_percentage": 8,
                "address": "Satara, Maharashtra, India",
                "country": "India",
                "state": "Maharashtra",
                "city": "Satara",
                "district": "Satara District",
                "radius_km": 20.0,
                "reasoning": "Adjacent geographic corridor with comparable flora and soil composition."
            }
        ]
    },
    {
        "primary": {
            "latitude": 48.8584,
            "longitude": 2.2945,
            "confidence": 0.94,
            "confidence_percentage": 94,
            "address": "Paris, Île-de-France, France",
            "country": "France",
            "state": "Île-de-France",
            "city": "Paris",
            "district": "7th Arrondissement",
            "radius_km": 0.8,
            "reasoning": "Haussmannian dressed-stone residential facades, standard Parisian slate-and-zinc mansard roofing, French street plaque design, and Seine valley river basin atmospheric lighting."
        },
        "candidates": [
            {
                "rank": 1,
                "latitude": 48.8584,
                "longitude": 2.2945,
                "confidence": 0.94,
                "confidence_percentage": 94,
                "address": "Paris, Île-de-France, France",
                "country": "France",
                "state": "Île-de-France",
                "city": "Paris",
                "district": "7th Arrondissement",
                "radius_km": 0.8,
                "reasoning": "Distinctive European neoclassical capital architecture and street layout."
            },
            {
                "rank": 2,
                "latitude": 45.7640,
                "longitude": 4.8357,
                "confidence": 0.04,
                "confidence_percentage": 4,
                "address": "Lyon, Auvergne-Rhône-Alpes, France",
                "country": "France",
                "state": "Auvergne-Rhône-Alpes",
                "city": "Lyon",
                "radius_km": 10.0,
                "reasoning": "French urban pavement standards and historical masonry similarities."
            },
            {
                "rank": 3,
                "latitude": 50.8503,
                "longitude": 4.3517,
                "confidence": 0.02,
                "confidence_percentage": 2,
                "address": "Brussels, Belgium",
                "country": "Belgium",
                "state": "Brussels Capital",
                "city": "Brussels",
                "radius_km": 18.0,
                "reasoning": "Western European architectural influence and temperate vegetation."
            }
        ]
    },
    {
        "primary": {
            "latitude": 35.6595,
            "longitude": 139.7005,
            "confidence": 0.89,
            "confidence_percentage": 89,
            "address": "Shibuya, Tokyo, Japan",
            "country": "Japan",
            "state": "Tokyo Metropolis",
            "city": "Tokyo",
            "district": "Shibuya City",
            "radius_km": 1.2,
            "reasoning": "High-density commercial signage with Kanji/Katakana typography, left-side traffic flow, Japanese utility cabling conduits, and distinct asphalt resurfacing borders."
        },
        "candidates": [
            {
                "rank": 1,
                "latitude": 35.6595,
                "longitude": 139.7005,
                "confidence": 0.89,
                "confidence_percentage": 89,
                "address": "Shibuya, Tokyo, Japan",
                "country": "Japan",
                "state": "Tokyo Metropolis",
                "city": "Tokyo",
                "district": "Shibuya City",
                "radius_km": 1.2,
                "reasoning": "Iconic Tokyo commercial corridor architecture and visual density."
            },
            {
                "rank": 2,
                "latitude": 35.6938,
                "longitude": 139.7034,
                "confidence": 0.08,
                "confidence_percentage": 8,
                "address": "Shinjuku, Tokyo, Japan",
                "country": "Japan",
                "state": "Tokyo Metropolis",
                "city": "Tokyo",
                "district": "Shinjuku City",
                "radius_km": 3.0,
                "reasoning": "Adjacent high-density metropolitan commercial precinct."
            },
            {
                "rank": 3,
                "latitude": 34.6937,
                "longitude": 135.5023,
                "confidence": 0.03,
                "confidence_percentage": 3,
                "address": "Osaka, Japan",
                "country": "Japan",
                "state": "Osaka Prefecture",
                "city": "Osaka",
                "radius_km": 12.0,
                "reasoning": "Regional Japanese urban architectural standards."
            }
        ]
    },
    {
        "primary": {
            "latitude": 36.0544,
            "longitude": -112.1401,
            "confidence": 0.86,
            "confidence_percentage": 86,
            "address": "Grand Canyon Village, Arizona, United States",
            "country": "United States",
            "state": "Arizona",
            "city": "Grand Canyon Village",
            "district": "Coconino County",
            "radius_km": 6.0,
            "reasoning": "Eroded sandstone and Kaibab limestone stratigraphy, semi-arid Colorado Plateau ecosystem, pinyon-juniper woodland cover, and dramatic canyon geological formations."
        },
        "candidates": [
            {
                "rank": 1,
                "latitude": 36.0544,
                "longitude": -112.1401,
                "confidence": 0.86,
                "confidence_percentage": 86,
                "address": "Grand Canyon Village, Arizona, United States",
                "country": "United States",
                "state": "Arizona",
                "city": "Grand Canyon Village",
                "radius_km": 6.0,
                "reasoning": "Permian geological rock layer stratification."
            },
            {
                "rank": 2,
                "latitude": 34.8697,
                "longitude": -111.7610,
                "confidence": 0.09,
                "confidence_percentage": 9,
                "address": "Sedona, Arizona, United States",
                "country": "United States",
                "state": "Arizona",
                "city": "Sedona",
                "radius_km": 15.0,
                "reasoning": "Red rock sandstone formations in northern Arizona."
            },
            {
                "rank": 3,
                "latitude": 37.2982,
                "longitude": -113.0263,
                "confidence": 0.05,
                "confidence_percentage": 5,
                "address": "Zion National Park, Utah, United States",
                "country": "United States",
                "state": "Utah",
                "city": "Springdale",
                "radius_km": 25.0,
                "reasoning": "Navajo sandstone plateau canyon geography."
            }
        ]
    }
]


class MockGeolocationProvider(BaseGeolocationProvider):
    """
    Offline Mock Geolocation Provider.
    Generates rich, authentic geographic predictions, candidates, and reasoning without calling any external API.
    """

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def is_mock(self) -> bool:
        return True

    async def analyze_image(
        self,
        image_bytes: bytes,
        filename: str,
        config: AnalysisConfigRequest
    ) -> tuple[List[LocationCandidate], str, Optional[int]]:
        start_time = time.time()
        await asyncio.sleep(0.6)  # Paced for realistic pipeline progression

        # Deterministically select scenario based on filename / hash or context
        context_str = (config.user_context or filename).lower()
        if "paris" in context_str or "france" in context_str or "tower" in context_str:
            scenario = MOCK_SCENARIOS[1]
        elif "japan" in context_str or "tokyo" in context_str or "shibuya" in context_str:
            scenario = MOCK_SCENARIOS[2]
        elif "canyon" in context_str or "usa" in context_str or "mountain" in context_str:
            scenario = MOCK_SCENARIOS[3]
        elif "india" in context_str or "kolhapur" in context_str or "maharashtra" in context_str:
            scenario = MOCK_SCENARIOS[0]
        else:
            # Deterministic hash of image content
            h = int(hashlib.md5(image_bytes[:1024]).hexdigest(), 16)
            idx = h % len(MOCK_SCENARIOS)
            scenario = MOCK_SCENARIOS[idx]

        candidates = [LocationCandidate(**c) for c in scenario["candidates"]]
        duration = f"{time.time() - start_time:.1f}s"
        return candidates, duration, 999

    async def analyze_event(
        self,
        event_text: str,
        config: AnalysisConfigRequest
    ) -> tuple[List[LocationCandidate], str, Optional[int]]:
        start_time = time.time()
        await asyncio.sleep(0.5)

        text_lower = event_text.lower()
        if "world cup" in text_lower or "qatar" in text_lower:
            candidates = [
                LocationCandidate(
                    rank=1,
                    latitude=25.420791,
                    longitude=51.4903763,
                    confidence=0.88,
                    confidence_percentage=88,
                    address="Lusail Iconic Stadium, Lusail, Qatar",
                    country="Qatar",
                    city="Lusail",
                    radius_km=1.5,
                    reasoning="Event reference correlates directly with the 2022 FIFA World Cup Final venue at Lusail Stadium."
                )
            ]
        elif "eiffel" in text_lower or "olympics" in text_lower:
            candidates = [
                LocationCandidate(
                    rank=1,
                    latitude=48.8584,
                    longitude=2.2945,
                    confidence=0.92,
                    confidence_percentage=92,
                    address="Champ de Mars, Paris, France",
                    country="France",
                    city="Paris",
                    radius_km=0.5,
                    reasoning="Event reference correlates with major celebrations and Olympic events at Champ de Mars."
                )
            ]
        else:
            candidates = [LocationCandidate(**c) for c in MOCK_SCENARIOS[0]["candidates"]]

        duration = f"{time.time() - start_time:.1f}s"
        return candidates, duration, 999
