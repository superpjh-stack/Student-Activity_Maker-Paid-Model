'use client';

import { useState } from 'react';
import { SUBJECTS } from '@/lib/subjects';
import type { LengthOption, ToneOption, TeacherStyle } from '@/types';
import { TEACHER_STYLE_LABELS } from '@/types';

export interface BatchItem {
  subjectId: string;
  subjectName: string;
  subjectEmoji: string;
  topic: string;
}

interface BatchSubjectSelectorProps {
  items: BatchItem[];
  onChange: (items: BatchItem[]) => void;
  length: LengthOption;
  tone: ToneOption;
  teacherStyle: TeacherStyle | undefined;
  onLengthChange: (v: LengthOption) => void;
  onToneChange: (v: ToneOption) => void;
  onTeacherStyleChange: (v: TeacherStyle | undefined) => void;
}

const LENGTH_OPTIONS: { value: LengthOption; label: string }[] = [
  { value: 'short', label: '단 (500자)' },
  { value: 'medium', label: '중 (1000자)' },
  { value: 'long', label: '장 (2000자)' },
];

const TONE_OPTIONS: { value: ToneOption; label: string }[] = [
  { value: 'academic', label: '학술적' },
  { value: 'friendly', label: '친근한' },
  { value: 'neutral', label: '중립적' },
];

const MAX_ITEMS = 4;

export default function BatchSubjectSelector({
  items,
  onChange,
  length,
  tone,
  teacherStyle,
  onLengthChange,
  onToneChange,
  onTeacherStyleChange,
}: BatchSubjectSelectorProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const addItem = () => {
    if (items.length >= MAX_ITEMS) return;
    const first = SUBJECTS[0];
    onChange([
      ...items,
      { subjectId: first.id, subjectName: first.name, subjectEmoji: first.emoji, topic: '' },
    ]);
    setOpenIdx(items.length);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
    setOpenIdx(null);
  };

  const updateItem = (idx: number, patch: Partial<BatchItem>) => {
    onChange(items.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const handleSubjectChange = (idx: number, subjectId: string) => {
    const subj = SUBJECTS.find((s) => s.id === subjectId);
    if (!subj) return;
    updateItem(idx, {
      subjectId: subj.id,
      subjectName: subj.name,
      subjectEmoji: subj.emoji,
      topic: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Subject rows */}
      {items.map((item, idx) => {
        const subj = SUBJECTS.find((s) => s.id === item.subjectId);
        return (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">과목 {idx + 1}</p>
              <button
                onClick={() => removeItem(idx)}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                삭제
              </button>
            </div>

            {/* Subject select */}
            <select
              value={item.subjectId}
              onChange={(e) => handleSubjectChange(idx, e.target.value)}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none"
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </select>

            {/* Topic input */}
            <input
              type="text"
              value={item.topic}
              onChange={(e) => updateItem(idx, { topic: e.target.value })}
              placeholder="탐구 주제를 직접 입력하세요"
              maxLength={100}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none"
            />

            {/* Quick topic suggestions */}
            {subj && (
              <div className="mt-2">
                <button
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  className="text-xs text-indigo-500 hover:underline"
                >
                  {openIdx === idx ? '주제 숨기기 ▲' : '추천 주제 보기 ▼'}
                </button>
                {openIdx === idx && (
                  <div className="mt-2 space-y-1">
                    {subj.topics.slice(0, 5).map((t, ti) => (
                      <button
                        key={ti}
                        onClick={() => {
                          updateItem(idx, { topic: t });
                          setOpenIdx(null);
                        }}
                        className="block w-full rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-left text-xs text-indigo-700 hover:bg-indigo-100"
                      >
                        {t.length > 60 ? t.slice(0, 60) + '…' : t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add button */}
      {items.length < MAX_ITEMS && (
        <button
          onClick={addItem}
          className="w-full rounded-xl border-2 border-dashed border-indigo-200 py-3 text-sm font-medium text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50"
        >
          + 과목 추가 ({items.length}/{MAX_ITEMS})
        </button>
      )}

      {/* Shared options */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">공통 옵션</p>

        <div className="mb-3">
          <p className="mb-2 text-xs font-medium text-slate-600">탐구보고서 길이</p>
          <div className="flex gap-2">
            {LENGTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onLengthChange(opt.value)}
                className={`flex-1 rounded-lg border-2 py-2 text-xs font-medium transition-all ${
                  length === opt.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <p className="mb-2 text-xs font-medium text-slate-600">문체 / 톤</p>
          <div className="flex gap-2">
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onToneChange(opt.value)}
                className={`flex-1 rounded-lg border-2 py-2 text-xs font-medium transition-all ${
                  tone === opt.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-slate-600">
            교사 문체 스타일 <span className="font-normal text-slate-400">(선택사항)</span>
          </p>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {(Object.entries(TEACHER_STYLE_LABELS) as [TeacherStyle, { label: string; desc: string }][]).map(
              ([value, info]) => (
                <button
                  key={value}
                  onClick={() => onTeacherStyleChange(teacherStyle === value ? undefined : value)}
                  className={`rounded-lg border py-2 text-center text-xs transition-all ${
                    teacherStyle === value
                      ? 'border-violet-400 bg-violet-50 font-semibold text-violet-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {info.label}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
