'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import type { KeywordSet, GeneratedReport } from '@/types';

function AccordionItem({
  id,
  title,
  children,
  openIds,
  onToggle,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  openIds: string[];
  onToggle: (id: string) => void;
}) {
  const isOpen = openIds.includes(id);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="w-full bg-white hover:bg-gray-50 px-5 py-4 flex justify-between items-center transition-colors"
      >
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="bg-gray-50 px-5 py-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

export default function TrackerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'ai' | 'timeline'>('ai');
  const [openAccordions, setOpenAccordions] = useState(['detail', 'cases', 'metrics', 'ops', 'recommendations']);

  const toggleAccordion = (accordionId: string) => {
    setOpenAccordions((prev) =>
      prev.includes(accordionId) ? prev.filter((i) => i !== accordionId) : [...prev, accordionId]
    );
  };

  const { data: keywordSet, isLoading, refetch } = useQuery<KeywordSet>({
    queryKey: ['keywordSet', id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('keyword_sets')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      if (!keywordSet) throw new Error('키워드 세트 없음');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인 필요');

      const { data, error } = await supabase
        .from('generated_reports')
        .insert({
          user_id: user.id,
          keyword_set_id: keywordSet.id,
          title: `${keywordSet.title} - 키워드 변화 추적 보고서`,
          start_date: new Date(keywordSet.created_at).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          executive_summary: keywordSet.ai_one_liner || '분석 결과를 요약합니다.',
          question: keywordSet.question,
          answer: keywordSet.ai_body || '분석 중입니다.',
          main_insights: (keywordSet.timeline ?? []).slice(0, 4).map((t, idx) => ({
            title: t.tagText || `인사이트 ${idx + 1}`,
            content: t.content,
            severity: t.dot === 'critical' ? 'high' : t.dot === 'warning' ? 'medium' : 'low',
          })),
          timeline_analysis: (keywordSet.timeline ?? []).map((t) => ({
            date: t.date,
            title: t.tagText,
            description: t.content,
            impact: t.dot === 'critical' ? '높음' : t.dot === 'warning' ? '중간' : '낮음',
          })),
          qualitative_analysis: keywordSet.ai_body || '정성 분석 내용입니다.',
          ref_links: (keywordSet.sources ?? []).map((s) => `${s.title}${s.url ? ` (${s.url})` : ''}`),
        } satisfies Omit<GeneratedReport, 'id' | 'created_at'>)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (report) => {
      router.push(`/reports/${report.id}`);
    },
  });

  const reanalyzeMutation = useMutation({
    mutationFn: async () => {
      if (!keywordSet) return;
      await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword_set_id: keywordSet.id,
          keywords: keywordSet.keywords,
          question: keywordSet.question,
          category: keywordSet.category,
        }),
      });
    },
    onSuccess: () => {
      setTimeout(() => refetch(), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!keywordSet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">키워드 세트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold mb-6 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          대시보드로 돌아가기
        </Link>

        {/* 헤더 카드 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{keywordSet.title}</h1>
            <div className="flex gap-2">
              <button
                onClick={() => reanalyzeMutation.mutate()}
                disabled={reanalyzeMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${reanalyzeMutation.isPending ? 'animate-spin' : ''}`} />
                재분석
              </button>
              <button
                onClick={() => generateReportMutation.mutate()}
                disabled={generateReportMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
                style={{ background: 'var(--signal-gradient)' }}
              >
                <FileText className="w-4 h-4" />
                {generateReportMutation.isPending ? '생성 중...' : '보고서 생성'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {keywordSet.keywords?.map((k, i) => (
              <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full font-medium">
                {k}
              </span>
            ))}
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full">
              {keywordSet.category}
            </span>
          </div>

          <div className="flex gap-6 text-sm text-gray-500">
            <span>업데이트: <strong className="text-gray-700">{keywordSet.update_frequency}</strong></span>
            <span>마지막 수정: <strong className="text-gray-700">{new Date(keywordSet.updated_at).toLocaleString('ko-KR')}</strong></span>
            {keywordSet.purpose && (
              <span>추적 목적: <strong className="text-gray-700">{keywordSet.purpose}</strong></span>
            )}
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-4 mb-6 border-b-2 border-gray-200">
          {(['ai', 'timeline'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-indigo-600 border-b-4 border-indigo-600 -mb-0.5'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'ai' ? 'AI 분석' : '타임라인 & 출처'}
            </button>
          ))}
        </div>

        {/* AI 분석 탭 */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">핵심 질문</p>
                <p className="text-gray-800 font-medium">{keywordSet.question}</p>
              </div>

              {keywordSet.ai_one_liner ? (
                <div className="border-l-4 border-indigo-500 bg-indigo-50 rounded-r-xl p-4 mb-6">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">AI 한줄 요약</p>
                  <div
                    className="text-gray-800 font-medium leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: keywordSet.ai_one_liner }}
                  />
                </div>
              ) : (
                <div className="border border-dashed border-indigo-200 rounded-xl p-6 text-center text-gray-400 mb-6">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 text-indigo-200" />
                  <p className="text-sm">AI 분석이 진행 중입니다. 잠시 후 새로고침 해주세요.</p>
                </div>
              )}

              <div className="space-y-3">
                {keywordSet.ai_body && (
                  <AccordionItem id="detail" title="상세 답변" openIds={openAccordions} onToggle={toggleAccordion}>
                    <div className="text-gray-700 leading-relaxed text-sm"
                      dangerouslySetInnerHTML={{ __html: keywordSet.ai_body }} />
                  </AccordionItem>
                )}
                {keywordSet.ai_cases && (
                  <AccordionItem id="cases" title="유사 사례 / 시장 신호" openIds={openAccordions} onToggle={toggleAccordion}>
                    <div className="text-gray-700 leading-relaxed text-sm"
                      dangerouslySetInnerHTML={{ __html: keywordSet.ai_cases }} />
                    {keywordSet.links?.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-indigo-600 text-sm hover:underline mt-2">
                        <ExternalLink className="w-3 h-3" />{link.label}
                      </a>
                    ))}
                  </AccordionItem>
                )}
                {keywordSet.ai_metrics && (
                  <AccordionItem id="metrics" title="추적할 지표" openIds={openAccordions} onToggle={toggleAccordion}>
                    <div className="text-gray-700 leading-relaxed text-sm"
                      dangerouslySetInnerHTML={{ __html: keywordSet.ai_metrics }} />
                  </AccordionItem>
                )}
                {keywordSet.ai_ops && (
                  <AccordionItem id="ops" title="운영 체크리스트 & KPI" openIds={openAccordions} onToggle={toggleAccordion}>
                    <div className="text-gray-700 leading-relaxed text-sm"
                      dangerouslySetInnerHTML={{ __html: keywordSet.ai_ops }} />
                  </AccordionItem>
                )}
                {keywordSet.ai_recommendations && (
                  <AccordionItem id="recommendations" title="추천 실행안 요약" openIds={openAccordions} onToggle={toggleAccordion}>
                    <div className="text-gray-700 leading-relaxed text-sm"
                      dangerouslySetInnerHTML={{ __html: keywordSet.ai_recommendations }} />
                  </AccordionItem>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 타임라인 탭 */}
        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-5">변화 타임라인</h3>
              <div className="space-y-4">
                {(keywordSet.timeline ?? []).slice().reverse().map((item, idx) => (
                  <div key={idx} className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-l-0">
                    <div className={`absolute -left-2 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                      item.dot === 'critical' ? 'bg-red-500' :
                      item.dot === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="font-semibold text-gray-900 text-sm">
                      {item.date}
                      {item.tagText && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                          {item.tagText}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
              <h3 className="text-lg font-bold text-gray-900 mb-5">출처 및 참고 자료</h3>
              <div className="space-y-3 mb-6">
                {(keywordSet.sources ?? []).map((source, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="font-semibold text-gray-900 text-sm mb-1">{source.title}</p>
                    {source.date && <p className="text-xs text-gray-400 mb-2">{source.date}</p>}
                    {source.url && (
                      <a href={source.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                        출처 보기 <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
                {(keywordSet.sources ?? []).length === 0 && (
                  <p className="text-sm text-gray-400">출처 정보가 없습니다.</p>
                )}
              </div>

              <div className="pt-5 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">업데이트 주기</p>
                <p className="text-gray-700 font-medium">
                  {keywordSet.update_frequency === '6h' && 'Every 6 hours'}
                  {keywordSet.update_frequency === '12h' && 'Every 12 hours'}
                  {keywordSet.update_frequency === '24h' && 'Every 24 hours'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  다음 업데이트:{' '}
                  {new Date(
                    new Date(keywordSet.updated_at).getTime() +
                      (keywordSet.update_frequency === '6h' ? 6 :
                       keywordSet.update_frequency === '12h' ? 12 : 24) * 60 * 60 * 1000
                  ).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
