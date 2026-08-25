import React from 'react';
import { Layers, MapPin, ExternalLink, Navigation } from 'lucide-react';
import { LocationCandidate } from '../types/analysis';

interface CandidatesListProps {
  candidates: LocationCandidate[];
  selectedCandidate: LocationCandidate | null;
  onSelectCandidate: (candidate: LocationCandidate) => void;
}

export const CandidatesList: React.FC<CandidatesListProps> = ({
  candidates,
  selectedCandidate,
  onSelectCandidate,
}) => {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="glass-panel p-6 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Ranked Location Candidates</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Geographic probability distribution of candidate coordinates
          </p>
        </div>

        <span className="px-2 py-0.5 rounded text-xs font-mono text-cyan-400 bg-cyber-800 border border-slate-700">
          {candidates.length} Ranked
        </span>
      </div>

      {/* Candidate List Cards */}
      <div className="space-y-2.5">
        {candidates.map((candidate) => {
          const isSelected =
            selectedCandidate &&
            selectedCandidate.latitude === candidate.latitude &&
            selectedCandidate.longitude === candidate.longitude;

          const isPrimary = candidate.rank === 1;

          return (
            <div
              key={candidate.rank}
              onClick={() => onSelectCandidate(candidate)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-cyber-950/60 hover:bg-cyber-950/90 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Left Rank & Address */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 ${
                      isPrimary
                        ? 'bg-cyan-500 text-black shadow-sm'
                        : 'bg-cyber-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    #{candidate.rank}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-white">
                        {candidate.address}
                      </h4>
                      {isPrimary && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      {candidate.latitude.toFixed(4)}, {candidate.longitude.toFixed(4)}
                      {candidate.radius_km && ` • ±${candidate.radius_km}km`}
                    </p>
                  </div>
                </div>

                {/* Right Confidence Bar & Percent */}
                <div className="flex items-center gap-4 self-end sm:self-auto min-w-[160px]">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Probability:</span>
                      <span className="text-white font-bold">{candidate.confidence_percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-cyber-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          isPrimary
                            ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                            : 'bg-amber-400'
                        }`}
                        style={{ width: `${candidate.confidence_percentage}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-1.5 rounded-lg bg-cyber-800 hover:bg-cyber-700 text-slate-400 hover:text-cyan-300 transition-colors"
                    title="Focus on map"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Reasoning */}
              {candidate.reasoning && (
                <p className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/40 font-sans leading-relaxed">
                  {candidate.reasoning}
                </p>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
