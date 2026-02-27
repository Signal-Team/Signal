'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { Category, UpdateFrequency, CreateKeywordSetInput } from '@/types';

const CATEGORIES: Category[] = ['음악', '패션', '요리', '기술', '여행', '건강', '교육', '영화', '기타'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateKeywordSetInput) => void;
  isLoading?: boolean;
}

export function AddKeywordModal({ isOpen, onClose, onSave, isLoading }: Props) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [question, setQuestion] = useState('');
  const [purpose, setPurpose] = useState('');
  const [category, setCategory] = useState<Category>('기타');
  const [updateFrequency, setUpdateFrequency] = useState<UpdateFrequency>('24h');

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keywords.length === 0 || !question.trim()) return;
    onSave({ keywords, question: question.trim(), purpose: purpose.trim() || undefined, category, update_frequency: updateFrequency });
  };

  const handleClose = () => {
    setKeywords([]);
    setKeywordInput('');
    setQuestion('');
    setPurpose('');
    setCategory('기타');
    setUpdateFrequency('24h');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">새 키워드 세트 추가</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* STEP 1: 키워드 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              키워드 <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                placeholder="키워드 입력 후 추가 버튼 클릭"
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10"
              />
              <button
                type="button"
                onClick={addKeyword}
                className="px-4 py-2.5 text-white text-sm font-semibold rounded-xl flex items-center gap-1"
                style={{ background: 'var(--signal-gradient)' }}
              >
                <Plus className="w-4 h-4" /> 추가
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <span key={kw} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full">
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 핵심 질문 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              핵심 질문 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="추적하고자 하는 핵심 질문을 입력하세요"
              rows={3}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 resize-none"
            />
          </div>

          {/* STEP 2: 추적 목적 (선택) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              추적 목적 <span className="text-gray-400 font-normal text-xs">(선택)</span>
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="예. 신규 콘텐츠 기획 검증"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">카테고리</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    category === cat
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={category === cat ? { background: 'var(--signal-gradient)' } : undefined}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 업데이트 주기 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">업데이트 주기</label>
            <div className="space-y-2">
              {(['6h', '12h', '24h'] as UpdateFrequency[]).map((freq) => (
                <label
                  key={freq}
                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                    updateFrequency === freq
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={freq}
                    checked={updateFrequency === freq}
                    onChange={() => setUpdateFrequency(freq)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">
                    Every {freq}{' '}
                    {freq === '24h' && <span className="text-indigo-500 text-xs">(recommended)</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || keywords.length === 0 || !question.trim()}
              className="flex-1 py-3 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'var(--signal-gradient)' }}
            >
              {isLoading ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
