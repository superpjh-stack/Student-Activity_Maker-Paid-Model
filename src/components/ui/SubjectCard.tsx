'use client';

import { Subject } from '@/types';

const COLOR_MAP: Record<string, { border: string; bg: string; text: string }> = {
  blue: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  green: { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  red: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  yellow: { border: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  purple: { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
  emerald: { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  orange: { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  amber: { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
};

interface SubjectCardProps {
  subject: Subject;
  selected: boolean;
  onClick: () => void;
}

export default function SubjectCard({ subject, selected, onClick }: SubjectCardProps) {
  const colors = COLOR_MAP[subject.color] || COLOR_MAP.blue;

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-5 transition-all duration-200 cursor-pointer hover:shadow-md ${
        selected
          ? `${colors.border} ${colors.bg} shadow-md`
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <span className="text-3xl">{subject.emoji}</span>
      <span className={`text-base font-semibold ${selected ? colors.text : 'text-slate-800'}`}>
        {subject.name}
      </span>
      <span className="text-xs text-slate-500">5개 주제 제공</span>
      {selected && (
        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
          ✓
        </span>
      )}
    </button>
  );
}
