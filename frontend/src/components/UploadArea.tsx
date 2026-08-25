import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  FileSearch,
  Sparkles,
  Zap,
  Bot,
  MapPin,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { AnalysisConfig } from '../types/analysis';

interface UploadAreaProps {
  onAnalyze: (file: File, config: AnalysisConfig) => void;
  isAnalyzing: boolean;
  maxFileSizeMb: number;
}

// Built-in high quality sample photos (data URIs / canvas generated demo items)
const PRESET_SAMPLES = [
  {
    id: 'paris',
    name: 'Paris Neoclassical',
    location: 'Paris, France',
    hint: 'European stone facade with zinc mansard roof',
    color: '#3b82f6',
    draw: (ctx: CanvasRenderingContext2D) => {
      // Sky
      const grad = ctx.createLinearGradient(0, 0, 0, 300);
      grad.addColorStop(0, '#60a5fa');
      grad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 300);
      // Eiffel silhouette
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(190, 40); ctx.lineTo(210, 40); ctx.lineTo(230, 260); ctx.lineTo(170, 260);
      ctx.fill();
      ctx.fillRect(160, 180, 80, 15);
      ctx.fillRect(180, 100, 40, 10);
      // Ground / Trees
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 250, 400, 50);
    }
  },
  {
    id: 'kolhapur',
    name: 'Maharashtra Heritage',
    location: 'Kolhapur, India',
    hint: 'Basalt stone arch with Marathi signage on Deccan plateau',
    color: '#f59e0b',
    draw: (ctx: CanvasRenderingContext2D) => {
      // Sky
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(0, 0, 400, 300);
      // Sun
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(320, 70, 35, 0, Math.PI * 2);
      ctx.fill();
      // Stone Temple / Arch
      ctx.fillStyle = '#334155';
      ctx.fillRect(80, 120, 240, 140);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(200, 200, 50, Math.PI, 0);
      ctx.fill();
      // Red soil
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 250, 400, 50);
    }
  },
  {
    id: 'tokyo',
    name: 'Tokyo Neon Crossing',
    location: 'Shibuya, Japan',
    hint: 'High-density urban crossing with Japanese Kanji/Katakana signage',
    color: '#ec4899',
    draw: (ctx: CanvasRenderingContext2D) => {
      // Dark cyber sky
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 400, 300);
      // Tall buildings with neon
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(30, 40, 90, 220);
      ctx.fillRect(140, 20, 120, 240);
      ctx.fillRect(280, 60, 90, 200);
      // Neon signs
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(50, 60, 50, 80);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(160, 50, 80, 60);
      // Asphalt & pedestrian lines
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 250, 400, 50);
      ctx.fillStyle = '#ffffff';
      for (let i = 20; i < 380; i += 40) {
        ctx.fillRect(i, 260, 25, 30);
      }
    }
  },
  {
    id: 'canyon',
    name: 'Colorado Plateau',
    location: 'Arizona, USA',
    hint: 'Layered sedimentary limestone canyon with arid desert scrub',
    color: '#ea580c',
    draw: (ctx: CanvasRenderingContext2D) => {
      // Sky
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(0, 0, 400, 300);
      // Canyon strata layers
      const colors = ['#ca8a04', '#b45309', '#9a3412', '#7c2d12'];
      colors.forEach((c, idx) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(0, 100 + idx * 40);
        ctx.bezierCurveTo(120, 110 + idx * 35, 260, 90 + idx * 45, 400, 110 + idx * 40);
        ctx.lineTo(400, 300);
        ctx.lineTo(0, 300);
        ctx.fill();
      });
    }
  }
];

export const UploadArea: React.FC<UploadAreaProps> = ({
  onAnalyze,
  isAnalyzing,
  maxFileSizeMb,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [userContext, setUserContext] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'fast' | 'agent'>('fast');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxFileSizeMb) {
      setError(`File size (${sizeMb.toFixed(1)}MB) exceeds limit of ${maxFileSizeMb}MB.`);
      return;
    }

    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext) && !file.type.startsWith('image/')) {
      setError(`Unsupported file type (.${ext}). Supported formats: JPG, PNG, WebP, HEIC.`);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_SAMPLES[0]) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      preset.draw(ctx);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `${preset.id}_sample.jpg`, { type: 'image/jpeg' });
          handleFile(file);
          setUserContext(preset.hint);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    onAnalyze(selectedFile, {
      analysis_mode: analysisMode,
      user_context: userContext.trim() || undefined,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Hero Header */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Visual Intelligence &amp; Spatial Triangulation</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Visual Geolocation Engine
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
          Upload any photograph to extract satellite EXIF telemetry, detect visible multilingual text, and estimate coordinates through multi-category visual evidence.
        </p>
      </div>

      {/* Upload Box */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 transition-all overflow-hidden ${
            dragActive
              ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
              : 'border-slate-800 hover:border-slate-700 bg-cyber-900/70'
          } ${selectedFile ? 'border-cyan-500/50 bg-cyber-900/90' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic,image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
            id="file-upload-input"
          />

          {!selectedFile ? (
            <label
              htmlFor="file-upload-input"
              className="flex flex-col items-center justify-center p-8 sm:p-12 cursor-pointer text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-cyber-800 border border-slate-700 flex items-center justify-center mb-4 group-hover:border-cyan-500/60 group-hover:bg-cyan-950/40 group-hover:scale-105 transition-all shadow-lg">
                <UploadCloud className="w-8 h-8 text-cyan-400 group-hover:text-cyan-300" />
              </div>
              <p className="text-base font-semibold text-white mb-1">
                Drop your image here, or <span className="text-cyan-400 underline underline-offset-2">browse files</span>
              </p>
              <p className="text-xs text-slate-400">
                Supports JPG, PNG, WebP, HEIC (Max {maxFileSizeMb}MB)
              </p>
            </label>
          ) : (
            <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
              {/* Thumbnail Preview */}
              <div className="relative group w-full md:w-56 h-44 rounded-xl overflow-hidden bg-black/50 border border-cyan-500/30 shadow-inner flex-shrink-0">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label
                    htmlFor="file-upload-input"
                    className="px-3 py-1.5 rounded-lg bg-cyber-800 text-cyan-300 border border-cyan-500/50 text-xs font-medium cursor-pointer hover:bg-cyber-700"
                  >
                    Change Image
                  </label>
                </div>
              </div>

              {/* File Info */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-base truncate max-w-xs sm:max-w-md">
                      {selectedFile.name}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'image/jpeg'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Context Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                    <span>Optional Geographic / Scene Hint:</span>
                    <span title="Add hints like country, season, event, or known landmark">
                      <HelpCircle className="w-3 h-3 text-slate-500" />
                    </span>
                  </label>
                  <input
                    type="text"
                    value={userContext}
                    onChange={(e) => setUserContext(e.target.value)}
                    placeholder="e.g. European capital, summer 2025, near a mountain ridge..."
                    className="w-full px-3.5 py-2 rounded-lg bg-cyber-950 border border-slate-700 focus:border-cyan-400 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
                  />
                </div>

                {/* Mode Selector */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-medium text-slate-400">Analysis Engine:</span>
                  <button
                    type="button"
                    onClick={() => setAnalysisMode('fast')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      analysisMode === 'fast'
                        ? 'bg-cyan-500 text-black font-semibold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-cyber-800 text-slate-300 border border-slate-700 hover:bg-cyber-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Fast Mode (~10s)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnalysisMode('agent')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      analysisMode === 'agent'
                        ? 'bg-cyan-500 text-black font-semibold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-cyber-800 text-slate-300 border border-slate-700 hover:bg-cyber-700'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Agent Mode (Deep)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Validation Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!selectedFile || isAnalyzing}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl font-display font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              !selectedFile || isAnalyzing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:scale-[1.02] cursor-pointer'
            }`}
          >
            <FileSearch className="w-4 h-4" />
            <span>Run Geolocation Investigation</span>
          </button>
        </div>
      </form>

      {/* Preset Demo Samples */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Or test with a sample photograph:</span>
          </span>
          <span className="text-[11px] text-slate-500">1-click instant load</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESET_SAMPLES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              disabled={isAnalyzing}
              className="group text-left p-2.5 rounded-xl bg-cyber-900/60 hover:bg-cyber-900 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-sm"
            >
              <div className="w-full h-20 rounded-lg overflow-hidden mb-2 bg-cyber-950 relative">
                <canvas
                  ref={(canvas) => {
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      if (ctx) preset.draw(ctx);
                    }
                  }}
                  width={200}
                  height={100}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="font-semibold text-xs text-white group-hover:text-cyan-300 truncate">
                {preset.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {preset.location}
              </p>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
