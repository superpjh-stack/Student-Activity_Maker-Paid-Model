import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const CREDIT_AMOUNT = 3;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { referralCode } = await request.json() as { referralCode: string };
  if (!referralCode || typeof referralCode !== 'string') {
    return NextResponse.json({ error: '추천 코드가 필요합니다' }, { status: 400 });
  }

  const refereeId = session.user.id;

  // 이미 추천 받은 이력 확인
  const existing = await prisma.referral.findUnique({
    where: { refereeId },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: '이미 추천 코드를 사용했습니다' }, { status: 409 });
  }

  // 추천인 조회
  const referrer = await prisma.user.findUnique({
    where: { referralCode: referralCode.toUpperCase() },
    select: { id: true },
  });
  if (!referrer) {
    return NextResponse.json({ error: '유효하지 않은 추천 코드입니다' }, { status: 404 });
  }
  if (referrer.id === refereeId) {
    return NextResponse.json({ error: '본인 추천 코드는 사용할 수 없습니다' }, { status: 400 });
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 3);

  // 추천 기록 + 크레딧 동시 생성
  await prisma.$transaction([
    prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId,
        completedAt: new Date(),
        creditsGranted: true,
      },
    }),
    prisma.usageCredit.create({
      data: { userId: referrer.id, type: 'seteok', amount: CREDIT_AMOUNT, reason: 'referral', expiresAt },
    }),
    prisma.usageCredit.create({
      data: { userId: refereeId, type: 'seteok', amount: CREDIT_AMOUNT, reason: 'referral', expiresAt },
    }),
  ]);

  return NextResponse.json({ ok: true, creditsGranted: CREDIT_AMOUNT });
}
