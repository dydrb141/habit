"use client";

import { motion, AnimatePresence } from 'framer-motion';

interface Buff {
  type: string;
  value: number;
  duration: number;
  source: string;
}

interface BuffIndicatorProps {
  buffs: Buff[];
  target?: 'player' | 'boss';
}

export default function BuffIndicator({
  buffs,
  target = 'player'
}: BuffIndicatorProps) {
  if (!buffs || buffs.length === 0) return null;

  const getBuffIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'strength': '💪',
      'damage_reduction': '🛡️',
      'speed': '⚡',
      'regeneration': '💚'
    };
    return iconMap[type] || '✨';
  };

  const getBuffColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'strength': 'from-red-500 to-orange-500',
      'damage_reduction': 'from-blue-500 to-cyan-500',
      'speed': 'from-yellow-500 to-amber-500',
      'regeneration': 'from-green-500 to-emerald-500'
    };
    return colorMap[type] || 'from-purple-500 to-pink-500';
  };

  const getBuffName = (type: string) => {
    const nameMap: Record<string, string> = {
      'strength': '공격력 증가',
      'damage_reduction': '피해 감소',
      'speed': '속도 증가',
      'regeneration': '재생'
    };
    return nameMap[type] || type;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      <AnimatePresence>
        {buffs.map((buff, index) => (
          <motion.div
            key={`${buff.type}-${index}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className={`
              relative
              bg-gradient-to-r ${getBuffColor(buff.type)}
              rounded-lg px-3 py-1.5
              border-2 border-white border-opacity-30
              shadow-lg
              flex items-center gap-2
            `}
          >
            {/* Icon */}
            <span className="text-xl">{getBuffIcon(buff.type)}</span>

            {/* Info */}
            <div className="flex flex-col">
              <span className="text-white text-xs font-bold leading-tight">
                {getBuffName(buff.type)}
              </span>
              <span className="text-white text-xs opacity-80 leading-tight">
                {buff.value > 0 && buff.value < 1
                  ? `${(buff.value * 100).toFixed(0)}%`
                  : `+${buff.value}`}
              </span>
            </div>

            {/* Duration badge */}
            <div className="absolute -top-1 -right-1 bg-white text-gray-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-current">
              {buff.duration}
            </div>

            {/* Pulse animation */}
            <motion.div
              className="absolute inset-0 bg-white rounded-lg"
              animate={{
                opacity: [0, 0.2, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
