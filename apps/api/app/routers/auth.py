"""Authentication endpoints."""
import secrets
from datetime import timedelta
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.deps import DBSession, RedisClient, CurrentUser
from app.models.user import User, Family
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserResponse,
    PairingCodeRequest,
    PairingCodeResponse,
    PairWithCodeRequest,
)
from app.middleware.auth import hash_password, verify_password, create_access_token
from app.models.character import Character


router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: DBSession):
    """Register new user (parent or child)."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    new_user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        nickname=user_data.nickname,
        role=user_data.role,
    )
    db.add(new_user)

    try:
        await db.commit()
        await db.refresh(new_user)

        # Create character for child users
        if new_user.role == "child":
            character = Character(
                user_id=new_user.id,
                stats={"strength": 10, "intelligence": 10, "vitality": 10, "luck": 10}
            )
            db.add(character)
            await db.commit()

        return new_user
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user"
        )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: DBSession):
    """Login and get JWT token."""
    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        expires_in=3600 * 24  # 24 hours
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: CurrentUser):
    """Get current authenticated user information."""
    return current_user


@router.post("/pairing/generate", response_model=PairingCodeResponse)
async def generate_pairing_code(
    request: PairingCodeRequest,
    current_user: CurrentUser,
    redis: RedisClient
):
    """Generate pairing code for parent to connect with child."""
    if current_user.role != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can generate pairing codes"
        )

    # Generate 6-digit code
    code = ''.join(secrets.choice('0123456789') for _ in range(6))

    # Store in Redis with 1-hour expiration
    redis_key = f"pairing_code:{code}"
    await redis.setex(
        redis_key,
        timedelta(hours=1),
        str(current_user.id)
    )

    return PairingCodeResponse(code=code, expires_in_minutes=60)


@router.post("/pairing/pair", status_code=status.HTTP_200_OK)
async def pair_with_code(
    request: PairWithCodeRequest,
    current_user: CurrentUser,
    db: DBSession,
    redis: RedisClient
):
    """Child user pairs with parent using code."""
    if current_user.role != "child":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only children can use pairing codes"
        )

    # Verify code in Redis
    redis_key = f"pairing_code:{request.pairing_code}"
    parent_id = await redis.get(redis_key)

    if not parent_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired pairing code"
        )

    # Create family relationship
    family = Family(
        parent_id=parent_id,
        child_id=str(current_user.id),
        pairing_code=request.pairing_code,
    )
    db.add(family)

    try:
        await db.commit()
        # Delete used code
        await redis.delete(redis_key)
        return {"message": "Successfully paired with parent"}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pairing already exists"
        )
