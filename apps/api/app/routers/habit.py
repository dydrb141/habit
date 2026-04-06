"""Habit endpoints."""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, and_
from datetime import datetime, date

from app.deps import DBSession, CurrentChild
from app.models.habit import Habit, HabitLog, HabitStatus
from app.models.character import Character
from app.schemas.habit import (
    HabitCreate,
    HabitResponse,
    HabitCheckRequest,
    HabitCheckResponse,
)
from app.engine.calculator import (
    calculate_rewards,
    calculate_level_up,
    calculate_stat_increase,
    calculate_hp_increase,
)

router = APIRouter()


@router.post("/", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(habit_data: HabitCreate, current_user: CurrentChild, db: DBSession):
    """Create a new habit."""
    new_habit = Habit(
        user_id=current_user.id,
        title=habit_data.title,
        category=habit_data.category,
        difficulty=habit_data.difficulty,
        requires_approval=habit_data.requires_approval,
        schedule=habit_data.schedule,
    )
    db.add(new_habit)
    await db.commit()
    await db.refresh(new_habit)
    return new_habit


@router.get("/today", response_model=list[HabitResponse])
async def get_today_habits(current_user: CurrentChild, db: DBSession):
    """Get today's active habits."""
    result = await db.execute(
        select(Habit).where(
            and_(Habit.user_id == current_user.id, Habit.is_active == True)
        )
    )
    habits = result.scalars().all()
    return habits


@router.post("/{habit_id}/check", response_model=HabitCheckResponse)
async def check_habit(
    habit_id: str, current_user: CurrentChild, db: DBSession
):
    """Check off a habit and earn rewards."""
    # Get habit
    result = await db.execute(select(Habit).where(Habit.id == habit_id))
    habit = result.scalar_one_or_none()

    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found"
        )

    if habit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your habit"
        )

    # Check if already completed today
    today = date.today()
    result = await db.execute(
        select(HabitLog).where(
            and_(
                HabitLog.habit_id == habit_id,
                HabitLog.user_id == current_user.id,
                HabitLog.completed_at >= datetime.combine(today, datetime.min.time()),
                HabitLog.status.in_([HabitStatus.PENDING, HabitStatus.COMPLETED]),
            )
        )
    )
    existing_log = result.scalar_one_or_none()

    if existing_log:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already completed today",
        )

    # Calculate rewards
    rewards = calculate_rewards(habit.difficulty)
    exp_earned = rewards["exp"]
    gold_earned = rewards["gold"]

    # If requires approval, set to pending
    log_status = (
        HabitStatus.PENDING if habit.requires_approval else HabitStatus.COMPLETED
    )

    # Create log
    habit_log = HabitLog(
        habit_id=habit.id,
        user_id=current_user.id,
        status=log_status,
        exp_earned=exp_earned,
        gold_earned=gold_earned,
    )
    db.add(habit_log)

    # If no approval needed, grant rewards immediately
    leveled_up = False
    new_level = None

    if not habit.requires_approval:
        # Get character
        result = await db.execute(
            select(Character).where(Character.user_id == current_user.id)
        )
        character = result.scalar_one()

        # Add gold
        character.gold += gold_earned

        # Calculate level up
        level_result = calculate_level_up(
            character.level, character.exp, exp_earned
        )

        if level_result["leveled_up"]:
            leveled_up = True
            new_level = level_result["new_level"]

            # Update level and exp
            character.level = new_level
            character.exp = level_result["new_exp"]
            character.max_exp = level_result["new_max_exp"]

            # Increase stats
            stat_increase = calculate_stat_increase(level_result["levels_gained"])
            character.stats["strength"] += stat_increase["strength"]
            character.stats["intelligence"] += stat_increase["intelligence"]
            character.stats["vitality"] += stat_increase["vitality"]
            character.stats["luck"] += stat_increase["luck"]

            # Increase max HP and restore HP
            hp_increase = calculate_hp_increase(level_result["levels_gained"])
            character.max_hp += hp_increase
            character.hp = character.max_hp  # Full heal on level up!

            # Update streak
            habit.streak_count += 1
        else:
            # Just add exp
            character.exp = level_result["new_exp"]

    await db.commit()

    return HabitCheckResponse(
        message="습관 완료!" if not habit.requires_approval else "부모 승인 대기 중",
        exp_earned=exp_earned,
        gold_earned=gold_earned,
        leveled_up=leveled_up,
        new_level=new_level,
    )
