'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-500 transition-all hover:bg-gray-100 hover:border-gray-300 active:scale-95"
    >
      <span>🚪</span><span className="hidden xs:inline sm:inline">로그아웃</span>
    </button>
  );
}
