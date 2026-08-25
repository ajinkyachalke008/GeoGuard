import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Maximize2, Minimize2, Navigation, Sun, ArrowUpRight, Landmark, Layers } from 'lucide-react';
import type { LocationCandidate, SolarData, OsmAmenity } from '../types/analysis';

interface GeoMapProps {
  primaryLocation: LocationCandidate;
  candidates: LocationCandidate[];
  selectedCandidate: LocationCandidate | null;
  onSelectCandidate: (candidate: LocationCandidate) => void;
  solarData?: SolarData;
  nearbyAmenities?: OsmAmenity[];
}

// Generate GeoJSON Circle for uncertainty radius
function createGeoJSONCircle(center: [number, number], radiusInKm: number, points = 64) {
  const coords = {
    latitude: center[1],
    longitude: center[0],
  };

  const km = radiusInKm;
  const ret = [];
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
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
      coordinates: [ret],
    },
    properties: {},
  };
}

// Generate Ray / LineString for solar & shadow vectors
function createVectorLine(center: [number, number], angleDeg: number, lengthKm = 3.0) {
  const lat = center[1];
  const lon = center[0];
  const rad = (angleDeg * Math.PI) / 180;
  const distanceX = (lengthKm * Math.sin(rad)) / (111.32 * Math.cos((lat * Math.PI) / 180));
  const distanceY = (lengthKm * Math.cos(rad)) / 110.574;

  return {
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [lon, lat],
        [lon + distanceX, lat + distanceY],
      ],
    },
    properties: {},
  };
}

export const GeoMap: React.FC<GeoMapProps> = ({
  primaryLocation,
  candidates,
  selectedCandidate,
  onSelectCandidate,
  solarData,
  nearbyAmenities,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [showSolarVectors, setShowSolarVectors] = useState(true);
  const [showAmenities, setShowAmenities] = useState(true);

  const STYLES = {
    dark: {
      version: 8 as const,
      sources: {
        'carto-dark': {
          type: 'raster' as const,
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        },
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster' as const,
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
    street: {
      version: 8 as const,
      sources: {
        'osm-tiles': {
          type: 'raster' as const,
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster' as const,
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
    satellite: {
      version: 8 as const,
      sources: {
        'satellite-tiles': {
          type: 'raster' as const,
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri',
        },
      },
      layers: [
        {
          id: 'satellite-layer',
          type: 'raster' as const,
          source: 'satellite-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: STYLES[mapStyle],
      center: [primaryLocation.longitude, primaryLocation.latitude],
      zoom: 12,
      pitch: 30,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      // 1. Add Uncertainty Radius Polygon Layer
      const radiusKm = primaryLocation.radius_km || 1.5;
      const circleGeoJSON = createGeoJSONCircle(
        [primaryLocation.longitude, primaryLocation.latitude],
        radiusKm
      );

      map.addSource('uncertainty-radius', {
        type: 'geojson',
        data: circleGeoJSON,
      });

      map.addLayer({
        id: 'uncertainty-radius-fill',
        type: 'fill',
        source: 'uncertainty-radius',
        paint: {
          'fill-color': '#06b6d4',
          'fill-opacity': 0.12,
        },
      });

      map.addLayer({
        id: 'uncertainty-radius-line',
        type: 'line',
        source: 'uncertainty-radius',
        paint: {
          'line-color': '#06b6d4',
          'line-width': 2,
          'line-dasharray': [3, 2],
        },
      });

      // 2. Add Solar Azimuth Vector (Yellow) & Shadow Vector (Emerald)
      if (solarData && showSolarVectors) {
        const sunLine = createVectorLine(
          [primaryLocation.longitude, primaryLocation.latitude],
          solarData.solar_azimuth_deg,
          2.5
        );
        const shadowLine = createVectorLine(
          [primaryLocation.longitude, primaryLocation.latitude],
          solarData.shadow_azimuth_deg,
          2.0
        );

        map.addSource('solar-sun-vector', { type: 'geojson', data: sunLine });
        map.addLayer({
          id: 'solar-sun-vector-line',
          type: 'line',
          source: 'solar-sun-vector',
          paint: {
            'line-color': '#f59e0b',
            'line-width': 3,
          },
        });

        map.addSource('solar-shadow-vector', { type: 'geojson', data: shadowLine });
        map.addLayer({
          id: 'solar-shadow-vector-line',
          type: 'line',
          source: 'solar-shadow-vector',
          paint: {
            'line-color': '#10b981',
            'line-width': 2,
            'line-dasharray': [2, 2],
          },
        });
      }

      renderMarkers(map);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
    };
  }, [mapStyle]);

  const renderMarkers = (map: maplibregl.Map) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Primary Target Marker
    const primaryEl = document.createElement('div');
    primaryEl.className = 'relative flex items-center justify-center cursor-pointer';
    primaryEl.innerHTML = `
      <div class="radar-ping"></div>
      <div class="relative z-10 w-7 h-7 rounded-full bg-cyan-500 border-2 border-white shadow-lg flex items-center justify-center text-black font-black text-xs">
        1
      </div>
    `;

    const primaryMarker = new maplibregl.Marker({ element: primaryEl })
      .setLngLat([primaryLocation.longitude, primaryLocation.latitude])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="color: #0f172a; padding: 4px; font-family: sans-serif;">
            <div style="font-weight: 800; font-size: 13px; color: #0284c7;">Target Location</div>
            <div style="font-size: 11px; margin-top: 2px;">${primaryLocation.address}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Confidence: <b>${primaryLocation.confidence_percentage}%</b> | Radius: ±${primaryLocation.radius_km || 1}km</div>
          </div>
        `)
      )
      .addTo(map);

    primaryEl.addEventListener('click', () => onSelectCandidate(primaryLocation));
    markersRef.current.push(primaryMarker);

    // 2. Secondary Candidate Pins
    candidates.forEach((c) => {
      if (c.rank === 1) return;

      const el = document.createElement('div');
      el.className =
        'relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125';
      el.innerHTML = `
        <div class="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 shadow-md flex items-center justify-center text-slate-200 font-mono font-bold text-[10px] hover:bg-cyan-600 hover:text-white">
          ${c.rank}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([c.longitude, c.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 20 }).setHTML(`
            <div style="color: #0f172a; padding: 4px; font-family: sans-serif;">
              <div style="font-weight: 700; font-size: 12px; color: #334155;">Candidate #${c.rank}</div>
              <div style="font-size: 11px;">${c.address}</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Confidence: <b>${c.confidence_percentage}%</b></div>
            </div>
          `)
        )
        .addTo(map);

      el.addEventListener('click', () => onSelectCandidate(c));
      markersRef.current.push(marker);
    });

    // 3. Nearby OSM Infrastructure Landmarks
    if (showAmenities && nearbyAmenities) {
      nearbyAmenities.forEach((a) => {
        const poiEl = document.createElement('div');
        poiEl.className = 'w-4 h-4 rounded-full bg-emerald-500/80 border border-white flex items-center justify-center text-[8px] text-white cursor-pointer shadow';
        poiEl.title = `${a.name} (${a.amenity_type})`;

        const poiMarker = new maplibregl.Marker({ element: poiEl })
          .setLngLat([a.longitude, a.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 15 }).setHTML(`
              <div style="color: #0f172a; padding: 4px; font-family: sans-serif;">
                <div style="font-weight: 700; font-size: 11px; color: #059669;">${a.name}</div>
                <div style="font-size: 10px; color: #475569;">${a.amenity_type} (${Math.round(a.distance_meters)}m away)</div>
              </div>
            `)
          )
          .addTo(map);

        markersRef.current.push(poiMarker);
      });
    }
  };

  // Fly to selected candidate if user clicks candidate list
  useEffect(() => {
    if (!mapRef.current) return;
    const target = selectedCandidate || primaryLocation;
    mapRef.current.flyTo({
      center: [target.longitude, target.latitude],
      zoom: 13,
      speed: 1.2,
    });
  }, [selectedCandidate, primaryLocation]);

  return (
    <div
      className={`glass-panel overflow-hidden relative transition-all flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)]' : 'h-[460px] w-full'
      }`}
    >
      {/* Map Header Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-cyber-950/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
        
        {/* Style Toggles */}
        {(['dark', 'satellite', 'street'] as const).map((style) => (
          <button
            key={style}
            onClick={() => setMapStyle(style)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold capitalize transition-all ${
              mapStyle === style
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            {style}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Solar Vector Toggle */}
        {solarData && (
          <button
            onClick={() => setShowSolarVectors(!showSolarVectors)}
            className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-all ${
              showSolarVectors ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' : 'text-slate-500 bg-slate-900/60'
            }`}
            title="Toggle Solar & Shadow Vectors"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px]">Sun Vector</span>
          </button>
        )}

        {/* OSM Landmark Toggle */}
        {nearbyAmenities && nearbyAmenities.length > 0 && (
          <button
            onClick={() => setShowAmenities(!showAmenities)}
            className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-all ${
              showAmenities ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'text-slate-500 bg-slate-900/60'
            }`}
            title="Toggle OSM Infrastructure Markers"
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px]">OSM POIs ({nearbyAmenities.length})</span>
          </button>
        )}
      </div>

      {/* Fullscreen Button */}
      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute top-3 right-12 z-10 p-2 rounded-xl bg-cyber-950/90 border border-slate-800 text-slate-300 hover:text-white shadow-xl transition-colors"
        title={isFullscreen ? 'Exit Fullscreen' : 'Expand Map'}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
