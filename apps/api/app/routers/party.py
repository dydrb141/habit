"""Party endpoints (placeholder)."""
from fastapi import APIRouter

router = APIRouter()


@router.post("/")
async def create_party():
    """Create party."""
    return {"message": "Party endpoint - to be implemented"}
