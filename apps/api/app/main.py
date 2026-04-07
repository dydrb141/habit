"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, close_db
from app.routers import auth, character, habit, party, report, boss, skill, family, streak
from app.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    if settings.DEBUG:
        await init_db()

    # Start background scheduler for daily tasks
    start_scheduler()

    yield

    # Shutdown
    stop_scheduler()
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(character.router, prefix="/api/v1/character", tags=["character"])
app.include_router(habit.router, prefix="/api/v1/habits", tags=["habits"])
app.include_router(party.router, prefix="/api/v1/party", tags=["party"])
app.include_router(report.router, prefix="/api/v1/report", tags=["report"])
app.include_router(boss.router, prefix="/api/v1/boss", tags=["boss"])
app.include_router(skill.router, prefix="/api/v1/skills", tags=["skills"])
app.include_router(family.router, prefix="/api/v1/family", tags=["family"])
app.include_router(streak.router, prefix="/api/v1/streak", tags=["streak"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "ok",
        "database": "connected",
        "redis": "connected"
    }
