"use client";

import { Howl } from 'howler';

export type SoundType =
  | 'levelup'
  | 'quest_complete'
  | 'gold'
  | 'exp'
  | 'stat_increase'
  | 'battle_start'
  | 'attack'
  | 'victory'
  | 'boss_appear';

class SoundManagerClass {
  private sounds: Map<SoundType, Howl> = new Map();
  private volume: number = 0.5;
  private muted: boolean = false;
  private initialized: boolean = false;

  // 효과음 파일 매핑
  private soundFiles: Record<SoundType, string> = {
    levelup: '/sounds/levelup.mp3',
    quest_complete: '/sounds/quest_complete.mp3',
    gold: '/sounds/gold.mp3',
    exp: '/sounds/exp.mp3',
    stat_increase: '/sounds/stat_increase.mp3',
    battle_start: '/sounds/battle_start.mp3',
    attack: '/sounds/attack.mp3',
    victory: '/sounds/victory.mp3',
    boss_appear: '/sounds/boss_appear.mp3',
  };

  constructor() {
    // 생성자에서는 초기화하지 않음 (SSR 대응)
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;
    if (this.initialized) return;

    this.initialized = true;
    this.preloadSounds();
  }

  private preloadSounds() {
    Object.entries(this.soundFiles).forEach(([key, src]) => {
      const sound = new Howl({
        src: [src],
        volume: this.volume,
        preload: true,
        html5: true, // 모바일 최적화
        onloaderror: () => {
          console.warn(`Failed to load sound: ${key}`);
        }
      });
      this.sounds.set(key as SoundType, sound);
    });
  }

  play(type: SoundType) {
    this.ensureInitialized();
    if (this.muted) return;

    const sound = this.sounds.get(type);
    if (sound) {
      sound.play();
    } else {
      // 효과음 파일이 없을 때 간단한 비프음 재생 (테스트용)
      this.playBeep(type);
    }
  }

  // 테스트용 비프음 생성
  private playBeep(type: SoundType) {
    if (typeof window === 'undefined') return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // 효과음 타입별 주파수
      const frequencies: Record<SoundType, number> = {
        quest_complete: 800,
        exp: 600,
        gold: 700,
        levelup: 1000,
        stat_increase: 900,
        battle_start: 400,
        attack: 500,
        victory: 1200,
        boss_appear: 300
      };

      oscillator.frequency.value = frequencies[type];
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      console.log(`🔊 효과음 재생: ${type} (테스트 비프음)`);
    } catch (e) {
      console.warn('효과음 재생 실패:', e);
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => sound.volume(this.volume));
  }

  mute() {
    this.muted = true;
  }

  unmute() {
    this.muted = false;
  }

  toggleMute() {
    this.muted = !this.muted;
  }
}

// 싱글톤 인스턴스
export const SoundManager = new SoundManagerClass();
