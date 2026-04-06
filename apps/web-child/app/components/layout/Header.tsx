"use client";

import { useAuth } from "@/app/contexts/AuthContext";

export default function Header() {
  const { character } = useAuth();

  if (!character) return null;

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
      {/* Level Badge */}
      <div className="flex items-center gap-2">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          Lv {character.level}
        </div>
        <span className="text-gray-300 text-sm font-medium">
          {character.name || "영웅"}
        </span>
      </div>

      {/* Currency */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-yellow-400 text-lg">💰</span>
          <span className="text-white text-sm font-bold">{character.gold}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-purple-400 text-lg">💎</span>
          <span className="text-white text-sm font-bold">{character.gems}</span>
        </div>
      </div>
    </div>
  );
}
