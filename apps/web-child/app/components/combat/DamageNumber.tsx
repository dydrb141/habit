"use client";

import { motion } from 'framer-motion';

interface DamageNumberProps {
  damage: number;
  isCrit: boolean;
  isPlayerAttack: boolean;
}

export default function DamageNumber({
  damage,
  isCrit,
  isPlayerAttack
}: DamageNumberProps) {
  const color = isPlayerAttack
    ? (isCrit ? 'text-yellow-300' : 'text-white')
    : 'text-red-400';

  const size = isCrit ? 'text-6xl' : 'text-4xl';

  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.5 }}
      animate={{
        y: -100,
        opacity: 0,
        scale: isCrit ? 1.5 : 1
      }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className={`absolute ${color} ${size} font-black pointer-events-none`}
      style={{
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      {isCrit && '💥 '}
      {damage}
      {isCrit && ' CRIT!'}
    </motion.div>
  );
}
