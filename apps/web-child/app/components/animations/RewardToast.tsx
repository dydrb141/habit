"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface RewardToastProps {
  show: boolean;
  exp: number;
  gold: number;
  onHide?: () => void;
}

export default function RewardToast({ show, exp, gold, onHide }: RewardToastProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);

    if (show) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onHide?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-4">
            <div className="text-2xl">✅</div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1">
                <span className="text-2xl">⭐</span>
                <span className="font-bold text-lg">+{exp} EXP</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-2xl">💰</span>
                <span className="font-bold text-lg">+{gold} 골드</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
