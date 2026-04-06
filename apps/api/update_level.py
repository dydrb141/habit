"""Update character level to 5."""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://habitquest:dev_password_change_in_prod@localhost:5432/habitquest_dev"

async def update_character_level():
    """Update child@test.com character to level 5."""
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Add mana columns if not exist
        try:
            await session.execute(
                text("""
                    ALTER TABLE characters
                    ADD COLUMN IF NOT EXISTS mana INTEGER DEFAULT 100 NOT NULL,
                    ADD COLUMN IF NOT EXISTS max_mana INTEGER DEFAULT 100 NOT NULL
                """)
            )
            await session.commit()
            print("✅ Mana columns added!")
        except Exception as e:
            print(f"Mana columns might already exist: {e}")
            await session.rollback()

        # Update character level
        await session.execute(
            text("""
                UPDATE characters
                SET level = 5,
                    exp = 0,
                    max_exp = 225,
                    hp = 120,
                    max_hp = 120,
                    mana = 100,
                    max_mana = 100
                FROM users
                WHERE characters.user_id = users.id
                AND users.email = 'child@test.com'
            """)
        )

        await session.commit()
        print("✅ Character level updated to 5!")

        # Check result
        result = await session.execute(
            text("""
                SELECT c.level, c.exp, c.hp, c.mana, u.email
                FROM characters c
                JOIN users u ON c.user_id = u.id
                WHERE u.email = 'child@test.com'
            """)
        )
        row = result.first()
        if row:
            print(f"Level: {row[0]}, EXP: {row[1]}, HP: {row[2]}, Mana: {row[3]}, Email: {row[4]}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update_character_level())
