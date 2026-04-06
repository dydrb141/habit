"use client";

import { motion } from 'framer-motion';
import { useState } from 'react';

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

interface SkillButtonProps {
  skill: Skill;
  isUsable: boolean;
  currentCooldown: number;
  onClick: () => void;
  disabled: boolean;
  reason?: string;
}

export default function SkillButton({
  skill,
  isUsable,
  currentCooldown,
  onClick,
  disabled,
  reason
}: SkillButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    if (isUsable && !disabled) {
      onClick();
    }
  };

  const getSkillColor = () => {
    if (!isUsable || disabled) return 'from-gray-600 to-gray-800';
    if (skill.mana_cost === 0) return 'from-gray-500 to-gray-700';
    if (skill.mana_cost < 20) return 'from-blue-600 to-blue-800';
    if (skill.mana_cost < 40) return 'from-purple-600 to-purple-800';
    return 'from-orange-600 to-orange-800';
  };

  const getSkillIcon = () => {
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
    return iconMap[skill.skill_code] || '✨';
  };

  return (
    <div className="relative">
      <motion.button
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        onClick={handleClick}
        disabled={!isUsable || disabled}
        whileHover={isUsable && !disabled ? { scale: 1.05 } : {}}
        whileTap={isUsable && !disabled ? { scale: 0.95 } : {}}
        className={`
          relative w-20 h-20 rounded-xl
          bg-gradient-to-br ${getSkillColor()}
          border-2 ${isUsable && !disabled ? 'border-yellow-400' : 'border-gray-600'}
          shadow-lg
          flex flex-col items-center justify-center
          transition-all duration-200
          ${!isUsable || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'}
        `}
      >
        {/* Skill Icon */}
        <div className="text-3xl mb-1">{getSkillIcon()}</div>

        {/* Mana Cost */}
        {skill.mana_cost > 0 && (
          <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            {skill.mana_cost}
          </div>
        )}

        {/* Cooldown Overlay */}
        {currentCooldown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black bg-opacity-70 rounded-xl flex items-center justify-center"
          >
            <div className="text-white text-2xl font-bold">{currentCooldown}</div>
          </motion.div>
        )}

        {/* Hotkey hint (if any) */}
        {skill.mana_cost === 0 && (
          <div className="absolute bottom-1 left-1 text-white text-xs opacity-50">1</div>
        )}
      </motion.button>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
        >
          <div className="bg-gray-900 text-white rounded-lg p-3 shadow-2xl border border-gray-700 min-w-[200px]">
            <div className="font-bold text-yellow-400 mb-1">{skill.name}</div>
            <div className="text-xs text-gray-300 mb-2">{skill.description}</div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {skill.mana_cost > 0 && (
                  <span className="text-blue-400">💧 {skill.mana_cost}</span>
                )}
                {skill.cooldown_turns > 0 && (
                  <span className="text-purple-400">⏱️ {skill.cooldown_turns}턴</span>
                )}
              </div>
              <span className="text-orange-400">{(skill.damage_multiplier * 100).toFixed(0)}%</span>
            </div>

            {!isUsable && reason && (
              <div className="mt-2 pt-2 border-t border-gray-700 text-red-400 text-xs">
                {reason}
              </div>
            )}

            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="border-8 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
