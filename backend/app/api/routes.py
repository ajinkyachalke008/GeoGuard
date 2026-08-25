from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.config.settings import settings
from app.schemas.analysis import (
    GeolocationResult,
    AnalysisConfigRequest,
    AppConfigResponse,
)
from app.utils.image_validator import validate_and_read_image
from app.services.pipeline_service import run_pipeline, run_pipeline_stream
from app.providers.factory import get_provider

router = APIRouter(prefix="/api", tags=["geoguard"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "GeoGuard Geolocation Intelligence API",
        "version": "1.0.0"
    }


@router.get("/config", response_model=AppConfigResponse)
async def get_app_config():
    is_mock = settings.GEOLOCATION_PROVIDER.lower() == "mock"
    model = None
    has_key = False
    if settings.GEOLOCATION_PROVIDER.lower() == "openrouter":
        model = settings.OPENROUTER_MODEL
        has_key = bool(settings.OPENROUTER_API_KEY.strip())
    elif settings.GEOLOCATION_PROVIDER.lower() == "openai":
        model = settings.OPENAI_MODEL
        has_key = bool(settings.OPENAI_API_KEY.strip())
    elif settings.GEOLOCATION_PROVIDER.lower() == "geoseer":
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
    Analyzes an uploaded image file, extracts EXIF and OCR, runs AI geolocation, and returns full intelligence report.
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
