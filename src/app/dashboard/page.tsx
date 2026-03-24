import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserProfile, getUsageStats, getRecentHistory, hasUsedReferral } from '@/lib/subscription';
import PlanBadge from '@/components/upsell/PlanBadge';
import DdayWidget from '@/components/dashboard/DdayWidget';
import SubjectTracker from '@/components/dashboard/SubjectTracker';
import UsageBar from '@/components/dashboard/UsageBar';
import RecentActivity from '@/components/dashboard/RecentActivity';
import InviteBanner from '@/components/dashboard/InviteBanner';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [profile, usage, history, usedReferral] = await Promise.all([
    getUserProfile(session.user.id),
    getUsageStats(session.user.id),
    getRecentHistory(session.user.id, 5),
    hasUsedReferral(session.user.id),
  ]);

  if (!profile) redirect('/login');

  return (
    <div className="py-4 space-y-4">
      {/* 학생 정보 헤더 */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
        {session.user.image ? (
          <img src={session.user.image} alt="프로필" className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-fuchsia-300 to-pink-300 flex items-center justify-center text-white font-bold">
            {(profile.name || '?')[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-purple-900 truncate">{profile.name || '학생'}</p>
            <PlanBadge plan={usage.plan} />
          </div>
          <p className="text-xs text-purple-400 truncate">
            {profile.school ? `${profile.school} ` : ''}
            {profile.grade ? `고${profile.grade}` : ''}
            {profile.targetUniv ? ` · 목표: ${profile.targetUniv}` : ''}
          </p>
        </div>
      </div>

      {/* D-day + 오늘의 행동 */}
      <DdayWidget examDate={profile.examDate} />

      {/* 세특 완성도 트래커 */}
      <SubjectTracker history={history} />

      {/* 이번 달 사용량 */}
      <UsageBar usage={usage} />

      {/* 최근 활동 */}
      <RecentActivity activities={history} />

      {/* 킬러 기능 진입 */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-purple-400 px-1">내 생기부 관리</p>
        <div className="grid grid-cols-2 gap-2">
          <a
            href="/my/diagnosis"
            className="glass-card rounded-2xl p-4 hover:shadow-md transition-all active:scale-95"
          >
            <div className="text-2xl mb-1">🩺</div>
            <p className="text-sm font-bold text-purple-900">건강 진단</p>
            <p className="text-[11px] text-purple-400 mt-0.5">7항목 AI 점수 분석</p>
          </a>
          <a
            href="/my/dna"
            className="glass-card rounded-2xl p-4 hover:shadow-md transition-all active:scale-95"
          >
            <div className="text-2xl mb-1">🧬</div>
            <p className="text-sm font-bold text-purple-900">진로 DNA</p>
            <p className="text-[11px] text-purple-400 mt-0.5">학문적 정체성 발굴</p>
          </a>
        </div>
      </div>

      {/* 친구 초대 (FREE 플랜만) */}
      {usage.plan === 'free' && (
        <InviteBanner referralCode={profile.referralCode} hasUsedReferral={usedReferral} />
      )}
    </div>
  );
}
