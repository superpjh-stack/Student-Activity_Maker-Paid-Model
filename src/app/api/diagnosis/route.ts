import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateDiagnosis } from '@/lib/ai';
import type { Plan } from '@/types/subscription';

const PLAN_TIER: Record<Plan, number> = { free: 0, standard: 1, premium: 2 };
const MONTHLY_LIMITS: Record<Plan, number> = { free: 1, standard: 5, premium: 9999 };

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as { text?: string; type?: 'seteok' | 'report' };
  const { text, type } = body;

  if (!text || text.trim().length < 50) {
    return NextResponse.json({ error: '텍스트가 너무 짧습니다 (최소 50자)' }, { status: 400 });
  }
  if (type !== 'seteok' && type !== 'report') {
    return NextResponse.json({ error: '올바른 type을 입력하세요 (seteok | report)' }, { status: 400 });
  }

  // 구독 플랜 확인
  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { plan: true },
  });
  const plan = (sub?.plan ?? 'free') as Plan;

  // 월별 사용량 확인
  const month = getCurrentMonth();
  const usageRecord = await prisma.usageRecord.findUnique({
    where: { userId_type_month: { userId: session.user.id, type: 'diagnosis', month } },
  });
  const used = usageRecord?.count ?? 0;
  const limit = MONTHLY_LIMITS[plan];

  if (used >= limit) {
    return NextResponse.json(
      { error: 'LIMIT_EXCEEDED', used, limit, plan },
      { status: 403 }
    );
  }

  // AI 진단 실행
  const result = await generateDiagnosis(text, type);

  // 사용량 기록
  await prisma.usageRecord.upsert({
    where: { userId_type_month: { userId: session.user.id, type: 'diagnosis', month } },
    update: { count: { increment: 1 } },
    create: { userId: session.user.id, type: 'diagnosis', month, count: 1 },
  });

  // 플랜별 데이터 제한
  const tier = PLAN_TIER[plan];
  const lockedItems = result.items.map((item, idx) => ({
    ...item,
    score: tier === 0 && idx > 0 ? -1 : item.score,        // free: 첫 항목만 공개
    feedback: tier === 0 && idx > 0 ? '' : item.feedback,
  }));

  return NextResponse.json({
    ...result,
    items: lockedItems,
    weakPoints: tier >= 1 ? result.weakPoints : [],
    locked: tier === 0,
    plan,
    used: used + 1,
    limit,
  });
}
