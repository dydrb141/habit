"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/app/lib/api-client";
import type { Child, Habit, HabitCategory, HabitDifficulty } from "@/app/types";
import ProgressBar from "@/app/components/animations/ProgressBar";

const categoryLabels: Record<HabitCategory, string> = {
  health: "건강",
  study: "공부",
  exercise: "운동",
  life: "생활",
};

const difficultyLabels: Record<HabitDifficulty, string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

const categoryColors: Record<HabitCategory, string> = {
  health: "bg-green-600",
  study: "bg-blue-600",
  exercise: "bg-red-600",
  life: "bg-purple-600",
};

export default function ChildDetailPage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;

  const [child, setChild] = useState<Child | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "habits">("overview");

  // Add/Edit habit form
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitForm, setHabitForm] = useState({
    name: "",
    category: "health" as HabitCategory,
    difficulty: "medium" as HabitDifficulty,
  });

  useEffect(() => {
    fetchData();
  }, [childId]);

  const fetchData = async () => {
    try {
      // Fetch child info
      const childrenData = await apiClient.get<Child[]>("/api/v1/family/children");
      const currentChild = childrenData.find((c) => c.user.id === childId);

      if (!currentChild) {
        throw new Error("자녀를 찾을 수 없습니다");
      }

      setChild(currentChild);

      // Fetch habits
      const habitsData = await apiClient.get<Habit[]>(
        `/api/v1/habit/user/${childId}`
      );
      setHabits(habitsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      alert("데이터를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = () => {
    setEditingHabit(null);
    setHabitForm({
      name: "",
      category: "health",
      difficulty: "medium",
    });
    setShowHabitForm(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitForm({
      name: habit.name,
      category: habit.category,
      difficulty: habit.difficulty,
    });
    setShowHabitForm(true);
  };

  const handleSubmitHabit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!habitForm.name.trim()) {
      alert("습관 이름을 입력해주세요");
      return;
    }

    try {
      if (editingHabit) {
        // Update habit
        await apiClient.patch(`/api/v1/habit/${editingHabit.id}`, {
          ...habitForm,
          user_id: childId,
        });
      } else {
        // Create habit
        await apiClient.post("/api/v1/habit/", {
          ...habitForm,
          user_id: childId,
        });
      }

      setShowHabitForm(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save habit:", error);
      alert("습관 저장에 실패했습니다");
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm("이 습관을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await apiClient.delete(`/api/v1/habit/${habitId}`);
      fetchData();
    } catch (error) {
      console.error("Failed to delete habit:", error);
      alert("습관 삭제에 실패했습니다");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-red-400 text-xl">자녀를 찾을 수 없습니다</div>
      </div>
    );
  }

  const completedToday = habits.filter((h) => h.is_completed).length;
  const completionRate =
    habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white hover:text-purple-300 transition"
          >
            ← 뒤로 가기
          </button>
          <h1 className="text-2xl font-bold text-white">
            {child.character.name || child.user.nickname}의 상세 정보
          </h1>
          <div className="w-20"></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "overview"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            📊 개요
          </button>
          <button
            onClick={() => setActiveTab("habits")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "habits"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            ✅ 습관 관리
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Character Info Card */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">캐릭터 정보</h2>

              {/* Level and EXP */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">레벨</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 rounded-full">
                    Lv.{child.character.level}
                  </span>
                </div>
                <ProgressBar
                  current={child.character.exp}
                  max={child.character.max_exp}
                  label="⭐ EXP"
                  color="bg-gradient-to-r from-blue-500 to-cyan-500"
                  animate={false}
                />
              </div>

              {/* HP and Mana */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <ProgressBar
                  current={child.character.hp}
                  max={child.character.max_hp}
                  label="❤️ HP"
                  color="bg-gradient-to-r from-red-500 to-pink-500"
                  animate={false}
                />
                <ProgressBar
                  current={child.character.mana}
                  max={child.character.max_mana}
                  label="💙 Mana"
                  color="bg-gradient-to-r from-blue-500 to-indigo-500"
                  animate={false}
                />
              </div>

              {/* Currency */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-yellow-400 text-sm mb-2">💰 골드</div>
                  <div className="text-white text-2xl font-bold">
                    {child.character.gold}
                  </div>
                </div>
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-purple-400 text-sm mb-2">💎 보석</div>
                  <div className="text-white text-2xl font-bold">
                    {child.character.gems}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-red-400 text-sm mb-2">⚔️ 힘</div>
                  <div className="text-white text-2xl font-bold">
                    {child.character.stats.strength}
                  </div>
                </div>
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-blue-400 text-sm mb-2">🧠 지능</div>
                  <div className="text-white text-2xl font-bold">
                    {child.character.stats.intelligence}
                  </div>
                </div>
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-green-400 text-sm mb-2">❤️ 체력</div>
                  <div className="text-white text-2xl font-bold">
                    {child.character.stats.vitality}
                  </div>
                </div>
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <div className="text-yellow-400 text-sm mb-2">🍀 행운</div>
                  <div className="text-white text-2xl font-bold">
                    {child.character.stats.luck}
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Stats */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">오늘의 현황</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-gray-400 text-sm mb-2">완료한 습관</div>
                  <div className="text-4xl font-bold text-white">
                    {completedToday}/{habits.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-sm mb-2">달성률</div>
                  <div className="text-4xl font-bold text-green-400">
                    {completionRate}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-sm mb-2">등록된 습관</div>
                  <div className="text-4xl font-bold text-purple-400">
                    {habits.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Habits Tab */}
        {activeTab === "habits" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">습관 목록</h2>
              <button
                onClick={handleAddHabit}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg transition font-bold"
              >
                ➕ 새 습관 추가
              </button>
            </div>

            {habits.length === 0 ? (
              <div className="bg-gray-800 rounded-2xl p-12 text-center border border-gray-700">
                <div className="text-gray-400 text-lg mb-4">
                  아직 등록된 습관이 없습니다
                </div>
                <p className="text-gray-500 mb-6">
                  자녀를 위한 첫 습관을 추가해보세요
                </p>
                <button
                  onClick={handleAddHabit}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  ➕ 습관 추가하기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">
                          {habit.name}
                        </h3>
                        <div className="flex gap-2">
                          <span
                            className={`${
                              categoryColors[habit.category]
                            } text-white text-xs px-2 py-1 rounded`}
                          >
                            {categoryLabels[habit.category]}
                          </span>
                          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                            {difficultyLabels[habit.difficulty]}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditHabit(habit)}
                          className="text-blue-400 hover:text-blue-300 transition text-sm"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="text-red-400 hover:text-red-300 transition text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={habit.is_completed}
                        readOnly
                        className="w-5 h-5"
                      />
                      <span
                        className={
                          habit.is_completed
                            ? "text-green-400 text-sm"
                            : "text-gray-400 text-sm"
                        }
                      >
                        {habit.is_completed ? "완료" : "미완료"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Habit Form Modal */}
        {showHabitForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">
                {editingHabit ? "습관 수정" : "새 습관 추가"}
              </h3>
              <form onSubmit={handleSubmitHabit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    습관 이름
                  </label>
                  <input
                    type="text"
                    value={habitForm.name}
                    onChange={(e) =>
                      setHabitForm({ ...habitForm, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="예: 매일 운동하기"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    카테고리
                  </label>
                  <select
                    value={habitForm.category}
                    onChange={(e) =>
                      setHabitForm({
                        ...habitForm,
                        category: e.target.value as HabitCategory,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="health">건강</option>
                    <option value="study">공부</option>
                    <option value="exercise">운동</option>
                    <option value="life">생활</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    난이도
                  </label>
                  <select
                    value={habitForm.difficulty}
                    onChange={(e) =>
                      setHabitForm({
                        ...habitForm,
                        difficulty: e.target.value as HabitDifficulty,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="easy">쉬움 (5골드, 10EXP)</option>
                    <option value="medium">보통 (10골드, 20EXP)</option>
                    <option value="hard">어려움 (20골드, 30EXP)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    {editingHabit ? "수정" : "추가"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHabitForm(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
