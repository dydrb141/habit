-- Add boss battle system tables
-- Migration: add_boss_tables

-- Add boss battle fields to characters table
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS battles_won INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_boss_level INTEGER DEFAULT 0 NOT NULL;

-- Create boss type enum
DO $$ BEGIN
    CREATE TYPE bosstype AS ENUM ('milestone', 'streak', 'event');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create battle status enum
DO $$ BEGIN
    CREATE TYPE battlestatus AS ENUM ('active', 'victory', 'defeat');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create bosses table
CREATE TABLE IF NOT EXISTS bosses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL,
    hp INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    boss_type bosstype NOT NULL DEFAULT 'milestone',
    sprite_url VARCHAR(255),
    loot_table JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Create boss_battles table
CREATE TABLE IF NOT EXISTS boss_battles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    boss_id UUID NOT NULL REFERENCES bosses(id),
    status battlestatus NOT NULL DEFAULT 'active',
    turns_taken INTEGER DEFAULT 0 NOT NULL,
    damage_dealt INTEGER DEFAULT 0 NOT NULL,
    damage_received INTEGER DEFAULT 0 NOT NULL,
    rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

-- Create battle_rewards table
CREATE TABLE IF NOT EXISTS battle_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id UUID NOT NULL REFERENCES boss_battles(id),
    user_id UUID NOT NULL REFERENCES users(id),
    gold INTEGER DEFAULT 0 NOT NULL,
    exp INTEGER DEFAULT 0 NOT NULL,
    gems INTEGER DEFAULT 0 NOT NULL,
    item_id UUID,
    claimed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_boss_battles_user_id ON boss_battles(user_id);
CREATE INDEX IF NOT EXISTS idx_boss_battles_status ON boss_battles(status);
CREATE INDEX IF NOT EXISTS idx_battle_rewards_user_id ON battle_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_rewards_battle_id ON battle_rewards(battle_id);

-- Insert initial bosses
INSERT INTO bosses (id, name, level, hp, attack, boss_type, loot_table)
VALUES
    (gen_random_uuid(), '그림자 슬라임', 5, 175, 15, 'MILESTONE'::bosstype, '{"gold": 250, "exp": 500, "gems": 10}'::jsonb),
    (gen_random_uuid(), '불의 골렘', 10, 300, 25, 'MILESTONE'::bosstype, '{"gold": 500, "exp": 1000, "gems": 15}'::jsonb),
    (gen_random_uuid(), '얼음 마법사', 15, 425, 35, 'MILESTONE'::bosstype, '{"gold": 750, "exp": 1500, "gems": 20}'::jsonb),
    (gen_random_uuid(), '번개 드래곤', 20, 550, 45, 'MILESTONE'::bosstype, '{"gold": 1000, "exp": 2000, "gems": 25}'::jsonb),
    (gen_random_uuid(), '습관 파괴자', 7, 200, 20, 'STREAK'::bosstype, '{"gold": 350, "exp": 700, "gems": 20}'::jsonb)
ON CONFLICT DO NOTHING;
