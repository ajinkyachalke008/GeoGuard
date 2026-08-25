import React, { useState } from 'react';
import { X, Key, Server, Cpu, Sparkles, ShieldCheck, Eye, EyeOff, Save } from 'lucide-react';
import { AppConfig } from '../types/analysis';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig | null;
  activeProvider: string;
  apiKey: string;
  onSaveSettings: (provider: string, apiKey: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  activeProvider,
  apiKey,
  onSaveSettings,
}) => {
  const [provider, setProvider] = useState(activeProvider || config?.provider || 'openrouter');
  const [key, setKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(provider, key);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const getKeyLabel = () => {
    switch (provider) {
      case 'openrouter':
        return { label: 'OpenRouter API Key', placeholder: 'sk-or-v1-xxxxxxxxxxxx', envVar: 'OPENROUTER_API_KEY' };
      case 'openai':
        return { label: 'OpenAI API Key', placeholder: 'sk-proj-xxxxxxxxxxxx', envVar: 'OPENAI_API_KEY' };
      case 'geoseer':
        return { label: 'GeoSeer API Key', placeholder: 'gs_live_xxxxxxxxxxxx', envVar: 'GEOSEER_API_KEY' };
      default:
        return { label: 'API Key (Optional)', placeholder: 'Not required for Mock mode', envVar: 'N/A' };
    }
  };

  const keyMeta = getKeyLabel();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl glass-panel p-6 relative border-cyan-500/30 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                GeoGuard Engine Settings
              </h3>
              <p className="text-xs text-slate-400">
                Configure Geolocation Providers &amp; External AI Credentials
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-5 pt-4">
          
          {/* Provider Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
              Active Geolocation Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* OpenRouter GPT-4o */}
              <button
                type="button"
                onClick={() => setProvider('openrouter')}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  provider === 'openrouter'
                    ? 'bg-cyan-950/60 border-cyan-400/80 text-white shadow-[0_0_12px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/40'
                    : 'bg-cyber-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    OpenRouter GPT-4o
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-900/60 text-cyan-200 border border-cyan-500/40">
                    Live Vision
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  State-of-the-art multimodal OSINT geolocation with full visual deduction.
                </p>
              </button>

              {/* OpenAI Direct */}
              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  provider === 'openai'
                    ? 'bg-emerald-950/60 border-emerald-400/80 text-white shadow-[0_0_12px_rgba(52,211,153,0.25)] ring-1 ring-emerald-400/40'
                    : 'bg-cyber-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-emerald-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    OpenAI GPT-4o
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Direct OpenAI API vision endpoint with custom model parameters.
                </p>
              </button>

              {/* GeoSeer */}
              <button
                type="button"
                onClick={() => setProvider('geoseer')}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  provider === 'geoseer'
                    ? 'bg-blue-950/60 border-blue-400/80 text-white shadow-[0_0_12px_rgba(59,130,246,0.25)] ring-1 ring-blue-400/40'
                    : 'bg-cyber-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-blue-300">GeoSeer API</span>
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  GeoSeer visual cloud API integration.
                </p>
              </button>

              {/* Mock Mode */}
              <button
                type="button"
                onClick={() => setProvider('mock')}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  provider === 'mock'
                    ? 'bg-amber-950/60 border-amber-400/80 text-white shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40'
                    : 'bg-cyber-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-amber-300">Mock Mode</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Offline simulated candidate generator.
                </p>
              </button>

            </div>
          </div>

          {/* API Key Input (if not mock) */}
          {provider !== 'mock' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{keyMeta.label}</span>
                </span>
                <span className="text-[10px] text-slate-500 lowercase font-mono">env: {keyMeta.envVar}</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder={keyMeta.placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cyber-950 border border-slate-700 focus:border-cyan-400 text-xs font-mono text-slate-100 placeholder-slate-600 outline-none pr-10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Key entered here will override the server environment for your current session.
              </p>
            </div>
          )}

          {/* Save Action */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-md flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'Saved!' : 'Save Settings'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
