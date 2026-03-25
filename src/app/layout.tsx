import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import SessionProvider from '@/components/auth/SessionProvider';
import PlanBadge from '@/components/upsell/PlanBadge';
import LogoutButton from '@/components/auth/LogoutButton';
import './globals.css';

export const metadata: Metadata = {
  title: "AI 생기부 친구 ✨",
  description: '나만의 세특과 탐구보고서를 AI로 5분 만에 완성하세요',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#fdf6fa" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <SessionProvider>
          <div className="mx-auto min-h-screen max-w-4xl px-4 pb-safe">
            {/* ── Navigation ── */}
            <nav className="flex items-center justify-between py-3 sm:py-4">
              <Link href={session ? '/dashboard' : '/'} className="flex items-center gap-2 group">
                <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-400 to-pink-300 text-base sm:text-lg shadow-md group-hover:shadow-pink-200 transition-all">
                  📝
                </span>
                <span className="font-bold text-sm sm:text-base gradient-text">AI 생기부</span>
                <span className="hidden sm:inline font-bold text-sm sm:text-base gradient-text">친구</span>
              </Link>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {session ? (
                  <>
                    {/* 플랜 배지 */}
                    <PlanBadge plan={session.user?.plan ?? 'free'} />

                    <Link
                      href="/batch"
                      className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-orange-600 transition-all hover:bg-orange-100 hover:border-orange-300 active:scale-95"
                    >
                      <span>📦</span><span className="hidden xs:inline sm:inline">배치</span>
                    </Link>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-purple-600 transition-all hover:bg-purple-100 hover:border-purple-300 active:scale-95"
                    >
                      <span>🏠</span><span className="hidden xs:inline sm:inline">홈</span>
                    </Link>
                    <Link
                      href="/my"
                      className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-pink-200 bg-pink-50 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-pink-500 transition-all hover:bg-pink-100 hover:border-pink-300 active:scale-95"
                    >
                      <span>👤</span><span className="hidden xs:inline sm:inline">마이</span>
                    </Link>
                    <LogoutButton />
                  </>
                ) : (
                  <>
                    <Link
                      href="/batch"
                      className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-orange-600 transition-all hover:bg-orange-100 hover:border-orange-300 active:scale-95"
                    >
                      <span>📦</span><span className="hidden xs:inline sm:inline">배치</span>
                    </Link>
                    <Link
                      href="/history"
                      className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-pink-200 bg-pink-50 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-pink-500 transition-all hover:bg-pink-100 hover:border-pink-300 active:scale-95"
                    >
                      <span>🗂️</span><span className="hidden xs:inline sm:inline">이력</span>
                    </Link>
                    <Link
                      href="/login"
                      className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-1.5 text-xs sm:text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
                    >
                      로그인
                    </Link>
                  </>
                )}
              </div>
            </nav>
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
