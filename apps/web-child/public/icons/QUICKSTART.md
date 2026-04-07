# 빠른 아이콘 생성 가이드

## 🚀 가장 빠른 방법 (5분)

### 1. PWA Builder 사용 (추천)

1. **https://www.pwabuilder.com/imageGenerator** 방문
2. 업로드할 이미지 준비:
   - 간단한 방법: 이모지 스크린샷 (⚔️ 또는 🎮)
   - 디자인 툴: Canva에서 512x512px 정사각형 만들기
   - 배경색: #8b5cf6 (보라색)
3. 이미지 업로드
4. 모든 크기의 아이콘 자동 생성 및 다운로드
5. 다운로드한 파일을 이 디렉토리에 복사

### 2. Favicon Generator 사용

1. **https://favicon.io/favicon-converter/** 방문
2. 이미지 업로드 (최소 512x512px)
3. PWA 크기 포함하여 생성
4. 다운로드 후 이름 변경:
   - android-chrome-192x192.png → icon-192x192.png
   - android-chrome-512x512.png → icon-512x512.png

### 3. 로컬에서 생성 (ImageMagick 있을 경우)

```bash
# ImageMagick 설치
brew install imagemagick

# 아이콘 생성 스크립트 실행
./generate-icons.sh
```

## 📋 필요한 아이콘 목록

체크리스트:
- [ ] icon-72x72.png
- [ ] icon-96x96.png
- [ ] icon-128x128.png
- [ ] icon-144x144.png
- [ ] icon-152x152.png
- [ ] icon-192x192.png ⭐ (필수)
- [ ] icon-384x384.png
- [ ] icon-512x512.png ⭐ (필수)

## ⚡ 임시 테스트용 (개발 단계)

개발 중에는 아이콘이 없어도 PWA가 작동합니다!
단, 실제 배포 전에는 반드시 추가해야 합니다.

## 🎨 디자인 권장사항

- **주제**: RPG, 게임, 모험 (검, 방패, 왕관 등)
- **색상**: 보라색 (#8b5cf6) 배경 권장
- **스타일**: 단순하고 인식하기 쉬운 아이콘
- **Safe Zone**: 중앙 80% 영역에 주요 요소 배치

## 현재 상태

⚠️ **아이콘 미생성 상태**

PWA 기능은 활성화되었지만,
앱 설치 시 기본 아이콘이 표시됩니다.

위 방법 중 하나로 아이콘을 생성해주세요!
