'use client';

import { useState } from 'react';
import type { UserProfile } from '@/types';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Omit<UserProfile, 'savedAt'>) => void;
  initialProfile?: Partial<UserProfile> | null;
}

export default function ProfileSetupModal({
  isOpen,
  onClose,
  onSave,
  initialProfile,
}: ProfileSetupModalProps) {
  const [career, setCareer] = useState(initialProfile?.career ?? '');
  const [interests, setInterests] = useState(initialProfile?.interests ?? '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ career: career.trim(), interests: interests.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-800">내 진로 프로필 설정</h2>
        <p className="mt-1 text-sm text-slate-500">
          설정하면 탐구보고서와 세특에 진로가 자동으로 연계됩니다. (선택사항)
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              희망 진로 / 학과
            </label>
            <input
              type="text"
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              placeholder="예: 컴퓨터공학, 의대, 경영학과"
              maxLength={50}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              관심사 / 특기
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="예: 코딩, 수학 올림피아드, 독서"
              maxLength={50}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            나중에
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            프로필 저장
          </button>
        </div>
      </div>
    </div>
  );
}
