"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Confetti from '../animations/Confetti';
import { useSoundEffect } from '../sound/useSoundEffect';

interface Skill {
  id: string;
  skill_code: string;
  name: string;
  description: string;
  mana_cost: number;
  cooldown_turns: number;
  damage_multiplier: number;
  unlock_level: number;
}

interface SkillUnlockModalProps {
  show: boolean;
  skills: Skill[];
  onClose?: () => void;
}

export default function SkillUnlockModal({
  show,
  skills,
  onClose
}: SkillUnlockModalProps) {
  const [isVisible, setIsVisible] = useState(show);
  const { playSound } = useSoundEffect();

  useEffect(() => {
    setIsVisible(show);

    if (show && skills.length > 0) {
      // 스킬 언락 효과음 재생
      playSound('levelup');

      // 4초 후 자동 닫힘
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, skills, playSound, onClose]);

  if (!skills || skills.length === 0) return null;

  const getSkillIcon = (skillCode: string) => {
    const iconMap: Record<string, string> = {
      'basic_attack': '⚔️',
      'defend': '🛡️',
      'power_strike': '💥',
      'whirlwind': '🌪️',
      'battle_cry': '📣',
      'execute': '⚡',
      'fireball': '🔥',
      'ice_lance': '❄️',
      'mana_surge': '💎',
      'meteor': '☄️'
    };
    return iconMap[skillCode] || '✨';
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
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
          >
            {/* 스킬 언락 카드 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{
                type: 'spring',
                damping: 15,
                stiffness: 200
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 rounded-2xl shadow-2xl text-white max-w-lg w-full mx-4"
            >
              {/* 헤더 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center mb-6"
              >
                <h2 className="text-6xl font-bold mb-2">🎊</h2>
                <h1 className="text-4xl font-black mb-2">새로운 스킬!</h1>
                <p className="text-lg opacity-90">
                  {skills.length}개의 스킬을 획득했습니다!
                </p>
              </motion.div>

              {/* 스킬 목록 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                {skills.map((skill, index) => (
                  <motion.div
                    key={skill.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="bg-white/20 backdrop-blur-sm rounded-xl p-4"
                  >
                    {/* 스킬 헤더 */}
                    <div className="flex items-center gap-3 mb-2">
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{
                          duration: 0.5,
                          delay: 0.8 + index * 0.1
                        }}
                        className="text-4xl"
                      >
                        {getSkillIcon(skill.skill_code)}
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{skill.name}</h3>
                        <p className="text-sm opacity-80">{skill.description}</p>
                      </div>
                    </div>

                    {/* 스킬 정보 */}
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      {skill.mana_cost > 0 && (
                        <div className="flex items-center gap-1">
                          <span>💧</span>
                          <span>{skill.mana_cost} 마나</span>
                        </div>
                      )}
                      {skill.cooldown_turns > 0 && (
                        <div className="flex items-center gap-1">
                          <span>⏱️</span>
                          <span>{skill.cooldown_turns}턴 쿨다운</span>
                        </div>
                      )}
                      {skill.damage_multiplier > 0 && (
                        <div className="flex items-center gap-1">
                          <span>⚔️</span>
                          <span>{(skill.damage_multiplier * 100).toFixed(0)}% 데미지</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* 닫기 버튼 */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => {
                  setIsVisible(false);
                  onClose?.();
                }}
                className="w-full mt-6 bg-white/30 hover:bg-white/40 backdrop-blur-sm rounded-lg px-6 py-3 font-bold transition-all"
              >
                확인했어요!
              </motion.button>

              {/* 자동 닫힘 안내 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="text-center mt-4 text-sm text-white/70"
              >
                자동으로 닫힙니다...
              </motion.p>
            </motion.div>
          </motion.div>

          {/* 색종이 효과 */}
          <Confetti trigger={isVisible} duration={4000} particleCount={150} />
        </>
      )}
    </AnimatePresence>
  );
}
