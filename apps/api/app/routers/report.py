"""Report endpoints (placeholder)."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/weekly")
async def get_weekly_report():
    """Get weekly report."""
    return {"message": "Report endpoint - to be implemented"}
