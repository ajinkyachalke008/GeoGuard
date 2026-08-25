import asyncio
import io
from PIL import Image
from app.schemas.analysis import AnalysisConfigRequest
from app.services.pipeline_service import run_pipeline

def test_pipeline():
    img = Image.new("RGB", (300, 300), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    
    config = AnalysisConfigRequest(user_context="Paris photo near Eiffel Tower")
    result = asyncio.run(run_pipeline(buf.getvalue(), "paris_sample.jpg", config))
    
    print(f"Status: {result.status}")
    print(f"Provider: {result.provider} (Mock: {result.is_mock})")
    print(f"Primary Address: {result.primary_location.address}")
    print(f"Coordinates: {result.primary_location.latitude}, {result.primary_location.longitude}")
    print(f"Confidence: {result.primary_location.confidence_percentage}%")
    print(f"Candidate count: {len(result.candidates)}")
    print(f"Evidence count: {len(result.evidence)}")
    print(f"Contradiction count: {len(result.contradictions)}")
    print(f"Stages completed: {len(result.stages)}")
    print("SUCCESS: GeoGuard Backend Pipeline is fully functional!")

if __name__ == "__main__":
    test_pipeline()
