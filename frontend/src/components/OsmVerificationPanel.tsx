import React from 'react';
import { Globe, MapPin, Building2, Landmark, Train, CheckCircle, Navigation } from 'lucide-react';
import { OsmVerification } from '../types/analysis';

interface OsmVerificationPanelProps {
  osm: OsmVerification;
}

export const OsmVerificationPanel: React.FC<OsmVerificationPanelProps> = ({ osm }) => {
  return (
    <div className="glass-panel p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
              OpenStreetMap Ground-Truth Verification
            </h3>
            <p className="text-[11px] text-slate-400">
              Live Nominatim reverse geocoding and Overpass infrastructure correlation
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          <span>OSM Score {osm.ground_truth_score}%</span>
        </span>
      </div>

      {/* Administrative Hierarchy Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-cyber-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">Road / Street</span>
          <span className="text-slate-200 font-semibold truncate block">{osm.road || 'N/A'}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-cyber-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">City / Suburb</span>
          <span className="text-slate-200 font-semibold truncate block">{osm.suburb || osm.city || 'N/A'}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-cyber-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">State / Region</span>
          <span className="text-slate-200 font-semibold truncate block">{osm.state || 'N/A'}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-cyber-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">Country</span>
          <span className="text-slate-200 font-semibold truncate block">{osm.country || 'N/A'} {osm.country_code ? `(${osm.country_code})` : ''}</span>
        </div>
      </div>

      {/* Full OSM Display Name */}
      {osm.display_name && (
        <div className="p-3 rounded-lg bg-cyber-950/50 border border-slate-800 text-xs text-slate-300 font-mono">
          <span className="text-slate-500 mr-2">Registered Address:</span>
          {osm.display_name}
        </div>
      )}

      {/* Nearby Amenities from Overpass */}
      {osm.nearby_amenities && osm.nearby_amenities.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <Landmark className="w-3.5 h-3.5 text-cyan-400" />
            Nearby Ground-Truth Landmarks (1.5km Radius)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {osm.nearby_amenities.slice(0, 6).map((a, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-cyan-400 flex-shrink-0 text-[10px]">
                    {idx + 1}
                  </div>
                  <div className="truncate">
                    <span className="text-white font-semibold block truncate">{a.name}</span>
                    <span className="text-slate-500 text-[10px]">{a.amenity_type}</span>
                  </div>
                </div>
                <span className="text-cyan-400 font-bold text-[11px] flex-shrink-0">
                  {Math.round(a.distance_meters)}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
