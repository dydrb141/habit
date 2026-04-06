"""Family endpoints for parent management."""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, and_, func, or_
from datetime import datetime, date, timedelta
from uuid import UUID

from app.deps import DBSession, CurrentParent
from app.models.user import Family, User
from app.models.character import Character
from app.models.habit import Habit, HabitLog, HabitStatus
from app.models.boss import Boss, BossBattle, BattleStatus
from app.schemas.family import (
    ChildSummaryResponse,
    ChildProgressResponse,
    HabitWithLogResponse,
    BossBattleResponse,
    HabitApprovalResponse,
    UserSummary,
    HabitStatsResponse,
    BattleStatsResponse,
    RecentActivity,
    BossInfoResponse,
)
from app.engine.calculator import (
    calculate_level_up,
    calculate_stat_increase,
    calculate_hp_increase,
)

router = APIRouter()


async def verify_parent_child_relationship(
    parent_id: UUID, child_id: UUID, db: DBSession
) -> Family:
    """Verify parent-child relationship exists."""
    result = await db.execute(
        select(Family).where(
            and_(Family.parent_id == parent_id, Family.child_id == child_id)
        )
    )
    family = result.scalar_one_or_none()

    if not family:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this child's data",
        )

    return family


@router.get("/children", response_model=list[ChildSummaryResponse])
async def get_children(current_user: CurrentParent, db: DBSession):
    """Get list of paired children."""
    # Get all family relationships where current user is parent
    result = await db.execute(
        select(Family, User, Character)
        .join(User, Family.child_id == User.id)
        .join(Character, Character.user_id == User.id)
        .where(Family.parent_id == current_user.id)
    )

    children = []
    for family, user, character in result.all():
        children.append(
            ChildSummaryResponse(
                user=UserSummary(
                    id=user.id, nickname=user.nickname, email=user.email
                ),
                character=character,
                paired_at=family.paired_at,
            )
        )

    return children


@router.get("/children/{child_id}/progress", response_model=ChildProgressResponse)
async def get_child_progress(
    child_id: UUID, current_user: CurrentParent, db: DBSession
):
    """Get detailed progress information for a child."""
    # Verify relationship
    await verify_parent_child_relationship(current_user.id, child_id, db)

    # Get character
    result = await db.execute(
        select(Character).where(Character.user_id == child_id)
    )
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Character not found"
        )

    # Calculate habit stats
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    # Today's completed habits
    today_result = await db.execute(
        select(func.count(HabitLog.id)).where(
            and_(
                HabitLog.user_id == child_id,
                HabitLog.status == HabitStatus.COMPLETED,
                HabitLog.completed_at
                >= datetime.combine(today, datetime.min.time()),
            )
        )
    )
    today_count = today_result.scalar() or 0

    # This week's completed habits
    week_result = await db.execute(
        select(func.count(HabitLog.id)).where(
            and_(
                HabitLog.user_id == child_id,
                HabitLog.status == HabitStatus.COMPLETED,
                HabitLog.completed_at
                >= datetime.combine(week_start, datetime.min.time()),
            )
        )
    )
    week_count = week_result.scalar() or 0

    # This month's completed habits
    month_result = await db.execute(
        select(func.count(HabitLog.id)).where(
            and_(
                HabitLog.user_id == child_id,
                HabitLog.status == HabitStatus.COMPLETED,
                HabitLog.completed_at
                >= datetime.combine(month_start, datetime.min.time()),
            )
        )
    )
    month_count = month_result.scalar() or 0

    # Pending habits
    pending_result = await db.execute(
        select(func.count(HabitLog.id)).where(
            and_(HabitLog.user_id == child_id, HabitLog.status == HabitStatus.PENDING)
        )
    )
    pending_count = pending_result.scalar() or 0

    habit_stats = HabitStatsResponse(
        today=today_count, week=week_count, month=month_count, pending=pending_count
    )

    # Calculate battle stats
    total_battles_result = await db.execute(
        select(func.count(BossBattle.id)).where(
            and_(
                BossBattle.user_id == child_id,
                BossBattle.status.in_([BattleStatus.VICTORY, BattleStatus.DEFEAT]),
            )
        )
    )
    total_battles = total_battles_result.scalar() or 0

    won_battles_result = await db.execute(
        select(func.count(BossBattle.id)).where(
            and_(
                BossBattle.user_id == child_id, BossBattle.status == BattleStatus.VICTORY
            )
        )
    )
    won_battles = won_battles_result.scalar() or 0

    lost_battles = total_battles - won_battles
    win_rate = (won_battles / total_battles * 100) if total_battles > 0 else 0

    battle_stats = BattleStatsResponse(
        total=total_battles, won=won_battles, lost=lost_battles, win_rate=win_rate
    )

    # Get recent activities (last 10)
    recent_activities = []

    # Recent habit completions
    recent_habits = await db.execute(
        select(HabitLog, Habit)
        .join(Habit, HabitLog.habit_id == Habit.id)
        .where(
            and_(
                HabitLog.user_id == child_id, HabitLog.status == HabitStatus.COMPLETED
            )
        )
        .order_by(HabitLog.completed_at.desc())
        .limit(5)
    )

    for log, habit in recent_habits.all():
        recent_activities.append(
            RecentActivity(
                type="habit",
                description=f"'{habit.title}' 습관 완료 (+{log.exp_earned} EXP, +{log.gold_earned} 골드)",
                timestamp=log.completed_at,
            )
        )

    # Recent battles
    recent_battles = await db.execute(
        select(BossBattle, Boss)
        .join(Boss, BossBattle.boss_id == Boss.id)
        .where(
            and_(
                BossBattle.user_id == child_id,
                BossBattle.status.in_([BattleStatus.VICTORY, BattleStatus.DEFEAT]),
            )
        )
        .order_by(BossBattle.completed_at.desc())
        .limit(5)
    )

    for battle, boss in recent_battles.all():
        status_text = "승리" if battle.status == BattleStatus.VICTORY else "패배"
        recent_activities.append(
            RecentActivity(
                type="battle",
                description=f"{boss.name} 전투 {status_text}",
                timestamp=battle.completed_at,
            )
        )

    # Sort by timestamp and take top 10
    recent_activities.sort(key=lambda x: x.timestamp, reverse=True)
    recent_activities = recent_activities[:10]

    return ChildProgressResponse(
        character=character,
        habit_stats=habit_stats,
        battle_stats=battle_stats,
        recent_activities=recent_activities,
    )


@router.get("/children/{child_id}/habits", response_model=list[HabitWithLogResponse])
async def get_child_habits(
    child_id: UUID,
    current_user: CurrentParent,
    db: DBSession,
    status_filter: HabitStatus | None = None,
):
    """Get child's habit logs with optional status filter."""
    # Verify relationship
    await verify_parent_child_relationship(current_user.id, child_id, db)

    # Build query
    query = (
        select(HabitLog, Habit)
        .join(Habit, HabitLog.habit_id == Habit.id)
        .where(HabitLog.user_id == child_id)
    )

    if status_filter:
        query = query.where(HabitLog.status == status_filter)

    # Order: pending first, then by completion time desc
    query = query.order_by(
        HabitLog.status == HabitStatus.PENDING,
        HabitLog.completed_at.desc(),
    )

    result = await db.execute(query)
    habit_logs = []

    for log, habit in result.all():
        habit_logs.append(
            HabitWithLogResponse(
                id=log.id,
                habit_id=habit.id,
                title=habit.title,
                category=habit.category,
                difficulty=habit.difficulty,
                status=log.status,
                exp_earned=log.exp_earned,
                gold_earned=log.gold_earned,
                completed_at=log.completed_at,
                approved_at=log.approved_at,
            )
        )

    return habit_logs


@router.get("/children/{child_id}/battles", response_model=list[BossBattleResponse])
async def get_child_battles(
    child_id: UUID, current_user: CurrentParent, db: DBSession, limit: int = 20
):
    """Get child's battle history."""
    # Verify relationship
    await verify_parent_child_relationship(current_user.id, child_id, db)

    # Get battles with boss info
    result = await db.execute(
        select(BossBattle, Boss)
        .join(Boss, BossBattle.boss_id == Boss.id)
        .where(BossBattle.user_id == child_id)
        .order_by(BossBattle.started_at.desc())
        .limit(limit)
    )

    battles = []
    for battle, boss in result.all():
        battles.append(
            BossBattleResponse(
                id=battle.id,
                boss=BossInfoResponse(
                    id=boss.id,
                    name=boss.name,
                    level=boss.level,
                    hp=boss.hp,
                    attack=boss.attack,
                ),
                status=battle.status,
                turns_taken=battle.turns_taken,
                damage_dealt=battle.damage_dealt,
                damage_received=battle.damage_received,
                rewards=battle.rewards,
                started_at=battle.started_at,
                completed_at=battle.completed_at,
            )
        )

    return battles


@router.post("/habits/{habit_log_id}/approve", response_model=HabitApprovalResponse)
async def approve_habit(
    habit_log_id: UUID, current_user: CurrentParent, db: DBSession
):
    """Approve a child's habit completion."""
    # Get habit log
    result = await db.execute(select(HabitLog).where(HabitLog.id == habit_log_id))
    habit_log = result.scalar_one_or_none()

    if not habit_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Habit log not found"
        )

    # Verify parent-child relationship
    await verify_parent_child_relationship(
        current_user.id, habit_log.user_id, db
    )

    # Check if already processed
    if habit_log.status != HabitStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Habit already {habit_log.status.value}",
        )

    # Update habit log
    habit_log.status = HabitStatus.COMPLETED
    habit_log.approved_by = current_user.id
    habit_log.approved_at = datetime.utcnow()

    # Get character
    result = await db.execute(
        select(Character).where(Character.user_id == habit_log.user_id)
    )
    character = result.scalar_one()

    # Add gold
    character.gold += habit_log.gold_earned

    # Calculate level up
    level_result = calculate_level_up(
        character.level, character.exp, habit_log.exp_earned
    )

    leveled_up = False
    new_level = None

    if level_result["leveled_up"]:
        leveled_up = True
        new_level = level_result["new_level"]

        # Update level and exp
        character.level = new_level
        character.exp = level_result["new_exp"]
        character.max_exp = level_result["new_max_exp"]

        # Increase stats
        stat_increase = calculate_stat_increase(level_result["levels_gained"])
        character.stats["strength"] += stat_increase["strength"]
        character.stats["intelligence"] += stat_increase["intelligence"]
        character.stats["vitality"] += stat_increase["vitality"]
        character.stats["luck"] += stat_increase["luck"]

        # Increase max HP and restore HP
        hp_increase = calculate_hp_increase(level_result["levels_gained"])
        character.max_hp += hp_increase
        character.hp = character.max_hp  # Full heal on level up!

        # Update streak
        result = await db.execute(
            select(Habit).where(Habit.id == habit_log.habit_id)
        )
        habit = result.scalar_one_or_none()
        if habit:
            habit.streak_count += 1
    else:
        # Just add exp
        character.exp = level_result["new_exp"]

    await db.commit()

    return HabitApprovalResponse(
        message="습관 승인 완료!",
        exp_earned=habit_log.exp_earned,
        gold_earned=habit_log.gold_earned,
        leveled_up=leveled_up,
        new_level=new_level,
    )


@router.post("/habits/{habit_log_id}/reject", response_model=dict)
async def reject_habit(
    habit_log_id: UUID, current_user: CurrentParent, db: DBSession
):
    """Reject a child's habit completion."""
    # Get habit log
    result = await db.execute(select(HabitLog).where(HabitLog.id == habit_log_id))
    habit_log = result.scalar_one_or_none()

    if not habit_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Habit log not found"
        )

    # Verify parent-child relationship
    await verify_parent_child_relationship(
        current_user.id, habit_log.user_id, db
    )

    # Check if already processed
    if habit_log.status != HabitStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Habit already {habit_log.status.value}",
        )

    # Update habit log
    habit_log.status = HabitStatus.REJECTED
    habit_log.approved_by = current_user.id
    habit_log.approved_at = datetime.utcnow()

    await db.commit()

    return {"message": "습관 거부됨"}
