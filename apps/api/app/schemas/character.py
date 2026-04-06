"""Character schemas."""
from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional


class CharacterResponse(BaseModel):
    """Character information response."""
    id: UUID
    user_id: UUID
    name: Optional[str] = None
    class_type: str
    level: int
    exp: int
    max_exp: int
    hp: int
    max_hp: int
    mana: int
    max_mana: int
    gold: int
    gems: int
    stats: dict
    equipment: dict
    appearance: dict

    model_config = {"from_attributes": True}


class CharacterUpdateRequest(BaseModel):
    """Character update request."""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
