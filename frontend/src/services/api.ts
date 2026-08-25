import {
  GeolocationResult,
  PipelineStage,
  AppConfig,
  AnalysisConfig,
  LocationCandidate,
} from '../types/analysis';

const API_BASE_URL = '/api';

export async function fetchAppConfig(): Promise<AppConfig> {
  const response = await fetch(`${API_BASE_URL}/config`);
  if (!response.ok) {
    throw new Error(`Failed to fetch app config: ${response.statusText}`);
  }
  return response.json();
}

export async function analyzeImage(
  file: File,
  config: AnalysisConfig,
  onStageUpdate?: (stage: PipelineStage) => void
): Promise<GeolocationResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('analysis_mode', config.analysis_mode);

  if (config.user_context) {
    formData.append('user_context', config.user_context);
  }
  if (config.provider_override) {
    formData.append('provider_override', config.provider_override);
  }
  if (config.api_key_override) {
    formData.append('api_key_override', config.api_key_override);
  }

  // Attempt Server-Sent Events (SSE) streaming
  try {
    const response = await fetch(`${API_BASE_URL}/analyze/stream`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let msg = `Analysis failed (${response.status})`;
      try {
        const parsed = JSON.parse(errorText);
        msg = parsed.detail || msg;
      } catch {
        // use default
      }
      throw new Error(msg);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by browser or backend.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalResult: GeolocationResult | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = 'message';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.replace('event:', '').trim();
        } else if (trimmed.startsWith('data:')) {
          const rawData = trimmed.replace('data:', '').trim();
          try {
            const dataObj = JSON.parse(rawData);
            if (currentEvent === 'processing' && dataObj.stage && onStageUpdate) {
              onStageUpdate(dataObj.stage);
            } else if (currentEvent === 'completed' && dataObj.result) {
              finalResult = dataObj.result;
            }
          } catch (e) {
            console.warn('Failed to parse SSE line JSON:', rawData);
          }
        }
      }
    }

    if (finalResult) {
      return finalResult;
    }
  } catch (streamErr: any) {
    console.warn('SSE Streaming fallback to synchronous analysis:', streamErr.message);
  }

  // Fallback to standard synchronous REST POST /api/analyze
  const fallbackResponse = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!fallbackResponse.ok) {
    const errText = await fallbackResponse.text();
    let msg = `Analysis failed (${fallbackResponse.status})`;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.detail || msg;
    } catch {
      // use default
    }
    throw new Error(msg);
  }

  return fallbackResponse.json();
}

export async function analyzeEvent(
  eventText: string,
  config: AnalysisConfig
): Promise<GeolocationResult> {
  const formData = new FormData();
  formData.append('event_text', eventText);
  if (config.provider_override) {
    formData.append('provider_override', config.provider_override);
  }
  if (config.api_key_override) {
    formData.append('api_key_override', config.api_key_override);
  }

  const response = await fetch(`${API_BASE_URL}/analyze/event`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    let msg = `Incident analysis failed (${response.status})`;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.detail || msg;
    } catch {
      // use default
    }
    throw new Error(msg);
  }

  return response.json();
}

// ----------------------------------------------------
// EXPORT FORMAT UTILITIES (GeoJSON, KML, CSV)
// ----------------------------------------------------

export function generateGeoJSON(result: GeolocationResult): string {
  const features: any[] = [];

  // Primary Location Point
  if (result.primary_location) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [result.primary_location.longitude, result.primary_location.latitude],
      },
      properties: {
        title: 'Primary Estimated Location',
        address: result.primary_location.address,
        confidence_percentage: result.primary_location.confidence_percentage,
        radius_km: result.primary_location.radius_km,
        reasoning: result.primary_location.reasoning,
        provider: result.provider,
        source: result.exif?.has_gps ? 'EXIF GPS' : 'AI Multimodal Vision',
      },
    });

    // Uncertainty circle as polygon
    if (result.primary_location.radius_km) {
      const coords = [];
      const km = result.primary_location.radius_km;
      const lat = result.primary_location.latitude;
      const lon = result.primary_location.longitude;
      const distanceX = km / (111.32 * Math.cos((lat * Math.PI) / 180));
      const distanceY = km / 110.574;
      for (let i = 0; i < 36; i++) {
        const theta = (i / 36) * (2 * Math.PI);
        coords.push([lon + distanceX * Math.cos(theta), lat + distanceY * Math.sin(theta)]);
      }
      coords.push(coords[0]);
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
        properties: {
          title: `Uncertainty Radius (±${km}km)`,
          confidence_percentage: result.primary_location.confidence_percentage,
        },
      });
    }
  }

  // Candidates
  result.candidates.forEach((c) => {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [c.longitude, c.latitude],
      },
      properties: {
        title: `Candidate #${c.rank}`,
        address: c.address,
        confidence_percentage: c.confidence_percentage,
        radius_km: c.radius_km,
        reasoning: c.reasoning,
      },
    });
  });

  return JSON.stringify(
    {
      type: 'FeatureCollection',
      name: 'GeoGuard_OSINT_Investigation',
      metadata: {
        generated_at: new Date().toISOString(),
        provider: result.provider,
        processing_time: result.processing_time,
      },
      features,
    },
    null,
    2
  );
}

export function generateKML(result: GeolocationResult): string {
  const p = result.primary_location;
  if (!p) return '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>GeoGuard OSINT Target Dossier</name>
    <description>AI Multimodal Triangulation for ${p.address}</description>
    <Placemark>
      <name>Primary Location (${p.confidence_percentage}% Confidence)</name>
      <description><![CDATA[
        <b>Address:</b> ${p.address}<br/>
        <b>Coordinates:</b> ${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}<br/>
        <b>Uncertainty Radius:</b> ±${p.radius_km || 1.0} km<br/>
        <b>Analysis Reasoning:</b> ${p.reasoning || ''}<br/>
        <b>Provider:</b> ${result.provider}
      ]]></description>
      <Point>
        <coordinates>${p.longitude},${p.latitude},0</coordinates>
      </Point>
    </Placemark>
    ${result.candidates
      .map(
        (c) => `
    <Placemark>
      <name>Candidate #${c.rank}: ${c.city || c.address} (${c.confidence_percentage}%)</name>
      <description><![CDATA[${c.reasoning || c.address}]]></description>
      <Point>
        <coordinates>${c.longitude},${c.latitude},0</coordinates>
      </Point>
    </Placemark>`
      )
      .join('\n')}
  </Document>
</kml>`;
}

export function generateCSV(result: GeolocationResult): string {
  const headers = ['Rank', 'Address', 'Latitude', 'Longitude', 'Confidence', 'Radius_KM', 'Reasoning'];
  const rows = result.candidates.map((c) => [
    c.rank,
    `"${(c.address || '').replace(/"/g, '""')}"`,
    c.latitude.toFixed(6),
    c.longitude.toFixed(6),
    `${c.confidence_percentage}%`,
    c.radius_km || '',
    `"${(c.reasoning || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
