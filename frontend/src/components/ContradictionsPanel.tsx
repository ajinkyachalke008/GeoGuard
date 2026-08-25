import React from 'react';
import { AlertCircle, HelpCircle, ShieldQuestion, Scale } from 'lucide-react';
import { ContradictionItem } from '../types/analysis';

interface ContradictionsPanelProps {
  contradictions: ContradictionItem[];
}

export const ContradictionsPanel: React.FC<ContradictionsPanelProps> = ({
  contradictions,
}) => {
  if (!contradictions || contradictions.length === 0) return null;

  return (
    <div className="glass-panel p-6 space-y-4 border-amber-500/20">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <span>Contradictions &amp; Uncertainty Analysis</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Scientific identification of conflicting cues, missing markers, and uncertainty factors
          </p>
        </div>

        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/40">
          Scientific Integrity
        </span>
      </div>

      {/* Contradiction Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {contradictions.map((item, idx) => {
          const effectBadge =
            item.effect === 'High uncertainty'
              ? 'text-rose-400 bg-rose-950/60 border-rose-500/40'
              : item.effect === 'Medium uncertainty'
              ? 'text-amber-400 bg-amber-950/60 border-amber-500/40'
              : 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';

          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-cyber-950/60 border border-slate-800/80 flex flex-col justify-between space-y-2.5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold uppercase text-slate-400">
                    {item.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${effectBadge}`}>
                    {item.effect}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-200">
                  {item.description}
                </p>
              </div>

              {item.scientific_note && (
                <div className="pt-2 border-t border-slate-800/50 text-[11px] text-slate-400 font-sans leading-relaxed">
                  <span className="text-amber-400/90 font-medium mr-1">Impact:</span>
                  {item.scientific_note}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
