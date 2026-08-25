import React, { useState } from 'react';
import {
  Building2,
  Milestone,
  Languages,
  Car,
  UtilityPole,
  Trees,
  Landmark,
  CheckCircle,
  HelpCircle,
  Filter
} from 'lucide-react';
import { EvidenceItem, EvidenceCategory } from '../types/analysis';

interface EvidencePanelProps {
  evidence: EvidenceItem[];
}

const CATEGORY_CONFIG: Record<
  EvidenceCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  Architecture: {
    label: 'Architecture',
    icon: <Building2 className="w-4 h-4" />,
    color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/30'
  },
  Roads: {
    label: 'Roads & Markings',
    icon: <Milestone className="w-4 h-4" />,
    color: 'text-sky-400 border-sky-500/40 bg-sky-950/30'
  },
  Language: {
    label: 'Language & Script',
    icon: <Languages className="w-4 h-4" />,
    color: 'text-amber-400 border-amber-500/40 bg-amber-950/30'
  },
  Vehicles: {
    label: 'Vehicles & Transit',
    icon: <Car className="w-4 h-4" />,
    color: 'text-purple-400 border-purple-500/40 bg-purple-950/30'
  },
  Infrastructure: {
    label: 'Infrastructure',
    icon: <UtilityPole className="w-4 h-4" />,
    color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30'
  },
  Environment: {
    label: 'Environment & Biomes',
    icon: <Trees className="w-4 h-4" />,
    color: 'text-teal-400 border-teal-500/40 bg-teal-950/30'
  },
  Landmarks: {
    label: 'Landmarks & Telemetry',
    icon: <Landmark className="w-4 h-4" />,
    color: 'text-rose-400 border-rose-500/40 bg-rose-950/30'
  },
};

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredEvidence =
    activeCategory === 'all'
      ? evidence
      : evidence.filter((item) => item.category === activeCategory);

  const categories = Array.from(new Set(evidence.map((e) => e.category)));

  return (
    <div className="glass-panel p-6 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-2">
            <span>Evidence Analysis</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-normal bg-cyber-800 text-cyan-400 border border-cyan-500/30">
              {evidence.length} Indicators Verified
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Breakdown of multi-sensory visual and spatial clues influencing the prediction
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-cyan-500 text-black font-semibold shadow-sm'
                : 'bg-cyber-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            All ({evidence.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-cyan-500 text-black font-semibold shadow-sm'
                  : 'bg-cyber-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredEvidence.map((item, idx) => {
          const config = CATEGORY_CONFIG[item.category] || {
            label: item.category,
            icon: <HelpCircle className="w-4 h-4" />,
            color: 'text-slate-300 border-slate-700 bg-slate-800/40'
          };

          const strengthBadge =
            item.strength === 'Strong'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
              : item.strength === 'Moderate'
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700';

          const sourceBadge =
            item.source === 'OCR'
              ? 'text-amber-400 bg-amber-950/60 border-amber-500/30'
              : item.source === 'EXIF'
              ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
              : item.source === 'Spatial Correlation'
              ? 'text-purple-400 bg-purple-950/60 border-purple-500/30'
              : 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30';

          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-cyber-950/60 hover:bg-cyber-950/90 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                
                {/* Category & Badges Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${config.color}`}>
                    {config.icon}
                    <span>{config.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${strengthBadge}`}>
                      {item.strength}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${sourceBadge}`}>
                      {item.source}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Extra Details */}
              {item.details && (
                <div className="pt-2 border-t border-slate-800/50 text-[11px] font-mono text-slate-400">
                  {item.details}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
