import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/toss';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('toss-payments-signature');

  // 서명 검증
  if (!verifyWebhookSignature(signature, rawBody)) {
    return NextResponse.json({ error: '서명 검증 실패' }, { status: 401 });
  }

  let event: { eventType: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: '잘못된 JSON' }, { status: 400 });
  }

  const { eventType, data } = event;

  if (eventType === 'PAYMENT_STATUS_CHANGED') {
    const status = data.status as string;
    const customerKey = data.customerKey as string;
    if (!customerKey) return NextResponse.json({ ok: true });

    const sub = await prisma.subscription.findFirst({
      where: { tossCustomerKey: customerKey },
      select: { userId: true },
    });
    if (!sub) return NextResponse.json({ ok: true });

    if (status === 'CANCELED' || status === 'ABORTED') {
      await prisma.subscription.update({
        where: { userId: sub.userId },
        data: { status: 'cancelled' },
      });
    }

    if (status === 'DONE') {
      const now = new Date();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      await prisma.subscription.update({
        where: { userId: sub.userId },
        data: { status: 'active', currentPeriodStart: now, currentPeriodEnd: periodEnd },
      });
    }
  }

  if (eventType === 'BILLING_STATUS_CHANGED') {
    const billingStatus = data.status as string;
    const customerKey = data.customerKey as string;

    if (billingStatus === 'EXPIRED' || billingStatus === 'CANCELED') {
      await prisma.subscription.updateMany({
        where: { tossCustomerKey: customerKey },
        data: { status: 'cancelled' },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
