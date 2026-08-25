import React from 'react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  onDismiss,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 shadow-lg flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-lg bg-rose-900/60 border border-rose-500/40 text-rose-400 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-rose-200">
            Investigation Interrupted
          </h4>
          <p className="text-xs text-rose-300/90 mt-0.5 leading-relaxed font-mono">
            {message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-500/50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-900/50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
