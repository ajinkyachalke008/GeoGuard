import React, { useState } from 'react';
import {
  X,
  Download,
  FileCode,
  Globe2,
  Table,
  Printer,
  Shield,
  FileCheck,
  Check
} from 'lucide-react';
import { GeolocationResult } from '../types/analysis';
import {
  generateGeoJSON,
  generateKML,
  generateCSV,
  downloadFile,
} from '../services/api';

interface ExportDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: GeolocationResult;
}

export const ExportDossierModal: React.FC<ExportDossierModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = (format: 'geojson' | 'kml' | 'csv') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    if (format === 'geojson') {
      const data = generateGeoJSON(result);
      downloadFile(data, `geoguard-osint-${timestamp}.geojson`, 'application/geo+json');
    } else if (format === 'kml') {
      const data = generateKML(result);
      downloadFile(data, `geoguard-target-${timestamp}.kml`, 'application/vnd.google-earth.kml+xml');
    } else if (format === 'csv') {
      const data = generateCSV(result);
      downloadFile(data, `geoguard-candidates-${timestamp}.csv`, 'text/csv');
    }

    setDownloadedFormat(format);
    setTimeout(() => setDownloadedFormat(null), 2500);
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl glass-panel border-cyan-500/30 p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Export OSINT Investigation Dossier
              </h3>
              <p className="text-xs text-slate-400">
                Export geospatial telemetry, candidate coordinates, and forensic findings in industry formats.
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

        {/* Export Grid Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* GeoJSON */}
          <div className="p-4 rounded-xl bg-cyber-950/60 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">GeoJSON FeatureCollection</h4>
                <p className="text-[11px] text-slate-400">Standard GIS vector points &amp; uncertainty polygons.</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('geojson')}
              className="w-full py-2 px-3 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {downloadedFormat === 'geojson' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloadedFormat === 'geojson' ? 'Exported!' : 'Download GeoJSON'}</span>
            </button>
          </div>

          {/* KML */}
          <div className="p-4 rounded-xl bg-cyber-950/60 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Globe2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">Google Earth KML</h4>
                <p className="text-[11px] text-slate-400">Placemarks for 3D aerial satellite flyovers.</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('kml')}
              className="w-full py-2 px-3 rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {downloadedFormat === 'kml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloadedFormat === 'kml' ? 'Exported!' : 'Download KML'}</span>
            </button>
          </div>

          {/* CSV */}
          <div className="p-4 rounded-xl bg-cyber-950/60 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Table className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">Tabular CSV Spreadsheet</h4>
                <p className="text-[11px] text-slate-400">Ranked candidates, coordinates &amp; confidence scores.</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('csv')}
              className="w-full py-2 px-3 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {downloadedFormat === 'csv' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloadedFormat === 'csv' ? 'Exported!' : 'Download CSV'}</span>
            </button>
          </div>

          {/* Print / PDF Brief */}
          <div className="p-4 rounded-xl bg-cyber-950/60 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">Printable OSINT Dossier</h4>
                <p className="text-[11px] text-slate-400">Generate formatted PDF briefing with verification block.</p>
              </div>
            </div>
            <button
              onClick={handlePrintDossier}
              className="w-full py-2 px-3 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target: {result.primary_location?.address || 'Geolocation Result'}</span>
          </div>
          <span>Provider: {result.provider}</span>
        </div>

      </div>
    </div>
  );
};
