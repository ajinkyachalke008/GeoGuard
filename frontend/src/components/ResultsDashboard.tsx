import React, { useState } from 'react';
import { GeolocationResult, LocationCandidate } from '../types/analysis';
import { PrimaryLocation } from './PrimaryLocation';
import { GeoMap } from './GeoMap';
import { EvidencePanel } from './EvidencePanel';
import { ContradictionsPanel } from './ContradictionsPanel';
import { CandidatesList } from './CandidatesList';
import { ExifIntelligence } from './ExifIntelligence';
import { OcrIntelligence } from './OcrIntelligence';

interface ResultsDashboardProps {
  result: GeolocationResult;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<LocationCandidate | null>(
    result.primary_location || null
  );

  if (!result.primary_location) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 rounded-2xl glass-panel text-center space-y-3">
        <h3 className="font-display font-bold text-xl text-white">
          No Geographic Location Determined
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          The uploaded image did not contain sufficient visual or metadata clues to resolve a geographic coordinate.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      
      {/* 1. Primary Location Banner */}
      <PrimaryLocation
        location={result.primary_location}
        exif={result.exif}
        isMock={result.is_mock}
        processingTime={result.processing_time}
      />

      {/* 2. Interactive Map & Candidates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Interactive Map (7 cols) */}
        <div className="lg:col-span-7">
          <GeoMap
            primaryLocation={result.primary_location}
            candidates={result.candidates}
            selectedCandidate={selectedCandidate}
            onSelectCandidate={(cand) => setSelectedCandidate(cand)}
          />
        </div>

        {/* Ranked Candidates List (5 cols) */}
        <div className="lg:col-span-5">
          <CandidatesList
            candidates={result.candidates}
            selectedCandidate={selectedCandidate}
            onSelectCandidate={(cand) => setSelectedCandidate(cand)}
          />
        </div>

      </div>

      {/* 3. Evidence Analysis (7 Categories) */}
      <EvidencePanel evidence={result.evidence} />

      {/* 4. Contradictions & Scientific Uncertainty */}
      <ContradictionsPanel contradictions={result.contradictions} />

      {/* 5. Deep Intelligence Drawers (EXIF & OCR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExifIntelligence exif={result.exif} />
        <OcrIntelligence ocr={result.ocr} />
      </div>

    </div>
  );
};
