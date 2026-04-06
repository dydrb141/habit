"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Confetti from './Confetti';
import { useSoundEffect } from '../sound/useSoundEffect';

interface StatIncrease {
  strength?: number;
  intelligence?: number;
  charisma?: number;
  luck?: number;
}

interface LevelUpModalProps {
  show: boolean;
  newLevel: number;
  statIncreases: StatIncrease;
  onClose?: () => void;
}

export default function LevelUpModal({
  show,
  newLevel,
  statIncreases,
  onClose
}: LevelUpModalProps) {
  const [isVisible, setIsVisible] = useState(show);
  const { playSound } = useSoundEffect();

  useEffect(() => {
    setIsVisible(show);

    if (show) {
      // 레벨업 효과음 재생
      playSound('levelup');

      // 3초 후 자동 닫힘
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, playSound, onClose]);

  const statEmojis: Record<keyof StatIncrease, string> = {
    strength: '💪',
    intelligence: '🧠',
    charisma: '✨',
    luck: '🍀'
  };

  const statNames: Record<keyof StatIncrease, string> = {
    strength: '힘',
    intelligence: '지능',
    charisma: '매력',
    luck: '행운'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
          >
            {/* 레벨업 카드 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{
                type: 'spring',
                damping: 15,
                stiffness: 200
              }}
              className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-8 rounded-2xl shadow-2xl text-white max-w-md w-full mx-4"
            >
              {/* 레벨업 텍스트 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center mb-6"
              >
                <h2 className="text-6xl font-bold mb-2">🎉</h2>
                <h1 className="text-5xl font-black mb-2">레벨 업!</h1>
                <div className="text-3xl font-bold">
                  레벨 {newLevel}
                </div>
              </motion.div>

              {/* 스탯 증가 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                {Object.entries(statIncreases).map(([stat, increase]) => (
                  increase ? (
                    <motion.div
                      key={stat}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {statEmojis[stat as keyof StatIncrease]}
                        </span>
                        <span className="font-semibold">
                          {statNames[stat as keyof StatIncrease]}
                        </span>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.3, 1] }}
                        transition={{ delay: 0.7 }}
                        className="text-2xl font-bold text-yellow-300"
                      >
                        +{increase}
                      </motion.div>
                    </motion.div>
                  ) : null
                ))}
              </motion.div>

              {/* 닫기 안내 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="text-center mt-6 text-sm text-white/70"
              >
                자동으로 닫힙니다...
              </motion.p>
            </motion.div>
          </motion.div>

          {/* 색종이 효과 */}
          <Confetti trigger={isVisible} duration={3000} particleCount={200} />
        </>
      )}
    </AnimatePresence>
  );
}
