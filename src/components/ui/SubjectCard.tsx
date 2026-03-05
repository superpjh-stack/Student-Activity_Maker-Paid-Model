'use client';

import { Subject } from '@/types';

const GRADIENT_MAP: Record<string, { gradient: string; shadow: string; ring: string; badge: string }> = {
  blue:    { gradient: 'from-blue-400 to-sky-300',    shadow: 'hover:shadow-blue-200',    ring: 'ring-blue-400',    badge: 'bg-blue-500' },
  green:   { gradient: 'from-emerald-400 to-teal-300',shadow: 'hover:shadow-emerald-200', ring: 'ring-emerald-400', badge: 'bg-emerald-500' },
  red:     { gradient: 'from-rose-400 to-pink-300',   shadow: 'hover:shadow-rose-200',    ring: 'ring-rose-400',    badge: 'bg-rose-500' },
  yellow:  { gradient: 'from-amber-400 to-yellow-300',shadow: 'hover:shadow-amber-200',   ring: 'ring-amber-400',   badge: 'bg-amber-500' },
  purple:  { gradient: 'from-violet-400 to-purple-300',shadow: 'hover:shadow-violet-200', ring: 'ring-violet-400',  badge: 'bg-violet-500' },
  emerald: { gradient: 'from-teal-400 to-cyan-300',   shadow: 'hover:shadow-teal-200',    ring: 'ring-teal-400',    badge: 'bg-teal-500' },
  orange:  { gradient: 'from-orange-400 to-amber-300',shadow: 'hover:shadow-orange-200',  ring: 'ring-orange-400',  badge: 'bg-orange-500' },
  amber:   { gradient: 'from-yellow-400 to-orange-300',shadow: 'hover:shadow-yellow-200', ring: 'ring-yellow-400',  badge: 'bg-yellow-500' },
};

interface SubjectCardProps {
  subject: Subject;
  selected: boolean;
  onClick: () => void;
}

export default function SubjectCard({ subject, selected, onClick }: SubjectCardProps) {
  const g = GRADIENT_MAP[subject.color] || GRADIENT_MAP.blue;

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center gap-2.5 rounded-2xl p-4 sm:p-5 cursor-pointer
        transition-all duration-200 card-hover active:scale-95
        ${selected
          ? `bg-gradient-to-br ${g.gradient} shadow-lg ${g.shadow} ring-2 ${g.ring} ring-offset-2`
          : 'glass-card hover:border-violet-200'
        }
      `}
    >
      {/* Selected check badge */}
      {selected && (
        <span className={`absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full ${g.badge} text-xs text-white shadow-sm`}>
          ✓
        </span>
      )}

      {/* Emoji */}
      <span className={`text-2xl sm:text-3xl transition-transform duration-200 ${selected ? 'scale-110' : ''}`}>
        {subject.emoji}
      </span>

      {/* Name */}
      <span className={`text-xs sm:text-sm font-bold leading-tight ${selected ? 'text-white drop-shadow-sm' : 'text-slate-700'}`}>
        {subject.name}
      </span>

      {/* Tag */}
      <span className={`rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium ${selected ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-500'}`}>
        주제 5개
      </span>
    </button>
  );
}
