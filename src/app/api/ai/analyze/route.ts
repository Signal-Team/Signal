import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// ── 요청 바디 타입 ────────────────────────────────────────────
interface AnalyzeRequest {
  keyword_set_id: string;   // 어떤 키워드 세트를 분석할지
  keywords: string[];        // 추적 키워드 목록
  question: string;          // 사용자의 전략 질문
  category: string;          // 카테고리 (영화, 패션 등)
  trigger_type?: 'manual' | 'scheduled'; // 분석 트리거 유형 (기본값: manual)
}

// ── update_frequency → 시간(number) 변환 헬퍼 ────────────────
// '6h' → 6, '12h' → 12, '24h' → 24
// Edge Function의 자동 분석이나 next_analyze_at 계산에 사용
function freqToHours(freq: string): number {
  const map: Record<string, number> = { '6h': 6, '12h': 12, '24h': 24 };
  return map[freq] ?? 24; // 알 수 없는 값이면 24시간으로 fallback
}

export async function POST(request: NextRequest) {
  try {
    // ── 환경변수 체크 ───────────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // ── 요청 파싱 ───────────────────────────────────────────
    const {
      keyword_set_id,
      keywords,
      question,
      category,
      trigger_type = 'manual', // 명시하지 않으면 수동 분석으로 간주
    }: AnalyzeRequest = await request.json();

    if (!keywords?.length || !question) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
    }

    // ── Claude API 클라이언트 초기화 ────────────────────────
    const client = new Anthropic({ apiKey });

    // ── 시스템 프롬프트 ─────────────────────────────────────
    // Claude에게 역할과 응답 형식을 지정하는 지시사항
    // 반드시 JSON만 반환하도록 강제 → 이후 파싱을 안정적으로 처리
    const systemPrompt = `당신은 마케팅 실무자를 위한 키워드 분석 전문가입니다.
사용자가 입력한 키워드와 질문을 분석하여, 전략적 인사이트를 제공합니다.

반드시 다음 JSON 형식으로만 응답하세요:
{
  "ai_one_liner": "한 줄 핵심 요약 (50자 이내)",
  "ai_body": "상세 분석 답변 (HTML 형식 허용, 300-500자)",
  "ai_cases": "유사 사례 및 시장 신호 (HTML 형식 허용, 200-300자)",
  "ai_metrics": "추적해야 할 핵심 지표들 (HTML 목록 형식)",
  "ai_ops": "운영 체크리스트 및 KPI (HTML 목록 형식)",
  "ai_recommendations": "추천 실행안 요약 (HTML 목록 형식)",
  "severity_level": "low|normal|high|critical",
  "severity_label": "낮음|보통|높음|긴급",
  "severity_pct": 0-100,
  "timeline": [
    { "date": "날짜", "dot": "info|warning|critical", "tagText": "태그", "content": "내용" }
  ],
  "sources": [
    { "title": "출처 제목", "url": "URL (있을 경우)", "date": "날짜" }
  ],
  "chart_labels": ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "D0"],
  "chart_data": [숫자 배열 7개]
}`;

    // ── 사용자 메시지 ───────────────────────────────────────
    const userMessage = `카테고리: ${category}
키워드: ${keywords.join(', ')}
핵심 질문: ${question}

위 키워드와 질문에 대한 마케팅 전략 분석을 JSON 형식으로 제공해주세요.`;

    // ── Claude API 호출 ─────────────────────────────────────
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: userMessage }],
      system: systemPrompt,
    });

    // ── 응답 텍스트 추출 ────────────────────────────────────
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // ── JSON 파싱 ───────────────────────────────────────────
    // Claude가 JSON 외에 다른 텍스트를 앞뒤에 붙일 수 있으므로
    // 정규식으로 JSON 블록만 추출
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 500 });
    }

    const analysisResult = JSON.parse(jsonMatch[0]);

    // ── Supabase 저장 ───────────────────────────────────────
    if (keyword_set_id) {
      const { createClient: createServerClient } = await import('@/lib/supabase/server');
      const supabase = await createServerClient();

      // 현재 시각 (분석 완료 시각으로 사용)
      const now = new Date().toISOString();

      // ── keyword_sets 조회 (update_frequency 확인용) ───────
      // 다음 분석 예정 시각(next_analyze_at)을 계산하려면
      // 이 키워드 세트의 업데이트 주기를 알아야 함
      const { data: keywordSet } = await supabase
        .from('keyword_sets')
        .select('update_frequency')
        .eq('id', keyword_set_id)
        .single();

      // 다음 분석 예정 시각 계산
      // 예: update_frequency = '6h' → 지금으로부터 6시간 후
      const hours = freqToHours(keywordSet?.update_frequency ?? '24h');
      const nextAnalyzeAt = new Date(
        Date.now() + hours * 60 * 60 * 1000
      ).toISOString();

      // ── 1. keyword_sets 업데이트 ─────────────────────────
      // 최신 분석 결과로 덮어씀 (빠른 조회를 위해 최신값 유지)
      // + 분석 상태 컬럼 갱신
      await supabase
        .from('keyword_sets')
        .update({
          // AI 분석 결과
          ai_one_liner:       analysisResult.ai_one_liner,
          ai_body:            analysisResult.ai_body,
          ai_cases:           analysisResult.ai_cases,
          ai_metrics:         analysisResult.ai_metrics,
          ai_ops:             analysisResult.ai_ops,
          ai_recommendations: analysisResult.ai_recommendations,

          // 심각도
          severity_level: analysisResult.severity_level ?? 'normal',
          severity_label: analysisResult.severity_label ?? '보통',
          severity_pct:   analysisResult.severity_pct   ?? 50,

          // 차트 & 타임라인
          timeline:     analysisResult.timeline     ?? [],
          sources:      analysisResult.sources      ?? [],
          chart_labels: analysisResult.chart_labels ?? ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'D0'],
          chart_data:   analysisResult.chart_data   ?? [10, 15, 12, 18, 22, 25, 30],

          // 분석 상태 컬럼 갱신 (002 마이그레이션에서 추가한 컬럼들)
          is_analyzing:     false,      // 분석 완료 → false로 되돌림
          last_analyzed_at: now,        // 마지막 분석 시각 기록
          next_analyze_at:  nextAnalyzeAt, // 다음 자동 분석 예정 시각

          updated_at: now,
        })
        .eq('id', keyword_set_id);

      // ── 2. keyword_analysis_history INSERT ───────────────
      // 이번 분석 결과의 스냅샷을 이력 테이블에 별도 저장
      // keyword_sets는 덮어쓰기지만, 이력 테이블은 누적 저장
      //
      // user_id를 얻기 위해 현재 로그인한 유저 정보를 가져옴
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('keyword_analysis_history')
          .insert({
            keyword_set_id,
            user_id: user.id,

            // 분석 결과 스냅샷 (keyword_sets와 동일한 값)
            ai_one_liner:       analysisResult.ai_one_liner,
            ai_body:            analysisResult.ai_body,
            ai_cases:           analysisResult.ai_cases,
            ai_metrics:         analysisResult.ai_metrics,
            ai_ops:             analysisResult.ai_ops,
            ai_recommendations: analysisResult.ai_recommendations,
            severity_level:     analysisResult.severity_level ?? 'normal',
            severity_label:     analysisResult.severity_label ?? '보통',
            severity_pct:       analysisResult.severity_pct   ?? 50,
            timeline:           analysisResult.timeline     ?? [],
            sources:            analysisResult.sources      ?? [],
            chart_labels:       analysisResult.chart_labels ?? [],
            chart_data:         analysisResult.chart_data   ?? [],

            // 이 분석이 수동인지 자동인지 기록
            // 'manual'    → 사용자가 재분석 버튼 클릭
            // 'scheduled' → Cron Edge Function이 자동 실행
            trigger_type,

            // analyzed_at은 DEFAULT now()이므로 생략 가능하지만
            // 명시적으로 now를 넣어 keyword_sets.last_analyzed_at과 일치시킴
            analyzed_at: now,
          });
      }
    }

    // ── 응답 반환 ───────────────────────────────────────────
    return NextResponse.json({ data: analysisResult });

  } catch (error) {
    console.error('AI Analyze Error:', error);

    // 에러 발생 시 is_analyzing을 false로 복구
    // (분석 시작 전에 true로 바꿨다면 stuck 상태가 되는 것을 방지)
    // ※ 현재는 시작 시점에 is_analyzing = true 로 바꾸는 로직이 없으므로
    //   향후 낙관적 업데이트 구현 시 여기에 복구 로직 추가 필요
    return NextResponse.json(
      { error: '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
