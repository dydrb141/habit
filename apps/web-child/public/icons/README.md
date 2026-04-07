# PWA 아이콘 생성 가이드

PWA를 완성하려면 다양한 크기의 아이콘이 필요합니다.

## 필요한 아이콘 크기

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png (필수)
- icon-384x384.png
- icon-512x512.png (필수)

## 아이콘 생성 방법

### 옵션 1: 온라인 도구 사용
1. https://www.pwabuilder.com/ 방문
2. 512x512px 원본 이미지 업로드
3. 모든 크기 자동 생성 및 다운로드

### 옵션 2: 로고 제작 도구
1. https://www.canva.com/ 또는 Figma 사용
2. 512x512px 캔버스에 로고 디자인
3. PNG로 내보내기
4. 온라인 리사이저로 모든 크기 생성

### 옵션 3: 임시 아이콘 (개발용)
빠른 테스트를 위해 단색 배경 + 이모지 조합:
```bash
# ImageMagick 설치 후:
convert -size 512x512 xc:'#8b5cf6' \
  -gravity center -pointsize 300 \
  -fill white -annotate +0+0 '⚔️' \
  icon-512x512.png
```

## 디자인 가이드라인

- **배경색**: #8b5cf6 (보라색, 테마 색상)
- **주요 아이콘**: 검, 방패, 왕관 등 RPG 테마
- **Safe Zone**: 중앙 80% 영역에 주요 내용 배치
- **투명도**: 불투명 배경 사용 (maskable 지원)

## 현재 상태

⚠️ **아이콘 파일이 아직 생성되지 않았습니다!**

위 방법 중 하나를 선택하여 아이콘을 생성하고 이 디렉토리에 저장하세요.
