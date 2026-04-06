"use client";

import { useCallback, useEffect, useState } from 'react';
import { SoundType } from './SoundManager';

export function useSoundEffect() {
  const [soundManager, setSoundManager] = useState<any>(null);

  useEffect(() => {
    // 클라이언트에서만 SoundManager 로드
    import('./SoundManager').then((module) => {
      setSoundManager(module.SoundManager);
    });
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (soundManager) {
      soundManager.play(type);
    }
  }, [soundManager]);

  return { playSound };
}
