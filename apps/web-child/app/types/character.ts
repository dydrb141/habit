/**
 * Character related types
 */

export interface Character {
  id: string;
  user_id: string;
  name: string | null;
  level: number;
  exp: number;
  max_exp: number;
  hp: number;
  max_hp: number;
  mana: number;
  max_mana: number;
  gold: number;
  gems: number;
  stats: CharacterStats;
}

export interface CharacterStats {
  strength: number;
  intelligence: number;
  vitality: number;
  luck: number;
}

export interface CharacterUpdateRequest {
  name?: string;
}
