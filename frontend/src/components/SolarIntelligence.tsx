import React from 'react';
import { Sun, Compass, Clock, ArrowUpRight, CloudSun, ShieldCheck } from 'lucide-react';
import { SolarData } from '../types/analysis';

interface SolarIntelligenceProps {
  solar: SolarData;
}

export const SolarIntelligence: React.FC<SolarIntelligenceProps> = ({ solar }) => {
  const sunStateColor =
    solar.sun_state === 'Daylight'
      ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
      : solar.sun_state === 'Golden Hour'
      ? 'bg-orange-950/60 text-orange-300 border-orange-500/40'
      : solar.sun_state === 'Civil Twilight' || solar.sun_state === 'Dusk / Dawn'
      ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
      : 'bg-slate-900 text-slate-300 border-slate-700';

  return (
    <div className="glass-panel p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
              Solar Position &amp; Shadow Vector
            </h3>
            <p className="text-[11px] text-slate-400">
              Astronomical NOAA solar calculations for lighting and shadow direction verification
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${sunStateColor}`}>
          {solar.sun_state}
        </span>
      </div>

      {/* Grid of Gauges & Vectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Solar Azimuth */}
        <div className="p-3.5 rounded-xl bg-cyber-950/70 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center relative flex-shrink-0">
            <Compass className="w-5 h-5 text-amber-400" />
            <div
              className="absolute w-1 h-4 bg-amber-400 rounded-full origin-bottom"
              style={{ transform: `rotate(${solar.solar_azimuth_deg}deg)` }}
            />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Solar Azimuth</span>
            <span className="font-display font-extrabold text-lg text-white">
              {solar.solar_azimuth_deg}°
            </span>
          </div>
        </div>

        {/* Solar Elevation */}
        <div className="p-3.5 rounded-xl bg-cyber-950/70 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0">
            <CloudSun className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Elevation Angle</span>
            <span className="font-display font-extrabold text-lg text-cyan-300">
              {solar.solar_elevation_deg}°
            </span>
          </div>
        </div>

        {/* Shadow Vector */}
        <div className="p-3.5 rounded-xl bg-cyber-950/70 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center relative flex-shrink-0">
            <ArrowUpRight
              className="w-5 h-5 text-emerald-400"
              style={{ transform: `rotate(${solar.shadow_azimuth_deg - 45}deg)` }}
            />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Shadow Direction</span>
            <span className="font-display font-extrabold text-lg text-emerald-400">
              {solar.shadow_azimuth_deg}°
            </span>
          </div>
        </div>

      </div>

      {/* Explanatory Note */}
      {solar.notes && (
        <div className="p-3 rounded-lg bg-cyber-950/40 border border-slate-800/80 text-xs text-slate-300 font-mono flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
          <span>{solar.notes}</span>
        </div>
      )}
    </div>
  );
};
