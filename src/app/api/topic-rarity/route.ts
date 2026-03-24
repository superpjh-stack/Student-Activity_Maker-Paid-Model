import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateTopicRarity } from '@/lib/ai';
import type { Plan } from '@/types/subscription';

const PLAN_TIER: Record<Plan, number> = { free: 0, standard: 1, premium: 2 };
// free: 배지만, standard: 2개 각도, premium: 5개 각도
const ANGLE_LIMITS: Record<Plan, number> = { free: 0, standard: 2, premium: 5 };

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as { subjectName?: string; topic?: string };
  const { subjectName, topic } = body;

  if (!subjectName || !topic) {
    return NextResponse.json({ error: 'subjectName과 topic이 필요합니다' }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { plan: true },
  });
  const plan = (sub?.plan ?? 'free') as Plan;
  const tier = PLAN_TIER[plan];
  const angleLimit = ANGLE_LIMITS[plan];

  const result = await generateTopicRarity(subjectName, topic);

  return NextResponse.json({
    rarityScore: result.rarityScore,
    competitionLevel: result.competitionLevel,
    competitionLabel:
      result.competitionLevel === 'high' ? '경쟁 높음' :
      result.competitionLevel === 'medium' ? '보통' : '차별화 유리',
    angles: result.angles.slice(0, angleLimit),
    locked: tier < 2,
    totalAngles: result.angles.length,
    plan,
  });
}
