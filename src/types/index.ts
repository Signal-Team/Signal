// ─── Signal 타입 정의 ──────────────────────────────

export type { User } from '@supabase/supabase-js';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// 카테고리
export type Category =
  | '음악'
  | '패션'
  | '요리'
  | '기술'
  | '여행'
  | '건강'
  | '교육'
  | '영화'
  | '기타';

// 업데이트 주기
export type UpdateFrequency = '6h' | '12h' | '24h';

// 심각도
export type SeverityLevel = 'low' | 'normal' | 'high' | 'critical';

// 타임라인 항목
export interface TimelineItem {
  date: string;
  dot: 'info' | 'warning' | 'critical';
  tagText: string;
  content: string;
}

// 출처
export interface Source {
  title: string;
  url?: string;
  date?: string;
}

// 참고 링크
export interface Link {
  label: string;
  url: string;
}

// 키워드 세트 (핵심 데이터 모델)
export interface KeywordSet {
  id: string;
  user_id: string;
  title: string;
  keywords: string[];
  question: string;
  purpose?: string;
  category: Category;
  update_frequency: UpdateFrequency;

  // AI 분석 결과
  ai_one_liner?: string;
  ai_body?: string;
  ai_cases?: string;
  ai_metrics?: string;
  ai_ops?: string;
  ai_recommendations?: string;
  space_suitability?: string;
  space_suitability_links?: Link[];
  pricing_positioning?: string;
  pricing_positioning_links?: Link[];
  demand_risks?: string;
  demand_risks_links?: Link[];
  success_conditions?: string;

  // 차트 데이터
  chart_labels?: string[];
  chart_data?: number[];

  // 타임라인 & 출처
  timeline?: TimelineItem[];
  sources?: Source[];
  links?: Link[];

  // 심각도
  severity_level?: SeverityLevel;
  severity_label?: string;
  severity_pct?: number;

  // 타임스탬프
  created_at: string;
  updated_at: string;
}

// 키워드 세트 생성 폼 데이터
export interface CreateKeywordSetInput {
  keywords: string[];
  question: string;
  purpose?: string;
  category: Category;
  update_frequency: UpdateFrequency;
}

// 생성된 보고서
export interface GeneratedReport {
  id: string;
  user_id: string;
  keyword_set_id: string;
  title: string;
  start_date: string;
  end_date: string;
  executive_summary: string;
  question: string;
  answer: string;
  main_insights: {
    title: string;
    content: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  timeline_analysis: {
    date: string;
    title: string;
    description: string;
    impact: string;
  }[];
  qualitative_analysis: string;
  ref_links: string[];
  created_at: string;
}

// AI 분석 요청
export interface AnalyzeRequest {
  keywords: string[];
  question: string;
  category: Category;
}

// AI 분석 응답
export interface AnalyzeResponse {
  ai_one_liner: string;
  ai_body: string;
  ai_cases: string;
  ai_metrics: string;
  ai_ops: string;
  ai_recommendations: string;
  timeline: TimelineItem[];
  sources: Source[];
  chart_labels: string[];
  chart_data: number[];
}
