import type { Plan } from '@/types/subscription';

export const PRICING: Record<Exclude<Plan, 'free'>, { monthly: number; annual: number }> = {
  standard: { monthly: 9900, annual: 79000 },
  premium:  { monthly: 19900, annual: 149000 },
};

export const PLAN_NAMES: Record<Exclude<Plan, 'free'>, string> = {
  standard: '준비생',
  premium: '입시생',
};

// Toss Payments 서버 API 기본 요청
async function tossRequest(path: string, body: object) {
  const secretKey = process.env.TOSS_SECRET_KEY!;
  const encoded = Buffer.from(`${secretKey}:`).toString('base64');

  const res = await fetch(`https://api.tosspayments.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Toss API 오류');
  return data;
}

// 빌링키 발급 (카드 자동결제 등록)
export async function issueBillingKey(authKey: string, customerKey: string) {
  return tossRequest('/billing/authorizations/issue', {
    authKey,
    customerKey,
  });
}

// 빌링키로 결제 실행
export async function chargeBilling({
  billingKey,
  customerKey,
  amount,
  orderId,
  orderName,
  customerEmail,
  customerName,
}: {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerEmail: string;
  customerName: string;
}) {
  return tossRequest(`/billing/${billingKey}`, {
    customerKey,
    amount,
    orderId,
    orderName,
    customerEmail,
    customerName,
  });
}

// 결제 취소
export async function cancelPayment(paymentKey: string, cancelReason: string) {
  const secretKey = process.env.TOSS_SECRET_KEY!;
  const encoded = Buffer.from(`${secretKey}:`).toString('base64');

  const res = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancelReason }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? '결제 취소 오류');
  return data;
}

// Webhook 서명 검증 (HMAC-SHA256)
export function verifyWebhookSignature(
  signature: string | null,
  rawBody: string
): boolean {
  if (!signature) return false;

  const secret = process.env.TOSS_WEBHOOK_SECRET;
  // TOSS_WEBHOOK_SECRET 미설정 시 개발 환경으로 간주
  if (!secret) {
    console.warn('[Toss Webhook] TOSS_WEBHOOK_SECRET 미설정 — 개발 환경에서만 허용');
    return process.env.NODE_ENV !== 'production';
  }

  // Node.js crypto 모듈로 HMAC-SHA256 검증
  const crypto = require('crypto') as typeof import('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  // 타이밍 공격 방지를 위해 timingSafeEqual 사용
  try {
    const sigBuf = Buffer.from(signature, 'base64');
    const expectedBuf = Buffer.from(expectedSignature, 'base64');
    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

// orderId 생성 (중복 없이)
export function generateOrderId(userId: string, plan: string): string {
  const ts = Date.now();
  return `ORDER_${userId.slice(0, 8)}_${plan}_${ts}`;
}
