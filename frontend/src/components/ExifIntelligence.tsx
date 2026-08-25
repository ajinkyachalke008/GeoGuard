import React from 'react';
import { Camera, Calendar, HardDrive, Compass, Cpu, CheckCircle2, XCircle } from 'lucide-react';
import { ExifData } from '../types/analysis';

interface ExifIntelligenceProps {
  exif?: ExifData;
}

export const ExifIntelligence: React.FC<ExifIntelligenceProps> = ({ exif }) => {
  if (!exif) return null;

  return (
    <div className="glass-panel p-6 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span>EXIF &amp; Metadata Intelligence</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Low-level hardware telemetry extracted from the original image file
          </p>
        </div>

        {/* Source Badge */}
        {exif.has_gps ? (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Location Source: EXIF GPS</span>
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-cyber-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>No Hardware GPS in EXIF</span>
          </span>
        )}
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Camera */}
        <div className="p-3 rounded-xl bg-cyber-950/60 border border-slate-800">
          <p className="text-[10px] font-mono uppercase text-slate-500">Camera Device</p>
          <p className="text-xs font-bold text-white mt-1 truncate">
            {exif.make || exif.model ? `${exif.make || ''} ${exif.model || ''}`.trim() : 'Unspecified'}
          </p>
        </div>

        {/* Lens */}
        <div className="p-3 rounded-xl bg-cyber-950/60 border border-slate-800">
          <p className="text-[10px] font-mono uppercase text-slate-500">Lens Optics</p>
          <p className="text-xs font-bold text-white mt-1 truncate">
            {exif.lens || 'Default / Phone'}
          </p>
        </div>

        {/* Capture Date */}
        <div className="p-3 rounded-xl bg-cyber-950/60 border border-slate-800">
          <p className="text-[10px] font-mono uppercase text-slate-500">Capture Timestamp</p>
          <p className="text-xs font-mono text-cyan-300 mt-1 truncate">
            {exif.captured_at || 'Not recorded'}
          </p>
        </div>

        {/* Resolution */}
        <div className="p-3 rounded-xl bg-cyber-950/60 border border-slate-800">
          <p className="text-[10px] font-mono uppercase text-slate-500">Resolution</p>
          <p className="text-xs font-mono text-white mt-1">
            {exif.dimensions || 'N/A'}
          </p>
        </div>

      </div>

      {/* GPS Specific details if available */}
      {exif.has_gps && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-emerald-200">
              Direct EXIF Coordinates: <strong>{exif.latitude?.toFixed(6)}, {exif.longitude?.toFixed(6)}</strong>
            </span>
          </div>
          {exif.altitude && (
            <span className="font-mono text-slate-400">
              Altitude: <strong className="text-white">{exif.altitude}m</strong>
            </span>
          )}
        </div>
      )}

    </div>
  );
};
