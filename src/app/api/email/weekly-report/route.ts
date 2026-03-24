/**
 * F-07: 주간 세특 완성도 리포트
 * Vercel Cron: 매주 월요일 07:00 KST (일요일 22:00 UTC)
 * 보호: Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail, weeklyReportEmailHtml } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase';

const ALL_SUBJECTS = ['국어', '수학', '영어', '한국사', '사회', '과학', '체육/예술', '제2외국어/한문'];

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  // Cron 인증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const month = getCurrentMonth();
  const results = { sent: 0, skipped: 0, errors: 0 };

  // 이번 달 세특 이력이 있는 활성 사용자 조회
  const activeUserIds = await prisma.seteokHistory.findMany({
    where: {
      createdAt: {
        gte: new Date(`${month}-01T00:00:00.000Z`),
      },
    },
    distinct: ['userId'],
    select: { userId: true },
  });

  const userIds = activeUserIds.map(r => r.userId);
  if (userIds.length === 0) {
    return NextResponse.json({ ...results, message: 'No active users this month' });
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, email: { not: '' } },
    select: { id: true, email: true, name: true },
  });

  for (const user of users) {
    if (!user.email) continue;

    // 알림 설정 확인
    const { data } = await supabase
      .from('users')
      .select('notification_settings')
      .eq('id', user.id)
      .single();

    const settings = data?.notification_settings as Record<string, boolean> | null;
    if (settings && settings.weekly === false) {
      results.skipped++;
      continue;
    }

    // 이번 달 완성된 과목 (세특 이력 기준)
    const history = await prisma.seteokHistory.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(`${month}-01T00:00:00.000Z`) },
      },
      distinct: ['subjectName'],
      select: { subjectName: true },
    });

    const completedSubjects = history.map(h => h.subjectName);
    const remainingSubjects = ALL_SUBJECTS.filter(s => !completedSubjects.includes(s));

    // 이번 달 총 생성 횟수
    const usageRecords = await prisma.usageRecord.findMany({
      where: { userId: user.id, month },
      select: { count: true },
    });
    const totalGenerated = usageRecords.reduce((sum, r) => sum + r.count, 0);

    const html = weeklyReportEmailHtml(
      user.name ?? '학생',
      completedSubjects,
      remainingSubjects,
      totalGenerated
    );

    const result = await sendEmail({
      to: user.email,
      subject: `[AI생기부] 이번 주 세특 완성도 리포트 — ${completedSubjects.length}/8과목 완성`,
      html,
    });

    if (result.ok) {
      results.sent++;
      console.log(`[email/weekly] sent to ${user.email}`);
    } else {
      results.errors++;
      console.error(`[email/weekly] failed for ${user.email}:`, result.error);
    }
  }

  return NextResponse.json({ ...results, timestamp: new Date().toISOString() });
}
