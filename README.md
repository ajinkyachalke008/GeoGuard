# GeoGuard 🌍🛡️

**AI Visual Geolocation & Geographic Intelligence Platform**

> Upload a photograph → extract satellite EXIF telemetry and visible multilingual text → estimate coordinates through modular AI visual geolocation → explore results on an interactive map → evaluate deep evidence across 7 visual categories and contradiction analysis.

---

## 🌟 Overview

**GeoGuard** is an open, modular, professional-grade geospatial intelligence platform. It triangulates geographic coordinates from photographs by integrating hardware metadata (EXIF/GPS), optical character recognition (OCR), and visual scene reasoning.

### Key Highlights

- 🧠 **Multi-Sensory Pipeline**: Executes 7 real analysis stages from raw image decoding to candidate clustering and contradiction analysis.
- ⚡ **Modular Provider Engine**:
  - **Mock Mode (Default)**: Complete, high-fidelity offline simulation with multi-continent scenarios and realistic candidate distributions—**runs 100% out of the box with zero external API keys**.
  - **GeoSeer Provider**: Native production integration with GeoSeer's AI visual geolocation REST & SSE endpoints (`POST /api/v1/analyze`).
  - **Extensible Architecture**: Easily add custom vision-language models or self-hosted weights in the future.
- 🛰️ **Hardware EXIF & GPS Intelligence**: Extracts camera manufacturer, lens optics, timestamps, orientation, and decodes GPS IFD tags (DMS to decimal degrees), explicitly differentiating between `Location Source: EXIF GPS` and `Location Source: AI Inference`.
- 🔤 **Visible Text & OCR Intelligence**: Scans imagery for road signs, commercial signboards, phone numbers, URLs, and identifies character writing systems (Devanagari, Cyrillic, Latin, Arabic, East Asian).
- 🗺️ **Interactive Cartography**: Interactive MapLibre GL dark-mode map with pulsating radar beacon, candidate pins, uncertainty radius polygons, and layer toggles (Dark, Satellite, Street).
- 🔬 **7-Category Evidence Breakdown**: Transparently details the visual evidence behind the prediction across **Architecture**, **Roads**, **Language**, **Vehicles**, **Infrastructure**, **Environment**, and **Landmarks**.
- ⚖️ **Scientific Contradictions & Uncertainty Analysis**: Highlights counter-clues, visual ambiguities, and missing landmark signatures to ensure scientific honesty.

---

## 🏗️ Architecture

```text
                               ┌─────────────────────────┐
                               │   User Image Upload     │
                               │ (JPG, PNG, WebP, HEIC)  │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │   1. Preparing Image    │
                               │  (MIME & Size Validator)│
                               └────────────┬────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
        ┌─────────────────────────┐                   ┌─────────────────────────┐
        │  2. Extracting Metadata │                   │ 3. Analyzing Text (OCR) │
        │ (EXIF / GPS / Camera)   │                   │ (Scripts, Signs, Langs) │
        └────────────┬────────────┘                   └────────────┬────────────┘
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            ▼
                               ┌─────────────────────────┐
                               │4. AI Visual Geolocation │
                               └────────────┬────────────┘
                                            │
                      ┌─────────────────────┴─────────────────────┐
                      ▼                                           ▼
         ┌─────────────────────────┐                 ┌─────────────────────────┐
         │      Mock Provider      │                 │    GeoSeer Provider     │
         │  (Offline Demo Mode)    │                 │    (Live External API)  │
         └────────────┬────────────┘                 └────────────┬────────────┘
                      │                                           │
                      └─────────────────────┬─────────────────────┘
                                            ▼
                               ┌─────────────────────────┐
                               │ 5. Candidate Generation │
                               │  (Ranking & Radiuses)   │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │  6. Evidence & Conflict │
                               │(7-Domain & Uncertainty) │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │ 7. Geographic Result    │
                               │  (MapLibre & Dashboard) │
                               └─────────────────────────┘
```

---

## 📁 Repository Structure

```text
GeoGuard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py              # REST & SSE streaming endpoints
│   │   ├── config/
│   │   │   └── settings.py            # Pydantic BaseSettings (.env loader)
│   │   ├── providers/
│   │   │   ├── base.py                # Abstract GeolocationProvider interface
│   │   │   ├── mock_provider.py       # Deterministic multi-region demo engine
│   │   │   ├── geoseer_provider.py    # Production GeoSeer REST client
│   │   │   └── factory.py             # Provider resolver factory
│   │   ├── schemas/
│   │   │   └── analysis.py            # Pydantic schema models
│   │   ├── services/
│   │   │   ├── exif_service.py        # EXIF tags & GPS coordinate extraction
│   │   │   ├── ocr_service.py         # Optical character recognition & script detection
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
│   │   │   ├── Header.tsx             # Brand header, status indicator & settings trigger
│   │   │   ├── UploadArea.tsx         # Drag & drop, preview, canvas demo presets
│   │   │   ├── AnalysisScreen.tsx     # Animated radar scanning & stage progress
│   │   │   ├── PrimaryLocation.tsx    # Estimated location card & confidence meter
│   │   │   ├── GeoMap.tsx             # MapLibre GL map with radar pin & uncertainty circle
│   │   │   ├── EvidencePanel.tsx      # 7-category visual evidence breakdown
│   │   │   ├── ContradictionsPanel.tsx# Scientific uncertainty & contradiction panel
│   │   │   ├── CandidatesList.tsx     # Ranked candidate locations table/cards
│   │   │   ├── ExifIntelligence.tsx   # Hardware camera & GPS metadata drawer
│   │   │   ├── OcrIntelligence.tsx    # Extracted text, signage & script chips
│   │   │   ├── SettingsModal.tsx      # Provider & API key configuration modal
│   │   │   ├── ErrorBanner.tsx        # Error diagnostics & retry handler
│   │   │   └── ResultsDashboard.tsx   # Comprehensive geospatial results container
│   │   ├── services/
│   │   │   └── api.ts                 # API client with SSE streaming support
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

*The backend will start at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.*

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

*Open `http://localhost:5173` in your web browser.*

---

## ⚙️ Configuration & Modes

### Mock Mode (Default)

GeoGuard runs in **Mock Mode** by default. In `backend/.env`:

```env
GEOLOCATION_PROVIDER=mock
```

- Enables full testing of all features without requiring an external API key.
- Includes realistic multi-region scenarios (Paris France, Kolhapur/Maharashtra India, Shibuya Tokyo, Grand Canyon USA).
- Clearly flagged in the UI with **DEMO DATA — NOT REAL GEOLOCATION**.

### Real GeoSeer API Mode

To use the live GeoSeer cloud AI model:

1. Obtain an API key from [geoseeer.com/dashboard](https://geoseeer.com/dashboard).
2. Configure `backend/.env` or enter your key in the **GeoGuard Settings Modal** in the UI:

```env
GEOLOCATION_PROVIDER=geoseer
GEOSEER_API_KEY=your_geoseer_api_key_here
GEOSEER_API_URL=https://geoseeer.com/api/v1
```

3. Restart the backend or save settings directly from the frontend UI.

---

## 📡 API Reference

### 1. `POST /api/analyze`
Analyzes an uploaded photograph and returns complete geolocation intelligence.

- **Request**: `multipart/form-data`
  - `file`: Image file (JPG, PNG, WebP, HEIC, max 10MB)
  - `analysis_mode`: `fast` or `agent` (optional, default: `fast`)
  - `user_context`: Optional text hint (e.g. `"European street"`)
  - `provider_override`: Optional provider override (`"mock"` or `"geoseer"`)
  - `api_key_override`: Optional API key override
- **Response**: `GeolocationResult` JSON object.

### 2. `POST /api/analyze/stream`
Server-Sent Events (SSE) streaming endpoint pushing real-time progress events across all 7 stages.

### 3. `GET /api/config`
Returns active provider status, mock mode indicator, and allowed file formats.

### 4. `GET /api/health`
Service health check and version info.

---

## 🔒 Security & Privacy

- **Server-Side API Keys**: External API keys are kept on the backend and never exposed in frontend bundles.
- **Strict File Validation**: Content length, MIME types, and file structure are verified using Pillow before processing.
- **Safe Temporary Memory**: Uploaded image bytes are processed in-memory and discarded after analysis.
- **CORS Protection**: Access is restricted to configured frontend origins.

---

## 🛡️ License

GeoGuard is distributed under the MIT License.

