"""Boss models for battle system."""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base


class BossType(str, enum.Enum):
    """Boss trigger types."""
    MILESTONE = "milestone"  # 레벨 5, 10, 15...
    STREAK = "streak"        # 스트릭 7일 달성
    EVENT = "event"          # 특별 이벤트


class BattleStatus(str, enum.Enum):
    """Battle status."""
    ACTIVE = "active"        # 진행 중
    VICTORY = "victory"      # 승리
    DEFEAT = "defeat"        # 패배


class Boss(Base):
    """Boss template model."""
    __tablename__ = "bosses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False)
    level = Column(Integer, nullable=False)
    hp = Column(Integer, nullable=False)
    attack = Column(Integer, nullable=False)
    boss_type = Column(SQLEnum(BossType), nullable=False, default=BossType.MILESTONE)
    sprite_url = Column(String(255), nullable=True)
    loot_table = Column(JSONB, default=dict, nullable=False)
    # Example: {"gold": 250, "exp": 500, "gems": 10, "item_chance": 0.3}

    def __repr__(self):
        return f"<Boss {self.name} lv={self.level}>"


class BossBattle(Base):
    """Boss battle record."""
    __tablename__ = "boss_battles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    boss_id = Column(UUID(as_uuid=True), ForeignKey("bosses.id"), nullable=False)

    status = Column(SQLEnum(BattleStatus), nullable=False, default=BattleStatus.ACTIVE)
    turns_taken = Column(Integer, default=0, nullable=False)
    damage_dealt = Column(Integer, default=0, nullable=False)
    damage_received = Column(Integer, default=0, nullable=False)

    # Battle state tracking
    player_current_hp = Column(Integer, nullable=True)
    boss_current_hp = Column(Integer, nullable=True)
    player_current_mana = Column(Integer, nullable=True)
    current_turn = Column(Integer, default=0, nullable=False)
    battle_state = Column(JSONB, default=dict, nullable=False)
    # Example: {"player_buffs": [], "boss_buffs": [], "cooldowns": {}}

    rewards = Column(JSONB, default=dict, nullable=False)
    # Example: {"gold": 250, "exp": 500, "gems": 5}

    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User")
    boss = relationship("Boss")

    def __repr__(self):
        return f"<BossBattle user={self.user_id} boss={self.boss_id} status={self.status}>"


class BattleReward(Base):
    """Battle reward claim record."""
    __tablename__ = "battle_rewards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    battle_id = Column(UUID(as_uuid=True), ForeignKey("boss_battles.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    gold = Column(Integer, default=0, nullable=False)
    exp = Column(Integer, default=0, nullable=False)
    gems = Column(Integer, default=0, nullable=False)
    item_id = Column(UUID(as_uuid=True), nullable=True)  # 향후 아이템 시스템 연동

    claimed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    battle = relationship("BossBattle")
    user = relationship("User")

    def __repr__(self):
        return f"<BattleReward battle={self.battle_id} gold={self.gold}>"
