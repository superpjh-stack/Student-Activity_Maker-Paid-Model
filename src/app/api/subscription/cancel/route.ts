import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { immediately = false, reason } = body as { immediately?: boolean; reason?: string };

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  if (!sub || sub.plan === 'free') {
    return NextResponse.json({ error: '취소할 구독이 없습니다' }, { status: 400 });
  }

  if (immediately) {
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        plan: 'free',
        status: 'cancelled',
        cancelAtPeriodEnd: false,
        cancelledAt: new Date(),
        cancellationReason: reason ?? null,
      },
    });
  } else {
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        cancelAtPeriodEnd: true,
        cancellationReason: reason ?? null,
      },
    });
  }

  return NextResponse.json({ ok: true, immediately });
}
