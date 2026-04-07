"""Daily reset service for habit management."""
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.habit import Habit, HabitLog, HabitStatus
from app.models.user import User
import logging

logger = logging.getLogger(__name__)


async def reset_daily_habits(db: AsyncSession):
    """Reset all habits at midnight and update streaks.

    This function should be called daily at midnight to:
    1. Check which habits were NOT completed today
    2. Reset their streak_count to 0
    3. Clear today's completion status for tomorrow

    Args:
        db: Database session
    """
    logger.info("Starting daily habit reset...")

    # Get today's date range (00:00 to 23:59)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    try:
        # Get all active habits
        result = await db.execute(
            select(Habit).where(Habit.is_active == True)
        )
        habits = result.scalars().all()

        habits_reset = 0
        streaks_maintained = 0
        streaks_broken = 0

        for habit in habits:
            # Check if habit was completed today
            log_result = await db.execute(
                select(HabitLog).where(
                    and_(
                        HabitLog.habit_id == habit.id,
                        HabitLog.completed_at >= today_start,
                        HabitLog.completed_at < today_end,
                        HabitLog.status == HabitStatus.COMPLETED
                    )
                )
            )
            completed_today = log_result.scalar_one_or_none()

            if completed_today:
                # Habit was completed - increment streak
                habit.streak_count += 1
                streaks_maintained += 1
                logger.info(f"Habit {habit.title} streak: {habit.streak_count}")
            else:
                # Habit was NOT completed - reset streak
                if habit.streak_count > 0:
                    logger.info(f"Breaking streak for {habit.title} (was {habit.streak_count})")
                    streaks_broken += 1
                habit.streak_count = 0

            habits_reset += 1

        await db.commit()

        logger.info(f"Daily reset complete: {habits_reset} habits processed, "
                   f"{streaks_maintained} streaks maintained, {streaks_broken} streaks broken")

        return {
            "success": True,
            "habits_reset": habits_reset,
            "streaks_maintained": streaks_maintained,
            "streaks_broken": streaks_broken
        }

    except Exception as e:
        logger.error(f"Error during daily reset: {e}")
        await db.rollback()
        return {
            "success": False,
            "error": str(e)
        }


async def get_user_streak_stats(user_id: str, db: AsyncSession) -> dict:
    """Get streak statistics for a user.

    Args:
        user_id: User ID
        db: Database session

    Returns:
        dict: {
            "current_streak": int,  # Current consecutive days
            "best_streak": int,     # Best streak ever
            "total_habits": int,    # Total active habits
            "streaks": [            # List of habits with streaks
                {
                    "habit_id": str,
                    "habit_title": str,
                    "streak_count": int
                }
            ]
        }
    """
    # Get all user's active habits
    result = await db.execute(
        select(Habit).where(
            and_(
                Habit.user_id == user_id,
                Habit.is_active == True
            )
        )
    )
    habits = result.scalars().all()

    if not habits:
        return {
            "current_streak": 0,
            "best_streak": 0,
            "total_habits": 0,
            "streaks": []
        }

    # Calculate average streak (could also use min or sum depending on requirements)
    current_streaks = [h.streak_count for h in habits if h.streak_count > 0]
    current_streak = min(current_streaks) if current_streaks else 0

    # Get best streak from habit logs
    best_streak = max([h.streak_count for h in habits]) if habits else 0

    # Build streak list
    streaks = [
        {
            "habit_id": str(h.id),
            "habit_title": h.title,
            "streak_count": h.streak_count
        }
        for h in habits
    ]

    return {
        "current_streak": current_streak,
        "best_streak": best_streak,
        "total_habits": len(habits),
        "streaks": streaks
    }


async def get_habit_completion_history(
    user_id: str,
    days: int,
    db: AsyncSession
) -> list:
    """Get habit completion history for the last N days.

    Args:
        user_id: User ID
        days: Number of days to look back
        db: Database session

    Returns:
        list: [
            {
                "date": "2024-04-07",
                "total_habits": 5,
                "completed": 4,
                "completion_rate": 80.0
            }
        ]
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    history = []

    for i in range(days):
        day_start = start_date + timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        # Get total habits that were active on this day
        habits_result = await db.execute(
            select(func.count(Habit.id)).where(
                and_(
                    Habit.user_id == user_id,
                    Habit.is_active == True,
                    Habit.created_at <= day_end
                )
            )
        )
        total_habits = habits_result.scalar() or 0

        # Get completed habits on this day
        completed_result = await db.execute(
            select(func.count(HabitLog.id)).where(
                and_(
                    HabitLog.user_id == user_id,
                    HabitLog.completed_at >= day_start,
                    HabitLog.completed_at < day_end,
                    HabitLog.status == HabitStatus.COMPLETED
                )
            )
        )
        completed = completed_result.scalar() or 0

        completion_rate = (completed / total_habits * 100) if total_habits > 0 else 0

        history.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "total_habits": total_habits,
            "completed": completed,
            "completion_rate": round(completion_rate, 1)
        })

    return history
