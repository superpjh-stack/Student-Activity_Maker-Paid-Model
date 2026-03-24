import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateDna } from '@/lib/ai';
import type { Plan } from '@/types/subscription';

const PLAN_TIER: Record<Plan, number> = { free: 0, standard: 1, premium: 2 };
const MONTHLY_LIMITS: Record<Plan, number> = { free: 1, standard: 3, premium: 9999 };

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function POST(_request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { plan: true },
  });
  const plan = (sub?.plan ?? 'free') as Plan;
  const tier = PLAN_TIER[plan];

  // 월별 사용량
  const month = getCurrentMonth();
  const usageRecord = await prisma.usageRecord.findUnique({
    where: { userId_type_month: { userId: session.user.id, type: 'dna', month } },
  });
  const used = usageRecord?.count ?? 0;
  const limit = MONTHLY_LIMITS[plan];

  if (used >= limit) {
    return NextResponse.json({ error: 'LIMIT_EXCEEDED', used, limit, plan }, { status: 403 });
  }

  // 히스토리 불러오기
  const history = await prisma.seteokHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { subjectName: true, topic: true, type: true },
  });

  if (history.length === 0) {
    return NextResponse.json({ error: '탐구 기록이 없습니다. 먼저 세특이나 탐구보고서를 생성해보세요.' }, { status: 400 });
  }

  const result = await generateDna(history);

  await prisma.usageRecord.upsert({
    where: { userId_type_month: { userId: session.user.id, type: 'dna', month } },
    update: { count: { increment: 1 } },
    create: { userId: session.user.id, type: 'dna', month, count: 1 },
  });

  // 플랜별 제한
  const keywordCount = tier === 0 ? 3 : 5;

  return NextResponse.json({
    keywords: result.keywords.slice(0, keywordCount),
    identity: result.identity,
    description: tier >= 1 ? result.description : '',
    recommendedMajors: tier >= 1 ? result.recommendedMajors : [],
    activities: tier >= 1 ? result.activities : [],
    sharableText: result.sharableText,
    locked: tier === 0,
    plan,
    used: used + 1,
    limit,
  });
}
