import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Sun,
  Eye,
  Camera,
  RotateCcw,
  Sparkles,
  Contrast,
  Layers
} from 'lucide-react';
import { ExifData } from '../types/analysis';

interface ImageForensicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  exif?: ExifData;
}

export const ImageForensicsModal: React.FC<ImageForensicsModalProps> = ({
  isOpen,
  onClose,
  imageFile,
  exif,
}) => {
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [invert, setInvert] = useState(false);
  const [edgeDetect, setEdgeDetect] = useState(false);
  const [sharpen, setSharpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // Apply filters on canvas
  useEffect(() => {
    if (!isOpen || !imageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Base CSS filters on canvas
      let filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      if (invert) filterStr += ' invert(100%)';
      ctx.filter = filterStr;

      ctx.drawImage(img, 0, 0);

      // Custom Pixel Filter: Sobel Edge Detection
      if (edgeDetect) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const width = canvas.width;
        const height = canvas.height;
        const gray = new Uint8Array(width * height);

        for (let i = 0; i < data.length; i += 4) {
          gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        const output = ctx.createImageData(width, height);
        const outData = output.data;

        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            // Sobel kernels
            const gx =
              -1 * gray[(y - 1) * width + (x - 1)] +
              1 * gray[(y - 1) * width + (x + 1)] +
              -2 * gray[y * width + (x - 1)] +
              2 * gray[y * width + (x + 1)] +
              -1 * gray[(y + 1) * width + (x - 1)] +
              1 * gray[(y + 1) * width + (x + 1)];

            const gy =
              -1 * gray[(y - 1) * width + (x - 1)] +
              -2 * gray[(y - 1) * width + x] +
              -1 * gray[(y - 1) * width + (x + 1)] +
              1 * gray[(y + 1) * width + (x - 1)] +
              2 * gray[(y + 1) * width + x] +
              1 * gray[(y + 1) * width + (x + 1)];

            const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
            const idx = (y * width + x) * 4;
            outData[idx] = 6;     // Cyan glow
            outData[idx + 1] = mag; // green
            outData[idx + 2] = mag; // blue
            outData[idx + 3] = 255;
          }
        }
        ctx.putImageData(output, 0, 0);
      }
    };
  }, [isOpen, imageSrc, brightness, contrast, saturation, invert, edgeDetect, sharpen]);

  const handleReset = () => {
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setInvert(false);
    setEdgeDetect(false);
    setSharpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-6xl h-[90vh] glass-panel border-cyan-500/30 flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Modal Topbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-cyber-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                Forensic Optical Image Inspector
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-900/50 text-cyan-300 border border-cyan-500/30">
                  OSINT Loupe &amp; Filters
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Inspect distant road signs, weathered facade textures, and optical telemetry at high magnification.
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

        {/* Modal Main Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-hidden">
          
          {/* Canvas Viewport (3 cols) */}
          <div className="lg:col-span-3 bg-black/70 rounded-xl border border-slate-800 flex flex-col overflow-hidden relative">
            
            {/* Viewport Floating Controls */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-cyber-950/90 backdrop-blur-sm border border-slate-700 rounded-lg p-1.5 shadow-lg">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-cyan-400 px-2">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(6, z + 0.25))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-700 mx-1" />
              <button
                onClick={handleReset}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 flex items-center gap-1 text-xs"
                title="Reset Image View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Scrollable Canvas Container */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              <canvas
                ref={canvasRef}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.1s ease-out',
                  maxWidth: zoom <= 1 ? '100%' : 'none',
                  maxHeight: zoom <= 1 ? '100%' : 'none',
                }}
                className="shadow-2xl rounded"
              />
            </div>
          </div>

          {/* Controls & Optical Telemetry Sidebar (1 col) */}
          <div className="space-y-4 overflow-y-auto pr-1">
            
            {/* Filter Sliders */}
            <div className="glass-panel p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Forensic Filters
                </span>
              </div>

              {/* Brightness */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Brightness</span>
                  <span>{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="250"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Contrast</span>
                  <span>{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="300"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Saturation</span>
                  <span>{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="250"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Quick Filter Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setInvert(!invert)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                    invert
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Contrast className="w-3.5 h-3.5" />
                  <span>Invert Colors</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEdgeDetect(!edgeDetect)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                    edgeDetect
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sobel Edges</span>
                </button>
              </div>
            </div>

            {/* Optical EXIF Sidebar */}
            {exif && (
              <div className="glass-panel p-4 space-y-3">
                <span className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  Optical Metadata
                </span>

                <div className="space-y-2 text-xs font-mono">
                  {exif.make && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Camera:</span>
                      <span className="text-slate-200">{exif.make} {exif.model || ''}</span>
                    </div>
                  )}
                  {exif.focal_length_35mm && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">35mm Equiv:</span>
                      <span className="text-cyan-300 font-bold">{exif.focal_length_35mm} mm</span>
                    </div>
                  )}
                  {exif.f_number && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Aperture:</span>
                      <span className="text-slate-200">ƒ/{exif.f_number}</span>
                    </div>
                  )}
                  {exif.exposure_time && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Shutter:</span>
                      <span className="text-slate-200">{exif.exposure_time}</span>
                    </div>
                  )}
                  {exif.iso_speed && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">ISO:</span>
                      <span className="text-slate-200">{exif.iso_speed}</span>
                    </div>
                  )}
                  {exif.dimensions && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Sensor Dim:</span>
                      <span className="text-slate-200">{exif.dimensions}</span>
                    </div>
                  )}
                  {exif.gps_img_direction !== undefined && (
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">Heading:</span>
                      <span className="text-cyan-300 font-bold">{exif.gps_img_direction}°</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
