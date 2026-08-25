import math
from typing import Optional, List, Dict, Any
import httpx
from app.config.settings import settings
from app.schemas.analysis import OsmVerification, OsmAmenity


def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in meters between two lat/lon points."""
    R = 6371000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)


async def reverse_geocode_osm(lat: float, lon: float) -> OsmVerification:
    """
    Reverse geocodes coordinates against OpenStreetMap Nominatim API for real-world address hierarchy.
    """
    headers = {
        "User-Agent": settings.NOMINATIM_USER_AGENT,
        "Accept": "application/json"
    }
    url = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat:.6f}&lon={lon:.6f}&zoom=18&addressdetails=1"

    verification = OsmVerification(
        display_name="",
        ground_truth_score=85
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                verification.osm_id = data.get("osm_id")
                verification.osm_type = data.get("osm_type")
                verification.display_name = data.get("display_name", "")
                
                addr: Dict[str, Any] = data.get("address", {})
                verification.road = addr.get("road") or addr.get("pedestrian") or addr.get("street")
                verification.suburb = addr.get("suburb") or addr.get("neighbourhood") or addr.get("quarter")
                verification.city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("municipality")
                verification.county = addr.get("county") or addr.get("district")
                verification.state = addr.get("state") or addr.get("province") or addr.get("region")
                verification.country = addr.get("country")
                verification.country_code = (addr.get("country_code") or "").upper()
                verification.postcode = addr.get("postcode")
                
                bbox = data.get("boundingbox")
                if bbox and len(bbox) == 4:
                    verification.bounding_box = [float(x) for x in bbox]
                
                verification.ground_truth_score = 95
    except Exception:
        # Graceful fallback if rate-limited or offline
        pass

    return verification


async def lookup_nearby_amenities(lat: float, lon: float, radius_meters: int = 1500) -> List[OsmAmenity]:
    """
    Queries the OpenStreetMap Overpass API for real landmarks, transit nodes, infrastructure,
    and places of worship within the radius around the predicted location.
    """
    overpass_query = f"""[out:json][timeout:10];
(
  node["amenity"~"place_of_worship|police|hospital|townhall|school|university|bank|ferry_terminal"](around:{radius_meters},{lat:.6f},{lon:.6f});
  node["tourism"~"viewpoint|attraction|monument|artwork|museum"](around:{radius_meters},{lat:.6f},{lon:.6f});
  node["railway"~"station|subway_entrance|tram_stop"](around:{radius_meters},{lat:.6f},{lon:.6f});
  node["man_made"~"tower|communications_tower|lighthouse|bridge|flagpole"](around:{radius_meters},{lat:.6f},{lon:.6f});
  node["historic"~"memorial|monument|castle|ruins|archaeological_site"](around:{radius_meters},{lat:.6f},{lon:.6f});
);
out center 15;"""

    amenities: List[OsmAmenity] = []
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": overpass_query},
                headers={"User-Agent": settings.NOMINATIM_USER_AGENT}
            )
            if res.status_code == 200:
                data = res.json()
                for el in data.get("elements", []):
                    tags = el.get("tags", {})
                    name = tags.get("name") or tags.get("name:en") or tags.get("description")
                    if not name:
                        continue
                    
                    cat = "Amenity"
                    sub_type = "Infrastructure"
                    if "amenity" in tags:
                        cat = "Public / Religious"
                        sub_type = tags["amenity"].replace("_", " ").title()
                    elif "tourism" in tags:
                        cat = "Tourism / Landmark"
                        sub_type = tags["tourism"].replace("_", " ").title()
                    elif "railway" in tags:
                        cat = "Transit & Rail"
                        sub_type = tags["railway"].replace("_", " ").title()
                    elif "historic" in tags:
                        cat = "Heritage & Historic"
                        sub_type = tags["historic"].replace("_", " ").title()
                    elif "man_made" in tags:
                        cat = "Structure / Tower"
                        sub_type = tags["man_made"].replace("_", " ").title()

                    node_lat = el.get("lat") or el.get("center", {}).get("lat", lat)
                    node_lon = el.get("lon") or el.get("center", {}).get("lon", lon)
                    dist = _haversine_distance(lat, lon, node_lat, node_lon)

                    amenities.append(
                        OsmAmenity(
                            name=str(name),
                            category=cat,
                            amenity_type=sub_type,
                            distance_meters=dist,
                            latitude=round(node_lat, 6),
                            longitude=round(node_lon, 6)
                        )
                    )

                amenities.sort(key=lambda a: a.distance_meters)
    except Exception:
        pass

    return amenities[:10]


async def get_elevation_m(lat: float, lon: float) -> Optional[float]:
    """
    Fetches real surface elevation in meters above sea level using Open-Meteo elevation API.
    """
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(f"https://api.open-meteo.com/v1/elevation?latitude={lat:.6f}&longitude={lon:.6f}")
            if res.status_code == 200:
                data = res.json()
                elevation_list = data.get("elevation", [])
                if elevation_list:
                    return round(float(elevation_list[0]), 1)
    except Exception:
        pass
    return None
