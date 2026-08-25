import httpx
import io
from PIL import Image

def verify_live_api():
    print("Connecting to live GeoGuard backend server...")
    
    # 1. Health check
    res_health = httpx.get("http://127.0.0.1:8000/api/health")
    assert res_health.status_code == 200, f"Health failed: {res_health.status_code}"
    print("[PASS] /api/health:", res_health.json())

    # 2. Config check
    res_config = httpx.get("http://127.0.0.1:8000/api/config")
    assert res_config.status_code == 200, f"Config failed: {res_config.status_code}"
    print("[PASS] /api/config:", res_config.json())

    # 3. Multipart Analyze test
    img = Image.new("RGB", (400, 300), color=(50, 100, 150))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    
    files = {"file": ("test_paris.jpg", buf.getvalue(), "image/jpeg")}
    data = {"analysis_mode": "fast", "user_context": "Paris photo near Eiffel Tower"}
    
    res_analyze = httpx.post("http://127.0.0.1:8000/api/analyze", files=files, data=data, timeout=15.0)
    assert res_analyze.status_code == 200, f"Analyze failed: {res_analyze.status_code} {res_analyze.text}"
    
    payload = res_analyze.json()
    print("[PASS] /api/analyze Response:")
    print("  - Status:", payload["status"])
    print("  - Primary Location:", payload["primary_location"]["address"])
    print("  - Coordinates:", f"{payload['primary_location']['latitude']}, {payload['primary_location']['longitude']}")
    print("  - Confidence:", f"{payload['primary_location']['confidence_percentage']}%")
    print("  - Uncertainty Radius:", f"±{payload['primary_location']['radius_km']} km")
    print("  - Candidates count:", len(payload["candidates"]))
    print("  - Evidence items:", len(payload["evidence"]))
    print("  - Contradictions count:", len(payload["contradictions"]))
    print("  - EXIF GPS:", payload["exif"]["has_gps"])
    print("  - OCR text found:", payload["ocr"]["has_text"])
    print("  - Processing time:", payload["processing_time"])
    print("  - Stages executed:", [s["name"] for s in payload["stages"]])
    print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    verify_live_api()
