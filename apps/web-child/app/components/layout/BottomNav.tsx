"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  hasBossAvailable?: boolean;
}

export default function BottomNav({ hasBossAvailable = false }: BottomNavProps) {
  const pathname = usePathname();

  const tabs = [
    { path: "/quests", icon: "⚔️", label: "퀘스트" },
    { path: "/dashboard", icon: "👤", label: "캐릭터" },
    { path: "/battle", icon: "🎯", label: "전투", badge: hasBossAvailable },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 safe-area-inset-bottom z-50">
      <div className="flex justify-around py-3 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;

          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? "text-purple-400 bg-purple-900/30"
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              <span className="text-2xl relative">
                {tab.icon}
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                  </span>
                )}
              </span>
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
