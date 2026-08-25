import React, { useState } from 'react';
import {
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  Compass,
  Radio,
  Globe,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { LocationCandidate, ExifData } from '../types/analysis';

interface PrimaryLocationProps {
  location: LocationCandidate;
  exif?: ExifData;
  isMock: boolean;
  processingTime: string;
}

export const PrimaryLocation: React.FC<PrimaryLocationProps> = ({
  location,
  exif,
  isMock,
  processingTime,
}) => {
  const [copied, setCopied] = useState(false);

  const coordsText = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(coordsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceColor =
    location.confidence_percentage >= 80
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40'
      : location.confidence_percentage >= 60
      ? 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40'
      : 'text-amber-400 border-amber-500/40 bg-amber-950/40';

  const isExifGps = exif?.has_gps;

  return (
    <div className="glass-panel p-6 relative overflow-hidden space-y-4">
      
      {/* Prominent Demo Warning Banner */}
      {isMock && (
        <div className="flex items-center justify-between p-2.5 px-4 rounded-lg bg-amber-950/70 border border-amber-500/50 text-amber-300 text-xs font-mono">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="font-bold tracking-wide">DEMO DATA — NOT REAL GEOLOCATION</span>
          </div>
          <span className="text-[11px] text-amber-400/80 hidden sm:inline">
            Offline Mock Engine Active
          </span>
        </div>
      )}

      {/* Main Grid Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Address & Details */}
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Estimated Geographic Location</span>
            </span>

            {/* Source Label */}
            {isExifGps ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                Location Source: EXIF GPS
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                Location Source: AI Inference
              </span>
            )}
          </div>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            {location.address}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
            {location.city && (
              <span className="flex items-center gap-1">
                <span className="text-slate-500">City:</span>
                <strong className="text-white">{location.city}</strong>
              </span>
            )}
            {location.state && (
              <span className="flex items-center gap-1">
                <span className="text-slate-500">State:</span>
                <strong className="text-white">{location.state}</strong>
              </span>
            )}
            {location.country && (
              <span className="flex items-center gap-1">
                <span className="text-slate-500">Country:</span>
                <strong className="text-white">{location.country}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Right Metric Cards */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          
          {/* Confidence Badge */}
          <div className={`px-4 py-3 rounded-xl border flex flex-col items-center justify-center min-w-[110px] ${confidenceColor}`}>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Confidence
            </span>
            <span className="font-display text-2xl font-black">
              {location.confidence_percentage}%
            </span>
          </div>

          {/* Uncertainty Radius */}
          {location.radius_km !== undefined && (
            <div className="px-4 py-3 rounded-xl border border-slate-800 bg-cyber-950/60 flex flex-col items-center justify-center min-w-[110px]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Radius Uncertainty
              </span>
              <span className="font-display text-2xl font-black text-cyan-300">
                ±{location.radius_km} <span className="text-xs font-normal text-slate-400">km</span>
              </span>
            </div>
          )}

          {/* Lat/Lon Copy Block */}
          <div className="px-4 py-3 rounded-xl border border-slate-800 bg-cyber-950/80 flex flex-col justify-center min-w-[180px]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Coordinates
            </span>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className="font-mono text-xs font-bold text-white">
                {coordsText}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Copy Coordinates"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Primary Reasoning Paragraph */}
      {location.reasoning && (
        <div className="p-3.5 rounded-xl bg-cyber-950/50 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans">
          <span className="font-mono font-semibold text-cyan-400 uppercase text-[11px] mr-2">
            Analysis Reasoning:
          </span>
          {location.reasoning}
        </div>
      )}

    </div>
  );
};
