import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadArea } from './components/UploadArea';
import { AnalysisScreen } from './components/AnalysisScreen';
import { ResultsDashboard } from './components/ResultsDashboard';
import { SettingsModal } from './components/SettingsModal';
import { ErrorBanner } from './components/ErrorBanner';
import {
  GeolocationResult,
  PipelineStage,
  AppConfig,
  AnalysisConfig
} from './types/analysis';
import { fetchAppConfig, analyzeImage } from './services/api';
import { Shield, Sparkles, Compass } from 'lucide-react';

export const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>('mock');
  const [apiKey, setApiKey] = useState<string>('');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedFileName, setAnalyzedFileName] = useState<string>('');
  
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [result, setResult] = useState<GeolocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [lastAnalysisConfig, setLastAnalysisConfig] = useState<AnalysisConfig | null>(null);

  // Load app config on initial mount
  useEffect(() => {
    fetchAppConfig()
      .then((cfg) => {
        setConfig(cfg);
        setActiveProvider(cfg.provider);
      })
      .catch((err) => {
        console.warn('Could not load initial backend config, defaulting to mock:', err);
      });
  }, []);

  const handleStageUpdate = (updatedStage: PipelineStage) => {
    setStages((prevStages) => {
      const idx = prevStages.findIndex((s) => s.stage_id === updatedStage.stage_id);
      if (idx !== -1) {
        const next = [...prevStages];
        next[idx] = updatedStage;
        return next;
      }
      return [...prevStages, updatedStage];
    });
  };

  const handleStartAnalysis = async (file: File, analysisConfig: AnalysisConfig) => {
    setError(null);
    setResult(null);
    setIsAnalyzing(true);
    setAnalyzedFileName(file.name);
    setLastUploadedFile(file);
    setLastAnalysisConfig(analysisConfig);

    // Initial 7 stages definition
    const initialStages: PipelineStage[] = [
      { stage_id: 'stage_1', name: 'Preparing image', status: 'processing', message: 'Validating file integrity...' },
      { stage_id: 'stage_2', name: 'Extracting metadata', status: 'pending', message: '' },
      { stage_id: 'stage_3', name: 'Analyzing visible text', status: 'pending', message: '' },
      { stage_id: 'stage_4', name: 'Analyzing geographic clues', status: 'pending', message: '' },
      { stage_id: 'stage_5', name: 'Generating candidate locations', status: 'pending', message: '' },
      { stage_id: 'stage_6', name: 'Verifying evidence', status: 'pending', message: '' },
      { stage_id: 'stage_7', name: 'Preparing geographic result', status: 'pending', message: '' },
    ];
    setStages(initialStages);

    try {
      const payloadConfig: AnalysisConfig = {
        ...analysisConfig,
        provider_override: activeProvider,
        api_key_override: apiKey.trim() || undefined,
      };

      const finalResult = await analyzeImage(file, payloadConfig, handleStageUpdate);
      setResult(finalResult);
      if (finalResult.stages && finalResult.stages.length > 0) {
        setStages(finalResult.stages);
      }
    } catch (err: any) {
      setError(err.message || 'Geolocation pipeline execution encountered an error.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetry = () => {
    if (lastUploadedFile && lastAnalysisConfig) {
      handleStartAnalysis(lastUploadedFile, lastAnalysisConfig);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
    setStages([]);
  };

  const handleSaveSettings = (newProvider: string, newApiKey: string) => {
    setActiveProvider(newProvider);
    setApiKey(newApiKey);
    if (config) {
      setConfig({
        ...config,
        provider: newProvider,
        is_mock: newProvider === 'mock',
        has_custom_api_key: Boolean(newApiKey.trim()),
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cyber-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      
      {/* Header */}
      <Header
        config={config}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={handleReset}
        hasResult={Boolean(result)}
        isAnalyzing={isAnalyzing}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        
        {/* Error Banner */}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={lastUploadedFile ? handleRetry : undefined}
            onDismiss={() => setError(null)}
          />
        )}

        {/* View Switching */}
        {isAnalyzing ? (
          <AnalysisScreen stages={stages} imageFileName={analyzedFileName} />
        ) : result ? (
          <ResultsDashboard result={result} />
        ) : (
          <UploadArea
            onAnalyze={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
            maxFileSizeMb={config?.max_file_size_mb || 10}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-cyber-950/80 py-6 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-semibold">GeoGuard</span>
            <span>— AI Visual Geolocation &amp; Geographic Intelligence</span>
          </div>
          <div>
            <span>Local &amp; Modular Engine • Open-Source Geospatial Security</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        activeProvider={activeProvider}
        apiKey={apiKey}
        onSaveSettings={handleSaveSettings}
      />

    </div>
  );
};

export default App;
