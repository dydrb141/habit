"use client";

import { motion } from "framer-motion";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export default function StreakBadge({ streak, size = "md" }: StreakBadgeProps) {
  const sizeClasses = {
    sm: "text-sm px-2 py-1",
    md: "text-base px-3 py-2",
    lg: "text-2xl px-6 py-3",
  };

  const iconSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-4xl",
  };

  // Different colors based on streak length
  const getStreakColor = (days: number) => {
    if (days === 0) return "from-gray-600 to-gray-700";
    if (days < 7) return "from-green-600 to-emerald-600";
    if (days < 30) return "from-blue-600 to-cyan-600";
    if (days < 100) return "from-purple-600 to-pink-600";
    return "from-yellow-500 to-orange-500"; // 100+ days
  };

  const getStreakLabel = (days: number) => {
    if (days === 0) return "시작하세요!";
    if (days === 1) return "첫 날!";
    if (days < 7) return "좋아요!";
    if (days === 7) return "1주일!";
    if (days < 30) return "멋져요!";
    if (days === 30) return "1개월!";
    if (days < 100) return "대단해요!";
    return "전설!";
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        bg-gradient-to-r ${getStreakColor(streak)}
        ${sizeClasses[size]}
        rounded-full
        font-bold
        text-white
        flex
        items-center
        gap-2
        shadow-lg
      `}
    >
      <span className={iconSizes[size]}>🔥</span>
      <div className="flex flex-col items-start">
        <span className="leading-tight">{streak}일</span>
        {size !== "sm" && (
          <span className="text-xs opacity-90 leading-tight">
            {getStreakLabel(streak)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
