"""Unlock skills for child@test.com character."""
import asyncio
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://habitquest:dev_password_change_in_prod@localhost:5432/habitquest_dev"

async def unlock_skills():
    """Unlock level 1 and level 5 skills for child@test.com."""
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Get character ID and class
        result = await session.execute(
            text("""
                SELECT c.id, c.class_type
                FROM characters c
                JOIN users u ON c.user_id = u.id
                WHERE u.email = 'child@test.com'
            """)
        )
        row = result.first()
        if not row:
            print("Character not found!")
            return

        character_id = row[0]
        character_class = row[1]
        print(f"Character ID: {character_id}, Class: {character_class}")

        # Get skills to unlock (level 1 and 5)
        result = await session.execute(
            text("""
                SELECT id, skill_code, name, unlock_level
                FROM skills
                WHERE (unlock_level <= 5)
                  AND (unlock_class IS NULL OR unlock_class = :class_type)
                ORDER BY unlock_level
            """),
            {"class_type": character_class}
        )
        skills_to_unlock = result.all()

        print(f"\nSkills to unlock: {len(skills_to_unlock)}")

        for skill in skills_to_unlock:
            skill_id, skill_code, skill_name, unlock_level = skill

            # Check if already unlocked
            check = await session.execute(
                text("""
                    SELECT id FROM character_skills
                    WHERE character_id = :char_id AND skill_id = :skill_id
                """),
                {"char_id": character_id, "skill_id": skill_id}
            )

            if check.first():
                print(f"  ⏭️  {skill_name} (lv{unlock_level}) - Already unlocked")
                continue

            # Unlock skill
            await session.execute(
                text("""
                    INSERT INTO character_skills (id, character_id, skill_id, skill_level, unlocked_at)
                    VALUES (:id, :char_id, :skill_id, 1, NOW())
                """),
                {
                    "id": uuid.uuid4(),
                    "char_id": character_id,
                    "skill_id": skill_id
                }
            )
            print(f"  ✅ {skill_name} (lv{unlock_level}) - Unlocked!")

        await session.commit()
        print("\n✅ All skills unlocked!")

        # Show final list
        result = await session.execute(
            text("""
                SELECT s.name, s.unlock_level, s.mana_cost
                FROM character_skills cs
                JOIN skills s ON cs.skill_id = s.id
                WHERE cs.character_id = :char_id
                ORDER BY s.unlock_level, s.mana_cost
            """),
            {"char_id": character_id}
        )

        print("\nFinal skill list:")
        for row in result:
            print(f"  - {row[0]} (Lv{row[1]}, {row[2]} mana)")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(unlock_skills())
