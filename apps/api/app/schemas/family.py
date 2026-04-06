"""Family schemas for parent-child management."""
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

from app.schemas.character import CharacterResponse
from app.models.habit import HabitStatus, HabitCategory, HabitDifficulty
from app.models.boss import BattleStatus


class UserSummary(BaseModel):
    """User summary information."""
    id: UUID
    nickname: str
    email: str

    model_config = {"from_attributes": True}


class ChildSummaryResponse(BaseModel):
    """Child summary for parent dashboard."""
    user: UserSummary
    character: CharacterResponse
    paired_at: Optional[datetime]

    model_config = {"from_attributes": True}


class HabitStatsResponse(BaseModel):
    """Habit statistics."""
    today: int
    week: int
    month: int
    pending: int


class BattleStatsResponse(BaseModel):
    """Battle statistics."""
    total: int
    won: int
    lost: int
    win_rate: float


class RecentActivity(BaseModel):
    """Recent activity log."""
    type: str  # "habit", "battle", "level_up"
    description: str
    timestamp: datetime


class ChildProgressResponse(BaseModel):
    """Detailed child progress information."""
    character: CharacterResponse
    habit_stats: HabitStatsResponse
    battle_stats: BattleStatsResponse
    recent_activities: list[RecentActivity]


class HabitWithLogResponse(BaseModel):
    """Habit with its log information."""
    id: UUID
    habit_id: UUID
    title: str
    category: HabitCategory
    difficulty: HabitDifficulty
    status: HabitStatus
    exp_earned: int
    gold_earned: int
    completed_at: datetime
    approved_at: Optional[datetime]

    model_config = {"from_attributes": True}


class BossInfoResponse(BaseModel):
    """Boss information."""
    id: UUID
    name: str
    level: int
    hp: int
    attack: int

    model_config = {"from_attributes": True}


class BossBattleResponse(BaseModel):
    """Boss battle information."""
    id: UUID
    boss: BossInfoResponse
    status: BattleStatus
    turns_taken: int
    damage_dealt: int
    damage_received: int
    rewards: dict
    started_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class HabitApprovalResponse(BaseModel):
    """Habit approval response."""
    message: str
    exp_earned: int
    gold_earned: int
    leveled_up: bool = False
    new_level: Optional[int] = None
