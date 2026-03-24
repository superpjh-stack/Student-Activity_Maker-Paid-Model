import { prisma } from './db';
import { PLAN_LIMITS } from '@/types/subscription';
import type { Plan, UsageStats, StudentProfile, UserSubscription } from '@/types/subscription';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function getUserProfile(userId: string): Promise<StudentProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;
  return {
    id: user.id,
    name: user.name ?? '',
    email: user.email,
    image: user.image ?? undefined,
    school: user.school ?? undefined,
    grade: user.grade as 1 | 2 | 3 | undefined,
    classNumber: user.classNumber ?? undefined,
    targetUniv: user.targetUniv ?? undefined,
    targetMajor: user.targetMajor ?? undefined,
    careerTags: user.careerTags,
    examDate: user.examDate?.toISOString() ?? undefined,
    referralCode: user.referralCode,
  };
}

export async function getSubscription(userId: string): Promise<UserSubscription> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!sub) return { plan: 'free', status: 'active', currentPeriodEnd: '', cancelAtPeriodEnd: false };

  return {
    plan: sub.plan as Plan,
    status: sub.status as UserSubscription['status'],
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    nextBillingDate: sub.currentPeriodEnd.toISOString(),
  };
}

export async function getUsageStats(userId: string): Promise<UsageStats> {
  const month = getCurrentMonth();
  const sub = await getSubscription(userId);
  const plan = sub.plan;
  const limits = PLAN_LIMITS[plan];
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const [records, credits] = await Promise.all([
    prisma.usageRecord.findMany({
      where: { userId, month },
      select: { type: true, count: true },
    }),
    prisma.usageCredit.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { amount: true },
    }),
  ]);

  const seteokUsed = records.find(r => r.type === 'seteok')?.count ?? 0;
  const reportUsed = records.find(r => r.type === 'report')?.count ?? 0;
  const creditsExtra = credits.reduce((sum, c) => sum + c.amount, 0);

  return {
    plan,
    seteokUsed,
    seteokLimit: limits.seteok,
    reportUsed,
    reportLimit: limits.report,
    creditsExtra,
    resetDate,
  };
}

export async function hasUsedReferral(userId: string): Promise<boolean> {
  const referral = await prisma.referral.findUnique({
    where: { refereeId: userId },
    select: { id: true },
  });
  return !!referral;
}

export async function getRecentHistory(userId: string, limit = 5) {
  const records = await prisma.seteokHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      subjectId: true,
      subjectName: true,
      type: true,
      topic: true,
      content: true,
      charCount: true,
      createdAt: true,
    },
  });

  return records.map(r => ({
    id: r.id,
    subjectId: r.subjectId,
    subjectName: r.subjectName,
    subjectEmoji: '',
    type: r.type as 'seteok' | 'report',
    topic: r.topic,
    content: r.content,
    charCount: r.charCount,
    createdAt: r.createdAt.toISOString(),
  }));
}
