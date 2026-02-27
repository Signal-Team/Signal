import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface AnalyzeRequest {
  keyword_set_id: string;
  keywords: string[];
  question: string;
  category: string;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    const { keyword_set_id, keywords, question, category }: AnalyzeRequest = await request.json();

    if (!keywords?.length || !question) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

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

    const userMessage = `카테고리: ${category}
키워드: ${keywords.join(', ')}
핵심 질문: ${question}

위 키워드와 질문에 대한 마케팅 전략 분석을 JSON 형식으로 제공해주세요.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      system: systemPrompt,
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // JSON 파싱
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 500 });
    }

    const analysisResult = JSON.parse(jsonMatch[0]);

    // Supabase에 결과 저장
    if (keyword_set_id) {
      const { createClient: createServerClient } = await import('@/lib/supabase/server');
      const supabase = await createServerClient();

      await supabase
        .from('keyword_sets')
        .update({
          ai_one_liner: analysisResult.ai_one_liner,
          ai_body: analysisResult.ai_body,
          ai_cases: analysisResult.ai_cases,
          ai_metrics: analysisResult.ai_metrics,
          ai_ops: analysisResult.ai_ops,
          ai_recommendations: analysisResult.ai_recommendations,
          severity_level: analysisResult.severity_level ?? 'normal',
          severity_label: analysisResult.severity_label ?? '보통',
          severity_pct: analysisResult.severity_pct ?? 50,
          timeline: analysisResult.timeline ?? [],
          sources: analysisResult.sources ?? [],
          chart_labels: analysisResult.chart_labels ?? ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'D0'],
          chart_data: analysisResult.chart_data ?? [10, 15, 12, 18, 22, 25, 30],
          updated_at: new Date().toISOString(),
        })
        .eq('id', keyword_set_id);
    }

    return NextResponse.json({ data: analysisResult });
  } catch (error) {
    console.error('AI Analyze Error:', error);
    return NextResponse.json({ error: '분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
