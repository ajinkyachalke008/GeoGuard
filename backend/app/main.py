from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.api.routes import router

app = FastAPI(
    title="GeoGuard API",
    description="AI Visual Geolocation & Geographic Intelligence Platform Backend",
    version="1.0.0",
)

# Configure CORS for local development & production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(router)


@app.get("/")
async def root():
    return {
        "app": "GeoGuard",
        "tagline": "AI Visual Geolocation & Geographic Intelligence",
        "docs": "/docs",
        "health": "/api/health",
        "provider": settings.GEOLOCATION_PROVIDER
    }
