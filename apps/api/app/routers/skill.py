"""Skill endpoints."""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.deps import DBSession, CurrentChild
from app.models.character import Character
from app.models.skill import Skill, CharacterSkill
from app.schemas.skill import (
    SkillResponse,
    CharacterSkillResponse,
    SkillListResponse,
)

router = APIRouter()


@router.get("/", response_model=SkillListResponse)
async def get_character_skills(current_user: CurrentChild, db: DBSession):
    """Get all skills available to the current character."""
    # Get character
    result = await db.execute(
        select(Character).where(Character.user_id == current_user.id)
    )
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )

    # Get character's skills
    result = await db.execute(
        select(CharacterSkill, Skill)
        .join(Skill, CharacterSkill.skill_id == Skill.id)
        .where(CharacterSkill.character_id == character.id)
        .order_by(Skill.unlock_level, Skill.mana_cost)
    )
    char_skills = result.all()

    # Build response
    skills = []
    for char_skill, skill in char_skills:
        skills.append(
            CharacterSkillResponse(
                id=char_skill.id,
                skill=SkillResponse.model_validate(skill),
                skill_level=char_skill.skill_level,
                unlocked_at=char_skill.unlocked_at,
                can_use=character.mana >= skill.mana_cost,
                current_cooldown=0,  # Will be set by battle state
                reason=None if character.mana >= skill.mana_cost else "Not enough mana"
            )
        )

    return SkillListResponse(
        skills=skills,
        current_mana=character.mana,
        max_mana=character.max_mana
    )


@router.get("/{skill_id}", response_model=SkillResponse)
async def get_skill_detail(skill_id: str, current_user: CurrentChild, db: DBSession):
    """Get detailed information about a specific skill."""
    from uuid import UUID

    # Get skill
    result = await db.execute(
        select(Skill).where(Skill.id == UUID(skill_id))
    )
    skill = result.scalar_one_or_none()

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )

    return SkillResponse.model_validate(skill)
