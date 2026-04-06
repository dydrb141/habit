"""Skill calculation engine for combat system."""
import random
from typing import Dict, Any, Tuple
from app.models.character import Character
from app.models.skill import Skill


def calculate_skill_damage(
    character: Character,
    skill: Skill,
    battle_state: dict
) -> dict:
    """Calculate damage dealt by a skill.

    Args:
        character: The character using the skill
        skill: The skill being used
        battle_state: Current battle state (buffs, debuffs, etc.)

    Returns:
        dict: {
            "damage": int,
            "is_crit": bool,
            "effects": dict
        }
    """
    # Base damage calculation
    base_damage = (
        character.stats.get("strength", 10) * 0.5 +
        character.stats.get("intelligence", 8) * 0.3 +
        random.randint(1, 10)
    )

    # Apply skill damage multiplier
    skill_damage = base_damage * float(skill.damage_multiplier)

    # Calculate critical hit
    crit_chance = min(character.stats.get("luck", 5) / 20.0, 0.9)
    crit_chance += skill.effects.get("crit_bonus", 0)
    is_crit = random.random() < crit_chance

    if is_crit:
        skill_damage *= 2

    # Apply active buffs from battle state
    for buff in battle_state.get("player_buffs", []):
        if buff["type"] == "strength":
            skill_damage *= (1 + buff["value"])

    # Execute mechanic (warrior execute skill)
    if skill.effects.get("execute_threshold"):
        boss_hp_percent = battle_state.get("boss_hp_percent", 1.0)
        if boss_hp_percent <= skill.effects["execute_threshold"]:
            skill_damage *= skill.effects.get("execute_multiplier", 1.0)

    return {
        "damage": int(skill_damage),
        "is_crit": is_crit,
        "effects": skill.effects
    }


def can_use_skill(
    character: Character,
    skill: Skill,
    battle_state: dict
) -> Tuple[bool, str]:
    """Check if character can use a skill.

    Args:
        character: The character attempting to use the skill
        skill: The skill to check
        battle_state: Current battle state

    Returns:
        Tuple[bool, str]: (can_use, reason_if_not)
    """
    # Check mana
    current_mana = battle_state.get("player_current_mana", character.mana)
    if current_mana < skill.mana_cost:
        return False, f"Not enough mana (need {skill.mana_cost}, have {current_mana})"

    # Check cooldown
    cooldowns = battle_state.get("cooldowns", {})
    skill_cooldown = cooldowns.get(str(skill.id), 0)
    if skill_cooldown > 0:
        return False, f"Skill on cooldown ({skill_cooldown} turns remaining)"

    # Check if stunned
    player_effects = battle_state.get("player_effects", {})
    if player_effects.get("stunned", False):
        return False, "Cannot use skills while stunned"

    return True, ""


def apply_skill_effects(
    skill: Skill,
    battle_state: dict,
    target: str = "boss"
) -> dict:
    """Apply skill effects to battle state.

    Args:
        skill: The skill being used
        battle_state: Current battle state
        target: "player" or "boss"

    Returns:
        dict: Updated battle state
    """
    effects = skill.effects.copy()
    effects_applied = {}

    # Apply buff effects
    if skill.skill_type == "buff":
        buff_list_key = f"{target}_buffs"
        buffs = battle_state.get(buff_list_key, [])

        # Strength buff
        if "strength_buff" in effects:
            buffs.append({
                "type": "strength",
                "value": effects["strength_buff"],
                "duration": effects.get("duration", 1),
                "source": skill.skill_code
            })
            effects_applied["strength_buff"] = effects["strength_buff"]

        # Damage reduction (defend skill)
        if "damage_reduction" in effects:
            buffs.append({
                "type": "damage_reduction",
                "value": effects["damage_reduction"],
                "duration": effects.get("duration", 1),
                "source": skill.skill_code
            })
            effects_applied["damage_reduction"] = effects["damage_reduction"]

        battle_state[buff_list_key] = buffs

    # Apply stun effect
    if "stun_chance" in effects:
        if random.random() < effects["stun_chance"]:
            effects_key = f"{target}_effects"
            target_effects = battle_state.get(effects_key, {})
            target_effects["stunned"] = effects.get("stun_duration", 1)
            battle_state[effects_key] = target_effects
            effects_applied["stunned"] = True

    # Apply mana restoration
    if skill.skill_type == "heal" and "mana_restore" in effects:
        current_mana = battle_state.get("player_current_mana", 0)
        max_mana = battle_state.get("player_max_mana", 100)
        restored = min(effects["mana_restore"], max_mana - current_mana)
        battle_state["player_current_mana"] = current_mana + restored
        effects_applied["mana_restored"] = restored

    return effects_applied


def update_cooldowns(battle_state: dict) -> dict:
    """Update skill cooldowns at end of turn.

    Args:
        battle_state: Current battle state

    Returns:
        dict: Updated battle state
    """
    cooldowns = battle_state.get("cooldowns", {})

    # Decrease all cooldowns by 1
    updated_cooldowns = {}
    for skill_id, turns in cooldowns.items():
        if turns > 1:
            updated_cooldowns[skill_id] = turns - 1
        # If turns == 1, skill becomes available (not added to dict)

    battle_state["cooldowns"] = updated_cooldowns

    return battle_state


def update_buffs(battle_state: dict) -> dict:
    """Update buff durations at end of turn.

    Args:
        battle_state: Current battle state

    Returns:
        dict: Updated battle state
    """
    # Update player buffs
    player_buffs = battle_state.get("player_buffs", [])
    active_buffs = []
    for buff in player_buffs:
        buff["duration"] -= 1
        if buff["duration"] > 0:
            active_buffs.append(buff)
    battle_state["player_buffs"] = active_buffs

    # Update boss buffs
    boss_buffs = battle_state.get("boss_buffs", [])
    active_buffs = []
    for buff in boss_buffs:
        buff["duration"] -= 1
        if buff["duration"] > 0:
            active_buffs.append(buff)
    battle_state["boss_buffs"] = active_buffs

    # Update player effects (stun, etc.)
    player_effects = battle_state.get("player_effects", {})
    if "stunned" in player_effects:
        player_effects["stunned"] -= 1
        if player_effects["stunned"] <= 0:
            del player_effects["stunned"]
    battle_state["player_effects"] = player_effects

    # Update boss effects
    boss_effects = battle_state.get("boss_effects", {})
    if "stunned" in boss_effects:
        boss_effects["stunned"] -= 1
        if boss_effects["stunned"] <= 0:
            del boss_effects["stunned"]
    battle_state["boss_effects"] = boss_effects

    return battle_state


def set_skill_cooldown(
    battle_state: dict,
    skill: Skill
) -> dict:
    """Set cooldown for a skill after use.

    Args:
        battle_state: Current battle state
        skill: The skill that was used

    Returns:
        dict: Updated battle state
    """
    if skill.cooldown_turns > 0:
        cooldowns = battle_state.get("cooldowns", {})
        cooldowns[str(skill.id)] = skill.cooldown_turns
        battle_state["cooldowns"] = cooldowns

    return battle_state


def calculate_boss_damage(
    boss_attack: int,
    battle_state: dict
) -> dict:
    """Calculate damage dealt by boss.

    Args:
        boss_attack: Boss base attack stat
        battle_state: Current battle state

    Returns:
        dict: {
            "damage": int,
            "is_crit": bool
        }
    """
    damage = boss_attack

    # Apply player damage reduction buffs
    for buff in battle_state.get("player_buffs", []):
        if buff["type"] == "damage_reduction":
            damage = int(damage * (1 - buff["value"]))

    # Apply boss strength buffs
    for buff in battle_state.get("boss_buffs", []):
        if buff["type"] == "strength":
            damage = int(damage * (1 + buff["value"]))

    return {
        "damage": damage,
        "is_crit": False
    }
