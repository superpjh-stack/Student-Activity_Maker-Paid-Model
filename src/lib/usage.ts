import { prisma } from './db';
import { PLAN_LIMITS } from '@/types/subscription';
import type { Plan, UsageCheckResponse } from '@/types/subscription';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getResetDate(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
}

export async function checkUsage(
  userId: string,
  type: 'seteok' | 'report'
): Promise<UsageCheckResponse> {
  const month = getCurrentMonth();

  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });

  const plan = (sub?.plan ?? 'free') as Plan;
  const status = sub?.status ?? 'inactive';

  if (status !== 'active') {
    return { allowed: false, used: 0, limit: 0, remaining: 0, resetDate: getResetDate(), reason: 'subscription_inactive' };
  }

  const limit = PLAN_LIMITS[plan][type];

  // 무제한 플랜
  if (limit === null) {
    return { allowed: true, used: 0, limit: null, remaining: null, resetDate: getResetDate() };
  }

  const now = new Date();

  const [record, credits] = await Promise.all([
    prisma.usageRecord.findUnique({
      where: { userId_type_month: { userId, type, month } },
      select: { count: true },
    }),
    prisma.usageCredit.findMany({
      where: {
        userId,
        type,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { amount: true },
    }),
  ]);

  const extra = credits.reduce((sum, c) => sum + c.amount, 0);
  const used = record?.count ?? 0;
  const effectiveLimit = limit + extra;
  const remaining = Math.max(0, effectiveLimit - used);

  return {
    allowed: used < effectiveLimit,
    used,
    limit: effectiveLimit,
    remaining,
    resetDate: getResetDate(),
    reason: used >= effectiveLimit ? 'limit_exceeded' : undefined,
  };
}

export async function incrementUsage(
  userId: string,
  type: 'seteok' | 'report'
): Promise<void> {
  const month = getCurrentMonth();

  await prisma.usageRecord.upsert({
    where: { userId_type_month: { userId, type, month } },
    create: { userId, type, month, count: 1 },
    update: { count: { increment: 1 } },
  });
}
