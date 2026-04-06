"""Boss battle endpoints."""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from uuid import UUID
import uuid
from datetime import datetime

from app.deps import DBSession, CurrentChild
from app.models.character import Character
from app.models.boss import Boss, BossBattle, BattleReward, BattleStatus
from app.schemas.boss import (
    AvailableBossResponse,
    BossResponse,
    BossBattleResponse,
    BattleSimulationResponse,
    TurnResult,
    BattleRewardResponse,
)
from app.schemas.skill import (
    BattleStateResponse,
    SkillActionRequest,
    SkillActionResponse,
    BattleTurnResponse,
    CharacterSkillResponse,
    SkillResponse,
)
from app.engine.boss_engine import (
    get_available_boss_for_level,
    initialize_battle_state,
    get_battle_state,
    execute_turn,
)
from app.engine.calculator import calculate_battle_rewards, calculate_level_up

router = APIRouter()


@router.get("/available", response_model=AvailableBossResponse)
async def get_available_boss(current_user: CurrentChild, db: DBSession):
    """Check if there's an available boss to challenge."""
    from app.models.boss import BossType

    # 캐릭터 조회
    result = await db.execute(
        select(Character).where(Character.user_id == current_user.id)
    )
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )

    # 도전 가능한 보스 확인
    boss = None

    # 레벨이 5의 배수이고, 아직 해당 레벨 보스를 처치하지 않았다면
    if character.level % 5 == 0 and character.last_boss_level < character.level:
        result = await db.execute(
            select(Boss).where(
                Boss.level == character.level,
                Boss.boss_type == BossType.MILESTONE
            )
        )
        boss = result.scalar_one_or_none()

    if boss:
        return AvailableBossResponse(
            available=True,
            boss=BossResponse.model_validate(boss),
            trigger="level"
        )

    return AvailableBossResponse(
        available=False,
        boss=None,
        trigger=None
    )


@router.post("/{boss_id}/start", response_model=BossBattleResponse)
async def start_boss_battle(
    boss_id: UUID,
    current_user: CurrentChild,
    db: DBSession
):
    """Start a new boss battle."""
    # 보스 확인
    result = await db.execute(select(Boss).where(Boss.id == boss_id))
    boss = result.scalar_one_or_none()

    if not boss:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boss not found"
        )

    # 이미 진행 중인 전투 ��인
    result = await db.execute(
        select(BossBattle).where(
            BossBattle.user_id == current_user.id,
            BossBattle.boss_id == boss_id,
            BossBattle.status == BattleStatus.ACTIVE
        )
    )
    existing_battle = result.scalar_one_or_none()

    if existing_battle:
        return existing_battle

    # 캐릭터 확인
    result = await db.execute(
        select(Character).where(Character.user_id == current_user.id)
    )
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )

    # 새 전투 생성
    battle = BossBattle(
        user_id=current_user.id,
        boss_id=boss_id,
        status=BattleStatus.ACTIVE
    )
    db.add(battle)
    await db.flush()

    # 전투 상태 초기화
    await initialize_battle_state(battle, character, boss, db)

    await db.refresh(battle)
    return battle


@router.post("/battles/{battle_id}/simulate", response_model=BattleSimulationResponse)
async def simulate_boss_battle(
    battle_id: UUID,
    current_user: CurrentChild,
    db: DBSession
):
    """Simulate a boss battle."""
    # 전투 조회
    result = await db.execute(
        select(BossBattle).where(
            BossBattle.id == battle_id,
            BossBattle.user_id == current_user.id
        )
    )
    battle = result.scalar_one_or_none()

    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )

    if battle.status != BattleStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Battle is already completed"
        )

    # 캐릭터 조회
    result = await db.execute(
        select(Character).where(Character.user_id == current_user.id)
    )
    character = result.scalar_one_or_none()

    # 보스 조회
    result = await db.execute(select(Boss).where(Boss.id == battle.boss_id))
    boss = result.scalar_one_or_none()

    # 전투 시뮬레이션
    simulation_result = simulate_battle(character, boss)

    # 전투 결과 업데이트
    battle.status = (
        BattleStatus.VICTORY if simulation_result["outcome"] == "victory"
        else BattleStatus.DEFEAT
    )
    battle.turns_taken = simulation_result["turns_taken"]
    battle.damage_dealt = simulation_result["total_damage_dealt"]
    battle.damage_received = simulation_result["total_damage_received"]
    battle.completed_at = datetime.utcnow()

    # 승리 ��� 보상 계산
    if battle.status == BattleStatus.VICTORY:
        first_time = character.last_boss_level < boss.level
        rewards = calculate_battle_rewards(boss.level, first_time)
        battle.rewards = rewards
    else:
        battle.rewards = {}

    await db.commit()

    # 응답 생성
    turn_results = [
        TurnResult(**turn) for turn in simulation_result["turns"]
    ]

    return BattleSimulationResponse(
        outcome=simulation_result["outcome"],
        turns=turn_results,
        total_damage_dealt=simulation_result["total_damage_dealt"],
        total_damage_received=simulation_result["total_damage_received"]
    )


@router.post("/battles/{battle_id}/claim", response_model=BattleRewardResponse)
async def claim_battle_reward(
    battle_id: UUID,
    current_user: CurrentChild,
    db: DBSession
):
    """Claim rewards from a victorious battle."""
    # 전투 조회
    result = await db.execute(
        select(BossBattle).where(
            BossBattle.id == battle_id,
            BossBattle.user_id == current_user.id
        )
    )
    battle = result.scalar_one_or_none()

    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )

    if battle.status != BattleStatus.VICTORY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only claim rewards from victorious battles"
        )

    # 이미 클레임했는지 확인
    result = await db.execute(
        select(BattleReward).where(BattleReward.battle_id == battle_id)
    )
    existing_reward = result.scalar_one_or_none()

    if existing_reward:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rewards already claimed"
        )

    # 캐릭터 조회
    result = await db.execute(
        select(Character).where(Character.user_id == current_user.id)
    )
    character = result.scalar_one_or_none()

    # 보스 조회
    result = await db.execute(select(Boss).where(Boss.id == battle.boss_id))
    boss = result.scalar_one_or_none()

    # 보상 지급
    rewards = battle.rewards
    character.gold += rewards.get("gold", 0)
    character.gems += rewards.get("gems", 0)

    # EXP 및 레벨업 처리
    level_result = calculate_level_up(
        character.level,
        character.exp,
        rewards.get("exp", 0)
    )

    character.exp = level_result["new_exp"]
    character.max_exp = level_result["new_max_exp"]
    leveled_up = level_result["leveled_up"]
    new_level = level_result["new_level"] if leveled_up else None

    if leveled_up:
        character.level = new_level
        # HP도 완전 회복
        character.hp = character.max_hp

    # 보스 처치 기록 업데이트
    character.battles_won += 1
    if character.last_boss_level < boss.level:
        character.last_boss_level = boss.level

    # 보상 클레임 기록
    reward_record = BattleReward(
        battle_id=battle_id,
        user_id=current_user.id,
        gold=rewards.get("gold", 0),
        exp=rewards.get("exp", 0),
        gems=rewards.get("gems", 0)
    )
    db.add(reward_record)

    await db.commit()

    return BattleRewardResponse(
        rewards=rewards,
        leveled_up=leveled_up,
        new_level=new_level
    )


@router.get("/history", response_model=list[BossBattleResponse])
async def get_battle_history(current_user: CurrentChild, db: DBSession):
    """Get user's battle history."""
    result = await db.execute(
        select(BossBattle)
        .where(BossBattle.user_id == current_user.id)
        .order_by(BossBattle.started_at.desc())
        .limit(20)
    )
    battles = result.scalars().all()

    return [BossBattleResponse.model_validate(battle) for battle in battles]


@router.get("/battles/{battle_id}/state", response_model=BattleStateResponse)
async def get_battle_current_state(
    battle_id: UUID,
    current_user: CurrentChild,
    db: DBSession
):
    """Get current battle state for manual combat."""
    # 전투 조회
    result = await db.execute(
        select(BossBattle).where(
            BossBattle.id == battle_id,
            BossBattle.user_id == current_user.id
        )
    )
    battle = result.scalar_one_or_none()

    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )

    # 캐릭터 조회
    result = await db.execute(
        select(Character).where(Character.user_id == current_user.id)
    )
    character = result.scalar_one_or_none()

    # 보스 조회
    result = await db.execute(select(Boss).where(Boss.id == battle.boss_id))
    boss = result.scalar_one_or_none()

    # 전투 상태 가져오기
    battle_state = await get_battle_state(battle, character, boss, db)

    # Convert to response format
    from app.models.skill import Skill, CharacterSkill

    available_skills = []
    for skill_info in battle_state["available_skills"]:
        available_skills.append(
            CharacterSkillResponse(
                id=skill_info["id"],
                skill=SkillResponse.model_validate(skill_info["skill"]),
                skill_level=1,  # TODO: Get from CharacterSkill
                unlocked_at=datetime.utcnow(),  # TODO: Get from CharacterSkill
                can_use=skill_info["can_use"],
                current_cooldown=skill_info["current_cooldown"],
                reason=skill_info["reason"]
            )
        )

    return BattleStateResponse(
        battle_id=battle.id,
        status=battle_state["status"],
        current_turn=battle_state["current_turn"],
        player_hp=battle_state["player_hp"],
        player_max_hp=battle_state["player_max_hp"],
        player_mana=battle_state["player_mana"],
        player_max_mana=battle_state["player_max_mana"],
        player_buffs=battle_state["player_buffs"],
        boss_hp=battle_state["boss_hp"],
        boss_max_hp=battle_state["boss_max_hp"],
        boss_name=battle_state["boss_name"],
        boss_buffs=battle_state["boss_buffs"],
        available_skills=available_skills,
        cooldowns=battle_state["cooldowns"]
    )


@router.post("/battles/{battle_id}/action", response_model=SkillActionResponse)
async def execute_battle_action(
    battle_id: UUID,
    action: SkillActionRequest,
    current_user: CurrentChild,
    db: DBSession
):
    """Execute a player action (use skill) in manual combat."""
    # 전투 조회
    result = await db.execute(
        select(BossBattle).where(
            BossBattle.id == battle_id,
            BossBattle.user_id == current_user.id
        )
    )
    battle = result.scalar_one_or_none()

    if not battle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battle not found"
        )

    if battle.status != BattleStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Battle is not active"
        )

    # 캐릭터 조회
    result = await db.execute(
        select(Character).where(Character.user_id == current_user.id)
    )
    character = result.scalar_one_or_none()

    # 보스 조회
    result = await db.execute(select(Boss).where(Boss.id == battle.boss_id))
    boss = result.scalar_one_or_none()

    # 턴 실행
    turn_result = await execute_turn(battle, character, boss, action.skill_id, db)

    if not turn_result["success"]:
        return SkillActionResponse(
            success=False,
            error=turn_result["error"],
            player_turn=None,
            boss_turn=None,
            battle_state=None
        )

    # Convert battle state to response format
    battle_state_dict = turn_result["battle_state"]
    available_skills = []
    for skill_info in battle_state_dict["available_skills"]:
        available_skills.append(
            CharacterSkillResponse(
                id=skill_info["id"],
                skill=SkillResponse.model_validate(skill_info["skill"]),
                skill_level=1,
                unlocked_at=datetime.utcnow(),
                can_use=skill_info["can_use"],
                current_cooldown=skill_info["current_cooldown"],
                reason=skill_info["reason"]
            )
        )

    battle_state = BattleStateResponse(
        battle_id=battle.id,
        status=battle_state_dict["status"],
        current_turn=battle_state_dict["current_turn"],
        player_hp=battle_state_dict["player_hp"],
        player_max_hp=battle_state_dict["player_max_hp"],
        player_mana=battle_state_dict["player_mana"],
        player_max_mana=battle_state_dict["player_max_mana"],
        player_buffs=battle_state_dict["player_buffs"],
        boss_hp=battle_state_dict["boss_hp"],
        boss_max_hp=battle_state_dict["boss_max_hp"],
        boss_name=battle_state_dict["boss_name"],
        boss_buffs=battle_state_dict["boss_buffs"],
        available_skills=available_skills,
        cooldowns=battle_state_dict["cooldowns"]
    )

    # Convert turns to response format
    player_turn = turn_result["player_turn"]
    player_turn_response = BattleTurnResponse(
        id=uuid.uuid4(),  # Temporary, should be from DB
        turn_number=player_turn["turn_number"],
        actor=player_turn["actor"],
        action_type=player_turn["action_type"],
        skill_id=player_turn.get("skill_id"),
        damage=player_turn["damage"],
        is_crit=player_turn["is_crit"],
        target_hp=player_turn["target_hp"],
        effects_applied=player_turn["effects_applied"]
    )

    boss_turn_response = None
    if turn_result["boss_turn"]:
        boss_turn = turn_result["boss_turn"]
        boss_turn_response = BattleTurnResponse(
            id=uuid.uuid4(),
            turn_number=boss_turn["turn_number"],
            actor=boss_turn["actor"],
            action_type=boss_turn["action_type"],
            skill_id=boss_turn.get("skill_id"),
            damage=boss_turn["damage"],
            is_crit=boss_turn["is_crit"],
            target_hp=boss_turn["target_hp"],
            effects_applied=boss_turn["effects_applied"]
        )

    return SkillActionResponse(
        success=True,
        error=None,
        player_turn=player_turn_response,
        boss_turn=boss_turn_response,
        battle_state=battle_state
    )
