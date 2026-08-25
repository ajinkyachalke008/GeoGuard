import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Maximize2, Minimize2, Navigation } from 'lucide-react';
import type { LocationCandidate } from '../types/analysis';

interface GeoMapProps {
  primaryLocation: LocationCandidate;
  candidates: LocationCandidate[];
  selectedCandidate: LocationCandidate | null;
  onSelectCandidate: (candidate: LocationCandidate) => void;
}

// Generate GeoJSON Circle for uncertainty radius
function createGeoJSONCircle(center: [number, number], radiusInKm: number, points = 64) {
  const coords = {
    latitude: center[1],
    longitude: center[0]
  };

  const km = radiusInKm;
  const ret = [];
  const distanceX = km / (111.320 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [ret]
    },
    properties: {}
  };
}

export const GeoMap: React.FC<GeoMapProps> = ({
  primaryLocation,
  candidates,
  selectedCandidate,
  onSelectCandidate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'street'>('dark');

  const STYLES = {
    dark: {
      version: 8 as const,
      sources: {
        'carto-dark': {
          type: 'raster' as const,
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster' as const,
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    },
    street: {
      version: 8 as const,
      sources: {
        'osm-tiles': {
          type: 'raster' as const,
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster' as const,
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    },
    satellite: {
      version: 8 as const,
      sources: {
        'satellite-tiles': {
          type: 'raster' as const,
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri'
        }
      },
      layers: [
        {
          id: 'satellite-layer',
          type: 'raster' as const,
          source: 'satellite-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize MapLibre GL Map
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: STYLES[mapStyle],
      center: [primaryLocation.longitude, primaryLocation.latitude],
      zoom: 10,
      pitch: 30,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      // Add Uncertainty Circle
      if (primaryLocation.radius_km) {
        const circleData = createGeoJSONCircle(
          [primaryLocation.longitude, primaryLocation.latitude],
          primaryLocation.radius_km
        );

        if (!map.getSource('uncertainty-radius')) {
          map.addSource('uncertainty-radius', {
            type: 'geojson',
            data: circleData
          });

          map.addLayer({
            id: 'uncertainty-radius-fill',
            type: 'fill',
            source: 'uncertainty-radius',
            paint: {
              'fill-color': '#06b6d4',
              'fill-opacity': 0.15
            }
          });

          map.addLayer({
            id: 'uncertainty-radius-line',
            type: 'line',
            source: 'uncertainty-radius',
            paint: {
              'line-color': '#06b6d4',
              'line-width': 2,
              'line-dasharray': [2, 2]
            }
          });
        }
      }
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
    };
  }, [mapStyle]);

  // Update Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add Primary Location Marker (Beacon)
    const primaryEl = document.createElement('div');
    primaryEl.className = 'radar-beacon cursor-pointer';
    primaryEl.innerHTML = `
      <div class="radar-beacon-ring"></div>
      <div class="radar-beacon-core"></div>
    `;

    const primaryPopup = new maplibregl.Popup({ offset: 25 }).setHTML(`
      <div class="space-y-1">
        <p class="text-[10px] font-mono text-cyan-400 font-bold uppercase">Estimated Location</p>
        <p class="font-bold text-xs text-white">${primaryLocation.address}</p>
        <p class="text-[11px] font-mono text-slate-400">${primaryLocation.latitude.toFixed(4)}, ${primaryLocation.longitude.toFixed(4)}</p>
        <p class="text-[11px] font-semibold text-emerald-400">Confidence: ${primaryLocation.confidence_percentage}%</p>
      </div>
    `);

    const primaryMarker = new maplibregl.Marker({ element: primaryEl })
      .setLngLat([primaryLocation.longitude, primaryLocation.latitude])
      .setPopup(primaryPopup)
      .addTo(map);

    primaryEl.addEventListener('click', () => {
      onSelectCandidate(primaryLocation);
    });

    markersRef.current.push(primaryMarker);

    // Add other Candidate markers
    candidates.forEach((cand) => {
      if (cand.rank === 1) return; // Skip primary already added

      const el = document.createElement('div');
      el.className = 'cursor-pointer transform hover:scale-125 transition-transform';
      el.innerHTML = `
        <div class="w-6 h-6 rounded-full bg-cyber-900 border-2 border-amber-400 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shadow-lg">
          ${cand.rank}
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(`
        <div class="space-y-1">
          <p class="text-[10px] font-mono text-amber-400 font-bold uppercase">Candidate #${cand.rank}</p>
          <p class="font-bold text-xs text-white">${cand.address}</p>
          <p class="text-[11px] font-semibold text-amber-300">Confidence: ${cand.confidence_percentage}%</p>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([cand.longitude, cand.latitude])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        onSelectCandidate(cand);
      });

      markersRef.current.push(marker);
    });
  }, [primaryLocation, candidates]);

  // Fly to selected candidate when changed
  useEffect(() => {
    if (!selectedCandidate || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [selectedCandidate.longitude, selectedCandidate.latitude],
      zoom: selectedCandidate.rank === 1 ? 11 : 9,
      essential: true,
      duration: 1200
    });
  }, [selectedCandidate]);

  const handleResetView = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [primaryLocation.longitude, primaryLocation.latitude],
      zoom: 10,
      pitch: 30,
      duration: 1000
    });
  };

  return (
    <div className={`glass-panel overflow-hidden relative flex flex-col ${isFullscreen ? 'fixed inset-4 z-50' : 'h-[460px]'}`}>
      
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        
        {/* Layer Switcher */}
        <div className="flex items-center rounded-lg bg-cyber-950/90 border border-slate-700/80 p-1 shadow-lg backdrop-blur-md">
          <button
            onClick={() => setMapStyle('dark')}
            className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded transition-colors ${
              mapStyle === 'dark' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded transition-colors ${
              mapStyle === 'satellite' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapStyle('street')}
            className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded transition-colors ${
              mapStyle === 'street' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Street
          </button>
        </div>

        {/* Reset View Button */}
        <button
          onClick={handleResetView}
          className="p-2 rounded-lg bg-cyber-950/90 hover:bg-cyber-900 border border-slate-700/80 text-cyan-400 hover:text-cyan-300 shadow-lg backdrop-blur-md transition-colors"
          title="Reset to Primary Coordinates"
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fullscreen Toggle */}
      <div className="absolute top-3 right-14 z-10">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-lg bg-cyber-950/90 hover:bg-cyber-900 border border-slate-700/80 text-slate-300 hover:text-white shadow-lg backdrop-blur-md transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand Map'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Bottom Map Legend */}
      <div className="absolute bottom-2 left-3 z-10 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-cyber-950/90 border border-slate-800 text-[10px] font-mono text-slate-300 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white" />
          <span>Primary Prediction</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>Candidate Locations</span>
        </div>
        {primaryLocation.radius_km && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-cyan-400 bg-cyan-400/20" />
            <span>Uncertainty Ring (±{primaryLocation.radius_km}km)</span>
          </div>
        )}
      </div>

    </div>
  );
};
