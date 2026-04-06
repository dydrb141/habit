"""Habit database models."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class HabitCategory(str, enum.Enum):
    """Habit category enumeration."""
    HEALTH = "health"  # 건강 → 체력
    STUDY = "study"  # 공부 → 지능
    EXERCISE = "exercise"  # 운동 → 힘
    LIFE = "life"  # 생활 → 행운


class HabitDifficulty(str, enum.Enum):
    """Habit difficulty enumeration."""
    EASY = "easy"  # 10 EXP, 5 골드
    MEDIUM = "medium"  # 20 EXP, 10 골드
    HARD = "hard"  # 30 EXP, 20 골드


class HabitStatus(str, enum.Enum):
    """Habit log status enumeration."""
    PENDING = "pending"  # 체크했지만 부모 승인 대기
    COMPLETED = "completed"  # 완료
    REJECTED = "rejected"  # 부모가 거절
    MISSED = "missed"  # 놓침


class Habit(Base):
    """Habit model for daily quests."""
    __tablename__ = "habits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(50), nullable=False)
    category = Column(Enum(HabitCategory), nullable=False)
    difficulty = Column(Enum(HabitDifficulty), default=HabitDifficulty.EASY, nullable=False)

    # Schedule: daily, specific days, etc.
    schedule = Column(JSONB, default=dict, nullable=False)
    # Example: {"type": "daily"} or {"type": "weekly", "days": [1,3,5]}

    requires_approval = Column(Boolean, default=False, nullable=False)
    streak_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    logs = relationship("HabitLog", back_populates="habit")

    def __repr__(self):
        return f"<Habit {self.title} ({self.difficulty})>"


class HabitLog(Base):
    """Habit completion log."""
    __tablename__ = "habit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    habit_id = Column(UUID(as_uuid=True), ForeignKey("habits.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    status = Column(Enum(HabitStatus), default=HabitStatus.PENDING, nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    exp_earned = Column(Integer, default=0, nullable=False)
    gold_earned = Column(Integer, default=0, nullable=False)

    completed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    habit = relationship("Habit", back_populates="logs")
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<HabitLog {self.habit_id} - {self.status}>"
