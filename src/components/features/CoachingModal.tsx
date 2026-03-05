'use client';

import { useState, useEffect } from 'react';

interface CoachingAnswers {
  motivation: string;
  activity: string;
  curiosity: string;
}

interface CoachingModalProps {
  isOpen: boolean;
  subjectName: string;
  topic: string;
  onComplete: (answers: CoachingAnswers) => void;
  onSkip: () => void;
}

const QUESTIONS = [
  {
    key: 'motivation' as const,
    question: '이 주제를 선택한 이유가 있나요?',
    placeholder: '예: 뉴스에서 관련 내용을 봤어요 / 수업 시간에 궁금했어요',
    hint: '탐구 동기로 세특에 자연스럽게 담겨요',
  },
  {
    key: 'activity' as const,
    question: '이 주제와 관련해 직접 해본 활동이 있나요?',
    placeholder: '예: 실험을 해봤어요 / 책을 읽었어요 / 관련 영상을 시청했어요',
    hint: '탐구 활동 내용을 더 구체적으로 만들어줘요',
  },
  {
    key: 'curiosity' as const,
    question: '이 탐구를 통해 무엇을 알고 싶나요?',
    placeholder: '예: ~의 원리를 알고 싶어요 / ~와의 관계가 궁금해요',
    hint: '탐구 목적과 결론 방향이 명확해져요',
  },
];

export default function CoachingModal({
  isOpen,
  subjectName,
  topic,
  onComplete,
  onSkip,
}: CoachingModalProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<CoachingAnswers>({
    motivation: '',
    activity: '',
    curiosity: '',
  });

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setAnswers({ motivation: '', activity: '', curiosity: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const current = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete(answers);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkipAll = () => {
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-indigo-600">탐구 코칭 {step + 1}/{QUESTIONS.length}</p>
            <h3 className="mt-1 text-base font-semibold text-slate-800">{current.question}</h3>
          </div>
          <button onClick={handleSkipAll} className="ml-3 shrink-0 text-xs text-slate-400 hover:text-slate-600">
            모두 건너뛰기
          </button>
        </div>

        {/* Topic badge */}
        <div className="mb-4 rounded-lg bg-indigo-50 px-3 py-2">
          <p className="text-xs text-indigo-600">
            {subjectName} · {topic.length > 30 ? topic.slice(0, 30) + '…' : topic}
          </p>
        </div>

        {/* Input */}
        <textarea
          value={answers[current.key]}
          onChange={(e) =>
            setAnswers((prev) => ({ ...prev, [current.key]: e.target.value }))
          }
          placeholder={current.placeholder}
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <p className="mt-1.5 text-xs text-slate-400">{current.hint}</p>

        {/* Progress dots */}
        <div className="mt-4 flex justify-center gap-1.5">
          {QUESTIONS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i <= step ? 'bg-indigo-500' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => {
              setAnswers((prev) => ({ ...prev, [current.key]: '' }));
              handleNext();
            }}
            className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
          >
            {isLast ? '입력 없이 생성' : '이 질문 건너뛰기'}
          </button>
          <button
            onClick={handleNext}
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {isLast ? 'AI 생성 시작' : '다음 질문 →'}
          </button>
        </div>
      </div>
    </div>
  );
}
