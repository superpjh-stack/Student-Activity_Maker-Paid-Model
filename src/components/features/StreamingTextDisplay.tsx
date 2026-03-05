'use client';

import type { StreamingState } from '@/types';

interface StreamingTextDisplayProps {
  text: string;
  state: StreamingState;
  label?: string;
}

export default function StreamingTextDisplay({ text, state, label }: StreamingTextDisplayProps) {
  if (state === 'idle') {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        아래 버튼을 눌러 {label ?? '내용'}을 생성하세요.
      </p>
    );
  }

  if (state === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-600">
        생성 중 오류가 발생했습니다. 다시 시도해주세요.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
        {text}
        {state === 'streaming' && (
          <span
            className="ml-0.5 inline-block h-4 w-px bg-indigo-500 align-middle"
            style={{ animation: 'blink 1s step-end infinite' }}
          />
        )}
      </div>
      {state === 'done' && text && (
        <p className="mt-3 text-right text-xs text-slate-400">총 {text.length}자</p>
      )}
    </div>
  );
}
