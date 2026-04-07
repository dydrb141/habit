# 부모 대시보드 완성

Phase 7 완료: 부모가 자녀의 습관을 관리하고 모니터링할 수 있는 완전한 대시보드

## 🎯 구현된 기능

### 1. 자녀 목록 대시보드 (`/dashboard`)
- ✅ 연결된 모든 자녀 표시
- ✅ 각 자녀의 캐릭터 정보 카드
  - 이름, 닉네임, 레벨
  - EXP 진행도 바
  - 골드 & 보석
  - 스탯 미리보기 (힘, 지능, 체력, 행운)
- ✅ 클릭하여 자녀 상세 페이지로 이동
- ✅ 페어링 코드 생성 버튼
- ✅ 로그아웃 기능

### 2. 자녀 상세 페이지 (`/children/[id]`)

#### 📊 개요 탭
**캐릭터 정보**:
- ✅ 레벨 & EXP 진행도
- ✅ HP & Mana 바
- ✅ 골드 & 보석 현황
- ✅ 전체 스탯 (힘, 지능, 체력, 행운)

**오늘의 현황**:
- ✅ 완료한 습관 수 / 전체 습관 수
- ✅ 달성률 (%)
- ✅ 등록된 습관 총 개수

#### ✅ 습관 관리 탭
**습관 목록**:
- ✅ 모든 습관 카드 형식 표시
- ✅ 카테고리 & 난이도 배지
- ✅ 완료/미완료 상태 표시
- ✅ 편집 & 삭제 버튼

**습관 추가/수정**:
- ✅ 모달 폼으로 습관 생성
- ✅ 입력 필드:
  - 습관 이름
  - 카테고리 (건강, 공부, 운동, 생활)
  - 난이도 (쉬움, 보통, 어려움)
- ✅ 수정 모드: 기존 값 자동 채우기
- ✅ 삭제 확인 다이얼로그

### 3. API 클라이언트 (`lib/api-client.ts`)
- ✅ 타입 안전한 HTTP 클라이언트
- ✅ 자동 JWT 토큰 포함
- ✅ 401 오류 시 자동 로그아웃 & 리다이렉트
- ✅ 30초 타임아웃
- ✅ 한국어 에러 메시지
- ✅ GET, POST, PATCH, DELETE 메서드

### 4. 타입 정의 (`types/index.ts`)
- ✅ User, Character, Child 인터페이스
- ✅ Habit, HabitLog, DailyStats 인터페이스
- ✅ HabitCategory, HabitDifficulty 타입

---

## 📖 사용 방법

### 부모 앱 실행
```bash
cd apps/web-parent
npm run dev
```
✅ 실행: http://localhost:3002

### 로그인
1. http://localhost:3002 접속
2. 부모 계정으로 로그인
3. 대시보드로 자동 이동

### 자녀 연결
1. 대시보드에서 "🔗 페어링 코드 생성" 클릭
2. 6자리 코드 복사
3. 자녀 앱에서 코드 입력하여 연결

### 자녀 정보 보기
1. 대시보드에서 자녀 카드 클릭
2. 개요 탭: 캐릭터 정보 & 오늘의 현황
3. 습관 관리 탭: 습관 목록 & 편집

### 습관 관리
**습관 추가**:
1. 습관 관리 탭 → "➕ 새 습관 추가"
2. 이름, 카테고리, 난이도 선택
3. "추가" 클릭

**습관 수정**:
1. 습관 카드에서 ✏️ 클릭
2. 정보 수정
3. "수정" 클릭

**습관 삭제**:
1. 습관 카드에서 🗑️ 클릭
2. 확인 다이얼로그에서 "확인"

---

## 🎨 UI 구성

### 카테고리 색상
- 🏥 건강: 초록색 (`bg-green-600`)
- 📚 공부: 파란색 (`bg-blue-600`)
- 🏋️ 운동: 빨간색 (`bg-red-600`)
- 🏠 생활: 보라색 (`bg-purple-600`)

### 난이도 레이블
- 쉬움: 5골드, 10EXP
- 보통: 10골드, 20EXP
- 어려움: 20골드, 30EXP

---

## 🔧 기술 스택

### Frontend
- **Next.js 15**: App Router, Server Components
- **React 19**: Client Components with hooks
- **TypeScript 5**: 완전한 타입 안전성
- **Tailwind CSS**: 유틸리티 우선 스타일링
- **Framer Motion**: 애니메이션

### API Integration
- **Custom API Client**: 타입 안전한 HTTP 요청
- **JWT Authentication**: localStorage 기반 토큰 관리
- **Error Handling**: 자동 리다이렉트 & 사용자 친화적 메시지

---

## 📊 API 엔드포인트

### 인증
- `POST /api/v1/auth/login` - 로그인
- `GET /api/v1/auth/me` - 현재 사용자 정보

### 가족
- `GET /api/v1/family/children` - 자녀 목록
- `POST /api/v1/family/generate-code` - 페어링 코드 생성

### 습관
- `GET /api/v1/habit/user/{user_id}` - 사용자의 습관 목록
- `POST /api/v1/habit/` - 새 습관 생성
- `PATCH /api/v1/habit/{habit_id}` - 습관 수정
- `DELETE /api/v1/habit/{habit_id}` - 습관 삭제

---

## ✅ 완료된 작업

- [x] API 클라이언트 구현
- [x] 타입 정의
- [x] 자녀 목록 대시보드
- [x] 자녀 상세 페이지
- [x] 개요 탭 (캐릭터 정보, 오늘의 현황)
- [x] 습관 관리 탭
- [x] 습관 추가/수정/삭제
- [x] 빌드 성공
- [x] TypeScript 타입 에러 없음

---

## 🔜 향후 개선 사항

### 리포트 & 분석
- [ ] 주간/월간 습관 완료 그래프
- [ ] 카테고리별 분석
- [ ] 스트릭 추적 (연속 달성 일수)
- [ ] 레벨업 히스토리

### 알림
- [ ] 자녀 레벨업 알림
- [ ] 습관 미완료 알림
- [ ] 보스전 도전 알림

### 소통
- [ ] 자녀에게 메시지 보내기
- [ ] 칭찬 배지/스티커
- [ ] 보상 지급 시스템

### UX 개선
- [ ] 드래그 앤 드롭으로 습관 순서 변경
- [ ] 습관 템플릿 (미리 정의된 습관들)
- [ ] 일괄 습관 생성

---

## 🐛 알려진 이슈

없음

---

## 📝 개발 노트

### 디렉토리 구조
```
apps/web-parent/
├── app/
│   ├── children/
│   │   └── [id]/
│   │       └── page.tsx          # 자녀 상세 페이지
│   ├── components/
│   │   ├── animations/
│   │   │   └── ProgressBar.tsx
│   │   └── PairingModal.tsx
│   ├── dashboard/
│   │   └── page.tsx               # 자녀 목록 대시보드
│   ├── lib/
│   │   └── api-client.ts          # API 클라이언트
│   ├── types/
│   │   └── index.ts               # 타입 정의
│   ├── layout.tsx
│   ├── page.tsx                   # 로그인
│   └── register/
│       └── page.tsx               # 회원가입
└── package.json
```

### 개발 팁
- 자녀 ID는 URL 파라미터로 전달: `/children/[id]`
- API 클라이언트는 싱글톤: `apiClient.get()`, `apiClient.post()`
- 모든 API 요청에 자동으로 JWT 토큰 포함
- 401 오류 시 자동 로그아웃 및 로그인 페이지로 리다이렉트

---

**상태**: ✅ Phase 7 완료
**다음 단계**: Phase 8 - 일일 리셋 시스템
