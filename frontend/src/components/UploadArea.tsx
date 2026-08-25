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
  FileText,
  Compass
} from 'lucide-react';
import { AnalysisConfig } from '../types/analysis';

interface UploadAreaProps {
  onAnalyze: (file: File, config: AnalysisConfig) => void;
  onAnalyzeEvent?: (eventText: string, config: AnalysisConfig) => void;
  isAnalyzing: boolean;
  maxFileSizeMb: number;
}

const PRESET_SAMPLES = [
  {
    id: 'paris',
    name: 'Paris Neoclassical',
    location: 'Paris, France',
    hint: 'European stone facade with zinc mansard roof and Eiffel silhouette',
    color: '#3b82f6',
    draw: (ctx: CanvasRenderingContext2D) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 300);
      grad.addColorStop(0, '#60a5fa');
      grad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(190, 40); ctx.lineTo(210, 40); ctx.lineTo(230, 260); ctx.lineTo(170, 260);
      ctx.fill();
      ctx.fillRect(160, 180, 80, 15);
      ctx.fillRect(180, 100, 40, 10);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 250, 400, 50);
    },
  },
  {
    id: 'kolhapur',
    name: 'Maharashtra Heritage',
    location: 'Kolhapur, India',
    hint: 'Basalt stone arch with Marathi signage on Deccan plateau',
    color: '#f59e0b',
    draw: (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(320, 70, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillRect(80, 120, 240, 140);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(200, 200, 50, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 250, 400, 50);
    },
  },
  {
    id: 'tokyo',
    name: 'Tokyo Neon Crossing',
    location: 'Shibuya, Japan',
    hint: 'High-density urban crossing with Japanese Kanji/Katakana signage',
    color: '#ec4899',
    draw: (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(30, 40, 90, 220);
      ctx.fillRect(140, 20, 120, 240);
      ctx.fillRect(280, 60, 90, 200);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(50, 60, 50, 80);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(160, 50, 80, 60);
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 250, 400, 50);
      ctx.fillStyle = '#ffffff';
      for (let i = 20; i < 380; i += 40) {
        ctx.fillRect(i, 260, 25, 30);
      }
    },
  },
  {
    id: 'canyon',
    name: 'Colorado Plateau',
    location: 'Arizona, USA',
    hint: 'Layered sedimentary limestone canyon with arid desert scrub',
    color: '#ea580c',
    draw: (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(0, 0, 400, 300);
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
    },
  },
];

const SAMPLE_INCIDENTS = [
  {
    title: 'Kyiv Rail Dispatch',
    text: 'Eyewitness reporting freight train stoppage at Kyiv-Pasazhyrskyi central terminal near Vokzalna metro station, Ukraine.',
  },
  {
    title: 'Mumbai Marine Drive',
    text: 'Heavy monsoon waves crashing over promenade along Netaji Subhash Chandra Bose Road near Nariman Point in South Mumbai.',
  },
];

export const UploadArea: React.FC<UploadAreaProps> = ({
  onAnalyze,
  onAnalyzeEvent,
  isAnalyzing,
  maxFileSizeMb,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [userContext, setUserContext] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'fast' | 'agent'>('fast');
  const [eventText, setEventText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxFileSizeMb) {
      setError(`File size (${sizeMb.toFixed(1)}MB) exceeds limit of ${maxFileSizeMb}MB.`);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = (sample: (typeof PRESET_SAMPLES)[0]) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    sample.draw(ctx);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${sample.id}_sample.jpg`, { type: 'image/jpeg' });
        setUserContext(sample.hint);
        handleFile(file);
      }
    }, 'image/jpeg');
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setUserContext('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    onAnalyze(selectedFile, {
      analysis_mode: analysisMode,
      user_context: userContext.trim() || undefined,
    });
  };

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventText.trim() || !onAnalyzeEvent) return;
    onAnalyzeEvent(eventText.trim(), {
      analysis_mode: 'event',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Mode Switcher */}
      <div className="flex items-center justify-center">
        <div className="glass-panel p-1.5 flex items-center gap-2 rounded-2xl border-cyan-500/30">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`px-5 py-2 rounded-xl text-xs font-display font-bold flex items-center gap-2 transition-all ${
              activeTab === 'image'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Photograph Geolocation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-5 py-2 rounded-xl text-xs font-display font-bold flex items-center gap-2 transition-all ${
              activeTab === 'text'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Incident / Dispatch (Text-to-Geo)</span>
          </button>
        </div>
      </div>

      {activeTab === 'image' ? (
        <form onSubmit={handleSubmitImage} className="space-y-6">
          
          {/* Drag and Drop Container */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            className={`glass-panel border-2 border-dashed p-8 rounded-2xl transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                : selectedFile
                ? 'border-slate-700 bg-cyber-950/40 cursor-default'
                : 'border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />

            {selectedFile && previewUrl ? (
              <div className="w-full flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group w-48 h-48 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0 bg-black">
                  <img
                    src={previewUrl}
                    alt="Upload Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleClear(); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-950 text-slate-300 hover:text-rose-400 border border-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-2 text-left w-full">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      Ready for AI Analysis
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-lg text-white truncate">
                    {selectedFile.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Type: {selectedFile.type || 'Image'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Click "Run Geolocation Analysis" below to execute optical EXIF extraction, OCR script reading, and AI spatial triangulation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    Drop your photograph here or click to browse
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports JPG, PNG, WebP, and HEIC up to {maxFileSizeMb}MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Context Clues & Analysis Mode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Optional Context Clue */}
            <div className="md:col-span-2 glass-panel p-4 space-y-2">
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Investigator Context Clues (Optional)</span>
              </label>
              <input
                type="text"
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                placeholder="e.g. European cobblestone alley, Deccan temple arch, Kyoto district"
                className="w-full px-3.5 py-2.5 rounded-xl bg-cyber-950 border border-slate-800 focus:border-cyan-400 text-xs text-slate-100 placeholder-slate-600 outline-none transition-colors"
              />
            </div>

            {/* Fast vs Agent Deep Mode */}
            <div className="glass-panel p-4 space-y-2">
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Forensic Mode</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAnalysisMode('fast')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    analysisMode === 'fast'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Fast</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnalysisMode('agent')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    analysisMode === 'agent'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Deep OSINT</span>
                </button>
              </div>
            </div>

          </div>

          {/* Preset Samples */}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
              Or test with a sample target:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_SAMPLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectPreset(s)}
                  className="p-3 rounded-xl glass-panel hover:border-cyan-500/50 text-left transition-all group"
                >
                  <span className="font-semibold text-xs text-white block group-hover:text-cyan-300">
                    {s.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono block truncate">
                    {s.location}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={!selectedFile || isAnalyzing}
              className="px-8 py-3.5 rounded-xl font-display font-black text-sm bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black shadow-lg shadow-cyan-500/25 flex items-center gap-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <FileSearch className="w-5 h-5" />
              <span>Run Geolocation Analysis</span>
            </button>
          </div>

        </form>
      ) : (
        /* Incident Text Mode Form */
        <form onSubmit={handleSubmitText} className="space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h3 className="font-display font-bold text-base text-white">
                Field Incident Report / Dispatch Text Geolocation
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Paste eyewitness descriptions, news snippets, police dispatch messages, or Telegram channels. The AI will extract mentioned entities and correlate them with OpenStreetMap coordinates.
            </p>

            <textarea
              rows={5}
              value={eventText}
              onChange={(e) => setEventText(e.target.value)}
              placeholder="Paste incident report or eyewitness dispatch text here..."
              className="w-full p-4 rounded-xl bg-cyber-950 border border-slate-800 focus:border-cyan-400 text-xs font-mono text-slate-100 placeholder-slate-600 outline-none transition-colors"
            />

            {/* Sample Dispatches */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono uppercase text-slate-500">Quick Test Dispatches:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_INCIDENTS.map((inc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEventText(inc.text)}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 text-left text-xs font-mono text-slate-300"
                  >
                    <span className="text-cyan-400 font-bold block">{inc.title}</span>
                    <span className="text-slate-400 text-[11px] line-clamp-1">{inc.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-3">
              <button
                type="submit"
                disabled={!eventText.trim() || isAnalyzing}
                className="px-8 py-3.5 rounded-xl font-display font-black text-sm bg-gradient-to-r from-cyan-500 to-emerald-400 text-black shadow-lg shadow-cyan-500/25 flex items-center gap-2.5 transition-all disabled:opacity-40"
              >
                <FileSearch className="w-5 h-5" />
                <span>Geolocate Incident Text</span>
              </button>
            </div>
          </div>
        </form>
      )}

    </div>
  );
};
