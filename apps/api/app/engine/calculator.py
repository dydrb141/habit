"""Game calculation engine for EXP, levels, and rewards."""
from app.models.habit import HabitDifficulty


# Reward configuration
REWARDS = {
    HabitDifficulty.EASY: {"exp": 10, "gold": 5},
    HabitDifficulty.MEDIUM: {"exp": 20, "gold": 10},
    HabitDifficulty.HARD: {"exp": 30, "gold": 20},
}


def calculate_rewards(difficulty: HabitDifficulty) -> dict:
    """Calculate EXP and gold rewards based on difficulty."""
    return REWARDS[difficulty]


def calculate_max_exp_for_level(level: int) -> int:
    """Calculate max EXP needed for a level.

    Formula: 100 * (1.5 ^ (level - 1))
    Level 1: 100 EXP
    Level 2: 150 EXP
    Level 3: 225 EXP
    """
    return int(100 * (1.5 ** (level - 1)))


def calculate_level_up(current_level: int, current_exp: int, exp_gained: int) -> dict:
    """Calculate if character leveled up and new stats.

    Returns:
        dict: {
            "leveled_up": bool,
            "new_level": int,
            "new_exp": int,
            "new_max_exp": int,
            "levels_gained": int
        }
    """
    total_exp = current_exp + exp_gained
    new_level = current_level
    levels_gained = 0

    while True:
        max_exp = calculate_max_exp_for_level(new_level)

        if total_exp >= max_exp:
            # Level up!
            total_exp -= max_exp
            new_level += 1
            levels_gained += 1
        else:
            break

    new_max_exp = calculate_max_exp_for_level(new_level)

    return {
        "leveled_up": levels_gained > 0,
        "new_level": new_level,
        "new_exp": total_exp,
        "new_max_exp": new_max_exp,
        "levels_gained": levels_gained,
    }


def calculate_stat_increase(levels_gained: int) -> dict:
    """Calculate stat increases from leveling up.

    Each level grants:
    - +2 to primary stat (based on class)
    - +1 to other stats
    """
    return {
        "strength": levels_gained * 2,  # For warrior
        "intelligence": levels_gained,
        "vitality": levels_gained,
        "luck": levels_gained,
    }


def calculate_hp_increase(levels_gained: int) -> int:
    """Calculate max HP increase from leveling up.

    Each level grants +10 max HP.
    """
    return levels_gained * 10


# ===== Boss Battle Calculations =====

def calculate_boss_stats(boss_level: int) -> dict:
    """Calculate boss HP and attack based on level.

    Formula:
    - HP: 50 + (boss_level * 25)
    - Attack: 5 + (boss_level * 2)

    Examples:
    - Level 5: HP=175, Attack=15
    - Level 10: HP=300, Attack=25
    """
    return {
        "hp": 50 + (boss_level * 25),
        "attack": 5 + (boss_level * 2),
    }


def calculate_player_damage(stats: dict) -> int:
    """Calculate player attack damage.

    Formula: (Strength * 0.5) + (Intelligence * 0.3) + random(1-10)
    """
    import random

    base_damage = (stats.get("strength", 10) * 0.5 +
                   stats.get("intelligence", 8) * 0.3)
    variance = random.randint(1, 10)

    return int(base_damage + variance)


def calculate_crit_chance(luck: int) -> float:
    """Calculate critical hit chance based on luck.

    Formula: luck / 20 (max 90%)

    Examples:
    - Luck 10 = 50% crit chance
    - Luck 18 = 90% crit chance
    """
    return min(luck / 20.0, 0.9)


def calculate_battle_rewards(boss_level: int, first_time: bool = False) -> dict:
    """Calculate rewards for defeating a boss.

    Formula:
    - Gold: boss_level * 50
    - EXP: boss_level * 100
    - Gems: 5-10 (first time only)
    """
    import random

    return {
        "gold": boss_level * 50,
        "exp": boss_level * 100,
        "gems": random.randint(5, 10) if first_time else 0,
    }


async def unlock_skills_for_level(character, new_level: int, db):
    """Unlock new skills when character levels up.

    Args:
        character: The character model
        new_level: The new level reached
        db: Database session

    Returns:
        list: List of newly unlocked skills
    """
    from sqlalchemy import select, or_
    from app.models.skill import Skill, CharacterSkill

    # Find skills that should be unlocked at this level
    result = await db.execute(
        select(Skill).where(
            Skill.unlock_level == new_level,
            or_(
                Skill.unlock_class == character.class_type,
                Skill.unlock_class.is_(None)  # Universal skills
            )
        )
    )
    unlockable_skills = result.scalars().all()

    newly_unlocked = []
    for skill in unlockable_skills:
        # Check if character already has this skill
        result = await db.execute(
            select(CharacterSkill).where(
                CharacterSkill.character_id == character.id,
                CharacterSkill.skill_id == skill.id
            )
        )
        existing = result.scalar_one_or_none()

        if not existing:
            # Unlock new skill
            import uuid
            char_skill = CharacterSkill(
                id=uuid.uuid4(),
                character_id=character.id,
                skill_id=skill.id,
                skill_level=1
            )
            db.add(char_skill)
            newly_unlocked.append(skill)

    if newly_unlocked:
        await db.commit()

    return newly_unlocked
