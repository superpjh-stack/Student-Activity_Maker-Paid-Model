'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SubjectCard from '@/components/ui/SubjectCard';
import TopicExpanderSection from '@/components/features/TopicExpanderSection';
import { SUBJECTS } from '@/lib/subjects';

const STEPS = ['과목 선택', '주제 선택', 'AI 생성'];

export default function HomePage() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const handleNext = () => {
    if (selectedSubject) {
      router.push(`/${selectedSubject}`);
    }
  };

  return (
    <div className="pb-16">
      {/* ── Hero ── */}
      <div className="mb-10 pt-6 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-medium text-violet-600">
          ✨ AI가 세특을 대신 써드려요
        </div>
        <h1 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
          나만의{' '}
          <span className="gradient-text">생기부</span>를{' '}
          <br className="sm:hidden" />
          5분 만에 완성
        </h1>
        <p className="mt-3 text-base text-slate-500">
          탐구보고서 · 세특 500자 — AI가 맞춤 작성해 드립니다
        </p>
      </div>

      {/* ── Step indicator ── */}
      <div className="mb-8 sm:mb-10 flex items-center justify-center gap-1.5 sm:gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1.5 sm:gap-2">
            <div className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${
              i === 0
                ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md shadow-violet-200'
                : 'bg-slate-100 text-slate-400'
            }`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                i === 0 ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-400'
              }`}>{i + 1}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px w-3 sm:w-4 bg-slate-200" />
            )}
          </div>
        ))}
      </div>

      {/* ── Subject heading ── */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-slate-800">
          어떤 과목의 탐구를 작성할까요?
        </h2>
        <p className="mt-1 text-sm text-slate-500">관심 과목을 하나 선택하세요 👇</p>
      </div>

      {/* ── Subject grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {SUBJECTS.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            selected={selectedSubject === subject.id}
            onClick={() => setSelectedSubject(subject.id)}
          />
        ))}
      </div>

      {/* ── Next button ── */}
      <div className="mt-8">
        <button
          onClick={handleNext}
          disabled={!selectedSubject}
          className={`w-full sm:w-auto sm:mx-auto sm:block rounded-full px-10 py-4 text-base font-bold transition-all active:scale-95 ${
            selectedSubject
              ? 'btn-gradient text-white cursor-pointer'
              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          다음 단계 →
        </button>
      </div>

      {/* ── Extra tools ── */}
      <div className="mt-12">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">추가 도구</p>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Topic Expander */}
          <button
            onClick={() => document.getElementById('topic-expander')?.scrollIntoView({ behavior: 'smooth' })}
            className="glass-card card-hover flex items-start gap-3 rounded-2xl p-4 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-indigo-400 text-xl shadow-sm">
              🔍
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">탐구 주제 확장기</p>
              <p className="mt-0.5 text-xs text-slate-500">키워드 하나로 8과목 연계 주제 탐색</p>
            </div>
          </button>

          {/* Feedback */}
          <button
            onClick={() => router.push('/feedback')}
            className="glass-card card-hover flex items-start gap-3 rounded-2xl p-4 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 text-xl shadow-sm">
              📝
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">내 글 AI 피드백</p>
              <p className="mt-0.5 text-xs text-slate-500">직접 쓴 세특·보고서를 교사 관점으로 첨삭</p>
            </div>
          </button>

          {/* Batch */}
          <button
            onClick={() => router.push('/batch')}
            className="glass-card card-hover flex items-start gap-3 rounded-2xl p-4 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 text-xl shadow-sm">
              📦
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">멀티 과목 배치 생성</p>
              <p className="mt-0.5 text-xs text-slate-500">여러 과목 세특을 한 번에 생성 (최대 4개)</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Topic Expander ── */}
      <div id="topic-expander" className="mt-10">
        <TopicExpanderSection />
      </div>

      {/* ── Footer note ── */}
      <p className="mt-10 text-center text-xs text-slate-400">
        🔒 개인정보 수집 없음 · 완전 무료
      </p>
    </div>
  );
}
