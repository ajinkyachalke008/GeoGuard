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
}

export type EvidenceCategory =
  | "Architecture"
  | "Roads"
  | "Language"
  | "Vehicles"
  | "Infrastructure"
  | "Environment"
  | "Landmarks";

export type EvidenceStrength = "Strong" | "Moderate" | "Supporting";
export type EvidenceSource = "OCR" | "EXIF" | "AI Vision" | "Spatial Correlation";

export interface EvidenceItem {
  category: EvidenceCategory;
  description: string;
  strength: EvidenceStrength;
  source: EvidenceSource;
  details?: string;
}

export type ContradictionEffect = "Low uncertainty" | "Medium uncertainty" | "High uncertainty";

export interface ContradictionItem {
  description: string;
  effect: ContradictionEffect;
  category: string;
  scientific_note?: string;
}

export interface ExifData {
  has_gps: boolean;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  make?: string;
  model?: string;
  lens?: string;
  captured_at?: string;
  software?: string;
  orientation?: number;
  dimensions?: string;
  location_source: "EXIF GPS" | "AI Inference" | "None";
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
  status: "pending" | "processing" | "completed" | "failed";
  message: string;
  timestamp?: string;
  duration_ms?: number;
}

export interface GeolocationResult {
  status: "success" | "error" | "no_location";
  provider: string;
  is_mock: boolean;
  primary_location?: LocationCandidate;
  candidates: LocationCandidate[];
  evidence: EvidenceItem[];
  contradictions: ContradictionItem[];
  exif?: ExifData;
  ocr?: OcrResult;
  processing_time: string;
  api_requests_remaining?: number;
  stages: PipelineStage[];
  error_message?: string;
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

export interface AnalysisConfig {
  analysis_mode: "fast" | "agent" | "event";
  user_context?: string;
  event_text?: string;
  provider_override?: string;
  api_key_override?: string;
}
