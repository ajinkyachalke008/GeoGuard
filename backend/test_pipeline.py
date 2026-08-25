import asyncio
import io
from PIL import Image
from app.config.settings import settings
from app.services.solar_service import calculate_solar_position, format_all_coordinates
from app.services.osm_service import reverse_geocode_osm, lookup_nearby_amenities, get_elevation_m
from app.services.exif_service import extract_exif_data
from app.schemas.analysis import AnalysisConfigRequest
from app.services.pipeline_service import run_pipeline


async def test_solar_and_coords():
    print("--- 1. Testing Solar & Coordinates Engine ---")
    coords = format_all_coordinates(48.8584, 2.2945)
    print(f"Decimal Degrees: {coords.decimal_degrees}")
    print(f"DMS: {coords.dms}")
    print(f"MGRS: {coords.mgrs}")
    print(f"UTM: {coords.utm}")
    print(f"Plus Code: {coords.plus_code}")

    solar = calculate_solar_position(48.8584, 2.2945, "2026:06:21 12:00:00")
    print(f"Solar Azimuth: {solar.solar_azimuth_deg}°")
    print(f"Solar Elevation: {solar.solar_elevation_deg}°")
    print(f"Shadow Azimuth: {solar.shadow_azimuth_deg}°")
    print(f"Sun State: {solar.sun_state}")
    print(f"Notes: {solar.notes}")
    assert solar.solar_azimuth_deg > 0


async def test_osm_services():
    print("\n--- 2. Testing OpenStreetMap Nominatim & Elevation ---")
    osm = await reverse_geocode_osm(48.8584, 2.2945)
    print(f"OSM Address: {osm.display_name}")
    print(f"Road: {osm.road}, City: {osm.city}, Country: {osm.country}")
    
    elev = await get_elevation_m(48.8584, 2.2945)
    print(f"Elevation: {elev} meters")

    amenities = await lookup_nearby_amenities(48.8584, 2.2945, radius_meters=1000)
    print(f"Nearby OSM Amenities found: {len(amenities)}")
    for a in amenities[:3]:
        print(f"  - {a.name} ({a.amenity_type}) at {a.distance_meters}m")


async def test_gemini_and_pipeline():
    print("\n--- 3. Testing Pipeline with Image Generation ---")
    # Generate test dummy image in memory
    img = Image.new("RGB", (300, 200), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    cfg = AnalysisConfigRequest(
        analysis_mode="fast",
        user_context="European stone building near Paris Eiffel tower"
    )

    print(f"Active Provider: {settings.GEOLOCATION_PROVIDER}")
    res = await run_pipeline(img_bytes, "test.jpg", cfg)
    print(f"Result Status: {res.status}")
    print(f"Provider Used: {res.provider} (is_mock: {res.is_mock})")
    if res.primary_location:
        print(f"Primary Location: {res.primary_location.address}")
        print(f"Coordinates: {res.primary_location.latitude}, {res.primary_location.longitude}")
        print(f"Confidence: {res.primary_location.confidence_percentage}%")
        print(f"Formatted Coords: {res.primary_location.coordinates_formatted}")
    print(f"Evidence Count: {len(res.evidence)}")
    print(f"Contradictions Count: {len(res.contradictions)}")
    print(f"Processing Time: {res.processing_time}")


async def main():
    await test_solar_and_coords()
    await test_osm_services()
    await test_gemini_and_pipeline()
    print("\n ALL BACKEND TESTS PASSED!")


if __name__ == "__main__":
    asyncio.run(main())
