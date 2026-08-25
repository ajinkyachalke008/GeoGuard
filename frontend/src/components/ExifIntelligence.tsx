import React, { useState } from 'react';
import { Camera, Satellite, Layers, ChevronDown, ChevronUp, Eye, Compass, ShieldCheck } from 'lucide-react';
import { ExifData } from '../types/analysis';

interface ExifIntelligenceProps {
  exif?: ExifData;
}

export const ExifIntelligence: React.FC<ExifIntelligenceProps> = ({ exif }) => {
  const [showAllTags, setShowAllTags] = useState(false);

  if (!exif) return null;

  return (
    <div className="glass-panel p-5 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white">
              Optical EXIF &amp; Hardware Telemetry
            </h3>
            <p className="text-[11px] text-slate-400">
              Sensor metadata, optical focal length, and satellite GPS IFD tags
            </p>
          </div>
        </div>

        {/* GPS Badge */}
        {exif.has_gps ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <Satellite className="w-3 h-3 text-emerald-400" />
            <span>Hardware GPS Verified</span>
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-700">
            No Embedded GPS Tag
          </span>
        )}
      </div>

      {/* Grid of Key Optical Data */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        
        {/* Camera / Make */}
        <div className="p-2.5 rounded-lg bg-cyber-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">Capture Device</span>
          <span className="text-slate-200 font-semibold truncate block">
            {exif.make ? `${exif.make} ${exif.model || ''}` : 'Unknown'}
          </span>
        </div>

        {/* 35mm Equiv Focal Length */}
        <div className="p-2.5 rounded-lg bg-cyber-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">35mm Equiv Lens</span>
          <span className="text-cyan-300 font-bold block">
            {exif.focal_length_35mm ? `${exif.focal_length_35mm} mm` : exif.focal_length_mm ? `${exif.focal_length_mm} mm` : 'N/A'}
          </span>
        </div>

        {/* Aperture / Shutter */}
        <div className="p-2.5 rounded-lg bg-cyber-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">Optics (ƒ / Shutter)</span>
          <span className="text-slate-200 font-semibold block truncate">
            {exif.f_number ? `ƒ/${exif.f_number}` : 'N/A'} {exif.exposure_time ? `• ${exif.exposure_time}` : ''}
          </span>
        </div>

        {/* ISO / Flash */}
        <div className="p-2.5 rounded-lg bg-cyber-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">ISO / Flash</span>
          <span className="text-slate-200 font-semibold block truncate">
            {exif.iso_speed ? `ISO ${exif.iso_speed}` : 'N/A'} {exif.flash ? `• ${exif.flash}` : ''}
          </span>
        </div>

        {/* Sensor Dimensions */}
        <div className="p-2.5 rounded-lg bg-cyber-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">Image Resolution</span>
          <span className="text-slate-200 font-semibold block">
            {exif.dimensions || 'N/A'}
          </span>
        </div>

        {/* Timestamp */}
        <div className="p-2.5 rounded-lg bg-cyber-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">Capture Timestamp</span>
          <span className="text-slate-200 font-semibold block truncate">
            {exif.captured_at || 'Not Recorded'}
          </span>
        </div>

        {/* GPS Altitude */}
        <div className="p-2.5 rounded-lg bg-cyber-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">GPS Altitude</span>
          <span className="text-slate-200 font-semibold block">
            {exif.altitude !== undefined && exif.altitude !== null ? `${exif.altitude} m` : 'N/A'}
          </span>
        </div>

        {/* Compass Direction */}
        <div className="p-2.5 rounded-lg bg-cyber-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">Camera Heading</span>
          <span className="text-cyan-300 font-bold block">
            {exif.gps_img_direction !== undefined && exif.gps_img_direction !== null ? `${exif.gps_img_direction}°` : 'N/A'}
          </span>
        </div>

      </div>

    </div>
  );
};
