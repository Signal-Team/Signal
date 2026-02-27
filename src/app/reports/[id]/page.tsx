'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { ArrowLeft, Printer } from 'lucide-react';
import type { GeneratedReport } from '@/types';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: report, isLoading } = useQuery<GeneratedReport>({
    queryKey: ['report', id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">보고서를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 탑 바 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/reports')}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            보고서 목록으로
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            인쇄
          </button>
        </div>

        {/* 보고서 헤더 */}
        <div className="rounded-2xl p-8 mb-6 text-white" style={{ background: 'var(--signal-gradient)' }}>
          <h1 className="text-2xl font-bold mb-2">{report.title}</h1>
          <p className="text-indigo-200 text-sm">
            분석 기간: {report.start_date} ~ {report.end_date} · 생성일: {new Date(report.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>

        {/* 1. 요약 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">1</span>
            <h2 className="text-lg font-bold text-gray-900">요약 (Executive Summary)</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">{report.executive_summary}</p>
        </div>

        {/* 2. 주요 분석 타임라인 */}
        {report.main_insights?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">2</span>
              <h2 className="text-lg font-bold text-gray-900">주요 분석 타임라인</h2>
            </div>
            <div className="space-y-3">
              {report.main_insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-4 ${
                    insight.severity === 'high'
                      ? 'bg-red-50 border border-red-100'
                      : insight.severity === 'medium'
                      ? 'bg-yellow-50 border border-yellow-100'
                      : 'bg-blue-50 border border-blue-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold ${
                      insight.severity === 'high' ? 'bg-red-500' :
                      insight.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}>{idx + 1}</span>
                    <p className="font-semibold text-gray-900 text-sm">{insight.title}</p>
                  </div>
                  <p className="text-sm text-gray-700 ml-7">{insight.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. 핵심 질문 & 답변 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">3</span>
            <h2 className="text-lg font-bold text-gray-900">핵심 질문 & AI 답변</h2>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">핵심 질문</p>
            <p className="text-gray-800 font-medium">{report.question}</p>
          </div>
          <div
            className="text-gray-700 leading-relaxed text-sm"
            dangerouslySetInnerHTML={{ __html: report.answer }}
          />
        </div>

        {/* 4. 참고 자료 */}
        {report.ref_links?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">4</span>
              <h2 className="text-lg font-bold text-gray-900">참고 자료</h2>
            </div>
            <ul className="space-y-2">
              {report.ref_links.map((ref, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">•</span>
                  {ref}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
