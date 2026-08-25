from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import StreamingResponse
from app.config.settings import settings
from app.schemas.analysis import (
    GeolocationResult,
    AnalysisConfigRequest,
    AppConfigResponse,
    SolarData,
    OsmVerification,
    LocationCandidate,
)
from app.utils.image_validator import validate_and_read_image
from app.services.pipeline_service import run_pipeline, run_pipeline_stream
from app.services.osm_service import reverse_geocode_osm, lookup_nearby_amenities, get_elevation_m
from app.services.solar_service import calculate_solar_position, format_all_coordinates
from app.services.evidence_service import synthesize_evidence_and_contradictions
from app.schemas.analysis import ExifData, OcrResult
from app.providers.factory import get_provider

router = APIRouter(prefix="/api", tags=["geoguard"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "GeoGuard Geolocation Intelligence API",
        "version": "2.0.0"
    }


@router.get("/config", response_model=AppConfigResponse)
async def get_app_config():
    is_mock = settings.GEOLOCATION_PROVIDER.lower() == "mock"
    model = None
    has_key = False
    
    prov = settings.GEOLOCATION_PROVIDER.lower()
    if prov in ("gemini", "google"):
        model = settings.GEMINI_MODEL
        has_key = bool(settings.GEMINI_API_KEY.strip())
    elif prov == "openrouter":
        model = settings.OPENROUTER_MODEL
        has_key = bool(settings.OPENROUTER_API_KEY.strip())
    elif prov == "openai":
        model = settings.OPENAI_MODEL
        has_key = bool(settings.OPENAI_API_KEY.strip())
    elif prov in ("claude", "anthropic"):
        model = settings.ANTHROPIC_MODEL
        has_key = bool(settings.ANTHROPIC_API_KEY.strip())
    elif prov == "geoseer":
        has_key = bool(settings.GEOSEER_API_KEY.strip())

    return AppConfigResponse(
        provider=settings.GEOLOCATION_PROVIDER,
        is_mock=is_mock,
        model_name=model,
        allowed_extensions=settings.allowed_extensions_list,
        max_file_size_mb=settings.MAX_FILE_SIZE_MB,
        environment=settings.ENVIRONMENT,
        has_custom_api_key=has_key
    )


@router.post("/analyze", response_model=GeolocationResult)
async def analyze_image_endpoint(
    file: UploadFile = File(...),
    analysis_mode: str = Form("fast"),
    user_context: Optional[str] = Form(None),
    provider_override: Optional[str] = Form(None),
    api_key_override: Optional[str] = Form(None),
):
    """
    Analyzes an uploaded image file, extracts optical EXIF and OCR, runs AI geolocation,
    cross-references OpenStreetMap & Solar geometry, and returns full intelligence report.
    """
    image_bytes, img_format, width, height = await validate_and_read_image(file)

    config = AnalysisConfigRequest(
        analysis_mode=analysis_mode,
        user_context=user_context,
        provider_override=provider_override,
        api_key_override=api_key_override
    )

    result = await run_pipeline(
        image_bytes=image_bytes,
        filename=file.filename or "image.jpg",
        config=config
    )
    return result


@router.post("/analyze/stream")
async def analyze_image_stream_endpoint(
    file: UploadFile = File(...),
    analysis_mode: str = Form("fast"),
    user_context: Optional[str] = Form(None),
    provider_override: Optional[str] = Form(None),
    api_key_override: Optional[str] = Form(None),
):
    """
    Server-Sent Events (SSE) streaming endpoint pushing live progress events for each analysis stage.
    """
    image_bytes, img_format, width, height = await validate_and_read_image(file)

    config = AnalysisConfigRequest(
        analysis_mode=analysis_mode,
        user_context=user_context,
        provider_override=provider_override,
        api_key_override=api_key_override
    )

    return StreamingResponse(
        run_pipeline_stream(
            image_bytes=image_bytes,
            filename=file.filename or "image.jpg",
            config=config
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/analyze/event", response_model=GeolocationResult)
async def analyze_event_endpoint(
    event_text: str = Form(...),
    provider_override: Optional[str] = Form(None),
    api_key_override: Optional[str] = Form(None),
):
    """
    Analyzes field dispatches, incident text, or news excerpts (Text-to-Geo)
    and resolves coordinates via LLM reasoning + OpenStreetMap verification.
    """
    config = AnalysisConfigRequest(
        analysis_mode="event",
        event_text=event_text,
        provider_override=provider_override,
        api_key_override=api_key_override
    )

    provider = get_provider(
        provider_name=config.provider_override,
        api_key_override=config.api_key_override
    )

    candidates, duration, remaining = await provider.analyze_event(
        event_text=event_text,
        config=config
    )

    primary: Optional[LocationCandidate] = candidates[0] if candidates else None
    osm_data: Optional[OsmVerification] = None
    elevation_val: Optional[float] = None
    solar_data: Optional[SolarData] = None

    if primary:
        primary.coordinates_formatted = format_all_coordinates(primary.latitude, primary.longitude)
        osm_data = await reverse_geocode_osm(primary.latitude, primary.longitude)
        primary.osm_verification = osm_data
        if osm_data.display_name:
            primary.address = osm_data.display_name
        elevation_val = await get_elevation_m(primary.latitude, primary.longitude)
        primary.elevation_meters = elevation_val
        solar_data = calculate_solar_position(primary.latitude, primary.longitude)

        for c in candidates[1:]:
            c.coordinates_formatted = format_all_coordinates(c.latitude, c.longitude)

    dummy_exif = ExifData(has_gps=False, location_source="AI Inference")
    dummy_ocr = OcrResult(has_text=False)
    evidence, contradictions = synthesize_evidence_and_contradictions(
        primary_candidate=primary,
        exif=dummy_exif,
        ocr=dummy_ocr,
        solar=solar_data,
        osm=osm_data,
        raw_reasoning=primary.reasoning if primary else None
    )

    return GeolocationResult(
        status="success" if primary else "no_location",
        provider=provider.provider_name,
        is_mock=provider.is_mock,
        primary_location=primary,
        candidates=candidates,
        evidence=evidence,
        contradictions=contradictions,
        exif=dummy_exif,
        ocr=dummy_ocr,
        solar_data=solar_data,
        osm_verification=osm_data,
        elevation_meters=elevation_val,
        processing_time=duration,
        api_requests_remaining=remaining,
        stages=[]
    )


@router.get("/osm/reverse", response_model=OsmVerification)
async def get_osm_reverse(lat: float = Query(...), lon: float = Query(...)):
    """Direct OpenStreetMap Nominatim reverse geocode query."""
    return await reverse_geocode_osm(lat, lon)


@router.get("/osm/nearby")
async def get_osm_nearby(lat: float = Query(...), lon: float = Query(...), radius: int = Query(1500)):
    """Direct Overpass API query for real-world infrastructure near coordinates."""
    amenities = await lookup_nearby_amenities(lat, lon, radius)
    return {"amenities": amenities, "count": len(amenities)}


@router.get("/solar", response_model=SolarData)
async def get_solar_data(lat: float = Query(...), lon: float = Query(...), datetime_str: Optional[str] = Query(None)):
    """Computes NOAA solar azimuth, elevation, and shadow vector."""
    return calculate_solar_position(lat, lon, datetime_str)
