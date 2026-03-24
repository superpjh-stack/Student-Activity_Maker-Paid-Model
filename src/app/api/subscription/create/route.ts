import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { issueBillingKey, chargeBilling, generateOrderId, PRICING, PLAN_NAMES } from '@/lib/toss';
import type { Plan } from '@/types/subscription';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { authKey, customerKey, plan, period } = body as {
    authKey: string;
    customerKey: string;
    plan: Exclude<Plan, 'free'>;
    period: 'monthly' | 'annual';
  };

  if (!authKey || !customerKey || !plan || !period) {
    return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
  }

  try {
    // 1. 빌링키 발급
    const billingData = await issueBillingKey(authKey, customerKey);
    const billingKey = billingData.billingKey;

    // 2. 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });

    if (!user) return NextResponse.json({ error: '사용자 없음' }, { status: 404 });

    // 3. 최초 결제 실행
    const amount = PRICING[plan][period];
    const orderId = generateOrderId(session.user.id, plan);
    const orderName = `AI 생기부 Maker ${PLAN_NAMES[plan]} ${period === 'monthly' ? '월간' : '연간'}`;

    const payment = await chargeBilling({
      billingKey,
      customerKey,
      amount,
      orderId,
      orderName,
      customerEmail: user.email,
      customerName: user.name ?? '학생',
    });

    // 4. 구독 테이블 업데이트 (upsert)
    const now = new Date();
    const periodEnd = period === 'monthly'
      ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        plan,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        tossBillingKey: billingKey,
        tossCustomerKey: customerKey,
      },
      update: {
        plan,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        tossBillingKey: billingKey,
        tossCustomerKey: customerKey,
      },
    });

    return NextResponse.json({
      ok: true,
      plan,
      orderId: payment.orderId,
      amount: payment.totalAmount,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : '결제 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
