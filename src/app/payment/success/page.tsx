'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'done' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const authKey = searchParams.get('authKey');
    const customerKey = searchParams.get('customerKey');
    const plan = searchParams.get('plan');
    const period = searchParams.get('period') as 'monthly' | 'annual';

    if (!authKey || !customerKey || !plan) {
      setStatus('error');
      setErrorMsg('결제 정보가 올바르지 않습니다.');
      return;
    }

    fetch('/api/subscription/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authKey, customerKey, plan, period: period ?? 'monthly' }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setStatus('done');
          setTimeout(() => router.push('/dashboard'), 2500);
        } else {
          setStatus('error');
          setErrorMsg(data.error ?? '결제 처리 오류');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('네트워크 오류가 발생했습니다.');
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      {status === 'processing' && (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-3xl animate-spin">
            ⏳
          </div>
          <div>
            <p className="text-lg font-bold text-purple-900">결제를 처리하고 있어요</p>
            <p className="mt-1 text-sm text-purple-400">잠시만 기다려주세요...</p>
          </div>
        </>
      )}

      {status === 'done' && (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            🎉
          </div>
          <div>
            <p className="text-lg font-bold text-purple-900">구독이 시작됐어요!</p>
            <p className="mt-1 text-sm text-purple-400">대시보드로 이동합니다...</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-r from-fuchsia-50 to-pink-50 border border-fuchsia-100 px-6 py-4">
            <p className="text-sm text-fuchsia-700 font-medium">이제 세특을 마음껏 만들어보세요 ✨</p>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
            ⚠️
          </div>
          <div>
            <p className="text-lg font-bold text-purple-900">결제 처리 중 오류가 발생했어요</p>
            <p className="mt-1 text-sm text-red-400">{errorMsg}</p>
          </div>
          <button
            onClick={() => router.push('/pricing')}
            className="btn-gradient rounded-2xl px-6 py-3 text-sm font-bold text-white"
          >
            다시 시도하기
          </button>
        </>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <PaymentSuccessContent />
    </Suspense>
  );
}
