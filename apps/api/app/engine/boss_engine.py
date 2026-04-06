"""Boss battle engine for turn-based combat."""
import random
import uuid
from typing import Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.character import Character
from app.models.boss import Boss, BossBattle, BattleStatus
from app.models.skill import Skill, BattleTurn, CharacterSkill
from app.engine.skill_engine import (
    calculate_skill_damage,
    can_use_skill,
    apply_skill_effects,
    set_skill_cooldown,
    update_cooldowns,
    update_buffs,
    calculate_boss_damage,
)
from app.engine.calculator import calculate_battle_rewards


def get_available_boss_for_level(character: Character, db) -> Boss | None:
    """Check if character is eligible for a milestone boss.

    레벨이 5의 배수이고, 아직 해당 레벨 보스를 처치하지 않았다면
    도전 가능한 보스를 반환합니다.
    """
    from app.models.boss import BossType

    # 레벨이 5의 배수가 아니면 보스 없음
    if character.level % 5 != 0:
        return None

    # 이미 해당 레벨 보스를 처치했으면 보스 없음
    if character.last_boss_level >= character.level:
        return None

    # 해당 레벨의 보스 찾기
    boss = db.query(Boss).filter(
        Boss.level == character.level,
        Boss.boss_type == BossType.MILESTONE
    ).first()

    return boss


async def initialize_battle_state(
    battle: BossBattle,
    character: Character,
    boss: Boss,
    db: AsyncSession
) -> None:
    """Initialize battle state when battle starts.

    Args:
        battle: The battle record
        character: The character
        boss: The boss
        db: Database session
    """
    # Apply stat bonuses to HP and Mana
    vitality = character.stats.get("vitality", 10)
    intelligence = character.stats.get("intelligence", 10)

    # Vitality increases max HP (10 vitality = base, each point adds 2% HP)
    hp_multiplier = 1 + ((vitality - 10) * 0.02)
    max_hp = int(character.max_hp * hp_multiplier)

    # Intelligence increases max Mana (10 intelligence = base, each point adds 3% mana)
    mana_multiplier = 1 + ((intelligence - 10) * 0.03)
    max_mana = int(character.max_mana * mana_multiplier)

    battle.player_current_hp = max_hp
    battle.boss_current_hp = boss.hp
    battle.player_current_mana = max_mana
    battle.current_turn = 0
    battle.battle_state = {
        "player_buffs": [],
        "boss_buffs": [],
        "player_effects": {},
        "boss_effects": {},
        "cooldowns": {},
        "boss_max_hp": boss.hp,
        "player_max_hp": max_hp,
        "player_max_mana": max_mana
    }
    await db.commit()


async def get_battle_state(
    battle: BossBattle,
    character: Character,
    boss: Boss,
    db: AsyncSession
) -> dict:
    """Get current battle state.

    Args:
        battle: The battle record
        character: The character
        boss: The boss
        db: Database session

    Returns:
        dict: Current battle state with all relevant info
    """
    # Get available skills
    result = await db.execute(
        select(CharacterSkill, Skill)
        .join(Skill, CharacterSkill.skill_id == Skill.id)
        .where(CharacterSkill.character_id == character.id)
    )
    char_skills = result.all()

    available_skills = []
    for char_skill, skill in char_skills:
        can_use, reason = can_use_skill(character, skill, battle.battle_state)
        available_skills.append({
            "id": skill.id,
            "skill": skill,
            "can_use": can_use,
            "current_cooldown": battle.battle_state.get("cooldowns", {}).get(str(skill.id), 0),
            "reason": reason if not can_use else None
        })

    return {
        "battle_id": battle.id,
        "status": battle.status.value,
        "current_turn": battle.current_turn,
        "player_hp": battle.player_current_hp,
        "player_max_hp": battle.battle_state.get("player_max_hp", character.max_hp),
        "player_mana": battle.player_current_mana,
        "player_max_mana": battle.battle_state.get("player_max_mana", character.max_mana),
        "player_buffs": battle.battle_state.get("player_buffs", []),
        "boss_hp": battle.boss_current_hp,
        "boss_max_hp": battle.battle_state.get("boss_max_hp", boss.hp),
        "boss_name": boss.name,
        "boss_buffs": battle.battle_state.get("boss_buffs", []),
        "available_skills": available_skills,
        "cooldowns": battle.battle_state.get("cooldowns", {})
    }


async def execute_turn(
    battle: BossBattle,
    character: Character,
    boss: Boss,
    skill_id: uuid.UUID,
    db: AsyncSession
) -> dict:
    """Execute a single combat turn.

    Args:
        battle: The battle record
        character: The character
        boss: The boss
        skill_id: ID of the skill to use
        db: Database session

    Returns:
        dict: Turn results and updated battle state
    """
    # Get skill
    result = await db.execute(select(Skill).where(Skill.id == skill_id))
    skill = result.scalar_one_or_none()

    if not skill:
        return {"success": False, "error": "Skill not found"}

    # Check if skill can be used
    battle.battle_state["player_current_mana"] = battle.player_current_mana
    battle.battle_state["boss_hp_percent"] = battle.boss_current_hp / battle.battle_state.get("boss_max_hp", boss.hp)

    can_use, reason = can_use_skill(character, skill, battle.battle_state)
    if not can_use:
        return {"success": False, "error": reason}

    # === PLAYER TURN ===
    player_result = calculate_skill_damage(character, skill, battle.battle_state)
    battle.boss_current_hp -= player_result["damage"]
    battle.player_current_mana -= skill.mana_cost

    # Apply skill effects (buff skills target player, attack skills target boss)
    target = "player" if skill.skill_type == "buff" else "boss"
    effects_applied = apply_skill_effects(skill, battle.battle_state, target=target)

    # Set cooldown
    battle.battle_state = set_skill_cooldown(battle.battle_state, skill)

    # Save player turn
    player_turn = BattleTurn(
        id=uuid.uuid4(),
        battle_id=battle.id,
        turn_number=battle.current_turn,
        actor="player",
        action_type="skill",
        skill_id=skill.id,
        damage=player_result["damage"],
        is_crit=player_result["is_crit"],
        target_hp=max(battle.boss_current_hp, 0),
        effects_applied=effects_applied
    )
    db.add(player_turn)

    # Check if boss is defeated
    if battle.boss_current_hp <= 0:
        battle.status = BattleStatus.VICTORY
        battle.completed_at = datetime.utcnow()
        battle.turns_taken = battle.current_turn + 1

        # Calculate and set rewards
        first_time = character.last_boss_level < boss.level
        battle.rewards = calculate_battle_rewards(boss.level, first_time)

        await db.commit()

        return {
            "success": True,
            "player_turn": {
                "turn_number": player_turn.turn_number,
                "actor": player_turn.actor,
                "action_type": player_turn.action_type,
                "skill_id": player_turn.skill_id,
                "damage": player_turn.damage,
                "is_crit": player_turn.is_crit,
                "target_hp": player_turn.target_hp,
                "effects_applied": player_turn.effects_applied
            },
            "boss_turn": None,
            "battle_state": await get_battle_state(battle, character, boss, db)
        }

    # === BOSS TURN ===
    # Check if boss is stunned
    boss_effects = battle.battle_state.get("boss_effects", {})
    if boss_effects.get("stunned", 0) > 0:
        boss_turn = None
    else:
        boss_result = calculate_boss_damage(boss.attack, battle.battle_state)
        battle.player_current_hp -= boss_result["damage"]

        boss_turn_record = BattleTurn(
            id=uuid.uuid4(),
            battle_id=battle.id,
            turn_number=battle.current_turn,
            actor="boss",
            action_type="attack",
            skill_id=None,
            damage=boss_result["damage"],
            is_crit=boss_result["is_crit"],
            target_hp=max(battle.player_current_hp, 0),
            effects_applied={}
        )
        db.add(boss_turn_record)

        boss_turn = {
            "turn_number": boss_turn_record.turn_number,
            "actor": boss_turn_record.actor,
            "action_type": boss_turn_record.action_type,
            "damage": boss_turn_record.damage,
            "is_crit": boss_turn_record.is_crit,
            "target_hp": boss_turn_record.target_hp,
            "effects_applied": boss_turn_record.effects_applied
        }

    # Check if player is defeated
    if battle.player_current_hp <= 0:
        battle.status = BattleStatus.DEFEAT
        battle.completed_at = datetime.utcnow()
        battle.turns_taken = battle.current_turn + 1
        await db.commit()

        return {
            "success": True,
            "player_turn": {
                "turn_number": player_turn.turn_number,
                "actor": player_turn.actor,
                "action_type": player_turn.action_type,
                "skill_id": player_turn.skill_id,
                "damage": player_turn.damage,
                "is_crit": player_turn.is_crit,
                "target_hp": player_turn.target_hp,
                "effects_applied": player_turn.effects_applied
            },
            "boss_turn": boss_turn,
            "battle_state": await get_battle_state(battle, character, boss, db)
        }

    # Update battle state
    battle.current_turn += 1
    battle.battle_state = update_cooldowns(battle.battle_state)
    battle.battle_state = update_buffs(battle.battle_state)

    await db.commit()

    return {
        "success": True,
        "player_turn": {
            "turn_number": player_turn.turn_number,
            "actor": player_turn.actor,
            "action_type": player_turn.action_type,
            "skill_id": player_turn.skill_id,
            "damage": player_turn.damage,
            "is_crit": player_turn.is_crit,
            "target_hp": player_turn.target_hp,
            "effects_applied": player_turn.effects_applied
        },
        "boss_turn": boss_turn,
        "battle_state": await get_battle_state(battle, character, boss, db)
    }


def calculate_boss_difficulty(character: Character, boss: Boss) -> str:
    """Calculate boss difficulty relative to character.

    Returns: "easy", "medium", "hard", "impossible"
    """
    # 간단한 파워 레벨 계산
    player_power = (
        character.stats.get("strength", 10) * 2 +
        character.stats.get("intelligence", 8) +
        character.hp / 10
    )

    boss_power = boss.hp / 10 + boss.attack * 2

    ratio = player_power / boss_power

    if ratio >= 1.5:
        return "easy"
    elif ratio >= 1.0:
        return "medium"
    elif ratio >= 0.7:
        return "hard"
    else:
        return "impossible"
