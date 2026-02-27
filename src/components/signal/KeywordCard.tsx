'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import type { KeywordSet } from '@/types';

interface Props {
  keywordSet: KeywordSet;
}

export function KeywordCard({ keywordSet }: Props) {
  const severityConfig = {
    low: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: TrendingDown },
    normal: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Minus },
    high: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: TrendingUp },
    critical: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: TrendingUp },
  };

  const level = keywordSet.severity_level ?? 'normal';
  const config = severityConfig[level] ?? severityConfig.normal;
  const SeverityIcon = config.icon;

  return (
    <Link href={`/tracker/${keywordSet.id}`}>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate mb-1">{keywordSet.title}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {keywordSet.update_frequency} 업데이트 · {keywordSet.category}
            </div>
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color} ${config.bg} border ${config.border} ml-3 shrink-0`}>
            <SeverityIcon className="w-3 h-3" />
            {keywordSet.severity_label ?? '보통'}
            {keywordSet.severity_pct !== undefined && (
              <span className="ml-0.5">{keywordSet.severity_pct}%</span>
            )}
          </div>
        </div>

        {/* 키워드 태그 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {keywordSet.keywords?.slice(0, 4).map((k, i) => (
            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium">
              {k}
            </span>
          ))}
          {(keywordSet.keywords?.length ?? 0) > 4 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{keywordSet.keywords!.length - 4}
            </span>
          )}
        </div>

        {/* AI 한줄 요약 */}
        {keywordSet.ai_one_liner ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 mb-3">
            <p className="text-xs text-indigo-600 font-semibold mb-0.5">AI 한줄 요약</p>
            <div
              className="text-xs text-gray-700 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: keywordSet.ai_one_liner }}
            />
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl px-3 py-2 mb-3">
            <p className="text-xs text-gray-400">AI 분석 진행 중...</p>
          </div>
        )}

        {/* 마지막 타임라인 항목 */}
        {keywordSet.timeline && keywordSet.timeline.length > 0 && (
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${
              keywordSet.timeline[keywordSet.timeline.length - 1].dot === 'critical' ? 'bg-red-400' :
              keywordSet.timeline[keywordSet.timeline.length - 1].dot === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
            }`} />
            <span className="line-clamp-1">{keywordSet.timeline[keywordSet.timeline.length - 1].content}</span>
          </div>
        )}

        {/* 마지막 수정 */}
        <p className="text-xs text-gray-300 mt-3">
          {new Date(keywordSet.updated_at).toLocaleString('ko-KR')} 업데이트
        </p>
      </div>
    </Link>
  );
}
