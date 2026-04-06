"""Boss schemas."""
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class BossResponse(BaseModel):
    """Boss information response."""
    id: UUID
    name: str
    level: int
    hp: int
    attack: int
    boss_type: str
    sprite_url: Optional[str]
    loot_table: dict

    model_config = {"from_attributes": True}


class BossBattleResponse(BaseModel):
    """Boss battle response."""
    id: UUID
    user_id: UUID
    boss_id: UUID
    status: str
    turns_taken: int
    damage_dealt: int
    damage_received: int
    rewards: dict
    started_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class BossBattleDetailResponse(BaseModel):
    """Boss battle with boss details."""
    battle: BossBattleResponse
    boss: BossResponse

    model_config = {"from_attributes": True}


class TurnResult(BaseModel):
    """Single turn result."""
    turn: int
    attacker: str  # "player" or "boss"
    damage: int
    target_hp: int
    is_crit: bool


class BattleSimulationResponse(BaseModel):
    """Battle simulation result."""
    outcome: str  # "victory" or "defeat"
    turns: list[TurnResult]
    total_damage_dealt: int
    total_damage_received: int


class AvailableBossResponse(BaseModel):
    """Available boss to challenge."""
    available: bool
    boss: Optional[BossResponse]
    trigger: Optional[str]  # "level" or "streak"

    model_config = {"from_attributes": True}


class BattleRewardResponse(BaseModel):
    """Battle reward claim response."""
    rewards: dict
    leveled_up: bool
    new_level: Optional[int]

    model_config = {"from_attributes": True}
