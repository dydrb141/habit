"""Character model for game RPG mechanics."""
import uuid
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class CharacterClass(str, enum.Enum):
    """Character class types."""
    WARRIOR = "warrior"
    MAGE = "mage"
    ARCHER = "archer"
    HEALER = "healer"


class Character(Base):
    """Character model with RPG stats."""
    __tablename__ = "characters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)

    # Basic info
    name = Column(String(50), nullable=True)
    class_type = Column(String(20), nullable=False, default=CharacterClass.WARRIOR.value)
    level = Column(Integer, default=1, nullable=False)

    # Experience
    exp = Column(Integer, default=0, nullable=False)
    max_exp = Column(Integer, default=100, nullable=False)

    # Health
    hp = Column(Integer, default=100, nullable=False)
    max_hp = Column(Integer, default=100, nullable=False)

    # Mana
    mana = Column(Integer, default=100, nullable=False)
    max_mana = Column(Integer, default=100, nullable=False)

    # Currency
    gold = Column(Integer, default=0, nullable=False)
    gems = Column(Integer, default=0, nullable=False)

    # JSONB for flexible game data
    stats = Column(JSONB, default=dict, nullable=False)
    # Example: {"strength": 10, "intelligence": 8, "vitality": 12, "luck": 5}

    equipment = Column(JSONB, default=dict, nullable=False)
    # Example: {"weapon": "iron_sword_01", "armor": "leather_vest_01", "accessory": null}

    appearance = Column(JSONB, default=dict, nullable=False)
    # Example: {"skin": "tone_2", "hair": "style_3", "eyes": "blue"}

    # Boss battle stats
    battles_won = Column(Integer, default=0, nullable=False)
    last_boss_level = Column(Integer, default=0, nullable=False)

    # Relationships
    user = relationship("User", back_populates="character")

    def __repr__(self):
        return f"<Character user_id={self.user_id} lv={self.level}>"
