'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams.get('message') ?? '결제가 취소되었습니다.';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
        😢
      </div>
      <div>
        <p className="text-lg font-bold text-purple-900">결제가 완료되지 않았어요</p>
        <p className="mt-1 text-sm text-purple-400">{message}</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => router.push('/pricing')}
          className="btn-gradient rounded-2xl px-5 py-2.5 text-sm font-bold text-white"
        >
          다시 시도
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="rounded-2xl border border-purple-100 px-5 py-2.5 text-sm text-purple-500 hover:bg-purple-50"
        >
          대시보드로
        </button>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense>
      <PaymentFailContent />
    </Suspense>
  );
}
