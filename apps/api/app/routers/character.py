"""Character endpoints."""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.deps import DBSession, CurrentChild
from app.models.character import Character
from app.schemas.character import CharacterResponse, CharacterUpdateRequest

router = APIRouter()


@router.get("/", response_model=CharacterResponse)
async def get_character(current_user: CurrentChild, db: DBSession):
    """Get current user's character."""
    result = await db.execute(
        select(Character).where(Character.user_id == current_user.id)
    )
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )

    return character


@router.patch("/", response_model=CharacterResponse)
async def update_character(
    update_data: CharacterUpdateRequest,
    current_user: CurrentChild,
    db: DBSession
):
    """Update current user's character."""
    result = await db.execute(
        select(Character).where(Character.user_id == current_user.id)
    )
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )

    # Update fields
    if update_data.name is not None:
        character.name = update_data.name

    await db.commit()
    await db.refresh(character)

    return character
