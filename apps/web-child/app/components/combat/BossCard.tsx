"use client";

import { motion } from 'framer-motion';

interface BossCardProps {
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  sprite?: string;
}

export default function BossCard({
  name,
  level,
  currentHp,
  maxHp,
  sprite
}: BossCardProps) {
  const hpPercentage = Math.max(0, (currentHp / maxHp) * 100);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20 }}
      className="bg-gradient-to-br from-red-900 to-purple-900 rounded-2xl p-6 border-4 border-red-500 shadow-2xl"
    >
      {/* 보스 이름과 레벨 */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-black text-white mb-2">{name}</h2>
        <div className="inline-block bg-red-600 text-white px-4 py-1 rounded-full font-bold">
          레벨 {level}
        </div>
      </div>

      {/* 보스 스프라이트 */}
      <div className="flex justify-center mb-4">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-32 h-32 bg-red-800 rounded-full flex items-center justify-center text-6xl"
        >
          {sprite || '👹'}
        </motion.div>
      </div>

      {/* HP 바 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-white">
          <span className="font-medium">HP</span>
          <span>{currentHp} / {maxHp}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-6 overflow-hidden border-2 border-red-700">
          <motion.div
            className="h-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold"
            initial={{ width: '100%' }}
            animate={{ width: `${hpPercentage}%` }}
            transition={{ duration: 0.5 }}
          >
            {hpPercentage > 10 && `${Math.round(hpPercentage)}%`}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
