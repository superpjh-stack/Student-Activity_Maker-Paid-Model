'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CopyButton from '@/components/ui/CopyButton';

type TextType = 'report' | 'setech';

export default function FeedbackPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [type, setType] = useState<TextType>('setech');
  const [feedback, setFeedback] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setFeedback('');
    setDone(false);
    setError(null);
    setStreaming(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), type }),
      });
      if (!res.ok || !res.body) throw new Error('피드백 요청 실패');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;
        acc += decoder.decode(value, { stream: true });
        setFeedback(acc);
      }
      setDone(true);
    } catch {
      setError('피드백 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="py-6 pb-16">
      {/* Header */}
      <button
        onClick={() => router.push('/')}
        className="mb-6 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-500 hover:border-violet-300 hover:text-violet-600 transition-all active:scale-95"
      >
        ← 뒤로
      </button>

      <h1 className="mb-1 text-xl sm:text-2xl font-bold text-slate-900">내 글 AI 피드백</h1>
      <p className="mb-6 sm:mb-8 text-sm text-slate-500">
        직접 작성한 세특이나 탐구보고서를 붙여넣으면 교사 관점에서 점수와 개선 제안을 드려요.
      </p>

      {/* Type selector */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-bold text-slate-700">글 유형</p>
        <div className="grid grid-cols-2 gap-2.5">
          {([
            { value: 'setech', label: '📝 세특 500자' },
            { value: 'report', label: '📄 탐구보고서' },
          ] as { value: TextType; label: string }[]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value)}
              className={`rounded-2xl border-2 py-3 text-sm font-semibold transition-all active:scale-95 ${
                type === opt.value
                  ? 'border-violet-400 bg-gradient-to-br from-violet-50 to-pink-50 text-violet-700'
                  : 'glass-card border-transparent text-slate-600 hover:border-violet-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text input */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-slate-700">검토할 글 붙여넣기</p>
          <span className="text-xs font-medium text-slate-400">{text.length}자</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={type === 'setech'
            ? '세특 내용을 여기에 붙여넣으세요 (500자 내외)...'
            : '탐구보고서 내용을 여기에 붙여넣으세요...'}
          rows={7}
          className="w-full resize-none rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={streaming || !text.trim()}
        className="mb-6 w-full rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-95 btn-gradient disabled:opacity-60"
      >
        {streaming ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            AI가 검토 중...
          </span>
        ) : '교사 관점으로 피드백 받기'}
      </button>

      {/* Feedback result */}
      {(feedback || streaming) && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">피드백 결과</p>
            {done && feedback && <CopyButton text={feedback} label="피드백" />}
          </div>
          <div className="glass-card rounded-2xl p-4 sm:p-5">
            <div className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
              {feedback}
              {streaming && (
                <span
                  className="ml-0.5 inline-block h-4 w-px bg-violet-500 align-middle"
                  style={{ animation: 'blink 1s step-end infinite' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Link to generate */}
      {done && (
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">피드백을 참고해서 AI로 새로 생성해볼까요?</p>
          <button
            onClick={() => router.push('/')}
            className="mt-2 text-sm font-semibold text-violet-600 hover:underline"
          >
            AI 생성하러 가기 →
          </button>
        </div>
      )}
    </div>
  );
}
