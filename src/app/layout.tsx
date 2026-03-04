import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: "Gerardo의 AI 생기부 Maker",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <div className="mx-auto min-h-screen max-w-4xl px-4">
          <nav className="flex items-center justify-between border-b border-slate-200 py-4">
            <Link href="/" className="text-base font-bold text-indigo-600 hover:text-indigo-700">
              📝 AI 생기부 Maker
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              🗂️ 생성 이력
            </Link>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
