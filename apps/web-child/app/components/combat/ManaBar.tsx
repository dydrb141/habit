"use client";

import { motion } from 'framer-motion';

interface ManaBarProps {
  current: number;
  max: number;
  showLabel?: boolean;
}

export default function ManaBar({
  current,
  max,
  showLabel = true
}: ManaBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-white mb-1">
          <span className="font-medium flex items-center gap-1">
            💧 마나
          </span>
          <span>{current} / {max}</span>
        </div>
      )}
      <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden border-2 border-blue-700">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold relative"
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-white opacity-20"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
          {percentage > 15 && `${Math.round(percentage)}%`}
        </motion.div>
      </div>
    </div>
  );
}
