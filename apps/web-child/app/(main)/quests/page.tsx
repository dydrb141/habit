"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { apiClient } from "@/app/lib/api-client";
import RewardToast from "@/app/components/animations/RewardToast";
import LevelUpModal from "@/app/components/animations/LevelUpModal";
import { useSoundEffect } from "@/app/components/sound/useSoundEffect";
import type { Habit, HabitCreateRequest, HabitCheckResponse, HabitCategory, HabitDifficulty } from "@/app/types";

export default function QuestsPage() {
  const router = useRouter();
  const { refreshCharacter } = useAuth();
  const { playSound } = useSoundEffect();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabit, setNewHabit] = useState<HabitCreateRequest>({
    title: "",
    category: "health",
    difficulty: "easy",
  });

  // 애니메이션 상태
  const [showRewardToast, setShowRewardToast] = useState(false);
  const [rewardData, setRewardData] = useState({ exp: 0, gold: 0 });
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState({
    newLevel: 0,
    statIncreases: {}
  });

  const fetchHabits = async () => {
    try {
      const data = await apiClient.get<Habit[]>("/api/v1/habits/today");
      setHabits(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiClient.post<Habit>("/api/v1/habits/", newHabit);
      setNewHabit({ title: "", category: "health", difficulty: "easy" });
      setShowAddForm(false);
      fetchHabits();
    } catch (err) {
      alert("습관 추가 실패");
    }
  };

  const handleCheckHabit = async (habitId: string) => {
    try {
      const result = await apiClient.post<HabitCheckResponse>(
        `/api/v1/habits/${habitId}/check`
      );

      // 캐릭터 정보 갱신
      await refreshCharacter();

      // 효과음 재생
      playSound('quest_complete');
      playSound('exp');
      playSound('gold');

      if (result.leveled_up && result.new_level) {
        // 레벨업 모달 표시
        setLevelUpData({
          newLevel: result.new_level,
          statIncreases: {
            strength: 1,
            intelligence: 1,
            charisma: 1,
            luck: 1
          }
        });
        setShowLevelUpModal(true);

        // 3초 후 보스 확인
        setTimeout(() => {
          // 레벨업 후 대시보드로 (보스는 BottomNav에서 확인)
          router.push("/dashboard");
        }, 3000);
      } else {
        // 보상 토스트 표시
        setRewardData({
          exp: result.exp_earned,
          gold: result.gold_earned
        });
        setShowRewardToast(true);
      }

      fetchHabits();
    } catch (err: any) {
      alert(err.detail || err.message || "체크 실패");
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      health: "❤️",
      study: "📚",
      exercise: "💪",
      life: "🏠",
    };
    return emojis[category] || "⭐";
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: "bg-green-600",
      medium: "bg-yellow-600",
      hard: "bg-red-600",
    };
    return colors[difficulty] || "bg-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 애니메이션 컴포넌트 */}
      <RewardToast
        show={showRewardToast}
        exp={rewardData.exp}
        gold={rewardData.gold}
        onHide={() => setShowRewardToast(false)}
      />
      <LevelUpModal
        show={showLevelUpModal}
        newLevel={levelUpData.newLevel}
        statIncreases={levelUpData.statIncreases}
        onClose={() => setShowLevelUpModal(false)}
      />

      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">오늘의 퀘스트</h1>
          <p className="text-gray-300 mt-2">습관을 체크하고 EXP를 획득하세요!</p>
        </div>

        {/* Add Habit Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition"
          >
            + 새로운 습관 추가
          </button>
        )}

        {/* Add Habit Form */}
        {showAddForm && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">새 습관 추가</h3>
            <form onSubmit={handleAddHabit} className="space-y-4">
              <input
                type="text"
                value={newHabit.title}
                onChange={(e) =>
                  setNewHabit({ ...newHabit, title: e.target.value })
                }
                placeholder="습관 이름 (예: 영어 단어 10개 외우기)"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newHabit.category}
                  onChange={(e) =>
                    setNewHabit({ ...newHabit, category: e.target.value as HabitCategory })
                  }
                  className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="health">❤️ 건강</option>
                  <option value="study">📚 공부</option>
                  <option value="exercise">💪 운동</option>
                  <option value="life">🏠 생활</option>
                </select>

                <select
                  value={newHabit.difficulty}
                  onChange={(e) =>
                    setNewHabit({ ...newHabit, difficulty: e.target.value as HabitDifficulty })
                  }
                  className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="easy">쉬움 (10 EXP)</option>
                  <option value="medium">보통 (20 EXP)</option>
                  <option value="hard">어려움 (30 EXP)</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Habits List */}
        {habits.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
            <p className="text-gray-400 text-lg">
              아직 습관이 없습니다. 새로운 습관을 추가해보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">
                        {getCategoryEmoji(habit.category)}
                      </span>
                      <h3 className="text-xl font-bold text-white">
                        {habit.title}
                      </h3>
                      <span
                        className={`${getDifficultyColor(
                          habit.difficulty
                        )} text-white text-xs px-3 py-1 rounded-full font-medium`}
                      >
                        {habit.difficulty === "easy" && "쉬움"}
                        {habit.difficulty === "medium" && "보통"}
                        {habit.difficulty === "hard" && "어려움"}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      🔥 {habit.streak_count}일 연속
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheckHabit(habit.id)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
                  >
                    ✓ 완료
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
