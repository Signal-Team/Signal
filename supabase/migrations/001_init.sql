-- ─── Early Signal DB 초기 스키마 ──────────────────────────────

-- 키워드 세트
CREATE TABLE IF NOT EXISTS keyword_sets (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  keywords        TEXT[] NOT NULL DEFAULT '{}',
  question        TEXT NOT NULL,
  purpose         TEXT,
  category        TEXT NOT NULL DEFAULT '기타',
  update_frequency TEXT NOT NULL DEFAULT '24h',

  -- AI 분석 결과
  ai_one_liner    TEXT,
  ai_body         TEXT,
  ai_cases        TEXT,
  ai_metrics      TEXT,
  ai_ops          TEXT,
  ai_recommendations TEXT,
  space_suitability   TEXT,
  space_suitability_links JSONB DEFAULT '[]',
  pricing_positioning     TEXT,
  pricing_positioning_links JSONB DEFAULT '[]',
  demand_risks            TEXT,
  demand_risks_links      JSONB DEFAULT '[]',
  success_conditions      TEXT,

  -- 심각도
  severity_level  TEXT DEFAULT 'normal',
  severity_label  TEXT DEFAULT '보통',
  severity_pct    INTEGER DEFAULT 45,

  -- 차트
  chart_labels    TEXT[] DEFAULT '{}',
  chart_data      INTEGER[] DEFAULT '{}',

  -- 타임라인 & 출처 (JSONB)
  timeline        JSONB DEFAULT '[]',
  sources         JSONB DEFAULT '[]',
  links           JSONB DEFAULT '[]',

  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 생성된 보고서
CREATE TABLE IF NOT EXISTS generated_reports (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword_set_id        UUID REFERENCES keyword_sets(id) ON DELETE SET NULL,
  title                 TEXT NOT NULL,
  start_date            DATE NOT NULL,
  end_date              DATE NOT NULL,
  executive_summary     TEXT,
  question              TEXT NOT NULL,
  answer                TEXT,
  main_insights         JSONB DEFAULT '[]',
  timeline_analysis     JSONB DEFAULT '[]',
  qualitative_analysis  TEXT,
  ref_links             TEXT[] DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ─── updated_at 자동 갱신 트리거 ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER keyword_sets_updated_at
  BEFORE UPDATE ON keyword_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security (RLS) ─────────────────────────────────
ALTER TABLE keyword_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

-- keyword_sets 정책
CREATE POLICY "keyword_sets_select" ON keyword_sets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "keyword_sets_insert" ON keyword_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "keyword_sets_update" ON keyword_sets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "keyword_sets_delete" ON keyword_sets
  FOR DELETE USING (auth.uid() = user_id);

-- generated_reports 정책
CREATE POLICY "reports_select" ON generated_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reports_insert" ON generated_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reports_delete" ON generated_reports
  FOR DELETE USING (auth.uid() = user_id);

-- ─── 인덱스 ─────────────────────────────────────────────────
CREATE INDEX idx_keyword_sets_user_id ON keyword_sets(user_id);
CREATE INDEX idx_keyword_sets_updated_at ON keyword_sets(updated_at DESC);
CREATE INDEX idx_reports_user_id ON generated_reports(user_id);
CREATE INDEX idx_reports_keyword_set_id ON generated_reports(keyword_set_id);
