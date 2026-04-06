"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// BattleScreen을 클라이언트에서만 렌더링
const BattleScreen = dynamic(
  () => import('@/app/components/combat/BattleScreen'),
  { ssr: false }
);

export default function BattlePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const bossId = searchParams.get('boss_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [boss, setBoss] = useState<any>(null);
  const [character, setCharacter] = useState<any>(null);
  const [battleId, setBattleId] = useState<string>('');

  useEffect(() => {
    if (!bossId) {
      setError('보스 ID가 없습니다.');
      setLoading(false);
      return;
    }

    startBattle();
  }, [bossId]);

  const startBattle = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      // 캐릭터 정보 가져오기
      const charResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/character/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!charResponse.ok) throw new Error('Failed to fetch character');
      const charData = await charResponse.json();
      setCharacter(charData);

      // 전투 시작
      const battleResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/boss/${bossId}/start`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!battleResponse.ok) throw new Error('Failed to start battle');
      const battleData = await battleResponse.json();
      setBattleId(battleData.id);

      // 보스 정보 가져오기 (available endpoint에서)
      const bossResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/boss/available`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!bossResponse.ok) throw new Error('Failed to fetch boss');
      const bossAvailableData = await bossResponse.json();

      if (bossAvailableData.available && bossAvailableData.boss) {
        setBoss(bossAvailableData.boss);
      } else {
        throw new Error('Boss not available');
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Battle init error:', err);
      setError(err.message || '전투를 시작할 수 없습니다.');
      setLoading(false);
    }
  };

  const handleBattleEnd = (victory: boolean) => {
    if (victory) {
      // 승리 시 대시보드로
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    }
  };

  // 클라이언트에서 마운트되기 전에는 로딩 화면 표시
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-red-900 to-black">
        <div className="text-white text-2xl">전투 준비 중...</div>
      </div>
    );
  }

  if (error || !boss || !character) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-red-900 to-black">
        <div className="text-center">
          <div className="text-red-400 text-2xl mb-4">
            {error || '데이터를 불러올 수 없습니다.'}
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <BattleScreen
      boss={boss}
      character={character}
      battleId={battleId}
      onBattleEnd={handleBattleEnd}
    />
  );
}
