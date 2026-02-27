'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { FileText, Trash2, ArrowRight } from 'lucide-react';
import type { GeneratedReport } from '@/types';

export default function ReportsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery<GeneratedReport[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('generated_reports').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Reports</h2>
          <p className="text-gray-500">
            {reports.length > 0
              ? '생성된 리포트를 확인하거나 새로운 리포트를 만들 수 있습니다.'
              : '키워드 상세 페이지에서 보고서를 생성해주세요.'}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">생성된 리포트가 없습니다</h3>
            <p className="text-gray-500 mb-6">
              키워드 상세 페이지에서 &quot;보고서 생성&quot;을 클릭해 첫 리포트를 만들어보세요.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 text-white font-semibold rounded-xl"
              style={{ background: 'var(--signal-gradient)' }}
            >
              대시보드로 이동
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="relative group">
                <div
                  onClick={() => router.push(`/reports/${report.id}`)}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{report.title}</h4>
                      <p className="text-sm text-gray-400 mb-3">
                        {report.start_date} ~ {report.end_date} · {new Date(report.created_at).toLocaleDateString('ko-KR')} 생성
                      </p>
                      {report.executive_summary && (
                        <p className="text-sm text-gray-600 line-clamp-2">{report.executive_summary}</p>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-1 text-indigo-600 text-sm font-semibold">
                      보기 <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('이 리포트를 삭제하시겠습니까?')) {
                      deleteMutation.mutate(report.id);
                    }
                  }}
                  className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
