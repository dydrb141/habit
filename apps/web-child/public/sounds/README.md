# 효과음 파일 다운로드 가이드

이 폴더에 9개의 효과음 파일을 추가해야 합니다. 각 파일은 무료로 다운로드할 수 있습니다.

## 필요한 효과음 파일

각 파일명과 추천 사운드는 다음과 같습니다:

1. **levelup.mp3** - 레벨업 팬파레
   - 추천: 밝고 경쾌한 승리 팬파레 사운드

2. **quest_complete.mp3** - 퀘스트 완료
   - 추천: 짧고 긍정적인 "딩!" 소리

3. **gold.mp3** - 골드 획득
   - 추천: 동전 떨어지는 소리

4. **exp.mp3** - 경험치 획득
   - 추천: 반짝이는 마법 소리

5. **stat_increase.mp3** - 스탯 증가
   - 추천: 파워업 효과음

6. **battle_start.mp3** - 전투 시작
   - 추천: 검 뽑는 소리 또는 전투 시작 효과음

7. **attack.mp3** - 공격
   - 추천: 검 휘두르는 소리

8. **victory.mp3** - 승리
   - 추천: 승리 팬파레

9. **boss_appear.mp3** - 보스 출현
   - 추천: 긴장감 있는 출현 효과음

## 무료 효과음 다운로드 사이트

### 1. Freesound.org (추천)
- URL: https://freesound.org/
- 가장 다양하고 고품질의 효과음
- CC0 라이선스 필터 사용 권장
- 회원가입 필요 (무료)

**검색 키워드:**
- levelup: "level up fanfare", "victory fanfare"
- quest_complete: "notification", "achievement ding"
- gold: "coin drop", "coins"
- exp: "sparkle", "magic twinkle"
- stat_increase: "power up", "level up"
- battle_start: "sword unsheath", "battle start"
- attack: "sword swing", "whoosh"
- victory: "victory", "win fanfare"
- boss_appear: "boss appear", "dramatic entrance"

### 2. Mixkit.co
- URL: https://mixkit.co/free-sound-effects/
- 회원가입 불필요
- 모든 사운드 무료 사용 가능
- 카테고리별로 정리되어 있음

### 3. Pixabay Sound Effects
- URL: https://pixabay.com/sound-effects/
- 회원가입 불필요
- CC0 라이선스
- 간단한 인터페이스

### 4. Zapsplat
- URL: https://www.zapsplat.com/
- 무료 회원가입 필요
- 매우 다양한 효과음
- 일일 다운로드 제한 있음

## 파일 최적화

효과음 파일을 다운로드한 후:

1. **파일 크기 최적화**
   - 각 파일을 50KB 이하로 유지 권장
   - 온라인 MP3 압축기 사용: https://www.mp3smaller.com/

2. **길이 조정**
   - 대부분의 효과음은 1-2초 권장
   - levelup, victory, boss_appear는 3-5초 가능
   - 온라인 오디오 편집기: https://audiotrimmer.com/

3. **포맷 변환**
   - MP3 포맷 권장
   - 비트레이트: 128kbps 권장
   - 온라인 변환기: https://online-audio-converter.com/

## 설치 방법

1. 위 사이트에서 9개 효과음 다운로드
2. 파일명을 정확히 맞춰 변경 (예: levelup.mp3)
3. 이 폴더 (`/apps/web-child/public/sounds/`)에 복사
4. 앱을 재시작하여 효과음 확인

## 임시 대안 (테스트용)

효과음 파일이 없어도 앱은 정상 작동합니다. 콘솔에 경고 메시지만 표시됩니다.

실제 효과음 없이 테스트하려면:
- 애니메이션과 UI만 확인 가능
- 효과음은 나중에 추가 가능

## 라이선스 주의사항

- CC0 (Public Domain) 라이선스 권장
- 상업적 사용 가능 여부 확인
- 저작자 표시가 필요한 경우 별도 파일에 기록

## 문제 해결

효과음이 재생되지 않는 경우:

1. **파일 경로 확인**
   ```
   /apps/web-child/public/sounds/levelup.mp3
   ```

2. **브라우저 콘솔 확인**
   - 개발자 도구 → Console 탭
   - 로딩 에러 메시지 확인

3. **파일 포맷 확인**
   - MP3 포맷만 지원
   - 파일 확장자가 정확한지 확인

4. **모바일 테스트**
   - iOS Safari는 첫 사용자 인터랙션 후 재생 가능
   - 자동 재생 정책으로 인해 첫 클릭 후 작동

## 효과음 볼륨 조절

코드에서 볼륨 조절:

```typescript
// SoundManager.tsx에서 기본 볼륨 변경
private volume: number = 0.5; // 0.0 ~ 1.0
```

또는 런타임에 조절:

```typescript
import { SoundManager } from './components/sound/SoundManager';

// 볼륨 50%로 설정
SoundManager.setVolume(0.5);

// 음소거
SoundManager.mute();

// 음소거 해제
SoundManager.unmute();
```
