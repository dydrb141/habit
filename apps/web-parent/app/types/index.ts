export interface User {
  id: string;
  email: string;
  nickname: string;
  role: "parent" | "child";
  created_at: string;
}

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

export interface Child {
  user: User;
  character: Character;
  paired_at: string;
}

export type HabitCategory = "health" | "study" | "exercise" | "life";
export type HabitDifficulty = "easy" | "medium" | "hard";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: HabitCategory;
  difficulty: HabitDifficulty;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  exp_earned: number;
  gold_earned: number;
}

export interface DailyStats {
  date: string;
  total_habits: number;
  completed_habits: number;
  completion_rate: number;
  exp_earned: number;
  gold_earned: number;
}
