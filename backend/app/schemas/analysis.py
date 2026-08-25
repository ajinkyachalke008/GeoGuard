from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class CoordinateFormats(BaseModel):
    decimal_degrees: str = Field(..., description="e.g. '48.858370, 2.294481'")
    dms: str = Field(..., description="Degrees, Minutes, Seconds e.g. '48° 51' 30.13\" N, 2° 17' 40.13\" E'")
    mgrs: str = Field(..., description="Military Grid Reference System e.g. '31U DQ 48251 11932'")
    utm: str = Field(..., description="Universal Transverse Mercator e.g. '31N 448251 5411932'")
    plus_code: str = Field(..., description="Open Location Code e.g. '8FW4V75R+9R'")


class SolarData(BaseModel):
    solar_azimuth_deg: float = Field(..., description="Solar azimuth in degrees (0 = North, 90 = East, 180 = South, 270 = West)")
    solar_elevation_deg: float = Field(..., description="Solar elevation angle above horizon in degrees")
    shadow_azimuth_deg: float = Field(..., description="Direction shadow is cast (azimuth + 180 mod 360)")
    shadow_length_factor: float = Field(..., description="Multiplier for shadow length relative to object height (cotangent of elevation)")
    solar_time: str = Field(..., description="Local apparent solar time or UTC calculation timestamp")
    sun_state: Literal["Daylight", "Golden Hour", "Civil Twilight", "Dusk / Dawn", "Night"] = "Daylight"
    notes: str = ""


class OsmAmenity(BaseModel):
    name: str
    category: str
    amenity_type: str
    distance_meters: float
    latitude: float
    longitude: float


class OsmVerification(BaseModel):
    osm_id: Optional[int] = None
    osm_type: Optional[str] = None
    display_name: str = ""
    road: Optional[str] = None
    suburb: Optional[str] = None
    city: Optional[str] = None
    county: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    postcode: Optional[str] = None
    bounding_box: Optional[List[float]] = None
    nearby_amenities: List[OsmAmenity] = []
    ground_truth_score: int = Field(default=85, ge=0, le=100)


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
    coordinates_formatted: Optional[CoordinateFormats] = None
    elevation_meters: Optional[float] = None
    osm_verification: Optional[OsmVerification] = None


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
    source: Literal["OCR", "EXIF", "AI Vision", "Spatial Correlation", "OSM Ground Truth", "Solar Telemetry"]
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
    gps_img_direction: Optional[float] = Field(default=None, description="Camera compass direction in degrees")
    make: Optional[str] = None
    model: Optional[str] = None
    lens: Optional[str] = None
    focal_length_mm: Optional[float] = None
    focal_length_35mm: Optional[float] = None
    f_number: Optional[float] = None
    exposure_time: Optional[str] = None
    iso_speed: Optional[int] = None
    exposure_bias: Optional[str] = None
    white_balance: Optional[str] = None
    flash: Optional[str] = None
    metering_mode: Optional[str] = None
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
    provider: str = "gemini"
    is_mock: bool = False
    primary_location: Optional[LocationCandidate] = None
    candidates: List[LocationCandidate] = []
    evidence: List[EvidenceItem] = []
    contradictions: List[ContradictionItem] = []
    exif: Optional[ExifData] = None
    ocr: Optional[OcrResult] = None
    solar_data: Optional[SolarData] = None
    osm_verification: Optional[OsmVerification] = None
    elevation_meters: Optional[float] = None
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
