"use client";

import { motion } from 'framer-motion';
import Confetti from '../animations/Confetti';

interface VictoryScreenProps {
  victory: boolean;
  rewards?: {
    gold: number;
    exp: number;
    gems: number;
  };
  onClaim?: () => void;
  onRetry?: () => void;
}

export default function VictoryScreen({
  victory,
  rewards,
  onClaim,
  onRetry
}: VictoryScreenProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      {victory && <Confetti trigger={true} duration={5000} />}

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        className={`${
          victory
            ? 'bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500'
            : 'bg-gradient-to-br from-gray-700 to-gray-900'
        } p-8 rounded-2xl shadow-2xl text-white max-w-md w-full mx-4`}
      >
        {/* 결과 텍스트 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <div className="text-7xl mb-4">
            {victory ? '🏆' : '💀'}
          </div>
          <h1 className="text-5xl font-black mb-2">
            {victory ? '승리!' : '패배...'}
          </h1>
          <p className="text-xl">
            {victory
              ? '보스를 물리쳤습니다!'
              : '더 강해져서 돌아오자!'}
          </p>
        </motion.div>

        {/* 승리 보상 */}
        {victory && rewards && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6 space-y-3"
          >
            <h3 className="text-xl font-bold text-center mb-4">보상</h3>
            <div className="flex items-center justify-between">
              <span className="text-lg">💰 골드</span>
              <span className="text-2xl font-bold text-yellow-300">
                +{rewards.gold}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg">⭐ 경험치</span>
              <span className="text-2xl font-bold text-blue-300">
                +{rewards.exp}
              </span>
            </div>
            {rewards.gems > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-lg">💎 보석</span>
                <span className="text-2xl font-bold text-purple-300">
                  +{rewards.gems}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* 버튼 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {victory ? (
            <button
              onClick={onClaim}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition text-xl"
            >
              보상 받기
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={onRetry}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition text-xl"
              >
                다시 도전
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition"
              >
                대시보드로 돌아가기
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
