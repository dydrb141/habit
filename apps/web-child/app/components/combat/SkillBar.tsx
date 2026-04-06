"use client";

import { motion } from 'framer-motion';
import SkillButton from './SkillButton';

interface Skill {
  id: string;
  skill_code: string;
  name: string;
  description: string;
  mana_cost: number;
  cooldown_turns: number;
  damage_multiplier: number;
  animation_type?: string;
}

interface CharacterSkill {
  id: string;
  skill: Skill;
  can_use: boolean;
  current_cooldown: number;
  reason?: string;
}

interface SkillBarProps {
  skills: CharacterSkill[];
  currentMana: number;
  maxMana: number;
  onSkillSelect: (skillId: string) => void;
  disabled: boolean;
}

export default function SkillBar({
  skills,
  currentMana,
  maxMana,
  onSkillSelect,
  disabled
}: SkillBarProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, delay: 0.3 }}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40"
    >
      <div className="bg-gradient-to-t from-gray-900 via-gray-800 to-transparent rounded-2xl p-4 border-2 border-purple-500 shadow-2xl backdrop-blur-sm">
        {/* Mana Display */}
        <div className="mb-3 text-center">
          <div className="text-sm text-gray-300 mb-1">마나</div>
          <div className="flex items-center justify-center gap-2">
            <div className="text-blue-400 font-bold text-lg">
              💧 {currentMana} / {maxMana}
            </div>
            <div className="w-32 bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                initial={{ width: '100%' }}
                animate={{ width: `${(currentMana / maxMana) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Skill Buttons */}
        <div className="flex gap-2">
          {skills.length === 0 ? (
            <div className="text-gray-400 text-sm px-4 py-2">
              스킬이 없습니다. 레벨업하여 새 스킬을 획득하세요!
            </div>
          ) : (
            skills.map((charSkill) => (
              <SkillButton
                key={charSkill.id}
                skill={charSkill.skill}
                isUsable={charSkill.can_use}
                currentCooldown={charSkill.current_cooldown}
                onClick={() => onSkillSelect(charSkill.skill.id)}
                disabled={disabled}
                reason={charSkill.reason}
              />
            ))
          )}
        </div>

        {/* Status hint */}
        {disabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-center text-yellow-400 text-xs"
          >
            전투가 진행중입니다...
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
