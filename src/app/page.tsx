'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SubjectCard from '@/components/ui/SubjectCard';
import { SUBJECTS } from '@/lib/subjects';

export default function HomePage() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const handleNext = () => {
    if (selectedSubject) {
      router.push(`/${selectedSubject}`);
    }
  };

  return (
    <div className="py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Gerardo의 AI 생기부 Maker
        </h1>
        <p className="mt-2 text-base text-slate-500">
          나만의 세특과 탐구보고서를 AI로 5분 만에 완성하세요
        </p>
      </div>

      {/* Steps */}
      <div className="mb-8 flex items-center justify-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">1</span>
          <span>과목 선택</span>
        </div>
        <div className="h-px w-6 bg-slate-300" />
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-500">2</span>
          <span>주제 선택</span>
        </div>
        <div className="h-px w-6 bg-slate-300" />
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-500">3</span>
          <span>AI 생성</span>
        </div>
      </div>

      {/* Subject heading */}
      <h2 className="mb-2 text-lg font-semibold text-slate-800">
        어떤 과목의 탐구를 작성할까요?
      </h2>
      <p className="mb-6 text-sm text-slate-500">관심 과목을 하나 선택하세요</p>

      {/* Subject grid */}
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

      {/* Next button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleNext}
          disabled={!selectedSubject}
          className={`rounded-lg px-8 py-3 text-base font-medium transition-colors ${
            selectedSubject
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          다음 →
        </button>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-center text-xs text-slate-400">
        개인정보 수집 없음 · 완전 무료
      </p>
    </div>
  );
}
