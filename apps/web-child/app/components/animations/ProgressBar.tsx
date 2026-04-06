"use client";

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  label: string;
  color?: string;
  animate?: boolean;
}

export default function ProgressBar({
  current,
  max,
  label,
  color = 'bg-green-500',
  animate: shouldAnimate = true
}: ProgressBarProps) {
  const progress = useMotionValue(0);
  const width = useTransform(progress, (v) => `${v}%`);

  useEffect(() => {
    // max가 0이면 0%로 설정 (0으로 나누기 방지)
    const targetProgress = max > 0 ? Math.min((current / max) * 100, 100) : 0;

    if (shouldAnimate) {
      const controls = animate(progress, targetProgress, {
        duration: 1,
        ease: 'easeOut'
      });
      return controls.stop;
    } else {
      progress.set(targetProgress);
    }
  }, [current, max, progress, shouldAnimate]);

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-gray-600">
          {current} / {max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full relative`}
          style={{ width }}
        >
          {/* 펄스 효과 */}
          <motion.div
            className="absolute inset-0 bg-white opacity-30"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
