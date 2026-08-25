export type EvidenceCategory =
  | 'Architecture'
  | 'Roads'
  | 'Language'
  | 'Vehicles'
  | 'Infrastructure'
  | 'Environment'
  | 'Landmarks';

export interface CoordinateFormats {
  decimal_degrees: string;
  dms: string;
  mgrs: string;
  utm: string;
  plus_code: string;
}

export interface SolarData {
  solar_azimuth_deg: number;
  solar_elevation_deg: number;
  shadow_azimuth_deg: number;
  shadow_length_factor: number;
  solar_time: string;
  sun_state: 'Daylight' | 'Golden Hour' | 'Civil Twilight' | 'Dusk / Dawn' | 'Night';
  notes: string;
}

export interface OsmAmenity {
  name: string;
  category: string;
  amenity_type: string;
  distance_meters: number;
  latitude: number;
  longitude: number;
}

export interface OsmVerification {
  osm_id?: number;
  osm_type?: string;
  display_name: string;
  road?: string;
  suburb?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
  postcode?: string;
  bounding_box?: number[];
  nearby_amenities: OsmAmenity[];
  ground_truth_score: number;
}

export interface LocationCandidate {
  rank: number;
  latitude: number;
  longitude: number;
  confidence: number;
  confidence_percentage: number;
  address: string;
  country?: string;
  state?: string;
  city?: string;
  district?: string;
  radius_km?: number;
  reasoning?: string;
  coordinates_formatted?: CoordinateFormats;
  elevation_meters?: number;
  osm_verification?: OsmVerification;
}

export interface EvidenceItem {
  category: EvidenceCategory;
  description: string;
  strength: 'Strong' | 'Moderate' | 'Supporting';
  source: 'OCR' | 'EXIF' | 'AI Vision' | 'Spatial Correlation' | 'OSM Ground Truth' | 'Solar Telemetry';
  details?: string;
}

export interface ContradictionItem {
  description: string;
  effect: 'Low uncertainty' | 'Medium uncertainty' | 'High uncertainty';
  category: string;
  scientific_note?: string;
}

export interface ExifData {
  has_gps: boolean;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  gps_img_direction?: number;
  make?: string;
  model?: string;
  lens?: string;
  focal_length_mm?: number;
  focal_length_35mm?: number;
  f_number?: number;
  exposure_time?: string;
  iso_speed?: number;
  exposure_bias?: string;
  white_balance?: string;
  flash?: string;
  metering_mode?: string;
  captured_at?: string;
  software?: string;
  orientation?: number;
  dimensions?: string;
  location_source: 'EXIF GPS' | 'AI Inference' | 'None';
  raw_tags?: Record<string, any>;
}

export interface OcrResult {
  has_text: boolean;
  full_text: string;
  text_fragments: string[];
  scripts_detected: string[];
  languages_detected: string[];
  signs_identified: string[];
  phone_numbers: string[];
  urls: string[];
}

export interface PipelineStage {
  stage_id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  timestamp?: string;
  duration_ms?: number;
}

export interface GeolocationResult {
  status: 'success' | 'error' | 'no_location';
  provider: string;
  is_mock: boolean;
  primary_location?: LocationCandidate;
  candidates: LocationCandidate[];
  evidence: EvidenceItem[];
  contradictions: ContradictionItem[];
  exif?: ExifData;
  ocr?: OcrResult;
  solar_data?: SolarData;
  osm_verification?: OsmVerification;
  elevation_meters?: number;
  processing_time: string;
  api_requests_remaining?: number;
  stages: PipelineStage[];
  error_message?: string;
}

export interface AnalysisConfig {
  analysis_mode: 'fast' | 'agent' | 'event';
  user_context?: string;
  event_text?: string;
  provider_override?: string;
  api_key_override?: string;
}

export interface AppConfig {
  provider: string;
  is_mock: boolean;
  model_name?: string;
  allowed_extensions: string[];
  max_file_size_mb: number;
  environment: string;
  has_custom_api_key: boolean;
}
