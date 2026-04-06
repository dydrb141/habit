"""Skill models for combat system."""
import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base


class Skill(Base):
    """Skill template model."""
    __tablename__ = "skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    skill_type = Column(String(20), nullable=False)  # "attack", "buff", "heal"

    damage_multiplier = Column(Numeric(4, 2), nullable=False)
    mana_cost = Column(Integer, nullable=False)
    cooldown_turns = Column(Integer, nullable=False)

    unlock_level = Column(Integer, nullable=False)
    unlock_class = Column(String(20), nullable=True)  # None = all classes

    effects = Column(JSONB, default=dict, nullable=False)
    # Examples: {"crit_bonus": 0.2, "stun_chance": 0.3, "strength_buff": 0.3}

    icon_url = Column(String(255), nullable=True)
    animation_type = Column(String(50), nullable=True)

    def __repr__(self):
        return f"<Skill {self.name} ({self.skill_code})>"


class CharacterSkill(Base):
    """Character's acquired skills."""
    __tablename__ = "character_skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    character_id = Column(UUID(as_uuid=True), ForeignKey("characters.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)

    skill_level = Column(Integer, default=1, nullable=False)
    unlocked_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    skill = relationship("Skill")

    def __repr__(self):
        return f"<CharacterSkill char={self.character_id} skill={self.skill_id}>"


class BattleTurn(Base):
    """Turn-by-turn battle record."""
    __tablename__ = "battle_turns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    battle_id = Column(UUID(as_uuid=True), ForeignKey("boss_battles.id", ondelete="CASCADE"), nullable=False)

    turn_number = Column(Integer, nullable=False)
    actor = Column(String(10), nullable=False)  # "player" or "boss"
    action_type = Column(String(20), nullable=False)  # "attack", "skill", "defend"
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id", ondelete="SET NULL"), nullable=True)

    damage = Column(Integer, default=0, nullable=False)
    is_crit = Column(Boolean, default=False, nullable=False)
    target_hp = Column(Integer, nullable=False)

    effects_applied = Column(JSONB, default=dict, nullable=False)
    # Examples: {"buff_applied": "strength", "stun_applied": true}

    # Relationships
    skill = relationship("Skill")

    def __repr__(self):
        return f"<BattleTurn battle={self.battle_id} turn={self.turn_number} actor={self.actor}>"
