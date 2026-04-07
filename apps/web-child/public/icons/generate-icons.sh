#!/bin/bash
# PWA 아이콘 생성 스크립트
# 실행 전에 ImageMagick 설치 필요: brew install imagemagick

SIZES=(72 96 128 144 152 192 384 512)
SOURCE="../icon.svg"

echo "PWA 아이콘 생성 중..."

for size in "${SIZES[@]}"; do
  OUTPUT="icon-${size}x${size}.png"
  echo "생성: $OUTPUT"
  
  # SVG를 PNG로 변환 (ImageMagick 필요)
  if command -v convert &> /dev/null; then
    convert -background none -resize ${size}x${size} "$SOURCE" "$OUTPUT"
  elif command -v magick &> /dev/null; then
    magick -background none -resize ${size}x${size} "$SOURCE" "$OUTPUT"
  else
    echo "⚠️  ImageMagick이 설치되지 않았습니다."
    echo "    설치 방법: brew install imagemagick"
    echo "    또는 온라인 도구 사용: https://www.pwabuilder.com/"
    exit 1
  fi
done

echo "✅ 아이콘 생성 완료!"
