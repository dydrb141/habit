# 자녀용 PWA 기본 화면 구현 설계서

**작성일**: 2026-04-06
**버전**: 1.0
**목적**: 습관퀘스트 자녀용 PWA MVP 기본 화면 구현을 위한 포괄적인 설계

---

## 📋 목차

1. [현황 분석](#현황-분석)
2. [구현 필요 기능](#구현-필요-기능)
3. [시스템 아키텍처](#시스템-아키텍처)
4. [컴포넌트 설계](#컴포넌트-설계)
5. [API 통합](#api-통합)
6. [상태 관리](#상태-관리)
7. [라우팅 구조](#라우팅-구조)
8. [구현 우선순위](#구현-우선순위)
9. [검증 기준](#검증-기준)

---

## 1. 현황 분석

### ✅ 이미 구현된 기능

#### 페이지
- **로그인 페이지** (`/app/page.tsx`)
  - 이메일/비밀번호 인증
  - JWT 토큰 저장
  - 에러 핸들링

- **대시보드** (`/app/dashboard/page.tsx`)
  - 캐릭터 정보 표시 (레벨, HP, EXP, 골드, 보석, 스탯)
  - 캐릭터 이름 편집
  - 보스 도전 가능 시 알림
  - 퀘스트 페이지 이동

- **퀘스트 페이지** (`/app/quests/page.tsx`)
  - 오늘의 습관 목록 조회
  - 습관 체크 (완료 처리)
  - 새 습관 추가 폼
  - 보상 애니메이션 (RewardToast, LevelUpModal)
  - 효과음 재생

- **전투 페이지** (`/app/battle/page.tsx`)
  - 보스전 UI (추정)

#### 컴포넌트
- **애니메이션**: `RewardToast`, `LevelUpModal`, `ProgressBar`, `Confetti`
- **전투**: `BattleScreen`, `BossCard`, `SkillButton`, `SkillBar`, `DamageNumber`, `BuffIndicator`, `ManaBar`, `VictoryScreen`
- **사운드**: `SoundManager`, `useSoundEffect`
- **캐릭터**: `SkillUnlockModal`

#### 기술 스택
- Next.js 15.1.6 (App Router)
- React 19
- TailwindCSS
- TypeScript
- framer-motion (애니메이션)
- canvas-confetti (축하 효과)
- howler (사운드)

### ❌ 미구현/불완전한 기능

1. **회원가입 페이지 없음**
2. **페어링 코드 입력 페이지 없음** (부모와 연결)
3. **API 클라이언트 유틸리티 없음** (fetch 중복 코드)
4. **인증 토큰 관리 미흡** (localStorage만 사용, 자동 갱신 없음)
5. **에러 바운더리 없음**
6. **로딩 상태 일관성 부족**
7. **환경 변수 설정 미완성**
8. **PWA 설정 없음** (manifest.json, service worker)
9. **상점 페이지 없음**
10. **전투 페이지 구현 검증 필요**
11. **오프라인 지원 없음**
12. **네비게이션 바 없음** (하단 탭)

---

## 2. 구현 필요 기능

### Phase 1: 필수 기능 (MVP)

#### 2.1 인증 시스템 보완

**회원가입 페이지** (`/app/register/page.tsx`)
- 폼 필드:
  - 이메일 (검증: 이메일 형식)
  - 비밀번호 (검증: 최소 8자)
  - 비밀번호 확인
  - 닉네임 (검증: 2-20자)
  - 역할: "child" 고정
- 기능:
  - `POST /api/v1/auth/register` 호출
  - 회원가입 성공 시 자동 로그인
  - 에러 핸들링 (중복 이메일 등)

**페어링 코드 입력 페이지** (`/app/pairing/page.tsx`)
- 6자리 숫자 코드 입력
- `POST /api/v1/auth/pairing/pair` 호출
- 페어링 성공 시 대시보드로 이동
- 에러 핸들링 (잘못된/만료된 코드)

#### 2.2 공통 인프라

**API 클라이언트** (`/app/lib/api-client.ts`)
```typescript
interface ApiClient {
  get<T>(endpoint: string): Promise<T>
  post<T>(endpoint: string, data?: any): Promise<T>
  patch<T>(endpoint: string, data?: any): Promise<T>
  delete<T>(endpoint: string): Promise<T>
}
```
- JWT 토큰 자동 포함
- 에러 핸들링 (401 → 로그인 페이지)
- 타입 안전성

**인증 컨텍스트** (`/app/contexts/AuthContext.tsx`)
```typescript
interface AuthContextType {
  user: User | null
  character: Character | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshCharacter: () => Promise<void>
}
```
- 전역 인증 상태 관리
- 자동 토큰 갱신 (옵션)
- Protected Route 래퍼

**공통 레이아웃 컴포넌트** (`/app/components/layout/`)
- `BottomNav.tsx`: 하단 네비게이션 바
  - 퀘스트 탭
  - 캐릭터 탭
  - 전투 탭 (보스 있을 때 배지)
  - (옵션) 상점 탭
- `Header.tsx`: 상단 헤더 (골드, 보석 표시)
- `LoadingSpinner.tsx`: 로딩 표시
- `ErrorBoundary.tsx`: 에러 처리

#### 2.3 페이지 개선

**대시보드 개선**
- 현재 기능 유지
- 공통 레이아웃 적용 (BottomNav)
- 캐릭터 비주얼 추가 (옵션: 이미지 또는 아바타)
- 최근 활동 로그 표시 (옵션)

**퀘스트 페이지 개선**
- 현재 기능 유지
- 공통 레이아웃 적용
- 오늘 완료한 습관과 미완료 습관 구분
- 스트릭 시각화 개선 (불 아이콘 애니메이션)
- "승인 대기중" 상태 표시

**전투 페이지 검증 및 개선**
- 기존 구현 검토
- 보스 선택 → 전투 시작 → 스킬 사용 → 승리/패배 플로우 검증
- API 연동 확인:
  - `GET /api/v1/boss/available`
  - `POST /api/v1/boss/{boss_id}/start`
  - `POST /api/v1/boss/battles/{battle_id}/action`
  - `POST /api/v1/boss/battles/{battle_id}/claim`

#### 2.4 PWA 설정

**manifest.json** (`/app/manifest.json`)
```json
{
  "name": "습관퀘스트",
  "short_name": "습관퀘스트",
  "description": "RPG 기반 습관관리 앱",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#6c5ce7",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker** (`/public/sw.js`)
- 오프라인 캐싱 (기본 에셋)
- API 요청 캐싱 전략 (Network First)

**next.config.js 수정**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  // 기존 설정
})
```

---

## 3. 시스템 아키텍처

### 3.1 디렉토리 구조

```
apps/web-child/
├── app/
│   ├── (auth)/                    # 인증 관련 라우트 그룹
│   │   ├── login/
│   │   │   └── page.tsx          # 로그인 페이지
│   │   ├── register/
│   │   │   └── page.tsx          # 회원가입 페이지
│   │   └── pairing/
│   │       └── page.tsx          # 페어링 코드 입력
│   │
│   ├── (main)/                    # 메인 앱 라우트 그룹
│   │   ├── dashboard/
│   │   │   └── page.tsx          # 캐릭터 대시보드
│   │   ├── quests/
│   │   │   └── page.tsx          # 오늘의 퀘스트
│   │   ├── battle/
│   │   │   └── page.tsx          # 보스전
│   │   └── layout.tsx            # 공통 레이아웃 (BottomNav 포함)
│   │
│   ├── components/
│   │   ├── layout/               # 레이아웃 컴포넌트
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── animations/           # 애니메이션 컴포넌트
│   │   ├── combat/               # 전투 컴포넌트
│   │   ├── character/            # 캐릭터 컴포넌트
│   │   └── sound/                # 사운드 컴포넌트
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx       # 인증 컨텍스트
│   │
│   ├── hooks/
│   │   ├── useAuth.ts            # 인증 훅
│   │   ├── useCharacter.ts       # 캐릭터 데이터 훅
│   │   └── useHabits.ts          # 습관 데이터 훅
│   │
│   ├── lib/
│   │   ├── api-client.ts         # API 클라이언트
│   │   ├── auth.ts               # 인증 유틸리티
│   │   └── constants.ts          # 상수 정의
│   │
│   ├── types/
│   │   ├── auth.ts               # 인증 타입
│   │   ├── character.ts          # 캐릭터 타입
│   │   └── habit.ts              # 습관 타입
│   │
│   ├── layout.tsx                # 루트 레이아웃
│   └── page.tsx                  # 루트 페이지 (리다이렉트)
│
├── public/
│   ├── icons/                    # PWA 아이콘
│   ├── sounds/                   # 효과음
│   ├── manifest.json
│   └── sw.js
│
├── .env.local                    # 환경 변수
├── next.config.js
└── package.json
```

### 3.2 데이터 플로우

```
┌─────────────┐
│   브라우저    │
└──────┬──────┘
       │
       ↓
┌──────────────────────────────────┐
│     Next.js App (Client)         │
│  ┌────────────────────────────┐  │
│  │   AuthContext Provider     │  │
│  │  (전역 인증 상태 관리)        │  │
│  └────────────┬───────────────┘  │
│               │                  │
│  ┌────────────↓───────────────┐  │
│  │      Pages/Components      │  │
│  │  - login, register         │  │
│  │  - dashboard, quests       │  │
│  │  - battle                  │  │
│  └────────────┬───────────────┘  │
│               │                  │
│  ┌────────────↓───────────────┐  │
│  │     API Client             │  │
│  │  - JWT 토큰 관리            │  │
│  │  - 요청/응답 처리           │  │
│  │  - 에러 핸들링              │  │
│  └────────────┬───────────────┘  │
└───────────────┼──────────────────┘
                │
                ↓ HTTP/HTTPS
┌───────────────────────────────────┐
│    FastAPI Backend (Server)       │
│  - /api/v1/auth/*                 │
│  - /api/v1/character/*            │
│  - /api/v1/habits/*               │
│  - /api/v1/boss/*                 │
└───────────────┬───────────────────┘
                │
                ↓
┌───────────────────────────────────┐
│    Database (PostgreSQL + Redis)  │
└───────────────────────────────────┘
```

---

## 4. 컴포넌트 설계

### 4.1 AuthContext Provider

**파일**: `/app/contexts/AuthContext.tsx`

**책임**:
- 전역 인증 상태 관리
- 로그인/로그아웃 처리
- 토큰 자동 갱신 (옵션)
- Protected Route 보호

**인터페이스**:
```typescript
interface AuthContextType {
  // 상태
  user: User | null
  character: Character | null
  isLoading: boolean
  isAuthenticated: boolean

  // 메서드
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
  refreshCharacter: () => Promise<void>
}

interface User {
  id: string
  email: string
  nickname: string
  role: 'parent' | 'child'
}

interface Character {
  id: string
  name: string | null
  level: number
  exp: number
  max_exp: number
  hp: number
  max_hp: number
  mana: number
  max_mana: number
  gold: number
  gems: number
  stats: {
    strength: number
    intelligence: number
    vitality: number
    luck: number
  }
}
```

**사용 예시**:
```tsx
function DashboardPage() {
  const { character, refreshCharacter, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />

  return <div>{character.name}</div>
}
```

### 4.2 API Client

**파일**: `/app/lib/api-client.ts`

**책임**:
- HTTP 요청 래퍼
- JWT 토큰 자동 포함
- 에러 핸들링
- 타입 안전성

**구현**:
```typescript
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const token = localStorage.getItem('token')

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    })

    if (response.status === 401) {
      // 토큰 만료 → 로그인 페이지로
      localStorage.removeItem('token')
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Request failed')
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
)
```

### 4.3 BottomNav 컴포넌트

**파일**: `/app/components/layout/BottomNav.tsx`

**책임**:
- 하단 네비게이션 바 표시
- 현재 활성 탭 하이라이트
- 보스 도전 가능 시 배지 표시

**인터페이스**:
```typescript
interface BottomNavProps {
  currentPath: string
  hasBossAvailable?: boolean
}
```

**UI 구조**:
```
┌─────────────────────────────────────────┐
│  [퀘스트]  [캐릭터]  [전투 🔴]  [상점]   │
└─────────────────────────────────────────┘
```

**구현**:
```tsx
function BottomNav({ currentPath, hasBossAvailable }: BottomNavProps) {
  const tabs = [
    { path: '/quests', icon: '⚔️', label: '퀘스트' },
    { path: '/dashboard', icon: '👤', label: '캐릭터' },
    { path: '/battle', icon: '🎯', label: '전투', badge: hasBossAvailable },
    { path: '/shop', icon: '🏪', label: '상점' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
      <div className="flex justify-around py-3">
        {tabs.map(tab => (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex flex-col items-center gap-1 ${
              currentPath === tab.path ? 'text-purple-400' : 'text-gray-400'
            }`}
          >
            <span className="text-2xl relative">
              {tab.icon}
              {tab.badge && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              )}
            </span>
            <span className="text-xs">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
```

### 4.4 Protected Route Wrapper

**파일**: `/app/components/layout/ProtectedRoute.tsx`

**책임**:
- 인증되지 않은 사용자 리다이렉트
- 로딩 상태 표시

**구현**:
```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
```

---

## 5. API 통합

### 5.1 엔드포인트 매핑

| 페이지/기능 | HTTP Method | 엔드포인트 | 설명 |
|------------|------------|-----------|------|
| **인증** |
| 회원가입 | POST | `/api/v1/auth/register` | 새 사용자 등록 |
| 로그인 | POST | `/api/v1/auth/login` | JWT 토큰 발급 |
| 내 정보 | GET | `/api/v1/auth/me` | 현재 사용자 정보 |
| 페어링 (자녀) | POST | `/api/v1/auth/pairing/pair` | 부모와 페어링 |
| **캐릭터** |
| 캐릭터 조회 | GET | `/api/v1/character/` | 내 캐릭터 정보 |
| 캐릭터 수정 | PATCH | `/api/v1/character/` | 이름 등 수정 |
| **습관** |
| 습관 생성 | POST | `/api/v1/habits/` | 새 습관 추가 |
| 오늘의 퀘스트 | GET | `/api/v1/habits/today` | 오늘 활성 습관 |
| 습관 체크 | POST | `/api/v1/habits/{id}/check` | 습관 완료 체크 |
| **보스** |
| 도전 가능 보스 | GET | `/api/v1/boss/available` | 현재 도전 가능한 보스 |
| 전투 시작 | POST | `/api/v1/boss/{id}/start` | 보스전 시작 |
| 전투 액션 | POST | `/api/v1/boss/battles/{id}/action` | 스킬 사용 |
| 보상 획득 | POST | `/api/v1/boss/battles/{id}/claim` | 승리 보상 획득 |

### 5.2 타입 정의

**파일**: `/app/types/api.ts`

```typescript
// 요청 타입
export interface RegisterRequest {
  email: string
  password: string
  nickname: string
  role: 'child'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface PairingRequest {
  pairing_code: string
}

export interface HabitCreateRequest {
  title: string
  category: 'health' | 'study' | 'exercise' | 'life'
  difficulty: 'easy' | 'medium' | 'hard'
  requires_approval?: boolean
  schedule?: any
}

export interface CharacterUpdateRequest {
  name?: string
}

// 응답 타입
export interface TokenResponse {
  access_token: string
  expires_in: number
}

export interface UserResponse {
  id: string
  email: string
  nickname: string
  role: 'parent' | 'child'
  created_at: string
}

export interface CharacterResponse {
  id: string
  user_id: string
  name: string | null
  level: number
  exp: number
  max_exp: number
  hp: number
  max_hp: number
  mana: number
  max_mana: number
  gold: number
  gems: number
  stats: {
    strength: number
    intelligence: number
    vitality: number
    luck: number
  }
}

export interface HabitResponse {
  id: string
  user_id: string
  title: string
  category: string
  difficulty: string
  streak_count: number
  is_active: boolean
  requires_approval: boolean
}

export interface HabitCheckResponse {
  message: string
  exp_earned: number
  gold_earned: number
  leveled_up: boolean
  new_level: number | null
}

export interface BossResponse {
  id: string
  name: string
  level: number
  hp: number
  max_hp: number
  description: string
}

export interface AvailableBossResponse {
  available: boolean
  boss: BossResponse | null
}
```

---

## 6. 상태 관리

### 6.1 전역 상태 (Context API)

**AuthContext**
- 사용자 정보
- 캐릭터 정보
- 인증 상태

### 6.2 로컬 상태 (useState)

각 페이지/컴포넌트에서:
- 폼 입력값
- 로딩 상태
- 에러 메시지
- 애니메이션 트리거

### 6.3 서버 상태 (React Query 대안)

현재는 `useEffect` + `useState`로 관리하지만, 나중에 React Query 도입 고려:
- 자동 캐싱
- 자동 재요청
- 낙관적 업데이트

---

## 7. 라우팅 구조

### 7.1 Route Groups

```
/                         → 루트 (리다이렉트)
├── (auth)/               → 인증 라우트 그룹
│   ├── login/            → 로그인
│   ├── register/         → 회원가입
│   └── pairing/          → 페어링
│
└── (main)/               → 메인 앱 라우트 그룹
    ├── dashboard/        → 캐릭터 대시보드
    ├── quests/           → 오늘의 퀘스트
    ├── battle/           → 보스전
    └── shop/             → 상점 (옵션)
```

### 7.2 네비게이션 플로우

```
[로그인] → [대시보드]
    ↓          ↓
[회원가입] → [페어링] (선택)
               ↓
           [대시보드] ←→ [퀘스트] ←→ [전투]
                            ↓
                         [상점]
```

### 7.3 리다이렉트 규칙

- `/` → 토큰 있으면 `/dashboard`, 없으면 `/login`
- 모든 `/main/*` → 토큰 없으면 `/login`으로 리다이렉트

---

## 8. 구현 우선순위

### Phase 1: 기반 인프라 (1-2일)

**P0 (필수)**
1. **API Client** 구현 (`/app/lib/api-client.ts`)
   - 타입 안전한 HTTP 클라이언트
   - JWT 토큰 자동 포함
   - 401 에러 처리

2. **AuthContext** 구현 (`/app/contexts/AuthContext.tsx`)
   - 전역 인증 상태 관리
   - login/logout 메서드

3. **타입 정의** (`/app/types/`)
   - API 요청/응답 타입
   - 도메인 모델 타입

4. **환경 변수 설정** (`.env.local`)
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

### Phase 2: 인증 페이지 완성 (1일)

**P0 (필수)**
5. **회원가입 페이지** (`/app/(auth)/register/page.tsx`)
   - 폼 + 검증
   - API 연동

6. **페어링 페이지** (`/app/(auth)/pairing/page.tsx`)
   - 6자리 코드 입력
   - API 연동

7. **로그인 페이지 리팩토링**
   - API Client 사용
   - AuthContext 통합

### Phase 3: 공통 레이아웃 (1일)

**P0 (필수)**
8. **BottomNav 컴포넌트** (`/app/components/layout/BottomNav.tsx`)
   - 하단 탭 네비게이션
   - 활성 탭 하이라이트

9. **공통 레이아웃 적용** (`/app/(main)/layout.tsx`)
   - BottomNav 포함
   - ProtectedRoute 래퍼

**P1 (중요)**
10. **LoadingSpinner** 컴포넌트
11. **ErrorBoundary** 컴포넌트

### Phase 4: 페이지 리팩토링 (1-2일)

**P0 (필수)**
12. **대시보드 페이지 리팩토링**
    - AuthContext 사용
    - API Client 사용
    - 공통 레이아웃 적용

13. **퀘스트 페이지 리팩토링**
    - AuthContext 사용
    - API Client 사용
    - "승인 대기중" 상태 표시

14. **전투 페이지 검증**
    - 기존 구현 확인
    - API 연동 검증

### Phase 5: PWA 설정 (0.5일)

**P1 (중요)**
15. **manifest.json** 작성
16. **아이콘 생성** (192x192, 512x512)
17. **next-pwa 설정**

### Phase 6: 테스트 및 버그 수정 (1일)

**P0 (필수)**
18. E2E 플로우 테스트
    - 회원가입 → 페어링 → 습관 체크 → 레벨업 → 보스전
19. 에러 케이스 처리
20. 모바일 반응형 확인

---

## 9. 검증 기준

### 9.1 기능 검증

#### 인증 플로우
- [ ] 회원가입 성공 시 자동 로그인
- [ ] 로그인 실패 시 에러 메시지 표시
- [ ] 페어링 코드 입력 후 부모와 연결
- [ ] 토큰 만료 시 자동 로그아웃
- [ ] 로그아웃 후 로그인 페이지로 이동

#### 습관 관리
- [ ] 오늘의 습관 목록 조회
- [ ] 새 습관 추가
- [ ] 습관 체크 시 보상 획득
- [ ] 레벨업 시 애니메이션 표시
- [ ] 스트릭 정상 증가

#### 캐릭터
- [ ] 캐릭터 정보 표시 (레벨, HP, EXP, 골드, 스탯)
- [ ] 캐릭터 이름 변경
- [ ] 보스 도전 가능 시 알림 표시

#### 보스전
- [ ] 보스 선택
- [ ] 전투 시작
- [ ] 스킬 사용
- [ ] 승리 시 보상 획득
- [ ] 패배 시 재도전 가능

### 9.2 UX 검증

- [ ] 로딩 상태 표시 (스피너)
- [ ] 에러 메시지 사용자 친화적
- [ ] 버튼 클릭 후 즉각 피드백 (로딩, 비활성화)
- [ ] 애니메이션 부드럽고 적절한 타이밍
- [ ] 모바일에서 터치 영역 충분 (최소 44x44px)

### 9.3 기술 검증

- [ ] TypeScript 타입 에러 없음
- [ ] 빌드 에러 없음 (`npm run build`)
- [ ] PWA 점수 90+ (Lighthouse)
- [ ] API 요청 중복 방지
- [ ] 토큰 자동 포함 (Authorization 헤더)

### 9.4 성능 검증

- [ ] 페이지 로딩 시간 < 2초
- [ ] 애니메이션 60fps 유지
- [ ] 메모리 누수 없음 (useEffect cleanup)
- [ ] 불필요한 리렌더링 최소화

---

## 10. 환경 설정

### 10.1 필수 환경 변수

`.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

프로덕션:
```
NEXT_PUBLIC_API_URL=https://api.habitquest.com
```

### 10.2 의존성 추가

```bash
npm install next-pwa
```

### 10.3 Next.js 설정

`next.config.js`:
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
})
```

---

## 11. 마일스톤

| Phase | 목표 | 완료 기준 | 예상 시간 |
|-------|-----|----------|----------|
| Phase 1 | 기반 인프라 | API Client, AuthContext 구현 | 1-2일 |
| Phase 2 | 인증 완성 | 회원가입, 페어링 페이지 | 1일 |
| Phase 3 | 공통 레이아웃 | BottomNav, 공통 컴포넌트 | 1일 |
| Phase 4 | 페이지 리팩토링 | 모든 페이지 AuthContext 사용 | 1-2일 |
| Phase 5 | PWA 설정 | manifest, SW 적용 | 0.5일 |
| Phase 6 | 테스트 및 버그 수정 | E2E 플로우 검증 | 1일 |
| **합계** | **MVP 완성** | **모든 검증 기준 통과** | **5.5-7.5일** |

---

## 12. 리스크 및 대응

### 리스크 1: 토큰 만료 처리 복잡성
**완화**:
- Phase 1에서 API Client에서 401 에러 자동 처리
- 필요 시 토큰 갱신 로직 추가

### 리스크 2: PWA 설정 미숙
**완화**:
- next-pwa 라이브러리 사용 (설정 간소화)
- 프로덕션 배포 전 Lighthouse 검증

### 리스크 3: 애니메이션 성능 이슈
**완화**:
- framer-motion 최적화 옵션 사용
- GPU 가속 (transform, opacity 사용)

### 리스크 4: 백엔드 API 변경
**완화**:
- 타입 정의로 API 계약 명확화
- API Client에서 에러 처리 일원화

---

## 13. 다음 단계 (MVP 이후)

### Phase 7: 상점 시스템
- 상점 페이지 구현
- 아이템 구매/장착

### Phase 8: 소셜 기능
- 파티 시스템 (친구 초대)
- 리더보드

### Phase 9: 알림
- 푸시 알림 (FCM)
- 습관 리마인더

### Phase 10: 오프라인 지원
- Service Worker 캐싱 전략
- 오프라인 대기열

---

## 부록 A: 컴포넌트 체크리스트

- [ ] `/app/lib/api-client.ts`
- [ ] `/app/contexts/AuthContext.tsx`
- [ ] `/app/types/api.ts`
- [ ] `/app/types/auth.ts`
- [ ] `/app/types/character.ts`
- [ ] `/app/types/habit.ts`
- [ ] `/app/components/layout/BottomNav.tsx`
- [ ] `/app/components/layout/Header.tsx`
- [ ] `/app/components/layout/LoadingSpinner.tsx`
- [ ] `/app/components/layout/ErrorBoundary.tsx`
- [ ] `/app/components/layout/ProtectedRoute.tsx`
- [ ] `/app/(auth)/register/page.tsx`
- [ ] `/app/(auth)/pairing/page.tsx`
- [ ] `/app/(main)/layout.tsx`
- [ ] `/public/manifest.json`
- [ ] `/public/icons/icon-192x192.png`
- [ ] `/public/icons/icon-512x512.png`
- [ ] `next.config.js` (PWA 설정)

---

## 부록 B: 코딩 컨벤션

### 파일명
- 컴포넌트: PascalCase (예: `BottomNav.tsx`)
- 유틸리티: camelCase (예: `api-client.ts`)
- 페이지: kebab-case (Next.js 규칙)

### 컴포넌트 구조
```tsx
// 1. Imports
import { useState } from 'react'

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Component
export default function MyComponent({ prop }: Props) {
  // 4. Hooks
  const [state, setState] = useState()

  // 5. Handlers
  const handleClick = () => {}

  // 6. Effects
  useEffect(() => {}, [])

  // 7. Render
  return <div>...</div>
}
```

### Tailwind 클래스 순서
1. Layout (flex, grid, block)
2. Positioning (absolute, relative)
3. Spacing (p-, m-)
4. Sizing (w-, h-)
5. Colors (bg-, text-)
6. Typography (font-, text-)
7. Effects (shadow-, hover:)

---

**설계 완료일**: 2026-04-06
**설계자**: Claude Sonnet 4.5
**승인 대기중** ✓
