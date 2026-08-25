import json
import time
from datetime import datetime
from typing import AsyncGenerator, Optional
from app.schemas.analysis import (
    GeolocationResult,
    PipelineStage,
    AnalysisConfigRequest,
    LocationCandidate,
)
from app.services.exif_service import extract_exif_data
from app.services.ocr_service import extract_ocr_data
from app.services.evidence_service import synthesize_evidence_and_contradictions
from app.providers.factory import get_provider

STAGES_DEFINITION = [
    ("stage_1", "Preparing image"),
    ("stage_2", "Extracting metadata"),
    ("stage_3", "Analyzing visible text"),
    ("stage_4", "Analyzing geographic clues"),
    ("stage_5", "Generating candidate locations"),
    ("stage_6", "Verifying evidence"),
    ("stage_7", "Preparing geographic result"),
]


def _create_initial_stages() -> list[PipelineStage]:
    return [
        PipelineStage(stage_id=s_id, name=s_name, status="pending", message="")
        for s_id, s_name in STAGES_DEFINITION
    ]


async def run_pipeline(
    image_bytes: bytes,
    filename: str,
    config: AnalysisConfigRequest
) -> GeolocationResult:
    """
    Executes the entire 7-stage GeoGuard visual geolocation pipeline synchronously.
    """
    start_total = time.time()
    stages = _create_initial_stages()

    # Stage 1: Preparing image
    stages[0].status = "processing"
    stages[0].message = f"Validating {filename} ({len(image_bytes) / 1024:.1f} KB)"
    stages[0].timestamp = datetime.utcnow().isoformat()
    stages[0].status = "completed"

    # Stage 2: Extracting metadata (EXIF)
    stages[1].status = "processing"
    stages[1].message = "Reading EXIF tags and GPS telemetry..."
    exif_data = extract_exif_data(image_bytes)
    if exif_data.has_gps:
        stages[1].message = f"Found hardware GPS coordinates ({exif_data.latitude}, {exif_data.longitude})"
    else:
        stages[1].message = f"Extracted camera metadata ({exif_data.make or 'No GPS tag'})"
    stages[1].status = "completed"

    # Stage 3: Analyzing visible text (OCR)
    stages[2].status = "processing"
    stages[2].message = "Scanning for signboards, scripts, and street typography..."
    ocr_data = extract_ocr_data(image_bytes)
    if ocr_data.has_text:
        stages[2].message = f"Detected {len(ocr_data.text_fragments)} text segments, scripts: {', '.join(ocr_data.scripts_detected) or 'Latin'}"
    else:
        stages[2].message = "No legible text or road signage identified"
    stages[2].status = "completed"

    # Stage 4 & 5: AI Visual Geolocation & Candidate Generation
    stages[3].status = "processing"
    stages[3].message = "Evaluating architectural features, biomes, and terrain..."
    
    provider = get_provider(
        provider_name=config.provider_override,
        api_key_override=config.api_key_override
    )

    candidates, duration, remaining = await provider.analyze_image(
        image_bytes=image_bytes,
        filename=filename,
        config=config
    )
    stages[3].status = "completed"

    stages[4].status = "processing"
    stages[4].message = f"Ranked {len(candidates)} geographic candidates"
    stages[4].status = "completed"

    # If EXIF GPS is present and real, ensure primary location can reflect true GPS
    primary: Optional[LocationCandidate] = candidates[0] if candidates else None
    if exif_data.has_gps and exif_data.latitude is not None and exif_data.longitude is not None:
        # Override primary with verified EXIF GPS coordinates
        exif_candidate = LocationCandidate(
            rank=1,
            latitude=exif_data.latitude,
            longitude=exif_data.longitude,
            confidence=0.98,
            confidence_percentage=98,
            address=f"EXIF GPS Coordinates ({exif_data.latitude:.4f}, {exif_data.longitude:.4f})",
            radius_km=0.1,
            reasoning=f"Verified hardware GPS coordinates embedded in photo metadata by {exif_data.make or 'camera'}."
        )
        if primary:
            exif_candidate.address = f"{primary.address} (EXIF Verified)"
            exif_candidate.country = primary.country
            exif_candidate.state = primary.state
            exif_candidate.city = primary.city
            candidates = [exif_candidate] + candidates
        else:
            candidates = [exif_candidate]
        primary = exif_candidate

    # Stage 6: Verifying evidence
    stages[5].status = "processing"
    stages[5].message = "Cross-verifying visual clues and evaluating contradictions..."
    evidence, contradictions = synthesize_evidence_and_contradictions(
        primary_candidate=primary,
        exif=exif_data,
        ocr=ocr_data,
        raw_reasoning=primary.reasoning if primary else None
    )
    stages[5].status = "completed"

    # Stage 7: Preparing geographic result
    stages[6].status = "processing"
    stages[6].message = "Assembling intelligence report..."
    stages[6].status = "completed"

    total_time = f"{time.time() - start_total:.2f}s"

    return GeolocationResult(
        status="success" if primary else "no_location",
        provider=provider.provider_name,
        is_mock=provider.is_mock,
        primary_location=primary,
        candidates=candidates,
        evidence=evidence,
        contradictions=contradictions,
        exif=exif_data,
        ocr=ocr_data,
        processing_time=total_time,
        api_requests_remaining=remaining,
        stages=stages
    )


async def run_pipeline_stream(
    image_bytes: bytes,
    filename: str,
    config: AnalysisConfigRequest
) -> AsyncGenerator[str, None]:
    """
    Streams Server-Sent Events (SSE) for each of the 7 pipeline stages as they happen.
    """
    start_total = time.time()
    stages = _create_initial_stages()

    async def _emit_event(event_type: str, data: dict):
        return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"

    # Stage 1
    stages[0].status = "processing"
    stages[0].message = f"Validating {filename} ({len(image_bytes) / 1024:.1f} KB)"
    yield await _emit_event("processing", {"stage": stages[0].model_dump()})
    stages[0].status = "completed"
    yield await _emit_event("processing", {"stage": stages[0].model_dump()})

    # Stage 2
    stages[1].status = "processing"
    stages[1].message = "Reading EXIF tags and GPS telemetry..."
    yield await _emit_event("processing", {"stage": stages[1].model_dump()})
    exif_data = extract_exif_data(image_bytes)
    stages[1].message = f"Extracted EXIF (GPS: {'Yes' if exif_data.has_gps else 'No'})"
    stages[1].status = "completed"
    yield await _emit_event("processing", {"stage": stages[1].model_dump()})

    # Stage 3
    stages[2].status = "processing"
    stages[2].message = "Scanning for visible text, signage, and scripts..."
    yield await _emit_event("processing", {"stage": stages[2].model_dump()})
    ocr_data = extract_ocr_data(image_bytes)
    stages[2].message = f"OCR complete ({len(ocr_data.text_fragments)} fragments found)"
    stages[2].status = "completed"
    yield await _emit_event("processing", {"stage": stages[2].model_dump()})

    # Stage 4
    stages[3].status = "processing"
    stages[3].message = "Analyzing geographic clues and scene architecture..."
    yield await _emit_event("processing", {"stage": stages[3].model_dump()})

    provider = get_provider(
        provider_name=config.provider_override,
        api_key_override=config.api_key_override
    )

    candidates, duration, remaining = await provider.analyze_image(
        image_bytes=image_bytes,
        filename=filename,
        config=config
    )
    stages[3].status = "completed"
    yield await _emit_event("processing", {"stage": stages[3].model_dump()})

    # Stage 5
    stages[4].status = "processing"
    stages[4].message = f"Generated {len(candidates)} candidate locations"
    stages[4].status = "completed"
    yield await _emit_event("processing", {"stage": stages[4].model_dump()})

    primary: Optional[LocationCandidate] = candidates[0] if candidates else None
    if exif_data.has_gps and exif_data.latitude is not None and exif_data.longitude is not None:
        exif_candidate = LocationCandidate(
            rank=1,
            latitude=exif_data.latitude,
            longitude=exif_data.longitude,
            confidence=0.98,
            confidence_percentage=98,
            address=f"EXIF GPS ({exif_data.latitude:.4f}, {exif_data.longitude:.4f})",
            radius_km=0.1,
            reasoning="Verified direct hardware GPS telemetry."
        )
        candidates = [exif_candidate] + candidates
        primary = exif_candidate

    # Stage 6
    stages[5].status = "processing"
    stages[5].message = "Cross-verifying evidence and checking contradictions..."
    yield await _emit_event("processing", {"stage": stages[5].model_dump()})
    evidence, contradictions = synthesize_evidence_and_contradictions(
        primary_candidate=primary,
        exif=exif_data,
        ocr=ocr_data,
        raw_reasoning=primary.reasoning if primary else None
    )
    stages[5].status = "completed"
    yield await _emit_event("processing", {"stage": stages[5].model_dump()})

    # Stage 7
    stages[6].status = "processing"
    stages[6].message = "Finalizing geographic intelligence report..."
    stages[6].status = "completed"
    yield await _emit_event("processing", {"stage": stages[6].model_dump()})

    total_time = f"{time.time() - start_total:.2f}s"

    final_result = GeolocationResult(
        status="success" if primary else "no_location",
        provider=provider.provider_name,
        is_mock=provider.is_mock,
        primary_location=primary,
        candidates=candidates,
        evidence=evidence,
        contradictions=contradictions,
        exif=exif_data,
        ocr=ocr_data,
        processing_time=total_time,
        api_requests_remaining=remaining,
        stages=stages
    )

    yield await _emit_event("completed", {"result": final_result.model_dump()})
