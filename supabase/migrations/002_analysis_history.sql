-- ============================================================
-- 마이그레이션 002: 분석 이력 관리 테이블 및 컬럼 추가
-- 목적: 키워드 세트의 AI 분석 결과를 누적 저장하여 변화 추적 가능하게 함
-- 실행 순서: 001_init.sql 이후에 실행
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. keyword_sets 테이블에 컬럼 3개 추가
--
-- 기존 keyword_sets 테이블에는 분석 상태를 나타내는 컬럼이 없었음.
-- 자동 주기 분석(6h / 12h / 24h)을 구현하려면
-- "지금 분석 중인가", "언제 다음 분석인가", "마지막 분석은 언제였나"
-- 를 DB에 저장해야 함.
-- ────────────────────────────────────────────────────────────

ALTER TABLE keyword_sets
  -- is_analyzing: 현재 AI 분석이 진행 중인지 여부
  --   true  → 분석 중 (UI에서 로딩 스피너 표시, 중복 요청 방지)
  --   false → 대기 중 (기본값)
  ADD COLUMN IF NOT EXISTS is_analyzing     BOOLEAN     NOT NULL DEFAULT false,

  -- next_analyze_at: 다음 자동 분석 예정 시각
  --   NULL  → 아직 분석된 적 없음 (최초 수동 분석 후 값이 채워짐)
  --   값 있음 → 이 시각이 지나면 자동 분석 대상이 됨
  --   Supabase Edge Function의 Cron이 이 컬럼을 기준으로 대상 조회
  ADD COLUMN IF NOT EXISTS next_analyze_at  TIMESTAMPTZ,

  -- last_analyzed_at: 가장 최근 분석 완료 시각
  --   NULL  → 아직 한 번도 분석되지 않은 상태
  --   값 있음 → 상세 페이지에서 "3시간 전 분석됨" 등으로 표시
  ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMPTZ;


-- ────────────────────────────────────────────────────────────
-- 2. 자동 분석 대상 조회용 인덱스
--
-- Cron이 주기적으로 "분석이 필요한 keyword_sets"를 조회할 때 사용.
-- 쿼리 예시:
--   SELECT * FROM keyword_sets
--   WHERE next_analyze_at <= now()
--   AND   is_analyzing = false;
--
-- 위 쿼리가 자주 실행되므로 next_analyze_at 기준 인덱스가 필요.
-- WHERE 절에 is_analyzing = false 조건을 포함하는 부분 인덱스(partial index)로 생성.
-- → is_analyzing = true(분석 중)인 행은 인덱스에서 제외 → 인덱스 크기 최소화
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_keyword_sets_next_analyze
  ON keyword_sets(next_analyze_at)
  WHERE is_analyzing = false;


-- ────────────────────────────────────────────────────────────
-- 3. keyword_analysis_history 테이블 생성
--
-- [왜 별도 테이블이 필요한가?]
--   keyword_sets 테이블의 AI 컬럼(ai_one_liner, ai_body 등)은
--   분석할 때마다 덮어쓰기(UPDATE)된다.
--   즉, 현재 결과만 남고 이전 결과는 사라진다.
--
-- [이 테이블의 역할]
--   분석이 실행될 때마다 결과의 스냅샷을 이 테이블에 INSERT.
--   → 시간에 따른 변화 추적 가능
--   → "지난주 분석 vs 이번주 분석" 비교 기능 구현 가능
--   → 보고서 생성 시 기간 내 이력 데이터 활용 가능
--
-- [keyword_sets와의 관계]
--   keyword_sets  1 : N  keyword_analysis_history
--   (하나의 키워드 세트 → 여러 개의 분석 이력)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS keyword_analysis_history (

  -- ── 기본 키 ──────────────────────────────────────────────
  id  UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  -- gen_random_uuid(): PostgreSQL 내장 함수로 UUID v4 자동 생성


  -- ── 외래 키 ──────────────────────────────────────────────

  -- 어떤 키워드 세트의 분석인지
  -- ON DELETE CASCADE: keyword_sets가 삭제되면 관련 이력도 함께 삭제
  keyword_set_id  UUID  REFERENCES keyword_sets(id) ON DELETE CASCADE NOT NULL,

  -- 누구의 분석인지 (RLS 정책에서 이 컬럼으로 접근 제어)
  -- ON DELETE CASCADE: 탈퇴한 유저의 이력도 함께 삭제
  user_id         UUID  REFERENCES auth.users(id)  ON DELETE CASCADE NOT NULL,


  -- ── AI 분석 결과 스냅샷 ───────────────────────────────────
  -- keyword_sets의 AI 컬럼과 동일한 구조.
  -- 분석 시점의 값을 그대로 복사해서 저장.

  -- AI가 생성한 한 줄 핵심 요약
  ai_one_liner        TEXT,

  -- AI 상세 분석 본문 (HTML 형식으로 저장됨)
  ai_body             TEXT,

  -- 유사 사례 / 시장 신호 (HTML)
  ai_cases            TEXT,

  -- 추적할 핵심 지표 (HTML)
  ai_metrics          TEXT,

  -- 운영 체크리스트 & KPI (HTML)
  ai_ops              TEXT,

  -- 추천 실행안 요약 (HTML)
  ai_recommendations  TEXT,

  -- 심각도 레벨: 'low' | 'normal' | 'high' | 'critical'
  severity_level      TEXT,

  -- 심각도 한글 레이블: '낮음' | '보통' | '높음' | '위험'
  severity_label      TEXT,

  -- 심각도 수치 (0~100, 게이지 바 표시용)
  severity_pct        INTEGER,

  -- 트렌드 차트 X축 레이블 배열 예: ['D-6', 'D-5', ..., 'D0']
  chart_labels        TEXT[]    DEFAULT '{}',

  -- 트렌드 차트 Y축 데이터 배열 예: [10, 15, 12, 20, 18, 25, 30]
  chart_data          INTEGER[] DEFAULT '{}',

  -- 타임라인 이벤트 목록 (JSONB 배열)
  -- 구조: [{ date, dot, tagText, content }, ...]
  -- dot 값: 'info' | 'warning' | 'critical'
  timeline            JSONB     DEFAULT '[]',

  -- 참고 출처 목록 (JSONB 배열)
  -- 구조: [{ title, url, date }, ...]
  sources             JSONB     DEFAULT '[]',


  -- ── 분석 메타 정보 ────────────────────────────────────────

  -- 분석이 어떻게 시작됐는지
  --   'manual'    → 사용자가 "재분석" 버튼을 눌러서 실행
  --   'scheduled' → Cron이 자동으로 실행 (주기 업데이트)
  trigger_type    TEXT        NOT NULL DEFAULT 'manual',

  -- 분석 완료 시각 (이 행이 INSERT된 시각)
  -- DEFAULT now(): INSERT 시점의 현재 시각 자동 입력
  analyzed_at     TIMESTAMPTZ NOT NULL DEFAULT now()

);


-- ────────────────────────────────────────────────────────────
-- 4. Row Level Security (RLS) 설정
--
-- Supabase는 기본적으로 RLS가 비활성화된 테이블은
-- 아무나 접근 가능(anon key로도 전체 조회 가능).
-- 반드시 RLS를 활성화하고 정책을 설정해야 함.
--
-- 핵심 원칙: auth.uid() = user_id
--   → 로그인한 유저는 자신의 데이터만 볼 수 있음
-- ────────────────────────────────────────────────────────────

-- RLS 활성화 (이 줄 없으면 아래 정책이 적용되지 않음)
ALTER TABLE keyword_analysis_history ENABLE ROW LEVEL SECURITY;


-- SELECT 정책: 자신의 분석 이력만 조회 가능
-- USING 절: 조회 시 자동으로 WHERE user_id = auth.uid() 조건이 붙음
-- 재실행해도 에러 안 나도록 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "history_select" ON keyword_analysis_history;
DROP POLICY IF EXISTS "history_insert" ON keyword_analysis_history;

CREATE POLICY "history_select" ON keyword_analysis_history
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT 정책: 자신의 user_id로만 삽입 가능
-- WITH CHECK 절: INSERT/UPDATE 시 새 행의 값이 이 조건을 만족해야 함
--   → user_id를 다른 사람 ID로 위조해서 삽입하는 것을 방지
CREATE POLICY "history_insert" ON keyword_analysis_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ※ UPDATE, DELETE 정책은 의도적으로 생략
--   분석 이력은 불변(immutable) 데이터로 관리.
--   한번 기록된 이력은 수정/삭제하지 않는 것이 원칙.
--   (잘못된 분석 결과도 이력으로 남겨 변화 추적에 활용)


-- ────────────────────────────────────────────────────────────
-- 5. 인덱스 생성
--
-- 가장 자주 실행될 쿼리:
--   "특정 키워드 세트의 분석 이력을 최신순으로 가져와"
--   SELECT * FROM keyword_analysis_history
--   WHERE keyword_set_id = $1
--   ORDER BY analyzed_at DESC
--   LIMIT 10;
--
-- keyword_set_id + analyzed_at DESC 복합 인덱스로
-- WHERE + ORDER BY 를 한 번에 처리.
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_history_keyword_set_id
  ON keyword_analysis_history(keyword_set_id, analyzed_at DESC);
