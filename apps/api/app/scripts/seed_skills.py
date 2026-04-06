"""Seed initial skill data into the database."""
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
from app.models.skill import Skill

# Define initial skills
SKILLS = [
    # Universal skills (all classes)
    {
        "skill_code": "basic_attack",
        "name": "기본 공격",
        "description": "기본적인 공격입니다. 마나를 소모하지 않습니다.",
        "skill_type": "attack",
        "damage_multiplier": 1.0,
        "mana_cost": 0,
        "cooldown_turns": 0,
        "unlock_level": 1,
        "unlock_class": None,  # All classes
        "effects": {},
        "icon_url": None,
        "animation_type": "melee"
    },
    {
        "skill_code": "defend",
        "name": "방어",
        "description": "방어 자세를 취하여 받는 데미지를 50% 감소시킵니다.",
        "skill_type": "buff",
        "damage_multiplier": 0.0,
        "mana_cost": 0,
        "cooldown_turns": 0,
        "unlock_level": 1,
        "unlock_class": None,  # All classes
        "effects": {"damage_reduction": 0.5, "duration": 1},
        "icon_url": None,
        "animation_type": "buff"
    },

    # Warrior skills
    {
        "skill_code": "power_strike",
        "name": "강타",
        "description": "강력한 일격을 가합니다. 180% 데미지를 줍니다.",
        "skill_type": "attack",
        "damage_multiplier": 1.8,
        "mana_cost": 15,
        "cooldown_turns": 2,
        "unlock_level": 5,
        "unlock_class": "warrior",
        "effects": {},
        "icon_url": None,
        "animation_type": "melee_heavy"
    },
    {
        "skill_code": "whirlwind",
        "name": "회전 베기",
        "description": "회전하며 베어냅니다. 250% 데미지와 20% 크리티컬 확률 증가.",
        "skill_type": "attack",
        "damage_multiplier": 2.5,
        "mana_cost": 30,
        "cooldown_turns": 4,
        "unlock_level": 10,
        "unlock_class": "warrior",
        "effects": {"crit_bonus": 0.2},
        "icon_url": None,
        "animation_type": "aoe"
    },
    {
        "skill_code": "battle_cry",
        "name": "전투 함성",
        "description": "전투의 함성으로 자신을 고무시킵니다. 3턴간 공격력 30% 증가.",
        "skill_type": "buff",
        "damage_multiplier": 0.0,
        "mana_cost": 20,
        "cooldown_turns": 5,
        "unlock_level": 15,
        "unlock_class": "warrior",
        "effects": {"strength_buff": 0.3, "duration": 3},
        "icon_url": None,
        "animation_type": "buff"
    },
    {
        "skill_code": "execute",
        "name": "처형",
        "description": "결정적인 일격을 가합니다. 300% 데미지, 대상 HP 30% 이하 시 5배 데미지.",
        "skill_type": "attack",
        "damage_multiplier": 3.0,
        "mana_cost": 40,
        "cooldown_turns": 6,
        "unlock_level": 20,
        "unlock_class": "warrior",
        "effects": {"execute_threshold": 0.3, "execute_multiplier": 5.0},
        "icon_url": None,
        "animation_type": "melee_finisher"
    },

    # Mage skills
    {
        "skill_code": "fireball",
        "name": "화염구",
        "description": "불타는 화염구를 발사합니다. 200% 데미지.",
        "skill_type": "attack",
        "damage_multiplier": 2.0,
        "mana_cost": 20,
        "cooldown_turns": 2,
        "unlock_level": 5,
        "unlock_class": "mage",
        "effects": {},
        "icon_url": None,
        "animation_type": "projectile_fire"
    },
    {
        "skill_code": "ice_lance",
        "name": "얼음 창",
        "description": "날카로운 얼음 창을 날립니다. 150% 데미지, 50% 확률로 1턴 기절.",
        "skill_type": "attack",
        "damage_multiplier": 1.5,
        "mana_cost": 25,
        "cooldown_turns": 3,
        "unlock_level": 10,
        "unlock_class": "mage",
        "effects": {"stun_chance": 0.5, "stun_duration": 1},
        "icon_url": None,
        "animation_type": "projectile_ice"
    },
    {
        "skill_code": "mana_surge",
        "name": "마나 쇄도",
        "description": "마력을 끌어모아 마나를 회복합니다. 마나 50 회복.",
        "skill_type": "heal",
        "damage_multiplier": 0.0,
        "mana_cost": 0,
        "cooldown_turns": 6,
        "unlock_level": 15,
        "unlock_class": "mage",
        "effects": {"mana_restore": 50},
        "icon_url": None,
        "animation_type": "buff"
    },
    {
        "skill_code": "meteor",
        "name": "메테오",
        "description": "하늘에서 운석을 떨어뜨립니다. 400% 데미지.",
        "skill_type": "attack",
        "damage_multiplier": 4.0,
        "mana_cost": 50,
        "cooldown_turns": 8,
        "unlock_level": 20,
        "unlock_class": "mage",
        "effects": {},
        "icon_url": None,
        "animation_type": "aoe_ultimate"
    },
]


def seed_skills():
    """Seed skills into the database."""
    # Replace async URL with sync URL
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    engine = create_engine(sync_url, echo=True)
    SessionLocal = sessionmaker(bind=engine)

    with SessionLocal() as session:
        # Check if skills already exist
        from sqlalchemy import select
        result = session.execute(select(Skill))
        existing_skills = result.scalars().all()

        if existing_skills:
            print(f"Skills already exist ({len(existing_skills)} skills found). Skipping seed.")
            return

        # Insert skills
        for skill_data in SKILLS:
            skill = Skill(
                id=uuid.uuid4(),
                **skill_data
            )
            session.add(skill)

        session.commit()
        print(f"Successfully seeded {len(SKILLS)} skills!")

    engine.dispose()


if __name__ == "__main__":
    print("Seeding skills...")
    seed_skills()
