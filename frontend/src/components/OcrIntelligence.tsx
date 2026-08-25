import React from 'react';
import { ScanText, Languages, Signpost, Phone, Globe, FileText } from 'lucide-react';
import { OcrResult } from '../types/analysis';

interface OcrIntelligenceProps {
  ocr?: OcrResult;
}

export const OcrIntelligence: React.FC<OcrIntelligenceProps> = ({ ocr }) => {
  if (!ocr) return null;

  return (
    <div className="glass-panel p-6 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-2">
            <ScanText className="w-5 h-5 text-cyan-400" />
            <span>Visible Text &amp; OCR Intelligence</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Optical character recognition and script analysis across the visual scene
          </p>
        </div>

        <span className="px-2 py-0.5 rounded text-xs font-mono text-cyan-400 bg-cyber-800 border border-slate-700">
          {ocr.has_text ? `${ocr.text_fragments.length} Segments Found` : 'No Text Detected'}
        </span>
      </div>

      {ocr.has_text ? (
        <div className="space-y-4">
          
          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Scripts */}
            <div className="p-3 rounded-xl bg-cyber-950/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                <span>Detected Scripts</span>
              </span>
              <p className="text-xs font-semibold text-white">
                {ocr.scripts_detected.length > 0 ? ocr.scripts_detected.join(', ') : 'Latin'}
              </p>
            </div>

            {/* Languages */}
            <div className="p-3 rounded-xl bg-cyber-950/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Linguistic Correlates</span>
              </span>
              <p className="text-xs font-semibold text-white">
                {ocr.languages_detected.length > 0 ? ocr.languages_detected.join(', ') : 'Regional standard'}
              </p>
            </div>

            {/* Signs Identified */}
            <div className="p-3 rounded-xl bg-cyber-950/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                <Signpost className="w-3.5 h-3.5 text-emerald-400" />
                <span>Signage Identified</span>
              </span>
              <p className="text-xs font-semibold text-white">
                {ocr.signs_identified.length > 0 ? `${ocr.signs_identified.length} items` : 'None identified'}
              </p>
            </div>

          </div>

          {/* Text Fragments */}
          {ocr.text_fragments.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Extracted Text Chips:
              </span>
              <div className="flex flex-wrap gap-2">
                {ocr.text_fragments.map((frag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-cyber-950 border border-slate-700 text-xs font-mono text-slate-200"
                  >
                    "{frag}"
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="p-4 rounded-xl bg-cyber-950/40 border border-slate-800/80 text-center text-xs text-slate-500 font-mono">
          Optical Character Recognition found no visible alphabetic or numeric signage in this frame.
        </div>
      )}

    </div>
  );
};
