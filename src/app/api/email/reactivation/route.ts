/**
 * F-07: 재활성화 이메일
 * 14일 / 30일 / 60일 비접속 사용자에게 발송
 * Vercel Cron: 매일 08:00 KST (23:00 UTC)
 * 보호: Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail, reactivationEmailHtml } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase';

const INACTIVE_DAYS = [14, 30, 60];

export async function GET(request: NextRequest) {
  // Cron 인증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results = { sent: 0, skipped: 0, errors: 0 };
  const now = new Date();

  for (const days of INACTIVE_DAYS) {
    // 마지막 활동이 정확히 N일 전인 사용자 (당일 범위)
    const from = new Date(now);
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    const to = new Date(now);
    to.setDate(to.getDate() - days);
    to.setHours(23, 59, 59, 999);

    // 마지막 세특 생성이 해당 날짜 범위인 사용자 조회
    // (SeteokHistory 기준 — 그 이후 활동 없음 확인)
    const lastActivityGroups = await prisma.seteokHistory.groupBy({
      by: ['userId'],
      _max: { createdAt: true },
      having: {
        createdAt: {
          _max: { gte: from, lte: to },
        },
      },
    });

    if (lastActivityGroups.length === 0) continue;

    const candidateIds = lastActivityGroups.map((g: { userId: string }) => g.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: candidateIds }, email: { not: '' } },
      select: { id: true, email: true, name: true },
    });

    for (const user of users) {
      if (!user.email) continue;

      // 알림 설정 확인 (update 키를 재활성화에도 사용)
      const { data } = await supabase
        .from('users')
        .select('notification_settings')
        .eq('id', user.id)
        .single();

      const settings = data?.notification_settings as Record<string, boolean> | null;
      if (settings && settings.update === false) {
        results.skipped++;
        continue;
      }

      const html = reactivationEmailHtml(user.name ?? '학생', days);
      const result = await sendEmail({
        to: user.email,
        subject: `[AI생기부] ${user.name ?? '학생'}님, ${days}일 동안 보고 싶었어요`,
        html,
      });

      if (result.ok) {
        results.sent++;
        console.log(`[email/reactivation] sent D+${days} to ${user.email}`);
      } else {
        results.errors++;
        console.error(`[email/reactivation] failed for ${user.email}:`, result.error);
      }
    }
  }

  return NextResponse.json({ ...results, timestamp: new Date().toISOString() });
}
