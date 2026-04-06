"""add_skill_system

Revision ID: 86d089ac27bb
Revises: 5ae7ad6b27df
Create Date: 2026-04-04 13:27:32.910938

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '86d089ac27bb'
down_revision = '5ae7ad6b27df'
branch_labels = None
depends_on = None


def upgrade():
    # Create skills table
    op.create_table(
        'skills',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('skill_code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('skill_type', sa.String(length=20), nullable=False),
        sa.Column('damage_multiplier', sa.Numeric(precision=4, scale=2), nullable=False),
        sa.Column('mana_cost', sa.Integer(), nullable=False),
        sa.Column('cooldown_turns', sa.Integer(), nullable=False),
        sa.Column('unlock_level', sa.Integer(), nullable=False),
        sa.Column('unlock_class', sa.String(length=20), nullable=True),
        sa.Column('effects', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('icon_url', sa.String(length=255), nullable=True),
        sa.Column('animation_type', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('skill_code')
    )

    # Create character_skills table
    op.create_table(
        'character_skills',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('character_id', sa.UUID(), nullable=False),
        sa.Column('skill_id', sa.UUID(), nullable=False),
        sa.Column('skill_level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('unlocked_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('character_id', 'skill_id', name='uq_character_skill')
    )

    # Create bosses table if not exists
    op.create_table(
        'bosses',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('hp', sa.Integer(), nullable=False),
        sa.Column('attack', sa.Integer(), nullable=False),
        sa.Column('boss_type', sa.Enum('MILESTONE', 'STREAK', 'EVENT', name='bosstype'), nullable=False),
        sa.Column('sprite_url', sa.String(length=255), nullable=True),
        sa.Column('loot_table', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create boss_battles table if not exists
    op.create_table(
        'boss_battles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('boss_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'VICTORY', 'DEFEAT', name='battlestatus'), nullable=False),
        sa.Column('turns_taken', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('damage_dealt', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('damage_received', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('rewards', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_turn', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('player_current_hp', sa.Integer(), nullable=True),
        sa.Column('boss_current_hp', sa.Integer(), nullable=True),
        sa.Column('player_current_mana', sa.Integer(), nullable=True),
        sa.Column('battle_state', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['boss_id'], ['bosses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create battle_rewards table if not exists
    op.create_table(
        'battle_rewards',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('battle_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('gold', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('exp', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('gems', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('item_id', sa.UUID(), nullable=True),
        sa.Column('claimed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['battle_id'], ['boss_battles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create battle_turns table
    op.create_table(
        'battle_turns',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('battle_id', sa.UUID(), nullable=False),
        sa.Column('turn_number', sa.Integer(), nullable=False),
        sa.Column('actor', sa.String(length=10), nullable=False),
        sa.Column('action_type', sa.String(length=20), nullable=False),
        sa.Column('skill_id', sa.UUID(), nullable=True),
        sa.Column('damage', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_crit', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('target_hp', sa.Integer(), nullable=False),
        sa.Column('effects_applied', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.ForeignKeyConstraint(['battle_id'], ['boss_battles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('battle_id', 'turn_number', 'actor', name='uq_battle_turn')
    )

    # Add mana columns to characters table
    op.add_column('characters', sa.Column('mana', sa.Integer(), nullable=False, server_default='100'))
    op.add_column('characters', sa.Column('max_mana', sa.Integer(), nullable=False, server_default='100'))


def downgrade():
    # Remove mana columns from characters
    op.drop_column('characters', 'max_mana')
    op.drop_column('characters', 'mana')

    # Drop tables in reverse order
    op.drop_table('battle_turns')
    op.drop_table('battle_rewards')
    op.drop_table('boss_battles')
    op.drop_table('bosses')
    op.drop_table('character_skills')
    op.drop_table('skills')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS battlestatus')
    op.execute('DROP TYPE IF EXISTS bosstype')
