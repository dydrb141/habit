"""Streak and statistics endpoints."""
from fastapi import APIRouter, HTTPException, status
from app.deps import DBSession, CurrentChild
from app.services.daily_reset import (
    get_user_streak_stats,
    get_habit_completion_history,
    reset_daily_habits
)

router = APIRouter()


@router.get("/stats")
async def get_streak_statistics(
    current_user: CurrentChild,
    db: DBSession
):
    """Get current user's streak statistics."""
    stats = await get_user_streak_stats(str(current_user.id), db)
    return stats


@router.get("/history")
async def get_completion_history(
    current_user: CurrentChild,
    db: DBSession,
    days: int = 30
):
    """Get habit completion history for the last N days.

    Args:
        days: Number of days to look back (default: 30, max: 90)
    """
    if days > 90:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 90 days allowed"
        )

    history = await get_habit_completion_history(
        str(current_user.id),
        days,
        db
    )

    return history


@router.post("/reset-now")
async def manual_reset(db: DBSession):
    """Manual trigger for daily reset (admin/testing only).

    WARNING: This resets ALL habits and updates streaks.
    Use with caution!
    """
    result = await reset_daily_habits(db)
    return result
