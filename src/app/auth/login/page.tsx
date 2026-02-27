'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

const inputClass =
  'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else setMessage('확인 이메일을 발송했습니다. 이메일을 확인해주세요.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else {
        router.push('/dashboard');
        router.refresh();
      }
    }

    setLoading(false);
  };

  const switchTab = (signup: boolean) => {
    setIsSignUp(signup);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-1.5" style={{ background: 'var(--signal-gradient)' }} />

          <div className="px-8 pt-8 pb-9">
            <div className="text-center mb-7">
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1.5 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold signal-gradient-text">Signal</span>
              </Link>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {isSignUp ? '새 계정 만들기' : '로그인'}
              </h1>
              <p className="text-sm text-gray-400">
                {isSignUp ? '정보를 입력하고 간편하게 가입하세요' : '계정에 로그인하세요'}
              </p>
            </div>

            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => switchTab(false)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  !isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => switchTab(true)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                회원가입
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass}
                  placeholder="6자 이상"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}
              {message && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
                style={{ background: loading ? '#a5b4fc' : 'var(--signal-gradient)' }}
              >
                {loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center mt-5">
          <Link href="/" className="text-sm text-gray-400 hover:text-indigo-600 transition-colors">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
