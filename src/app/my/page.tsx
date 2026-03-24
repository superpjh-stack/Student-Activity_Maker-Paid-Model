import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserProfile, getSubscription, getRecentHistory } from '@/lib/subscription';
import ProfileForm from '@/components/my/ProfileForm';
import SubscriptionCard from '@/components/my/SubscriptionCard';
import PortfolioTabs from '@/components/my/PortfolioTabs';
import NotificationSettings from '@/components/my/NotificationSettings';

type Tab = 'profile' | 'subscription' | 'portfolio' | 'notifications';

interface MyPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function MyPage({ searchParams }: MyPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const params = await searchParams;
  const tab = (params.tab ?? 'profile') as Tab;

  const [profile, subscription, history] = await Promise.all([
    getUserProfile(session.user.id),
    getSubscription(session.user.id),
    getRecentHistory(session.user.id, 50),
  ]);

  if (!profile) redirect('/login');

  const portfolioItems = history.map(r => ({
    id: r.id,
    subjectId: r.subjectId,
    subjectName: r.subjectName,
    type: r.type,
    topic: r.topic,
    content: r.content,
    charCount: r.charCount,
    createdAt: r.createdAt,
  }));

  const TABS = [
    { id: 'profile', label: '프로필' },
    { id: 'subscription', label: '구독' },
    { id: 'portfolio', label: `포트폴리오 (${portfolioItems.length})` },
    { id: 'notifications', label: '알림' },
  ];

  return (
    <div className="py-4 space-y-4">
      {/* 탭 네비게이션 */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <a
            key={t.id}
            href={`/my?tab=${t.id}`}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-fuchsia-500 text-white'
                : 'border border-purple-100 text-purple-500 hover:border-fuchsia-300'
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === 'profile' && <ProfileForm profile={profile} />}
      {tab === 'subscription' && <SubscriptionCard subscription={subscription} />}
      {tab === 'portfolio' && <PortfolioTabs items={portfolioItems} plan={subscription.plan} />}
      {tab === 'notifications' && <NotificationSettings />}
    </div>
  );
}
