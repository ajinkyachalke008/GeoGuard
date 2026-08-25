from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class LocationCandidate(BaseModel):
    rank: int = 1
    latitude: float
    longitude: float
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    confidence_percentage: int = Field(..., ge=0, le=100)
    address: str
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    radius_km: Optional[float] = Field(default=None, description="Estimated uncertainty radius in kilometers")
    reasoning: Optional[str] = None


class EvidenceItem(BaseModel):
    category: Literal[
        "Architecture",
        "Roads",
        "Language",
        "Vehicles",
        "Infrastructure",
        "Environment",
        "Landmarks"
    ]
    description: str
    strength: Literal["Strong", "Moderate", "Supporting"]
    source: Literal["OCR", "EXIF", "AI Vision", "Spatial Correlation"]
    details: Optional[str] = None


class ContradictionItem(BaseModel):
    description: str
    effect: Literal["Low uncertainty", "Medium uncertainty", "High uncertainty"]
    category: str
    scientific_note: Optional[str] = None


class ExifData(BaseModel):
    has_gps: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude: Optional[float] = None
    make: Optional[str] = None
    model: Optional[str] = None
    lens: Optional[str] = None
    captured_at: Optional[str] = None
    software: Optional[str] = None
    orientation: Optional[int] = None
    dimensions: Optional[str] = None
    location_source: Literal["EXIF GPS", "AI Inference", "None"] = "AI Inference"
    raw_tags: Optional[Dict[str, Any]] = None


class OcrResult(BaseModel):
    has_text: bool = False
    full_text: str = ""
    text_fragments: List[str] = []
    scripts_detected: List[str] = []
    languages_detected: List[str] = []
    signs_identified: List[str] = []
    phone_numbers: List[str] = []
    urls: List[str] = []


class PipelineStage(BaseModel):
    stage_id: str
    name: str
    status: Literal["pending", "processing", "completed", "failed"] = "pending"
    message: str = ""
    timestamp: Optional[str] = None
    duration_ms: Optional[int] = None


class GeolocationResult(BaseModel):
    status: Literal["success", "error", "no_location"] = "success"
    provider: str = "mock"
    is_mock: bool = True
    primary_location: Optional[LocationCandidate] = None
    candidates: List[LocationCandidate] = []
    evidence: List[EvidenceItem] = []
    contradictions: List[ContradictionItem] = []
    exif: Optional[ExifData] = None
    ocr: Optional[OcrResult] = None
    processing_time: str = "0.0s"
    api_requests_remaining: Optional[int] = None
    stages: List[PipelineStage] = []
    error_message: Optional[str] = None


class AnalysisConfigRequest(BaseModel):
    analysis_mode: Literal["fast", "agent", "event"] = "fast"
    user_context: Optional[str] = None
    event_text: Optional[str] = None
    provider_override: Optional[str] = None
    api_key_override: Optional[str] = None


class AppConfigResponse(BaseModel):
    provider: str
    is_mock: bool
    model_name: Optional[str] = None
    allowed_extensions: List[str]
    max_file_size_mb: int
    environment: str
    has_custom_api_key: bool
