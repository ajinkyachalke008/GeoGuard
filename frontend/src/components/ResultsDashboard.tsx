import React, { useState } from 'react';
import { GeolocationResult, LocationCandidate } from '../types/analysis';
import { PrimaryLocation } from './PrimaryLocation';
import { GeoMap } from './GeoMap';
import { CandidatesList } from './CandidatesList';
import { EvidencePanel } from './EvidencePanel';
import { ContradictionsPanel } from './ContradictionsPanel';
import { ExifIntelligence } from './ExifIntelligence';
import { OcrIntelligence } from './OcrIntelligence';
import { SolarIntelligence } from './SolarIntelligence';
import { OsmVerificationPanel } from './OsmVerificationPanel';
import { ImageForensicsModal } from './ImageForensicsModal';
import { ExportDossierModal } from './ExportDossierModal';

interface ResultsDashboardProps {
  result: GeolocationResult;
  uploadedFile: File | null;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result, uploadedFile }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<LocationCandidate | null>(null);
  const [isForensicsOpen, setIsForensicsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  if (!result.primary_location) {
    return (
      <div className="glass-panel p-8 text-center space-y-3">
        <h3 className="font-display font-bold text-lg text-rose-400">No Location Determined</h3>
        <p className="text-xs text-slate-400">
          The uploaded image could not be geolocated with sufficient confidence. Please provide context clues or try a clearer image.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Primary Estimated Location Card */}
      <PrimaryLocation
        location={result.primary_location}
        exif={result.exif}
        solar={result.solar_data}
        elevationMeters={result.elevation_meters}
        isMock={result.is_mock}
        processingTime={result.processing_time}
        onOpenForensics={uploadedFile ? () => setIsForensicsOpen(true) : undefined}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* 2. Interactive GeoMap & Candidate List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map View (2 cols) */}
        <div className="lg:col-span-2">
          <GeoMap
            primaryLocation={result.primary_location}
            candidates={result.candidates}
            selectedCandidate={selectedCandidate}
            onSelectCandidate={(c) => setSelectedCandidate(c)}
            solarData={result.solar_data}
            nearbyAmenities={result.osm_verification?.nearby_amenities}
          />
        </div>

        {/* Candidate List (1 col) */}
        <div className="lg:col-span-1">
          <CandidatesList
            candidates={result.candidates}
            selectedCandidate={selectedCandidate}
            onSelectCandidate={(c) => setSelectedCandidate(c)}
          />
        </div>

      </div>

      {/* 3. Solar Intelligence & OpenStreetMap Ground Truth Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {result.solar_data && (
          <SolarIntelligence solar={result.solar_data} />
        )}
        {result.osm_verification && (
          <OsmVerificationPanel osm={result.osm_verification} />
        )}
      </div>

      {/* 4. Optical EXIF & Multilingual OCR Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExifIntelligence exif={result.exif} />
        <OcrIntelligence ocr={result.ocr} />
      </div>

      {/* 5. 7-Category Visual Evidence & Scientific Uncertainty Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EvidencePanel evidence={result.evidence} />
        </div>
        <div className="lg:col-span-1">
          <ContradictionsPanel contradictions={result.contradictions} />
        </div>
      </div>

      {/* Forensics Loupe Modal */}
      {uploadedFile && (
        <ImageForensicsModal
          isOpen={isForensicsOpen}
          onClose={() => setIsForensicsOpen(false)}
          imageFile={uploadedFile}
          exif={result.exif}
        />
      )}

      {/* Export Dossier Modal */}
      <ExportDossierModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        result={result}
      />

    </div>
  );
};
