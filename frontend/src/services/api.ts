import { GeolocationResult, AppConfig, AnalysisConfig, PipelineStage } from '../types/analysis';

const API_BASE = '/api';

export async function fetchAppConfig(): Promise<AppConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) {
    throw new Error(`Failed to load app configuration: ${res.statusText}`);
  }
  return res.json();
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

  // Try streaming SSE endpoint first
  try {
    const response = await fetch(`${API_BASE}/analyze/stream`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errData.detail || `Server error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming response reader unavailable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: GeolocationResult | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';

      for (const chunk of chunks) {
        const lines = chunk.split('\n');
        let eventType = '';
        let dataPayload: any = null;

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              dataPayload = JSON.parse(line.slice(6));
            } catch (e) {
              console.warn('Failed to parse SSE payload:', line);
            }
          }
        }

        if (!dataPayload) continue;

        if (eventType === 'processing' && dataPayload.stage && onStageUpdate) {
          onStageUpdate(dataPayload.stage);
        } else if (eventType === 'completed' && dataPayload.result) {
          finalResult = dataPayload.result;
        } else if (eventType === 'error') {
          throw new Error(dataPayload.error || 'Pipeline processing failed');
        }
      }
    }

    if (finalResult) {
      return finalResult;
    }
  } catch (streamErr: any) {
    console.warn('SSE streaming encountered error, falling back to standard API:', streamErr);
  }

  // Fallback to standard synchronous endpoint
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errData.detail || `Server error ${res.status}`);
  }

  return res.json();
}
