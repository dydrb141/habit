"use client";

import { motion } from "framer-motion";

interface DayData {
  date: string;
  total_habits: number;
  completed: number;
  completion_rate: number;
}

interface CompletionCalendarProps {
  history: DayData[];
}

export default function CompletionCalendar({ history }: CompletionCalendarProps) {
  const getColorForRate = (rate: number) => {
    if (rate === 0) return "bg-gray-700";
    if (rate < 30) return "bg-red-800";
    if (rate < 60) return "bg-orange-700";
    if (rate < 90) return "bg-yellow-600";
    return "bg-green-500";
  };

  const getIntensity = (rate: number) => {
    if (rate === 0) return "opacity-30";
    if (rate < 50) return "opacity-50";
    if (rate < 75) return "opacity-75";
    return "opacity-100";
  };

  // Group by weeks
  const weeks: DayData[][] = [];
  for (let i = 0; i < history.length; i += 7) {
    weeks.push(history.slice(i, i + 7));
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4">📅 완료 히스토리</h3>

      <div className="space-y-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-2">
            {week.map((day, dayIndex) => {
              const date = new Date(day.date);
              const dayOfWeek = date.toLocaleDateString("ko-KR", {
                weekday: "short",
              });

              return (
                <motion.div
                  key={dayIndex}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.02 }}
                  className="relative group flex-1"
                >
                  <div
                    className={`
                      ${getColorForRate(day.completion_rate)}
                      ${getIntensity(day.completion_rate)}
                      aspect-square
                      rounded-lg
                      flex
                      flex-col
                      items-center
                      justify-center
                      cursor-pointer
                      hover:scale-110
                      transition-transform
                    `}
                  >
                    <span className="text-xs text-white font-semibold">
                      {dayOfWeek}
                    </span>
                    <span className="text-xs text-white">
                      {Math.round(day.completion_rate)}%
                    </span>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl whitespace-nowrap border border-gray-700">
                      <div className="font-semibold mb-1">
                        {date.toLocaleDateString("ko-KR")}
                      </div>
                      <div className="text-gray-300">
                        완료: {day.completed}/{day.total_habits}
                      </div>
                      <div className="text-gray-300">
                        달성률: {day.completion_rate}%
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
        <span>적음</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-gray-700 opacity-30"></div>
          <div className="w-4 h-4 rounded bg-red-800 opacity-50"></div>
          <div className="w-4 h-4 rounded bg-orange-700 opacity-75"></div>
          <div className="w-4 h-4 rounded bg-yellow-600 opacity-100"></div>
          <div className="w-4 h-4 rounded bg-green-500 opacity-100"></div>
        </div>
        <span>많음</span>
      </div>
    </div>
  );
}
