import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/keywords - 키워드 세트 목록
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

    const { data, error } = await supabase
      .from('keyword_sets')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/keywords:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// POST /api/keywords - 키워드 세트 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

    const body = await request.json();
    const { keywords, question, purpose, category, update_frequency } = body;

    if (!keywords?.length || !question || !category || !update_frequency) {
      return NextResponse.json({ error: '필수 필드 누락' }, { status: 400 });
    }

    const title =
      keywords.slice(0, 2).join(' · ') +
      (keywords.length > 2 ? ` 외 ${keywords.length - 2}` : '');

    const { data, error } = await supabase
      .from('keyword_sets')
      .insert({
        user_id: user.id,
        title,
        keywords,
        question,
        purpose: purpose || null,
        category,
        update_frequency,
        severity_level: 'normal',
        severity_label: '보통',
        severity_pct: 45,
        timeline: [
          {
            date: new Date().toLocaleDateString('ko-KR'),
            dot: 'info',
            tagText: '등록',
            content: '키워드 세트가 등록되었습니다.',
          },
        ],
        chart_labels: ['D-2', 'D-1', 'D0'],
        chart_data: [10, 12, 15],
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/keywords:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
