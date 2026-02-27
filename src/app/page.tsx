import { AuthButton } from '@/components/auth/AuthButton';
import Link from 'next/link';
import { TrendingUp, Zap, BarChart2, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* 네비게이션 */}
      <nav className="border-b border-indigo-100/50 px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1.5 rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold signal-gradient-text">Signal</span>
        </div>
        <AuthButton />
      </nav>

      {/* 히어로 섹션 */}
      <main className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full text-sm font-medium text-indigo-700 mb-8">
          <Zap className="w-4 h-4" />
          2026 Blaybus 인사이트톤
        </div>

        <h1 className="text-5xl font-black mb-6 leading-tight">
          <span className="signal-gradient-text">Signal</span>
          <br />
          <span className="text-gray-900">마케팅 실무자를 위한</span>
          <br />
          <span className="text-gray-700 text-4xl">키워드 변화 추적 플랫폼</span>
        </h1>

        <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
          추적하고 싶은 키워드와 핵심 질문을 입력하면,<br />
          AI가 맞춤형으로 분석 결과와 인사이트를 제공합니다.
        </p>

        <div className="flex gap-4 justify-center mb-20">
          <Link
            href="/auth/login"
            className="px-8 py-4 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
            style={{ background: 'var(--signal-gradient)' }}
          >
            무료로 시작하기
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
          >
            대시보드 보기
          </Link>
        </div>

        {/* 기능 소개 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="bg-indigo-100 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">키워드 추적</h3>
            <p className="text-sm text-gray-500">
              관심 키워드를 등록하고 6h / 12h / 24h 주기로 자동 업데이트 받으세요.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="bg-purple-100 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">AI 분석 인사이트</h3>
            <p className="text-sm text-gray-500">
              단순 데이터가 아닌 AI가 전략적 방향성까지 제시하는 맞춤형 분석을 제공합니다.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="bg-blue-100 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">보고서 생성</h3>
            <p className="text-sm text-gray-500">
              분석 결과를 보고서 형식으로 정리하여 실무에서 바로 활용하세요.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
