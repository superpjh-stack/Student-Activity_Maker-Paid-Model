import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: "AI 생기부 Maker ✨",
  description: '나만의 세특과 탐구보고서를 AI로 5분 만에 완성하세요',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#faf7ff" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <div className="mx-auto min-h-screen max-w-4xl px-4 pb-safe">
          {/* ── Navigation ── */}
          <nav className="flex items-center justify-between py-3 sm:py-4">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-base sm:text-lg shadow-md group-hover:shadow-violet-200 transition-all">
                📝
              </span>
              <span className="font-bold text-sm sm:text-base gradient-text">AI 생기부</span>
              <span className="hidden sm:inline font-bold text-sm sm:text-base gradient-text">Maker</span>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/batch"
                className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-orange-600 transition-all hover:bg-orange-100 hover:border-orange-300 active:scale-95"
              >
                <span>📦</span><span className="hidden xs:inline sm:inline">배치</span>
              </Link>
              <Link
                href="/history"
                className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-violet-600 transition-all hover:bg-violet-100 hover:border-violet-300 active:scale-95"
              >
                <span>🗂️</span><span className="hidden xs:inline sm:inline">이력</span>
              </Link>
            </div>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
