import React from 'react';
import { Shield, Settings2, RefreshCw, Sparkles, Cpu, Globe2 } from 'lucide-react';
import { AppConfig } from '../types/analysis';

interface HeaderProps {
  config: AppConfig | null;
  onOpenSettings: () => void;
  onReset: () => void;
  hasResult: boolean;
  isAnalyzing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenSettings,
  onReset,
  hasResult,
  isAnalyzing,
}) => {
  const isMock = config?.is_mock ?? false;

  const renderStatus = () => {
    if (isMock) {
      return (
        <div className="flex items-center gap-2 text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-semibold">MOCK MODE</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Offline Simulation</span>
        </div>
      );
    }

    const prov = config?.provider?.toLowerCase() || '';
    if (prov.includes('gemini') || prov.includes('google')) {
      return (
        <div className="flex items-center gap-2 text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="font-semibold text-cyan-300">LIVE: Google Gemini</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-medium">Gemini 3.6 Flash</span>
        </div>
      );
    }

    if (prov.includes('openrouter')) {
      return (
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="font-semibold text-emerald-300">LIVE: OpenRouter</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-300 font-medium">GPT-4o Vision</span>
        </div>
      );
    }

    if (prov.includes('claude') || prov.includes('anthropic')) {
      return (
        <div className="flex items-center gap-2 text-purple-400">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          <span className="font-semibold text-purple-300">LIVE: Anthropic Claude</span>
          <span className="text-slate-500">|</span>
          <span className="text-purple-200 font-medium">Claude 3.5 Sonnet</span>
        </div>
      );
    }

    if (prov.includes('openai')) {
      return (
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="font-semibold text-emerald-300">LIVE: OpenAI</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-300 font-medium">{config?.model_name || 'GPT-4o'}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-cyan-400">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
        <span className="font-semibold text-cyan-300">LIVE: {config?.provider || 'Production AI'}</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-300">Real OSINT Active</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-cyber-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={onReset}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyber-900 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Shield className="w-5 h-5 text-cyan-400" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl tracking-tight text-white flex items-center">
                GEO<span className="text-cyan-400">GUARD</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                v2.0 PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide hidden sm:block">
              AI Visual Geolocation, OpenStreetMap &amp; OSINT Intelligence Platform
            </p>
          </div>
        </div>

        {/* Center Status Banner */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyber-900/90 border border-slate-800 text-xs font-mono">
          {renderStatus()}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {hasResult && (
            <button
              onClick={onReset}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyber-800 hover:bg-cyber-700 text-slate-200 border border-slate-700 transition-colors"
              title="Start New Geolocation Investigation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Analysis</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 shadow-sm transition-all"
            title="Configure Geolocation Providers &amp; API Keys"
          >
            <Settings2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
