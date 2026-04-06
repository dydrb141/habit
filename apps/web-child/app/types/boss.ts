/**
 * Boss and battle related types
 */

export interface Boss {
  id: string;
  name: string;
  level: number;
  hp: number;
  max_hp: number;
  description: string;
  image_url?: string;
}

export interface AvailableBossResponse {
  available: boolean;
  boss: Boss | null;
}

export interface BossBattle {
  id: string;
  boss_id: string;
  user_id: string;
  boss_hp: number;
  boss_max_hp: number;
  status: 'active' | 'victory' | 'defeat';
  started_at: string;
  completed_at?: string;
}

export interface BattleActionRequest {
  skill_id: string;
}

export interface BattleActionResponse {
  damage_dealt: number;
  damage_taken: number;
  boss_hp: number;
  player_hp: number;
  battle_status: 'active' | 'victory' | 'defeat';
}

export interface BattleReward {
  exp: number;
  gold: number;
  items?: any[];
}
