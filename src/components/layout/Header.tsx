'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, LayoutDashboard, FileText } from 'lucide-react';
import { AuthButton } from '@/components/auth/AuthButton';

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* 로고 */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold signal-gradient-text leading-none">Signal</h1>
              <p className="text-xs text-gray-400">키워드 변화 추적 플랫폼</p>
            </div>
          </Link>

          {/* 네비게이션 */}
          <div className="flex items-center gap-4">
            <nav className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                    pathname.startsWith(href)
                      ? 'bg-white text-indigo-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}
