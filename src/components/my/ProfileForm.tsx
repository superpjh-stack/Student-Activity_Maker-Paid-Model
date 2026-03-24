'use client';

import { useState } from 'react';
import type { StudentProfile } from '@/types/subscription';

const CAREER_SUGGESTIONS = ['의학', '공학', '경영', '법학', '교육', '예술', '사회복지', 'IT', '과학', '문학'];

interface ProfileFormProps {
  profile: StudentProfile;
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [form, setForm] = useState({
    name: profile.name ?? '',
    school: profile.school ?? '',
    grade: profile.grade?.toString() ?? '',
    classNumber: profile.classNumber?.toString() ?? '',
    targetUniv: profile.targetUniv ?? '',
    targetMajor: profile.targetMajor ?? '',
    examDate: profile.examDate ?? '',
    careerTags: profile.careerTags ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleTag = (tag: string) => {
    setForm(prev => {
      const tags = prev.careerTags.includes(tag)
        ? prev.careerTags.filter(t => t !== tag)
        : prev.careerTags.length < 3 ? [...prev.careerTags, tag] : prev.careerTags;
      return { ...prev, careerTags: tags };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        school: form.school,
        grade: form.grade ? Number(form.grade) : null,
        classNumber: form.classNumber ? Number(form.classNumber) : null,
        targetUniv: form.targetUniv,
        targetMajor: form.targetMajor,
        examDate: form.examDate || null,
        careerTags: form.careerTags,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = 'w-full rounded-xl border border-purple-100 bg-white px-3 py-2.5 text-sm text-purple-900 placeholder-purple-200 focus:border-purple-300 focus:outline-none transition-colors';

  return (
    <div className="space-y-5">
      {/* 기본 정보 */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-purple-900">기본 정보</h3>
        <input className={inputClass} placeholder="이름" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <input className={inputClass} placeholder="학교명" value={form.school} onChange={e => setForm(p => ({ ...p, school: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <select className={inputClass} value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}>
            <option value="">학년 선택</option>
            <option value="1">고1</option>
            <option value="2">고2</option>
            <option value="3">고3</option>
          </select>
          <input className={inputClass} placeholder="반/번호" value={form.classNumber} onChange={e => setForm(p => ({ ...p, classNumber: e.target.value }))} />
        </div>
      </div>

      {/* 진로 목표 */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-purple-900">진로 목표</h3>
        <input className={inputClass} placeholder="희망 대학" value={form.targetUniv} onChange={e => setForm(p => ({ ...p, targetUniv: e.target.value }))} />
        <input className={inputClass} placeholder="희망 학과/계열" value={form.targetMajor} onChange={e => setForm(p => ({ ...p, targetMajor: e.target.value }))} />

        <div>
          <p className="mb-2 text-xs text-purple-400">관심 진로 태그 (최대 3개)</p>
          <div className="flex flex-wrap gap-1.5">
            {CAREER_SUGGESTIONS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 text-xs transition-all ${
                  form.careerTags.includes(tag)
                    ? 'bg-fuchsia-500 text-white'
                    : 'border border-purple-200 text-purple-500 hover:border-fuchsia-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs text-purple-400">수능 응시일</p>
          <input
            type="date"
            className={inputClass}
            value={form.examDate}
            onChange={e => setForm(p => ({ ...p, examDate: e.target.value }))}
          />
        </div>
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-gradient w-full rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {saving ? '저장 중...' : saved ? '✓ 저장됨!' : '저장하기'}
      </button>
    </div>
  );
}
