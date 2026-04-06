"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BossCard from './BossCard';
import DamageNumber from './DamageNumber';
import VictoryScreen from './VictoryScreen';
import SkillBar from './SkillBar';
import ManaBar from './ManaBar';
import BuffIndicator from './BuffIndicator';
import { useSoundEffect } from '../sound/useSoundEffect';

interface Boss {
  id: string;
  name: string;
  level: number;
  hp: number;
  attack: number;
}

interface Character {
  id: string;
  hp: number;
  max_hp: number;
  mana: number;
  max_mana: number;
}

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

interface Buff {
  type: string;
  value: number;
  duration: number;
  source: string;
}

interface BattleState {
  battle_id: string;
  status: string;
  current_turn: number;
  player_hp: number;
  player_max_hp: number;
  player_mana: number;
  player_max_mana: number;
  player_buffs: Buff[];
  boss_hp: number;
  boss_max_hp: number;
  boss_name: string;
  boss_buffs: Buff[];
  available_skills: CharacterSkill[];
  cooldowns: Record<string, number>;
}

interface BattleScreenProps {
  boss: Boss;
  character: Character;
  battleId: string;
  onBattleEnd: (victory: boolean) => void;
}

export default function BattleScreen({
  boss,
  character,
  battleId,
  onBattleEnd
}: BattleScreenProps) {
  const { playSound } = useSoundEffect();

  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [showDamage, setShowDamage] = useState<{
    damage: number;
    isCrit: boolean;
    isPlayerAttack: boolean;
  } | null>(null);
  const [battleEnded, setBattleEnded] = useState(false);
  const [victory, setVictory] = useState(false);
  const [rewards, setRewards] = useState<any>(null);

  // 전투 상태 로드
  useEffect(() => {
    fetchBattleState();
  }, [battleId]);

  const fetchBattleState = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/boss/battles/${battleId}/state`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch battle state');

      const state = await response.json();
      setBattleState(state);
      setLoading(false);
    } catch (error) {
      console.error('Battle state fetch error:', error);
      alert('전투 상태를 불러올 수 없습니다.');
    }
  };

  // 스킬 사용
  const useSkill = async (skillId: string) => {
    if (animating || !battleState || battleState.status !== 'active') return;

    setAnimating(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/boss/battles/${battleId}/action`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ skill_id: skillId })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Skill use failed');
      }

      const result = await response.json();

      if (!result.success) {
        alert(result.error || '스킬을 사용할 수 없습니다.');
        setAnimating(false);
        return;
      }

      // 플레이어 턴 애니메이션
      await animateTurn(result.player_turn, 'player');

      // 보스 턴 애니메이션
      if (result.boss_turn) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await animateTurn(result.boss_turn, 'boss');
      }

      // 상태 업데이트
      setBattleState(result.battle_state);

      // 전투 종료 확인
      if (result.battle_state.status === 'victory') {
        playSound('victory');
        setTimeout(() => {
          setBattleEnded(true);
          setVictory(true);
          fetchRewards();
        }, 1000);
      } else if (result.battle_state.status === 'defeat') {
        playSound('boss_appear');
        setTimeout(() => {
          setBattleEnded(true);
          setVictory(false);
        }, 1000);
      }

      setAnimating(false);
    } catch (error) {
      console.error('Skill use error:', error);
      alert(error instanceof Error ? error.message : '스킬 사용 실패');
      setAnimating(false);
    }
  };

  // 턴 애니메이션
  const animateTurn = async (turn: any, actor: 'player' | 'boss') => {
    return new Promise<void>((resolve) => {
      // 데미지 숫자 표시
      setShowDamage({
        damage: turn.damage,
        isCrit: turn.is_crit,
        isPlayerAttack: actor === 'player'
      });

      // 효과음 재생
      playSound(actor === 'player' ? 'attack' : 'boss_appear');

      // 전투 로그 추가
      const logMessage = actor === 'player'
        ? `플레이어 공격! ${turn.damage} 데미지${turn.is_crit ? ' (크리티컬!)' : ''}`
        : `보스 공격! ${turn.damage} 데미지`;

      setBattleLog(prev => [...prev, logMessage].slice(-10)); // 최근 10개만 유지

      // 데미지 숫자 숨기기
      setTimeout(() => {
        setShowDamage(null);
        resolve();
      }, 1000);
    });
  };

  // 보상 가져오기
  const fetchRewards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/boss/battles/${battleId}/claim`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.warn('Reward claim issue:', error);
        return;
      }

      const result = await response.json();
      setRewards(result.rewards);
    } catch (error) {
      console.error('Reward fetch error:', error);
    }
  };

  const handleClaimReward = () => {
    onBattleEnd(true);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-red-900 to-black flex items-center justify-center">
        <div className="text-white text-2xl">전투 준비 중...</div>
      </div>
    );
  }

  if (!battleState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-red-900 to-black flex items-center justify-center">
        <div className="text-white text-2xl">전투 상태를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-red-900 to-black p-6 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* 보스 카드 */}
        <div className="mb-4">
          <BossCard
            name={battleState.boss_name}
            level={boss.level}
            currentHp={battleState.boss_hp}
            maxHp={battleState.boss_max_hp}
          />
          {/* 보스 버프 */}
          {battleState.boss_buffs.length > 0 && (
            <div className="mt-2">
              <BuffIndicator buffs={battleState.boss_buffs} target="boss" />
            </div>
          )}
        </div>

        {/* 전투 영역 (데미지 숫자 표시) */}
        <div className="relative h-32 mb-4">
          <AnimatePresence>
            {showDamage && (
              <DamageNumber
                damage={showDamage.damage}
                isCrit={showDamage.isCrit}
                isPlayerAttack={showDamage.isPlayerAttack}
              />
            )}
          </AnimatePresence>
        </div>

        {/* 전투 로그 */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 mb-4 h-32 overflow-y-auto border-2 border-gray-700">
          <h3 className="text-white font-bold text-sm mb-2">전투 로그</h3>
          <div className="space-y-1">
            {battleLog.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-gray-300 text-xs"
              >
                • {log}
              </motion.div>
            ))}
          </div>
        </div>

        {/* 플레이어 상태 */}
        <div className="bg-gray-800 rounded-xl p-4 border-2 border-blue-500 mb-4">
          {/* 플레이어 버프 */}
          {battleState.player_buffs.length > 0 && (
            <BuffIndicator buffs={battleState.player_buffs} target="player" />
          )}

          {/* HP 바 */}
          <div className="mb-3">
            <div className="flex justify-between text-white text-sm mb-1">
              <span className="font-bold">플레이어 HP</span>
              <span>{battleState.player_hp} / {battleState.player_max_hp}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                initial={{ width: '100%' }}
                animate={{
                  width: `${Math.max(0, (battleState.player_hp / battleState.player_max_hp) * 100)}%`
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* 마나 바 */}
          <ManaBar
            current={battleState.player_mana}
            max={battleState.player_max_mana}
          />
        </div>

        {/* 턴 정보 */}
        <div className="text-center text-white text-sm mb-4">
          턴 {battleState.current_turn}
        </div>
      </div>

      {/* 스킬 바 */}
      <SkillBar
        skills={battleState.available_skills}
        currentMana={battleState.player_mana}
        maxMana={battleState.player_max_mana}
        onSkillSelect={useSkill}
        disabled={animating || battleState.status !== 'active'}
      />

      {/* 승리/패배 화면 */}
      {battleEnded && (
        <VictoryScreen
          victory={victory}
          rewards={rewards}
          onClaim={handleClaimReward}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
