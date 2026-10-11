from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import academic_ai

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Microservice providing AI-powered academic analytics, personalized study plans, and at-risk student early warning diagnostics."
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(academic_ai.router)
app.include_router(academic_ai.router, prefix="/api")

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "fallback_mode": settings.FALLBACK_TO_RULES
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
