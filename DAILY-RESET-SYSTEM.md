# 일일 리셋 시스템

Phase 8 완료: 매일 자정 습관 초기화 및 스트릭 추적 시스템

## 🎯 개요

매일 자정(00:00)에 자동으로 실행되어:
1. 어제 완료하지 않은 습관의 스트릭을 0으로 리셋
2. 완료한 습관의 스트릭을 +1 증가
3. 일별 통계 기록

---

## 🛠️ 백엔드 구현

### 1. Daily Reset Service (`app/services/daily_reset.py`)

#### `reset_daily_habits()`
```python
# 매일 자정 실행
# 1. 모든 활성 습관 조회
# 2. 각 습관의 오늘 완료 여부 확인
# 3. 완료 O → streak_count += 1
# 4. 완료 X → streak_count = 0
```

**반환값**:
```python
{
    "success": True,
    "habits_reset": 15,           # 처리된 습관 수
    "streaks_maintained": 12,     # 유지된 스트릭
    "streaks_broken": 3           # 깨진 스트릭
}
```

#### `get_user_streak_stats()`
```python
# 사용자의 현재 스트릭 통계
{
    "current_streak": 5,          # 현재 연속 일수 (모든 습관 중 최소값)
    "best_streak": 15,            # 최고 기록
    "total_habits": 8,            # 총 습관 수
    "streaks": [                  # 습관별 스트릭
        {
            "habit_id": "...",
            "habit_title": "매일 운동하기",
            "streak_count": 5
        }
    ]
}
```

#### `get_habit_completion_history()`
```python
# 최근 N일간 완료 히스토리
[
    {
        "date": "2024-04-07",
        "total_habits": 5,
        "completed": 4,
        "completion_rate": 80.0
    }
]
```

---

### 2. Scheduler (`app/scheduler.py`)

**APScheduler** 사용:
- `CronTrigger(hour=0, minute=0)` - 매일 자정 실행
- 비동기 스케줄러 (AsyncIOScheduler)
- 앱 시작/종료 시 자동 관리

```python
# main.py에서 자동 시작
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()  # 스케줄러 시작

    yield

    # Shutdown
    stop_scheduler()   # 스케줄러 종료
```

---

### 3. API Endpoints (`app/routers/streak.py`)

#### `GET /api/v1/streak/stats`
현재 사용자의 스트릭 통계 조회

**Response**:
```json
{
    "current_streak": 5,
    "best_streak": 15,
    "total_habits": 8,
    "streaks": [...]
}
```

#### `GET /api/v1/streak/history?days=30`
최근 N일간 완료 히스토리

**Parameters**:
- `days`: 조회 기간 (기본값: 30, 최대: 90)

**Response**:
```json
[
    {
        "date": "2024-04-07",
        "total_habits": 5,
        "completed": 4,
        "completion_rate": 80.0
    }
]
```

#### `POST /api/v1/streak/reset-now`
수동 리셋 트리거 (테스트용)

**⚠️ 주의**: 모든 습관을 즉시 리셋합니다!

---

## 🎨 프론트엔드 컴포넌트

### 1. StreakBadge (`components/stats/StreakBadge.tsx`)

**Props**:
```typescript
{
    streak: number,      // 연속 일수
    size?: "sm" | "md" | "lg"
}
```

**동적 색상**:
- 0일: 회색 "시작하세요!"
- 1-6일: 초록색 "좋아요!"
- 7일: 파란색 "1주일!"
- 8-29일: 파란색 "멋져요!"
- 30일: 보라색 "1개월!"
- 31-99일: 보라색 "대단해요!"
- 100일+: 금색 "전설!"

**예시**:
```tsx
<StreakBadge streak={7} size="lg" />
// → 🔥 7일 "1주일!"
```

---

### 2. CompletionCalendar (`components/stats/CompletionCalendar.tsx`)

**Props**:
```typescript
{
    history: DayData[]
}

interface DayData {
    date: string,
    total_habits: number,
    completed: number,
    completion_rate: number
}
```

**기능**:
- 주 단위로 히스토리 표시
- 색상 코딩:
  - 회색 (어두움): 0% 완료
  - 빨간색: 1-29%
  - 주황색: 30-59%
  - 노란색: 60-89%
  - 초록색: 90-100%
- 호버 시 상세 정보 툴팁
- Framer Motion 애니메이션

**예시**:
```tsx
<CompletionCalendar history={last30Days} />
```

---

## 📅 작동 방식

### 자정 리셋 플로우

```
23:59 → 자녀가 습관 체크
00:00 → 스케줄러 실행
        ↓
1. 어제(04-06) 습관 로그 조회
2. 각 습관별 체크:
   - 로그 있음 → streak_count += 1
   - 로그 없음 → streak_count = 0
3. 통계 업데이트
        ↓
00:01 → 다음 날 시작 (오늘: 04-07)
        새로운 습관 체크 가능
```

---

## 🎮 사용자 경험

### 자녀 앱
1. **대시보드에 스트릭 배지 표시**
   ```
   🔥 5일 "좋아요!"
   ```

2. **완료 캘린더**
   - 최근 30일 시각화
   - 완료율에 따른 색상
   - 호버로 상세 정보

3. **습관별 스트릭**
   - 각 습관마다 개별 스트릭 추적
   - "🔥 7일 연속!" 표시

### 부모 앱
1. **자녀의 스트릭 모니터링**
   - 현재 스트릭 확인
   - 최고 기록 확인

2. **완료 히스토리 그래프**
   - 주간/월간 트렌드
   - 카테고리별 분석 (향후)

---

## 🔧 기술 스택

### Backend
- **APScheduler 3.10**: 비동기 크론 작업
- **SQLAlchemy 2.0**: 비동기 ORM 쿼리
- **FastAPI**: REST API 엔드포인트

### Frontend
- **React 19**: useState, useEffect 훅
- **Framer Motion**: 애니메이션
- **TypeScript**: 타입 안전성

---

## 📊 데이터베이스

### Habit 테이블에 추가된 필드
```sql
streak_count INTEGER DEFAULT 0 NOT NULL
```

### HabitLog 테이블 (기존)
```sql
completed_at TIMESTAMP  -- 완료 시간으로 날짜 구분
status ENUM             -- COMPLETED, PENDING, ...
```

---

## 🧪 테스트 방법

### 1. 수동 리셋 테스트
```bash
curl -X POST http://localhost:8000/api/v1/streak/reset-now
```

### 2. 스트릭 조회
```bash
curl http://localhost:8000/api/v1/streak/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 히스토리 조회
```bash
curl http://localhost:8000/api/v1/streak/history?days=7 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. 시나리오 테스트
```
Day 1:
- 습관 3개 체크 → streak_count: [1, 1, 1]

Day 2:
- 습관 2개만 체크 → streak_count: [2, 2, 0]
- 1개는 리셋됨

Day 3:
- 모두 체크 → streak_count: [3, 3, 1]
- 리셋된 습관 다시 시작
```

---

## ⚙️ 설정

### 리셋 시간 변경
`app/scheduler.py`:
```python
scheduler.add_job(
    daily_reset_job,
    CronTrigger(hour=0, minute=0),  # 자정
    # CronTrigger(hour=9, minute=0),  # 오전 9시로 변경 가능
)
```

### 테스트 모드
매 시간마다 실행 (개발용):
```python
scheduler.add_job(
    daily_reset_job,
    CronTrigger(minute=0),  # 매 시간 정각
)
```

---

## 🔜 향후 개선

### 스트릭 보스
- [ ] 7일 연속 완료 시 특별 보스 등장
- [ ] 30일 연속 시 레전더리 보스

### 알림
- [ ] 스트릭이 깨질 위험이 있을 때 알림
- [ ] "오늘 아직 습관을 체크하지 않았어요!"

### 보상
- [ ] 스트릭 마일스톤 달성 시 보너스
  - 7일: 보석 +5
  - 30일: 보석 +20
  - 100일: 특별 칭호

### 통계
- [ ] 주간/월간 리포트
- [ ] 카테고리별 완료율
- [ ] 시간대별 완료 패턴

---

## 📝 주의사항

### 1. 타임존
- 현재 UTC 기준으로 작동
- 서버 타임존 설정 필요 시 수정

### 2. 성능
- 대량 사용자 시 배치 처리 최적화 필요
- 인덱스: `habit_logs(completed_at, status)`

### 3. 백업
- 스트릭 리셋은 되돌릴 수 없음
- 정기 DB 백업 권장

---

**상태**: ✅ Phase 8 완료
**다음 단계**: Phase 9 - 상점 시스템 (골드/보석으로 아이템 구매)
