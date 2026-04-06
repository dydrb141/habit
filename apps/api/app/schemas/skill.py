"""Skill schemas for API responses."""
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any


class SkillResponse(BaseModel):
    """Skill information response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    skill_code: str
    name: str
    description: Optional[str] = None
    skill_type: str
    damage_multiplier: float
    mana_cost: int
    cooldown_turns: int
    unlock_level: int
    unlock_class: Optional[str] = None
    effects: Dict[str, Any] = {}
    icon_url: Optional[str] = None
    animation_type: Optional[str] = None


class CharacterSkillResponse(BaseModel):
    """Character's skill with additional info."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    skill: SkillResponse
    skill_level: int
    unlocked_at: datetime

    # Runtime info (not from DB)
    can_use: bool = True
    current_cooldown: int = 0
    reason: Optional[str] = None


class SkillListResponse(BaseModel):
    """List of character's skills with usability info."""
    skills: list[CharacterSkillResponse]
    current_mana: int
    max_mana: int


class BattleTurnResponse(BaseModel):
    """Single turn result."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    turn_number: int
    actor: str
    action_type: str
    skill_id: Optional[UUID] = None
    damage: int
    is_crit: bool
    target_hp: int
    effects_applied: Dict[str, Any] = {}


class BattleStateResponse(BaseModel):
    """Current battle state."""
    battle_id: UUID
    status: str
    current_turn: int

    # Player state
    player_hp: int
    player_max_hp: int
    player_mana: int
    player_max_mana: int
    player_buffs: list[Dict[str, Any]] = []

    # Boss state
    boss_hp: int
    boss_max_hp: int
    boss_name: str
    boss_buffs: list[Dict[str, Any]] = []

    # Available skills
    available_skills: list[CharacterSkillResponse]

    # Cooldowns
    cooldowns: Dict[str, int] = {}


class SkillActionRequest(BaseModel):
    """Request to use a skill."""
    skill_id: UUID


class SkillActionResponse(BaseModel):
    """Response after using a skill."""
    success: bool
    error: Optional[str] = None

    # Turn results
    player_turn: Optional[BattleTurnResponse] = None
    boss_turn: Optional[BattleTurnResponse] = None

    # Updated battle state
    battle_state: BattleStateResponse


class SkillUnlockNotification(BaseModel):
    """Notification for newly unlocked skill."""
    skill: SkillResponse
    message: str
