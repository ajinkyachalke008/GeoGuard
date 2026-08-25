import React from 'react';
import {
  FileCheck,
  Binary,
  ScanText,
  Compass,
  Layers,
  ShieldAlert,
  MapPin,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { PipelineStage } from '../types/analysis';

interface AnalysisScreenProps {
  stages: PipelineStage[];
  imageFileName: string;
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  stage_1: <FileCheck className="w-4 h-4" />,
  stage_2: <Binary className="w-4 h-4" />,
  stage_3: <ScanText className="w-4 h-4" />,
  stage_4: <Compass className="w-4 h-4" />,
  stage_5: <Layers className="w-4 h-4" />,
  stage_6: <ShieldAlert className="w-4 h-4" />,
  stage_7: <MapPin className="w-4 h-4" />,
};

export const AnalysisScreen: React.FC<AnalysisScreenProps> = ({
  stages,
  imageFileName,
}) => {
  // Find current active stage
  const activeIndex = stages.findIndex((s) => s.status === 'processing');
  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / (stages.length || 7)) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      
      {/* Radar Animation Hub */}
      <div className="relative p-8 rounded-2xl glass-panel-accent overflow-hidden text-center space-y-4">
        
        {/* Animated Radar Scanning Element */}
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
          <div className="absolute inset-2 rounded-full border border-cyan-500/30" />
          <div className="absolute inset-6 rounded-full border border-cyan-500/40" />
          
          {/* Rotating sweep line */}
          <div className="absolute inset-0 rounded-full animate-radar-sweep border-t-2 border-cyan-400 bg-gradient-to-tr from-transparent via-cyan-500/10 to-cyan-400/30" />
          
          <div className="relative z-10 w-12 h-12 rounded-full bg-cyber-950 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] flex items-center justify-center">
            <Compass className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>

        <div>
          <h2 className="font-display font-bold text-xl text-white tracking-tight">
            Geospatial Intelligence in Progress
          </h2>
          <p className="text-xs font-mono text-cyan-300 mt-1">
            Analyzing {imageFileName} • {progressPercent}% Completed
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto h-2 bg-cyber-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Real Pipeline Stages List */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Pipeline Execution Telemetry
          </span>
          <span className="text-[11px] font-mono text-cyan-400">
            Stages Verified ({completedCount}/{stages.length})
          </span>
        </div>

        <div className="divide-y divide-slate-800/50">
          {stages.map((stage, idx) => {
            const isCurrent = stage.status === 'processing';
            const isDone = stage.status === 'completed';
            const isPending = stage.status === 'pending';

            return (
              <div
                key={stage.stage_id || idx}
                className={`py-3 px-3 rounded-lg flex items-center justify-between transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/40 border border-cyan-500/40 shadow-sm'
                    : isDone
                    ? 'bg-cyber-950/30 text-slate-300'
                    : 'opacity-40 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Status icon */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono ${
                      isDone
                        ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                        : isCurrent
                        ? 'bg-cyan-950 border border-cyan-400 text-cyan-300 animate-pulse'
                        : 'bg-cyber-800 border border-slate-700 text-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : (
                      STAGE_ICONS[stage.stage_id] || idx + 1
                    )}
                  </div>

                  <div>
                    <p
                      className={`text-xs font-semibold ${
                        isCurrent ? 'text-cyan-300 font-display' : isDone ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {stage.name}
                    </p>
                    {stage.message && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {stage.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                      isDone
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                        : isCurrent
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400 animate-pulse'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {stage.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
