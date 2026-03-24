'use client';

import { useState } from 'react';

interface InviteBannerProps {
  referralCode: string;
  hasUsedReferral?: boolean;
}

export default function InviteBanner({ referralCode, hasUsedReferral = false }: InviteBannerProps) {
  const [copied, setCopied] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = async () => {
    if (!inputCode.trim()) return;
    setApplying(true);
    setApplyResult(null);
    try {
      const res = await fetch('/api/referral/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: inputCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplyResult({ ok: true, message: `세특 +${data.creditsGranted}회가 지급되었어요!` });
        setInputCode('');
      } else {
        setApplyResult({ ok: false, message: data.error ?? '코드 적용에 실패했어요.' });
      }
    } catch {
      setApplyResult({ ok: false, message: '네트워크 오류가 발생했어요.' });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-400 p-5 text-white">
      <p className="text-sm font-bold">친구 초대하면 세특 +3회!</p>
      <p className="mt-0.5 text-xs text-white/80">쌍방 지급 — 친구도 나도 +3회</p>

      <div className="mt-3 flex items-center gap-2">
        {/* 내 추천 코드 */}
        <div className="flex flex-1 items-center justify-between rounded-xl bg-white/20 px-3 py-2">
          <span className="font-mono text-lg font-bold tracking-widest">{referralCode}</span>
          <button
            onClick={handleCopy}
            className="ml-2 rounded-lg bg-white/20 px-2 py-1 text-xs transition-all hover:bg-white/30 active:scale-95"
          >
            {copied ? '✓ 복사됨' : '복사'}
          </button>
        </div>

        {/* 카카오 공유 */}
        <button
          onClick={() => {
            const url = `${window.location.origin}?ref=${referralCode}`;
            navigator.clipboard.writeText(url);
            alert('초대 링크가 복사되었어요!');
          }}
          className="flex-shrink-0 rounded-xl bg-[#FEE500] px-3 py-2 text-xs font-bold text-[#3C1E1E] transition-all hover:brightness-105 active:scale-95"
        >
          카톡 공유
        </button>
      </div>

      {/* 추천 코드 입력 (미사용자만) */}
      {!hasUsedReferral && (
        <div className="mt-3">
          {!showApply ? (
            <button
              onClick={() => setShowApply(true)}
              className="text-xs text-white/70 underline underline-offset-2 hover:text-white"
            >
              친구 코드 입력하기
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={e => setInputCode(e.target.value.toUpperCase())}
                placeholder="추천 코드 입력"
                maxLength={8}
                className="flex-1 rounded-xl bg-white/20 px-3 py-2 text-sm font-mono font-bold tracking-widest placeholder:text-white/50 outline-none"
              />
              <button
                onClick={handleApply}
                disabled={applying || !inputCode.trim()}
                className="flex-shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-bold text-fuchsia-600 transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
              >
                {applying ? '...' : '적용'}
              </button>
              <button
                onClick={() => { setShowApply(false); setApplyResult(null); setInputCode(''); }}
                className="text-xs text-white/60 hover:text-white"
              >
                취소
              </button>
            </div>
          )}
          {applyResult && (
            <p className={`mt-1.5 text-xs ${applyResult.ok ? 'text-white' : 'text-red-200'}`}>
              {applyResult.ok ? '🎉 ' : '⚠ '}{applyResult.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
