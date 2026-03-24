'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? '회원가입에 실패했습니다.');
      setLoading(false);
      return;
    }

    // 가입 후 자동 로그인
    const loginRes = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/dashboard',
    });

    setLoading(false);

    if (loginRes?.error) {
      router.push('/login');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* 로고 */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-400 to-pink-300 text-3xl shadow-lg">
          📝
        </span>
        <h1 className="text-2xl font-bold gradient-text">AI 생기부 Maker</h1>
        <p className="text-sm text-purple-400">무료로 시작하세요</p>
      </div>

      {/* 회원가입 카드 */}
      <div className="glass-card w-full max-w-sm rounded-3xl p-8">
        <h2 className="mb-6 text-center text-lg font-bold text-purple-900">회원가입</h2>

        <form onSubmit={handleSignup} className="space-y-3">
          <input
            type="text"
            placeholder="이름 (선택)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl border border-purple-100 bg-white/70 px-4 py-3 text-sm text-purple-900 placeholder-purple-300 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
          />
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-purple-100 bg-white/70 px-4 py-3 text-sm text-purple-900 placeholder-purple-300 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
          />
          <input
            type="password"
            placeholder="비밀번호 (8자 이상)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-purple-100 bg-white/70 px-4 py-3 text-sm text-purple-900 placeholder-purple-300 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            className="w-full rounded-xl border border-purple-100 bg-white/70 px-4 py-3 text-sm text-purple-900 placeholder-purple-300 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-500 py-3.5 text-sm font-bold text-white transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
          >
            {loading ? '가입 중…' : '이메일로 시작하기'}
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-purple-400">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-semibold text-fuchsia-500 hover:underline">
            로그인
          </Link>
        </p>

        {/* 구분선 */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 border-t border-purple-100" />
          <span className="text-xs text-purple-300">또는</span>
          <div className="flex-1 border-t border-purple-100" />
        </div>

        {/* 카카오 */}
        <button
          onClick={() => signIn('kakao', { callbackUrl: '/dashboard' })}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#FEE500] py-3.5 text-sm font-bold text-[#3C1E1E] transition-all hover:brightness-95 active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.657 5.07 4.16 6.47L5.09 21l5.02-2.64C10.69 18.45 11.34 18.5 12 18.5c5.523 0 10-3.477 10-7.7C22 6.477 17.523 3 12 3z"/>
          </svg>
          카카오로 시작하기
        </button>

        <p className="mt-6 text-center text-xs text-purple-300">
          가입 시{' '}
          <span className="underline cursor-pointer">이용약관</span>
          {' '}및{' '}
          <span className="underline cursor-pointer">개인정보처리방침</span>
          에 동의합니다
        </p>
      </div>
    </div>
  );
}
