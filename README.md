# GeoGuard 🌍🛡️

**Industrial-Grade AI Visual Geolocation & OpenStreetMap OSINT Intelligence Platform**

> Upload any photograph or paste field incident text → extract optical EXIF sensor telemetry and multilingual signage → deduce exact coordinates through Google Gemini / Claude / OpenAI multimodal AI vision → cross-reference real-world OpenStreetMap Nominatim & Overpass infrastructure → compute NOAA solar shadow angles → explore results on MapLibre GL → inspect micro-clues with the Forensic Image Loupe → export intelligence dossiers in GeoJSON, KML, CSV, or PDF.

---

## 🌟 100% Real Key Highlights & Capabilities

- 🧠 **Multi-Sensory Real AI Vision Engine**:
  - **Google Gemini 3.6 Flash / 2.0 / 1.5 Pro**: World-class spatial deduction, landmark knowledge, biome classification, and typography reading.
  - **Anthropic Claude 3.5 Sonnet**: Forensic spatial reasoning and architectural categorization.
  - **OpenAI GPT-4o / GPT-4o-mini**: Direct OpenAI and OpenRouter multimodal vision endpoints.
  - **GeoSeer Provider**: Native cloud API integration.
  - **Offline Mock Engine**: Instant fallback mode for offline testing.

- 🗺️ **Real OpenStreetMap Ground-Truth Verification**:
  - **Nominatim Reverse Geocoding**: Queries live OpenStreetMap for verified administrative boundaries (Road, Suburb, City, County, State, Country, Postal Code, OSM ID, Bounding Box).
  - **Overpass API Infrastructure Discovery**: Scans a 1.5km radius around predicted coordinates for real registered amenities (churches, mosques, temples, railway stations, transit stops, communications towers, bridges, historic monuments).
  - **Real Surface Elevation**: Instant altitude (meters above sea level) via Open-Meteo elevation API.

- ☀️ **NOAA Astronomical Solar & Shadow Vector Engine**:
  - Computes exact **Solar Azimuth Angle** (degrees), **Solar Elevation Angle**, **Shadow Cast Direction**, and **Shadow Length Multiplier** from capture timestamp & coordinates.
  - Projects the Solar Azimuth Vector and Shadow Cone directly on the interactive map to verify lighting/shadows in the photo.

- 🔍 **Forensic Optical Image Inspector (Loupe & Filters)**:
  - **Magnifier Loupe**: Up to 600% magnification with fluid pan for inspecting blurry road signs, distant towers, and vehicle registration plates.
  - **Live Canvas Filters**: Real-time Sobel Edge Detection, High-Contrast booster, Brightness, Saturation, and Color Inversion.
  - **Optical Metadata Telemetry**: 35mm equivalent focal length, camera aperture ($f$-stop), shutter speed, ISO sensitivity, exposure bias, white balance, and camera compass heading.

- 🌐 **Multi-Format Coordinates & External OSINT Pivots**:
  - Formats: **Decimal Degrees (DD)**, **Degrees Minutes Seconds (DMS)**, **Military Grid Reference System (MGRS)**, **Universal Transverse Mercator (UTM)**, and **Google Plus Code (OLC)**.
  - One-Click External Pivots: **Google Street View**, **Google Maps 3D Satellite**, **OpenStreetMap**, **Mapillary Street Imagery**, **Sentinel Hub Earth Observation**, and **SunCalc**.

- 📁 **Investigation Export Engine**:
  - **GeoJSON**: Standard GIS FeatureCollection with candidate points and uncertainty radius polygons.
  - **KML**: Ready for Google Earth Pro 3D flyovers.
  - **CSV**: Tabular spreadsheet for analyst reporting.
  - **Printable / PDF OSINT Brief**: Formatted intelligence dossier with mission header, photo evidence, map overview, coordinate breakdowns, 7-domain evidence matrix, and investigator signoff block.

- 📝 **Dual Mode: Photo Geolocation & Field Incident Text-to-Geo**:
  - Seamlessly switch between photo geolocation and text incident extraction (dispatch messages, news excerpts, telegram channels).

---

## 🏗️ System Architecture

```text
                               ┌───────────────────────────────────────────────┐
                               │     User Input: Image or Field Incident       │
                               │  (JPG, PNG, WebP, HEIC or Dispatch Text)     │
                               └──────────────────────┬────────────────────────┘
                                                      │
                                                      ▼
                               ┌───────────────────────────────────────────────┐
                               │         1. Preparing Image & Validation       │
                               │        (MIME & 15MB Buffer Integrity)         │
                               └──────────────────────┬────────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
          ┌─────────────────────────┐                                   ┌─────────────────────────┐
          │ 2. EXIF & Sensor Optics │                                   │  3. OCR & Script Reader │
          │ (35mm Focal, F-stop,    │                                   │ (Devanagari, Cyrillic,  │
          │  ISO, Heading, GPS)     │                                   │  Latin, Kanji, Signage) │
          └────────────┬────────────┘                                   └────────────┬────────────┘
                       │                                                             │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      ▼
                               ┌───────────────────────────────────────────────┐
                               │ 4. Multimodal AI Visual Geolocation           │
                               │ (Google Gemini 3.6 / Claude / GPT-4o / Seer)  │
                               └──────────────────────┬────────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
          ┌─────────────────────────┐                                   ┌─────────────────────────┐
          │  5. OSM Reverse Geocode │                                   │ 6. NOAA Solar & Shadows │
          │(Nominatim & Overpass POI│                                   │(Solar Azimuth, Elevation│
          │ + Open-Meteo Elevation) │                                   │  & Shadow Vector Angle) │
          └────────────┬────────────┘                                   └────────────┬────────────┘
                       │                                                             │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      ▼
                               ┌───────────────────────────────────────────────┐
                               │ 7. Geospatial OSINT Intelligence Dashboard    │
                               │  (MapLibre GL, Forensics Loupe, Multi-Coords, │
                               │   7-Domain Evidence, GeoJSON/KML/PDF Dossier) │
                               └───────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```text
GeoGuard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py              # REST & SSE streaming, Text-to-Geo, OSM & Solar endpoints
│   │   ├── config/
│   │   │   └── settings.py            # Pydantic BaseSettings (.env loader)
│   │   ├── providers/
│   │   │   ├── base.py                # Abstract GeolocationProvider interface
│   │   │   ├── gemini_provider.py     # Native Google Gemini 3.6 Flash / 2.0 Vision Provider
│   │   │   ├── claude_provider.py     # Native Anthropic Claude 3.5 Sonnet Vision Provider
│   │   │   ├── openai_provider.py     # OpenAI / OpenRouter Multimodal Vision Provider
│   │   │   ├── geoseer_provider.py    # Production GeoSeer REST client
│   │   │   ├── mock_provider.py       # Offline simulated demo engine
│   │   │   └── factory.py             # Provider resolver factory
│   │   ├── schemas/
│   │   │   └── analysis.py            # Pydantic schema models (Solar, OSM, Coords, Exif)
│   │   ├── services/
│   │   │   ├── osm_service.py         # OpenStreetMap Nominatim reverse geocoding & Overpass API
│   │   │   ├── solar_service.py       # NOAA solar azimuth, elevation & shadow calculation
│   │   │   ├── exif_service.py        # Optical EXIF (35mm equiv, f-number, shutter, heading, GPS)
│   │   │   ├── ocr_service.py         # Multilingual character recognition & script detection
│   │   │   ├── evidence_service.py    # 7-domain evidence & contradiction synthesizer
│   │   │   └── pipeline_service.py    # 7-stage orchestrator (sync & SSE streaming)
│   │   ├── utils/
│   │   │   └── image_validator.py     # Image verification & size limiting
│   │   └── main.py                    # FastAPI entrypoint with CORS
│   ├── requirements.txt               # Backend Python dependencies
│   ├── .env.example                   # Environment configuration template
│   ├── test_pipeline.py               # Unit verification test script
│   └── run.py                         # Backend uvicorn server runner
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx             # Brand header, provider status & settings modal trigger
│   │   │   ├── UploadArea.tsx         # Dual mode: Photo upload + Field Incident Text-to-Geo
│   │   │   ├── AnalysisScreen.tsx     # Animated radar scanning & stage progress
│   │   │   ├── PrimaryLocation.tsx    # Multi-format coordinates (DD, DMS, MGRS, UTM, Plus Code) & OSINT Pivots
│   │   │   ├── GeoMap.tsx             # MapLibre GL map with radar pin, solar vectors & OSM POI markers
│   │   │   ├── SolarIntelligence.tsx  # Astronomical solar azimuth, elevation & shadow dial
│   │   │   ├── OsmVerificationPanel.tsx# Real OpenStreetMap address hierarchy & nearby infrastructure
│   │   │   ├── ImageForensicsModal.tsx# Magnifier Loupe & client-side Sobel edge / contrast filters
│   │   │   ├── ExportDossierModal.tsx # Multi-format export (GeoJSON, KML, CSV, Printable PDF)
│   │   │   ├── EvidencePanel.tsx      # 7-category visual evidence breakdown
│   │   │   ├── ContradictionsPanel.tsx# Scientific uncertainty & contradiction matrix
│   │   │   ├── CandidatesList.tsx     # Ranked candidate locations cards
│   │   │   ├── ExifIntelligence.tsx   # Optical camera & hardware GPS metadata drawer
│   │   │   ├── OcrIntelligence.tsx    # Extracted text, signage & script chips
│   │   │   ├── SettingsModal.tsx      # Multi-provider credentials manager
│   │   │   ├── ErrorBanner.tsx        # Error diagnostics & retry handler
│   │   │   └── ResultsDashboard.tsx   # Comprehensive geospatial intelligence container
│   │   ├── services/
│   │   │   └── api.ts                 # API client with SSE streaming & export generators
│   │   ├── types/
│   │   │   └── analysis.ts            # TypeScript interfaces
│   │   ├── index.css                  # Dark geospatial aesthetic & custom animations
│   │   └── App.tsx                    # Main state machine & application container
│   ├── package.json                   # React + Vite + Tailwind + MapLibre dependencies
│   ├── vite.config.ts                 # Vite bundler config with backend proxy
│   └── index.html                     # HTML document entry
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** & **npm**

---

### 1. Start the Backend

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run the backend server
python run.py
```

*The backend starts at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.*

---

### 2. Start the Frontend

In a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the Vite development server
npm run dev
```

*Open `http://localhost:5173` in your browser.*

---

## 🛡️ License

GeoGuard is distributed under the MIT License.
