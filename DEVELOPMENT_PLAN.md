# Signal 개발 계획서

> 마케팅 실무자를 위한 키워드 변화 추적 플랫폼
> 기간: 4주 (2026.03.06 ~ 2026.04.03)

---

## 현재 구현 상태

| 영역 | 파일 | 상태 |
|------|------|------|
| 프로젝트 셋업 | Next.js 16, Supabase, Tailwind, TanStack Query | 완료 |
| 타입 정의 | `src/types/index.ts` | 완료 |
| DB 스키마 | `supabase/migrations/001_init.sql` | 완료 |
| 인증 | `auth/login`, `auth/callback`, Supabase Auth | 완료 |
| API | `/api/keywords` (GET, POST), `/api/keywords/[id]`, `/api/ai/analyze`, `/api/reports` | 완료 |
| 컴포넌트 | `AddKeywordModal`, `KeywordCard`, `Header`, `AuthButton` | 완료 |
| 페이지 셸 | `dashboard`, `tracker/[id]`, `reports`, `reports/[id]` | 완료 (셸) |

---

## 1주차 — 핵심 UI 완성 & 데이터 흐름 연결

> 목표: 앱이 실제로 동작하는 상태로 만들기

### 우선순위 작업

#### 1-1. 대시보드 (`/dashboard`) 완성
- [ ] `KeywordCard` 목록 렌더링 (API 연결)
- [ ] 빈 상태(Empty State) UI — 키워드가 없을 때 안내 문구 + CTA
- [ ] `AddKeywordModal` → POST `/api/keywords` → 목록 즉시 반영 (TanStack Query invalidate)
- [ ] 로딩 스켈레톤 UI (카드 3개 placeholder)
- [ ] 키워드 삭제 기능 (카드 내 삭제 버튼 → DELETE `/api/keywords/[id]`)

#### 1-2. 키워드 상세 (`/tracker/[id]`) 완성
- [ ] 데이터 패치 (GET `/api/keywords/[id]`)
- [ ] AI 분석 결과 렌더링 (ai_one_liner, ai_body 등)
- [ ] 심각도 배지 컴포넌트 (severity_level별 색상)
- [ ] 타임라인 컴포넌트
- [ ] 출처 목록 렌더링
- [ ] "AI 분석 실행" 버튼 → POST `/api/ai/analyze` → 결과 저장 → 화면 갱신

#### 1-3. 차트 컴포넌트
- [ ] Recharts `LineChart` 래퍼 컴포넌트 (`TrendChart`)
- [ ] `chart_labels` / `chart_data`를 props로 받아 렌더링
- [ ] 반응형 처리 (`ResponsiveContainer`)

#### 1-4. 인증 흐름 검증
- [ ] 로그인 → 대시보드 리다이렉트 확인
- [ ] 비로그인 상태에서 보호된 페이지 접근 시 `/auth/login` 리다이렉트 확인 (미들웨어)
- [ ] 로그아웃 기능 (`AuthButton`)

### 완료 기준
- 키워드 추가 → 카드 목록 표시 → 상세 페이지 진입 → AI 분석 실행 → 결과 화면 표시가 end-to-end로 동작

---

## 2주차 — AI 분석 고도화 & 자동 업데이트

> 목표: 핵심 가치 제안인 "주기적 AI 분석"을 구현

### 2-1. 분석 히스토리 저장

현재 AI 분석 결과가 `keyword_sets` 테이블에 덮어쓰기 방식으로 저장됨.
**변화 추적**을 위해 분석 이력을 별도 테이블에 보존해야 함.

- [ ] `keyword_analysis_history` 테이블 마이그레이션 추가 (DB 설계 섹션 참고)
- [ ] `/api/ai/analyze` 수정: 분석 결과를 히스토리에도 INSERT
- [ ] 상세 페이지에 "이전 분석 비교" UI 추가 (최근 2개 결과 diff)

### 2-2. 주기적 자동 업데이트 (Supabase Edge Function)

- [ ] Supabase Edge Function `auto-analyze` 작성
  - `update_frequency`에 따라 분석이 필요한 `keyword_sets` 조회
  - 각 세트에 대해 Claude API 호출 후 결과 저장
- [ ] Supabase Cron 설정 (매 6시간마다 Edge Function 트리거)
- [ ] `next_analyze_at` 컬럼 추가 — 다음 분석 예정 시각 관리

### 2-3. 분석 상태 표시
- [ ] 분석 중 상태 (`analyzing`) 컬럼 추가 및 UI 반영
- [ ] 마지막 분석 시각 표시 ("3시간 전 분석됨")
- [ ] 다음 분석 예정 시각 카운트다운

### 2-4. 웹 검색 연동 (선택)
- [ ] Claude의 tool_use로 웹 검색 결과를 컨텍스트로 주입
- [ ] 또는 별도 검색 API (Brave Search, Serper 등)로 실시간 뉴스 수집 후 Claude 프롬프트에 삽입

---

## 3주차 — 보고서 기능 & 알림

> 목표: 보고서 생성과 알림으로 실무 활용도 높이기

### 3-1. 보고서 생성 (`/reports`)

- [ ] 보고서 목록 페이지 (`/reports`) — GET `/api/reports`
- [ ] 보고서 생성 모달
  - 기간 선택 (시작일 ~ 종료일)
  - 대상 키워드 세트 선택
- [ ] POST `/api/reports` — Claude에게 기간 내 분석 히스토리를 바탕으로 보고서 생성 요청
- [ ] 보고서 상세 페이지 (`/reports/[id]`)
  - executive_summary, main_insights, timeline_analysis 렌더링
  - 인쇄/PDF 저장 버튼 (`window.print()` 스타일 시트 활용)

### 3-2. 알림 시스템

- [ ] `notifications` 테이블 추가 (DB 설계 섹션 참고)
- [ ] 심각도가 `high` / `critical`로 바뀔 때 알림 생성 (Edge Function 내에서)
- [ ] 헤더 알림 벨 아이콘 + 드롭다운 (읽음/안읽음 처리)
- [ ] (선택) 이메일 알림 — Supabase Auth 이메일 또는 Resend API

### 3-3. 키워드 세트 관리 기능 보강
- [ ] 키워드 세트 수정 기능 (PATCH `/api/keywords/[id]`)
- [ ] 아카이브/일시정지 기능 (`is_active` 컬럼)
- [ ] 대시보드 필터 (카테고리별, 심각도별)

---

## 4주차 — 플랜 관리, 폴리싱, 배포

> 목표: 프로덕션 준비 완료

### 4-1. 플랜 & 사용량 제한

- [ ] `user_profiles` 테이블 (플랜 관리, DB 설계 섹션 참고)
- [ ] Free 플랜 제한 적용
  - 키워드 세트 최대 3개
  - 업데이트 주기 24h 고정
  - 보고서 생성 불가
- [ ] Pro 플랜 제한 해제 UI (업그레이드 CTA)
- [ ] 설정 페이지 (`/settings`) — 프로필, 현재 플랜, 사용량 확인

### 4-2. UX 폴리싱
- [ ] 전체 페이지 로딩 상태 통일 (스켈레톤 UI)
- [ ] 에러 상태 처리 (API 실패 시 toast 알림)
- [ ] 빈 상태 화면 일관성
- [ ] 모바일 반응형 검토
- [ ] 다크모드 지원 (Tailwind `dark:` 클래스)

### 4-3. 성능 & 안정성
- [ ] TanStack Query staleTime / cacheTime 튜닝
- [ ] API 응답 속도 측정 (AI 분석 호출 시 스트리밍 고려)
- [ ] Rate limiting (동일 유저가 AI 분석을 연속 호출하는 것 방지)

### 4-4. 배포
- [ ] Vercel 배포 설정 (Next.js)
- [ ] 환경 변수 프로덕션 설정
- [ ] Supabase Edge Function 배포
- [ ] 커스텀 도메인 연결 (선택)
- [ ] Vercel Analytics 연동

---

## DB 설계

### 현재 테이블

#### `keyword_sets` (기존)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| user_id | UUID FK → auth.users | |
| title | TEXT | 자동 생성 (키워드 앞 2개) |
| keywords | TEXT[] | 추적 키워드 목록 |
| question | TEXT | 전략 질문 |
| purpose | TEXT | 추적 목적 |
| category | TEXT | 카테고리 |
| update_frequency | TEXT | '6h' / '12h' / '24h' |
| ai_one_liner | TEXT | AI 한줄 요약 |
| ai_body | TEXT | AI 상세 분석 (HTML) |
| ai_cases | TEXT | 유사 사례 (HTML) |
| ai_metrics | TEXT | 핵심 지표 (HTML) |
| ai_ops | TEXT | 운영 체크리스트 (HTML) |
| ai_recommendations | TEXT | 추천 실행안 (HTML) |
| space_suitability | TEXT | |
| space_suitability_links | JSONB | |
| pricing_positioning | TEXT | |
| pricing_positioning_links | JSONB | |
| demand_risks | TEXT | |
| demand_risks_links | JSONB | |
| success_conditions | TEXT | |
| severity_level | TEXT | 'low'/'normal'/'high'/'critical' |
| severity_label | TEXT | 한글 레이블 |
| severity_pct | INTEGER | 0~100 |
| chart_labels | TEXT[] | |
| chart_data | INTEGER[] | |
| timeline | JSONB | TimelineItem[] |
| sources | JSONB | Source[] |
| links | JSONB | Link[] |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | 트리거로 자동 갱신 |

#### `generated_reports` (기존)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| user_id | UUID FK | |
| keyword_set_id | UUID FK → keyword_sets | |
| title | TEXT | |
| start_date | DATE | |
| end_date | DATE | |
| executive_summary | TEXT | |
| question | TEXT | |
| answer | TEXT | |
| main_insights | JSONB | {title, content, severity}[] |
| timeline_analysis | JSONB | {date, title, description, impact}[] |
| qualitative_analysis | TEXT | |
| ref_links | TEXT[] | |
| created_at | TIMESTAMPTZ | |

---

### 추가할 테이블 (2~4주차)

#### `user_profiles` — 플랜 관리 (4주차)
```sql
CREATE TABLE user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL DEFAULT 'free',      -- 'free' | 'pro' | 'business'
  plan_expires_at TIMESTAMPTZ,                        -- 구독 만료일 (null = 무기한)
  keyword_set_limit INTEGER NOT NULL DEFAULT 3,       -- 생성 가능한 키워드 세트 수
  analyze_limit   INTEGER NOT NULL DEFAULT 30,        -- 월간 AI 분석 호출 수
  analyze_count   INTEGER NOT NULL DEFAULT 0,         -- 이번 달 사용량
  analyze_reset_at TIMESTAMPTZ,                       -- 사용량 초기화 예정일
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 신규 회원 가입 시 user_profiles 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, analyze_reset_at)
  VALUES (NEW.id, date_trunc('month', now()) + interval '1 month');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

#### `keyword_analysis_history` — 분석 이력 (2주차)
```sql
CREATE TABLE keyword_analysis_history (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_set_id  UUID REFERENCES keyword_sets(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 분석 결과 스냅샷
  ai_one_liner    TEXT,
  ai_body         TEXT,
  ai_cases        TEXT,
  ai_metrics      TEXT,
  ai_ops          TEXT,
  ai_recommendations TEXT,
  severity_level  TEXT,
  severity_label  TEXT,
  severity_pct    INTEGER,
  chart_labels    TEXT[],
  chart_data      INTEGER[],
  timeline        JSONB DEFAULT '[]',
  sources         JSONB DEFAULT '[]',

  -- 분석 메타
  trigger_type    TEXT DEFAULT 'manual',  -- 'manual' | 'scheduled'
  analyzed_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE keyword_analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "history_select" ON keyword_analysis_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "history_insert" ON keyword_analysis_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_history_keyword_set_id ON keyword_analysis_history(keyword_set_id, analyzed_at DESC);
```

#### `keyword_sets` 컬럼 추가 (2주차)
```sql
ALTER TABLE keyword_sets
  ADD COLUMN is_active        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN is_analyzing     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN next_analyze_at  TIMESTAMPTZ,
  ADD COLUMN last_analyzed_at TIMESTAMPTZ;

-- next_analyze_at 인덱스 (자동 분석 대상 조회용)
CREATE INDEX idx_keyword_sets_next_analyze ON keyword_sets(next_analyze_at)
  WHERE is_active = true;
```

#### `notifications` — 알림 (3주차)
```sql
CREATE TABLE notifications (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword_set_id  UUID REFERENCES keyword_sets(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,  -- 'severity_change' | 'analysis_complete' | 'system'
  title           TEXT NOT NULL,
  body            TEXT,
  severity_from   TEXT,           -- 심각도 변경 시: 이전 값
  severity_to     TEXT,           -- 심각도 변경 시: 새 값
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
```

---

### ERD 요약

```
auth.users
    │
    ├── user_profiles          (1:1)  플랜, 사용량
    │
    ├── keyword_sets           (1:N)  키워드 세트
    │       │
    │       ├── keyword_analysis_history  (1:N)  분석 이력
    │       │
    │       └── generated_reports         (1:N)  보고서
    │
    └── notifications          (1:N)  알림
```

---

### 중요 설계 원칙

1. **분석 결과 이중 저장**: `keyword_sets`에는 최신 결과만 유지 (빠른 조회), `keyword_analysis_history`에는 전체 이력 보존 (변화 추적)
2. **RLS 필수**: 모든 테이블에 Row Level Security 적용 — `auth.uid() = user_id` 조건으로 데이터 격리
3. **JSONB vs 배열**: 구조가 변할 수 있는 데이터(timeline, sources, insights)는 JSONB, 단순 목록(keywords, chart_labels)은 배열
4. **소프트 삭제**: 키워드 세트는 `is_active = false`로 비활성화 (연결된 히스토리/보고서 보존)
5. **플랜 제한은 API에서 체크**: RLS는 소유권 검증, 플랜 한도는 서버 API Route에서 별도 검증

---

## API 라우트 체계

### 기존
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/keywords` | 내 키워드 세트 목록 |
| POST | `/api/keywords` | 키워드 세트 생성 |
| GET | `/api/keywords/[id]` | 키워드 세트 상세 |
| DELETE | `/api/keywords/[id]` | 키워드 세트 삭제 |
| POST | `/api/ai/analyze` | AI 분석 실행 |
| GET | `/api/reports` | 보고서 목록 |
| POST | `/api/reports` | 보고서 생성 |

### 추가 예정
| 메서드 | 경로 | 주차 | 설명 |
|--------|------|------|------|
| PATCH | `/api/keywords/[id]` | 3주 | 키워드 세트 수정 |
| GET | `/api/keywords/[id]/history` | 2주 | 분석 이력 조회 |
| GET | `/api/notifications` | 3주 | 알림 목록 |
| PATCH | `/api/notifications/[id]` | 3주 | 알림 읽음 처리 |
| GET | `/api/profile` | 4주 | 내 프로필/플랜 조회 |
| PATCH | `/api/profile` | 4주 | 프로필 수정 |

---

## 주차별 체크리스트 요약

### 1주차 완료 기준
- [ ] 키워드 추가 → 대시보드 목록 표시
- [ ] 상세 페이지에서 AI 분석 실행 → 결과 화면 표시
- [ ] 키워드 삭제 동작
- [ ] 로그인/로그아웃 흐름 완성

### 2주차 완료 기준
- [ ] 분석 히스토리 테이블 마이그레이션 적용
- [ ] 분석 실행 시 히스토리에도 기록
- [ ] Supabase Edge Function 작성 + Cron 설정
- [ ] 상세 페이지에 "마지막 분석 시각" 표시

### 3주차 완료 기준
- [ ] 보고서 생성 및 목록/상세 페이지 동작
- [ ] 보고서 PDF 출력 동작
- [ ] 키워드 세트 수정 가능
- [ ] 알림 벨 아이콘 동작

### 4주차 완료 기준
- [ ] Free/Pro 플랜 한도 적용
- [ ] 설정 페이지 동작
- [ ] Vercel 배포 완료
- [ ] 전체 사용자 플로우 에러 없이 동작
