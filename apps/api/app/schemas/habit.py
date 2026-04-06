"""Habit schemas."""
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional

from app.models.habit import HabitCategory, HabitDifficulty, HabitStatus


class HabitCreate(BaseModel):
    """Habit creation request."""
    title: str = Field(min_length=2, max_length=50)
    category: HabitCategory
    difficulty: HabitDifficulty = HabitDifficulty.EASY
    requires_approval: bool = False
    schedule: dict = {"type": "daily"}


class HabitResponse(BaseModel):
    """Habit information response."""
    id: UUID
    user_id: UUID
    title: str
    category: HabitCategory
    difficulty: HabitDifficulty
    requires_approval: bool
    streak_count: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class HabitCheckRequest(BaseModel):
    """Habit check request."""
    pass  # Just checking, no additional data needed


class HabitCheckResponse(BaseModel):
    """Habit check response."""
    message: str
    exp_earned: int
    gold_earned: int
    new_level: Optional[int] = None
    leveled_up: bool = False


class HabitLogResponse(BaseModel):
    """Habit log response."""
    id: UUID
    habit_id: UUID
    status: HabitStatus
    exp_earned: int
    gold_earned: int
    completed_at: datetime

    model_config = {"from_attributes": True}
