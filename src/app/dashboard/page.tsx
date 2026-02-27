'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { KeywordCard } from '@/components/signal/KeywordCard';
import { AddKeywordModal } from '@/components/signal/AddKeywordModal';
import { Plus, Search, TrendingUp, Trash2 } from 'lucide-react';
import type { KeywordSet, Category, CreateKeywordSetInput } from '@/types';

const CATEGORIES: Category[] = ['음악', '패션', '요리', '기술', '여행', '건강', '교육', '영화', '기타'];

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: keywordSets = [], isLoading } = useQuery<KeywordSet[]>({
    queryKey: ['keywordSets'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('keyword_sets')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateKeywordSetInput) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const title =
        input.keywords.slice(0, 2).join(' · ') +
        (input.keywords.length > 2 ? ` 외 ${input.keywords.length - 2}` : '');

      const { data, error } = await supabase
        .from('keyword_sets')
        .insert({
          user_id: user.id,
          title,
          keywords: input.keywords,
          question: input.question,
          purpose: input.purpose || null,
          category: input.category,
          update_frequency: input.update_frequency,
          severity_level: 'normal',
          severity_label: '보통',
          severity_pct: 45,
          ai_one_liner: null,
          ai_body: null,
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

      // AI 분석 트리거 (백그라운드)
      fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword_set_id: data.id,
          keywords: input.keywords,
          question: input.question,
          category: input.category,
        }),
      }).catch(console.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywordSets'] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('keyword_sets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywordSets'] });
    },
  });

  const filtered = keywordSets.filter((set) => {
    const matchesSearch =
      !searchQuery ||
      set.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.keywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      set.question?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || set.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 페이지 타이틀 + 검색 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">키워드 대시보드</h2>
            <p className="text-gray-500">{filtered.length}개의 키워드 세트 추적 중</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="키워드 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 w-64"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
              style={{ background: 'var(--signal-gradient)' }}
            >
              <Plus className="w-4 h-4" />
              새 키워드
            </button>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            전체
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery || selectedCategory !== 'all'
                ? '검색 결과가 없습니다'
                : '키워드 세트가 없습니다'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || selectedCategory !== 'all'
                ? '다른 검색어나 카테고리를 시도해보세요'
                : '새 키워드를 추가하여 추적을 시작하세요'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 text-white font-semibold rounded-xl"
                style={{ background: 'var(--signal-gradient)' }}
              >
                첫 키워드 추가하기
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((set) => (
              <div key={set.id} className="relative group">
                <KeywordCard keywordSet={set} />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.confirm('이 키워드 세트를 삭제하시겠습니까?')) {
                      deleteMutation.mutate(set.id);
                    }
                  }}
                  className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddKeywordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(input) => createMutation.mutate(input)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
