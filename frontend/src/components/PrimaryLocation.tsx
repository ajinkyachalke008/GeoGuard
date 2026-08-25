import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Copy,
  Check,
  Globe,
  ExternalLink,
  Sun,
  Mountain,
  AlertTriangle,
  Layers,
  Search
} from 'lucide-react';
import { LocationCandidate, ExifData, SolarData } from '../types/analysis';

interface PrimaryLocationProps {
  location: LocationCandidate;
  exif?: ExifData;
  solar?: SolarData;
  elevationMeters?: number;
  isMock: boolean;
  processingTime: string;
  onOpenForensics?: () => void;
  onOpenExport?: () => void;
}

export const PrimaryLocation: React.FC<PrimaryLocationProps> = ({
  location,
  exif,
  solar,
  elevationMeters,
  isMock,
  processingTime,
  onOpenForensics,
  onOpenExport,
}) => {
  const [coordFormat, setCoordFormat] = useState<'dd' | 'dms' | 'mgrs' | 'utm' | 'plus'>('dd');
  const [copied, setCopied] = useState(false);

  const getCoordText = () => {
    const f = location.coordinates_formatted;
    if (!f) return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    switch (coordFormat) {
      case 'dms':
        return f.dms;
      case 'mgrs':
        return f.mgrs;
      case 'utm':
        return f.utm;
      case 'plus':
        return f.plus_code;
      default:
        return f.decimal_degrees;
    }
  };

  const currentCoordText = getCoordText();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCoordText);
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
  const lat = location.latitude;
  const lon = location.longitude;

  return (
    <div className="glass-panel p-6 relative overflow-hidden space-y-4">
      
      {/* Demo Warning Banner if Mock */}
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

      {/* Main Location Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        
        {/* Left Address and Badges */}
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Coordinates &amp; Location</span>
            </span>

            {/* Source Label */}
            {isExifGps ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                Location Source: EXIF GPS
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                Location Source: AI Spatial Deduction
              </span>
            )}

            {elevationMeters !== undefined && elevationMeters !== null && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-700 flex items-center gap-1">
                <Mountain className="w-3 h-3 text-cyan-400" />
                <span>{elevationMeters}m Elevation</span>
              </span>
            )}

            {solar && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-amber-300 border border-slate-700 flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>{solar.solar_time}</span>
              </span>
            )}
          </div>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
            {location.address}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-0.5">
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

        {/* Right Metric Badges */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          
          {/* Confidence Badge */}
          <div className={`px-4 py-3 rounded-xl border flex flex-col items-center justify-center min-w-[100px] ${confidenceColor}`}>
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

        </div>
      </div>

      {/* Coordinate Format Switcher & Copy Bar */}
      <div className="p-3.5 rounded-xl bg-cyber-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Format Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[10px] font-mono uppercase text-slate-500 mr-1.5 hidden sm:inline">Format:</span>
          {(['dd', 'dms', 'mgrs', 'utm', 'plus'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setCoordFormat(fmt)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono uppercase font-bold transition-all ${
                coordFormat === fmt
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {fmt === 'plus' ? 'Plus Code' : fmt}
            </button>
          ))}
        </div>

        {/* Active Coordinate Display & Copy */}
        <div className="flex items-center gap-2 justify-between md:justify-end">
          <span className="font-mono text-xs font-bold text-cyan-300 select-all truncate">
            {currentCoordText}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex-shrink-0"
            title="Copy Coordinates"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* OSINT External Pivot Buttons */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase text-slate-400 mr-1 flex items-center gap-1">
            <ExternalLink className="w-3 h-3 text-cyan-400" />
            <span>OSINT Pivots:</span>
          </span>

          {/* Google Street View */}
          <a
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
          >
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Street View</span>
          </a>

          {/* Google 3D Satellite */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
          >
            <Globe className="w-3 h-3 text-blue-400" />
            <span>Google Maps</span>
          </a>

          {/* OpenStreetMap */}
          <a
            href={`https://www.openstreetmap.org/#map=18/${lat}/${lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
          >
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>OpenStreetMap</span>
          </a>

          {/* Mapillary Street Photos */}
          <a
            href={`https://www.mapillary.com/app/?lat=${lat}&lng=${lon}&z=17`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-purple-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3 h-3 text-purple-400" />
            <span>Mapillary</span>
          </a>

          {/* Sentinel Hub EO Browser */}
          <a
            href={`https://apps.sentinel-hub.com/eo-browser/?lat=${lat}&lng=${lon}&zoom=14`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
          >
            <Globe className="w-3 h-3 text-amber-400" />
            <span>Sentinel EO</span>
          </a>
        </div>

        {/* Action Triggers (Forensics & Export) */}
        <div className="flex items-center gap-2">
          {onOpenForensics && (
            <button
              onClick={onOpenForensics}
              className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspect Forensics</span>
            </button>
          )}

          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Export Dossier</span>
            </button>
          )}
        </div>

      </div>

      {/* Primary Reasoning Paragraph */}
      {location.reasoning && (
        <div className="p-3.5 rounded-xl bg-cyber-950/50 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans">
          <span className="font-mono font-semibold text-cyan-400 uppercase text-[11px] mr-2">
            Forensic Spatial Reasoning:
          </span>
          {location.reasoning}
        </div>
      )}

    </div>
  );
};
