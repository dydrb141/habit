"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { apiClient } from "@/app/lib/api-client";
import ProgressBar from "@/app/components/animations/ProgressBar";
import type { Character } from "@/app/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, character, refreshCharacter, logout } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  // character가 로드되면 이름 동기화
  useEffect(() => {
    if (character?.name) {
      setNewName(character.name);
    }
  }, [character]);

  const handleUpdateName = async () => {
    if (!newName.trim()) return;

    try {
      await apiClient.patch("/api/v1/character/", { name: newName.trim() });
      await refreshCharacter();
      setEditingName(false);
    } catch (err) {
      alert("이름 변경에 실패했습니다.");
    }
  };

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">캐릭터 정보를 불러오는 중...</div>
      </div>
    );
  }

  const hpPercentage = (character.hp / character.max_hp) * 100;
  const expPercentage = (character.exp / character.max_exp) * 100;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">나의 캐릭터</h1>
          {user && (
            <p className="text-gray-400 mt-1">
              👤 {user.nickname}님 환영합니다
            </p>
          )}
        </div>

        {/* Character Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          {/* Character Name */}
          <div className="mb-6">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="캐릭터 이름을 입력하세요"
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  maxLength={50}
                />
                <button
                  onClick={handleUpdateName}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNewName(character.name || "");
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                onClick={() => setEditingName(true)}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-700 p-3 rounded-lg transition"
              >
                <h2 className="text-2xl font-bold text-white">
                  {character.name || "캐릭터 이름을 설정하세요"}
                </h2>
                <span className="text-gray-400 text-sm">✏️ 편집</span>
              </div>
            )}
          </div>

          {/* Level Badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-full font-bold text-xl">
              레벨 {character.level}
            </div>
            <div className="text-gray-400 text-sm">전사</div>
          </div>

          {/* HP Bar */}
          <div className="mb-6">
            <ProgressBar
              current={character.hp}
              max={character.max_hp}
              label="❤️ HP"
              color="bg-gradient-to-r from-red-500 to-pink-500"
              animate={false}
            />
          </div>

          {/* EXP Bar */}
          <div className="mb-8">
            <ProgressBar
              current={character.exp}
              max={character.max_exp}
              label="⭐ EXP"
              color="bg-gradient-to-r from-blue-500 to-cyan-500"
              animate={false}
            />
          </div>

          {/* Currency */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-700 rounded-xl p-4 flex items-center justify-between">
              <span className="text-yellow-400 font-medium">💰 골드</span>
              <span className="text-white text-xl font-bold">
                {character.gold}
              </span>
            </div>
            <div className="bg-gray-700 rounded-xl p-4 flex items-center justify-between">
              <span className="text-purple-400 font-medium">💎 보석</span>
              <span className="text-white text-xl font-bold">
                {character.gems}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">스탯</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-xl p-4">
                <div className="text-red-400 text-sm mb-1">⚔️ 힘</div>
                <div className="text-white text-2xl font-bold">
                  {character.stats.strength}
                </div>
              </div>
              <div className="bg-gray-700 rounded-xl p-4">
                <div className="text-blue-400 text-sm mb-1">🧠 지능</div>
                <div className="text-white text-2xl font-bold">
                  {character.stats.intelligence}
                </div>
              </div>
              <div className="bg-gray-700 rounded-xl p-4">
                <div className="text-green-400 text-sm mb-1">❤️ 체력</div>
                <div className="text-white text-2xl font-bold">
                  {character.stats.vitality}
                </div>
              </div>
              <div className="bg-gray-700 rounded-xl p-4">
                <div className="text-yellow-400 text-sm mb-1">🍀 행운</div>
                <div className="text-white text-2xl font-bold">
                  {character.stats.luck}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
