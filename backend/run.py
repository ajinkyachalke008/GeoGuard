import uvicorn
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config.settings import settings

if __name__ == "__main__":
    print(f"Starting GeoGuard Backend on {settings.HOST}:{settings.PORT}")
    print(f"Active Geolocation Provider: {settings.GEOLOCATION_PROVIDER.upper()}")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    )
