/**
 * Habit related types
 */

export type HabitCategory = 'health' | 'study' | 'exercise' | 'life';
export type HabitDifficulty = 'easy' | 'medium' | 'hard';
export type HabitStatus = 'pending' | 'completed' | 'rejected' | 'failed';

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  category: HabitCategory;
  difficulty: HabitDifficulty;
  streak_count: number;
  is_active: boolean;
  requires_approval: boolean;
  schedule?: any;
  created_at: string;
}

export interface HabitCreateRequest {
  title: string;
  category: HabitCategory;
  difficulty: HabitDifficulty;
  requires_approval?: boolean;
  schedule?: any;
}

export interface HabitCheckResponse {
  message: string;
  exp_earned: number;
  gold_earned: number;
  leveled_up: boolean;
  new_level: number | null;
}
