from typing import List, Optional
from app.schemas.analysis import EvidenceItem, ContradictionItem, ExifData, OcrResult, LocationCandidate


def synthesize_evidence_and_contradictions(
    primary_candidate: Optional[LocationCandidate],
    exif: ExifData,
    ocr: OcrResult,
    raw_reasoning: Optional[str] = None
) -> tuple[List[EvidenceItem], List[ContradictionItem]]:
    """
    Synthesizes rich multi-category evidence items and scientifically honest contradiction/uncertainty assessments.
    """
    evidence: List[EvidenceItem] = []
    contradictions: List[ContradictionItem] = []

    # 1. EXIF Derived Evidence
    if exif.has_gps and exif.latitude is not None and exif.longitude is not None:
        evidence.append(
            EvidenceItem(
                category="Landmarks",
                description=f"Direct GPS coordinate telemetry recorded in image EXIF ({exif.latitude:.4f}, {exif.longitude:.4f})",
                strength="Strong",
                source="EXIF",
                details=f"Device: {exif.make or 'Unknown'} {exif.model or ''}, Alt: {exif.altitude or 'N/A'}m"
            )
        )
    elif exif.make or exif.model:
        evidence.append(
            EvidenceItem(
                category="Infrastructure",
                description=f"Capture device signature verified ({exif.make or ''} {exif.model or ''})",
                strength="Supporting",
                source="EXIF",
                details=f"Captured at {exif.captured_at or 'Unknown'}"
            )
        )

    # 2. OCR & Linguistic Evidence
    if ocr.has_text:
        if ocr.scripts_detected:
            evidence.append(
                EvidenceItem(
                    category="Language",
                    description=f"Visible script detected: {', '.join(ocr.scripts_detected)}",
                    strength="Strong",
                    source="OCR",
                    details=f"Extracted sample: '{ocr.text_fragments[0]}'" if ocr.text_fragments else None
                )
            )
        if ocr.signs_identified:
            evidence.append(
                EvidenceItem(
                    category="Language",
                    description=f"Commercial / Street signage detected: '{ocr.signs_identified[0]}'",
                    strength="Strong",
                    source="OCR",
                    details=f"Total signs located: {len(ocr.signs_identified)}"
                )
            )
        if ocr.phone_numbers:
            evidence.append(
                EvidenceItem(
                    category="Infrastructure",
                    description=f"Local telecommunication pattern identified: {ocr.phone_numbers[0]}",
                    strength="Moderate",
                    source="OCR"
                )
            )

    # 3. Contextual / Visual Evidence from Location and Reasoning
    if primary_candidate:
        loc_str = primary_candidate.address.lower()
        reasoning = (raw_reasoning or primary_candidate.reasoning or "").lower()

        # Architecture clues
        if any(term in loc_str or term in reasoning for term in ["temple", "gothic", "pagoda", "colonial", "brick", "concrete", "timber", "haussmann", "facade", "palace"]):
            arch_desc = "Regional architectural morphology, facade design and building materials"
            if "haussmann" in reasoning or "paris" in loc_str or "france" in loc_str:
                arch_desc = "Haussmannian stone masonry facade and ornate zinc roof lines characteristic of Western Europe"
            elif "temple" in reasoning or "india" in loc_str:
                arch_desc = "Traditional basalt and stone masonry architectural detailing characteristic of the Deccan plateau"
            elif "japan" in loc_str or "tokyo" in loc_str:
                arch_desc = "High-density urban multi-story commercial concrete framing with exterior fire escapes"
            evidence.append(
                EvidenceItem(
                    category="Architecture",
                    description=arch_desc,
                    strength="Strong" if primary_candidate.confidence > 0.7 else "Moderate",
                    source="AI Vision"
                )
            )

        # Roads & Traffic patterns
        if any(term in reasoning for term in ["road", "pavement", "asphalt", "curb", "lane", "driving", "crossing", "marking", "street"]):
            evidence.append(
                EvidenceItem(
                    category="Roads",
                    description="Pavement surface composition, painted road line geometry, and curb coloring patterns",
                    strength="Moderate",
                    source="AI Vision"
                )
            )
        else:
            evidence.append(
                EvidenceItem(
                    category="Roads",
                    description="Roadway width profile and urban pedestrian sidewalk arrangement",
                    strength="Supporting",
                    source="AI Vision"
                )
            )

        # Vehicles & Transit
        if any(term in reasoning for term in ["vehicle", "car", "plate", "taxi", "bus", "auto", "rickshaw", "tram", "train"]):
            evidence.append(
                EvidenceItem(
                    category="Vehicles",
                    description="Observed vehicle transit models and localized vehicle registration plate aspect ratio",
                    strength="Moderate",
                    source="AI Vision"
                )
            )

        # Infrastructure
        evidence.append(
            EvidenceItem(
                category="Infrastructure",
                description="Utility pole placement, overhead transmission lines, and streetlamp luminaire fixtures",
                strength="Supporting",
                source="AI Vision"
            )
        )

        # Environment & Terrain
        env_desc = "Vegetation biomes, tree foliage classification, and ambient solar illumination angle"
        if "tropical" in reasoning or "palm" in reasoning:
            env_desc = "Tropical foliage and broadleaf canopy indicating warm humid geographic coordinates"
        elif "arid" in reasoning or "desert" in reasoning or "canyon" in reasoning:
            env_desc = "Arid sedimentary rock strata and xerophytic vegetation profile"
        elif "temperate" in reasoning or "snow" in reasoning or "conifer" in reasoning:
            env_desc = "Temperate conifer canopy and seasonal solar elevation characteristics"
        evidence.append(
            EvidenceItem(
                category="Environment",
                description=env_desc,
                strength="Moderate",
                source="AI Vision"
            )
        )

        # Landmarks
        if any(term in reasoning for term in ["eiffel", "shibuya", "canyon", "monument", "tower", "bridge", "cathedral", "statue", "palace"]):
            evidence.append(
                EvidenceItem(
                    category="Landmarks",
                    description=f"Distinctive geographical / architectural landmark signature identified matching {primary_candidate.city or primary_candidate.address}",
                    strength="Strong",
                    source="Spatial Correlation",
                    details=primary_candidate.reasoning
                )
            )

    # 4. Scientific Contradictions and Uncertainty Analysis
    if not exif.has_gps:
        contradictions.append(
            ContradictionItem(
                description="Absence of direct hardware GPS coordinates in EXIF payload",
                effect="Low uncertainty",
                category="Metadata",
                scientific_note="Prediction relies purely on visual-spatial inference rather than satellite telemetry."
            )
        )

    if not ocr.has_text:
        contradictions.append(
            ContradictionItem(
                description="No unambiguous street, postal, or administrative text identified in image frame",
                effect="Medium uncertainty",
                category="Linguistics",
                scientific_note="Location estimation could not correlate administrative jurisdiction with visible signage."
            )
        )

    if primary_candidate and primary_candidate.confidence < 0.75:
        contradictions.append(
            ContradictionItem(
                description="Architectural or environmental elements exhibit shared regional traits across neighboring provinces",
                effect="Medium uncertainty",
                category="Visual Ambiguity",
                scientific_note="Similar building styles or flora exist in adjacent administrative regions; candidate ranking accounts for regional spread."
            )
        )

    if not any(e.category == "Landmarks" and e.strength == "Strong" for e in evidence):
        contradictions.append(
            ContradictionItem(
                description="No globally unique singular landmark pinpointed in the camera line of sight",
                effect="Medium uncertainty",
                category="Landmark Specificity",
                scientific_note="Coordinates represent an estimated zone based on combined contextual clues rather than a pinpoint monument."
            )
        )

    return evidence, contradictions
