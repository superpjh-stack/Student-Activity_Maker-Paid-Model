/**
 * F-07: 마감 D-14 / D-3 알림 이메일
 * Vercel Cron: 매일 07:00 KST (22:00 UTC)
 * 보호: Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail, deadlineEmailHtml } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase';

const DAYS_THRESHOLDS = [14, 3];

function getDaysDiff(target: Date): number {
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export async function GET(request: NextRequest) {
  // Cron 인증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results = { sent: 0, skipped: 0, errors: 0 };

  // examDate가 있는 사용자 중 D-14 또는 D-3에 해당하는 사용자 조회
  const today = new Date();
  const targetDates = DAYS_THRESHOLDS.map(d => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    return dt;
  });

  // 각 기준일 ±12시간 범위로 조회
  for (const [idx, targetDate] of targetDates.entries()) {
    const from = new Date(targetDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(targetDate);
    to.setHours(23, 59, 59, 999);

    const users = await prisma.user.findMany({
      where: {
        examDate: { gte: from, lte: to },
        email: { not: '' },
      },
      select: { id: true, email: true, name: true, examDate: true },
    });

    for (const user of users) {
      if (!user.email || !user.examDate) continue;

      // 알림 설정 확인
      const { data } = await supabase
        .from('users')
        .select('notification_settings')
        .eq('id', user.id)
        .single();

      const settings = data?.notification_settings as Record<string, boolean> | null;
      if (settings && settings.deadline === false) {
        results.skipped++;
        continue;
      }

      const daysLeft = DAYS_THRESHOLDS[idx];
      const html = deadlineEmailHtml(user.name ?? '학생', daysLeft);
      const result = await sendEmail({
        to: user.email,
        subject: `[AI생기부] 수능 D-${daysLeft} — 세특 마감이 다가왔어요`,
        html,
      });

      if (result.ok) {
        results.sent++;
        console.log(`[email/deadline] sent D-${daysLeft} to ${user.email}`);
      } else {
        results.errors++;
        console.error(`[email/deadline] failed for ${user.email}:`, result.error);
      }
    }
  }

  return NextResponse.json({ ...results, timestamp: new Date().toISOString() });
}
