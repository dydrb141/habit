"""Check why boss is not appearing."""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://habitquest:dev_password_change_in_prod@localhost:5432/habitquest_dev"

async def check_boss_availability():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check character
        result = await session.execute(
            text("""
                SELECT c.level, c.last_boss_level, u.email
                FROM characters c
                JOIN users u ON c.user_id = u.id
                WHERE u.email = :email
            """),
            {"email": "child@test.com"}
        )
        row = result.first()

        if not row:
            print("❌ Character not found!")
            return

        level, last_boss_level, email = row
        print(f"✅ Character found: {email}")
        print(f"   Level: {level}")
        print(f"   Last Boss Level: {last_boss_level}")

        # Check boss availability logic
        if level % 5 != 0:
            print(f"\n❌ Level {level} is not a multiple of 5")
        elif last_boss_level >= level:
            print(f"\n❌ Already defeated level {level} boss (last_boss_level: {last_boss_level})")
            print(f"   Need to UPDATE last_boss_level to {level - 1}")
        else:
            print(f"\n✅ Boss should be available!")

        # Check if boss exists
        result = await session.execute(
            text("""
                SELECT id, name, level, boss_type
                FROM bosses
                WHERE level = :level AND boss_type = 'MILESTONE'
            """),
            {"level": level}
        )
        boss = result.first()

        if boss:
            print(f"\n✅ Boss exists: {boss[1]} (Level {boss[2]})")
        else:
            print(f"\n❌ No boss found for level {level}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_boss_availability())
