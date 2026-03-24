/**
 * F-07: 이메일 알림 시스템
 * Resend API 래퍼 + 이메일 HTML 템플릿
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'AI생기부 Maker <noreply@samaker.kr>';
const APP_URL = process.env.NEXTAUTH_URL ?? 'https://samaker.kr';

// ─── 발송 헬퍼 ────────────────────────────────────────────────────
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping');
    return { ok: false, error: 'No API key' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[email] Resend error:', errText);
      return { ok: false, error: errText };
    }
    return { ok: true };
  } catch (err) {
    console.error('[email] fetch error:', err);
    return { ok: false, error: String(err) };
  }
}

// ─── 공통 레이아웃 래퍼 ───────────────────────────────────────────
function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

        <!-- 헤더 -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#e9d5ff;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;">AI 생기부 Maker</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">${title}</h1>
          </td>
        </tr>

        <!-- 본문 -->
        <tr>
          <td style="padding:40px;">
            ${body}
          </td>
        </tr>

        <!-- 푸터 -->
        <tr>
          <td style="background:#faf5ff;padding:24px 40px;border-top:1px solid #ede9fe;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
              알림 설정은
              <a href="${APP_URL}/my?tab=notifications" style="color:#7c3aed;text-decoration:none;">마이페이지 → 알림 설정</a>에서 변경할 수 있습니다.
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#d1d5db;">© 2026 AI 생기부 Maker</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── 버튼 공통 컴포넌트 ───────────────────────────────────────────
function emailBtn(href: string, text: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">${text}</a>`;
}

// ─── 1. 마감 D-14 / D-3 알림 이메일 ──────────────────────────────
export function deadlineEmailHtml(name: string, daysLeft: number): string {
  const urgency = daysLeft <= 3 ? '🔴' : '🟡';
  const title = `수능 D-${daysLeft} — 세특 마감이 다가왔어요`;

  const body = `
    <p style="margin:0;font-size:16px;color:#374151;">안녕하세요, <strong style="color:#7c3aed;">${name}</strong>님 👋</p>

    <div style="margin:24px 0;padding:20px 24px;background:#faf5ff;border-radius:12px;border-left:4px solid #a855f7;text-align:center;">
      <p style="margin:0;font-size:40px;">${urgency}</p>
      <p style="margin:8px 0 0;font-size:28px;font-weight:800;color:#7c3aed;">수능까지 D-${daysLeft}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#9ca3af;">세특 마감이 얼마 남지 않았어요</p>
    </div>

    <p style="font-size:15px;color:#374151;line-height:1.7;">
      생기부에서 세특이 차지하는 비중은 <strong>최대 20%</strong>입니다.<br/>
      아직 완성하지 못한 과목이 있다면 지금 바로 시작해 보세요.
    </p>

    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
      AI 생기부 Maker로 <strong>5분 안에 세특 초안</strong>을 완성하고,<br/>
      선생님과 함께 다듬어 완벽한 생기부를 만드세요.
    </p>

    <div style="text-align:center;">
      ${emailBtn(`${APP_URL}/generate`, '지금 바로 세특 생성하기 →')}
    </div>

    <p style="margin-top:32px;font-size:13px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:16px;">
      💡 수능 D-${daysLeft} 기준으로 자동 발송된 알림입니다.
    </p>
  `;

  return emailLayout(title, body);
}

// ─── 2. 주간 세특 완성도 리포트 ──────────────────────────────────
export function weeklyReportEmailHtml(
  name: string,
  completedSubjects: string[],
  remainingSubjects: string[],
  totalGenerated: number
): string {
  const title = '이번 주 세특 완성도 리포트';
  const rate = Math.round((completedSubjects.length / 8) * 100);

  const completedList = completedSubjects.length
    ? completedSubjects.map(s => `<li style="color:#059669;">✅ ${s}</li>`).join('')
    : '<li style="color:#9ca3af;">완성된 과목이 없습니다</li>';

  const remainingList = remainingSubjects.length
    ? remainingSubjects.map(s => `<li style="color:#dc2626;">📝 ${s}</li>`).join('')
    : '<li style="color:#059669;">모든 과목 완성! 🎉</li>';

  const body = `
    <p style="margin:0;font-size:16px;color:#374151;">안녕하세요, <strong style="color:#7c3aed;">${name}</strong>님 👋</p>
    <p style="font-size:14px;color:#6b7280;margin-top:4px;">이번 주 세특 진행 현황을 정리했어요.</p>

    <!-- 완성도 바 -->
    <div style="margin:24px 0;padding:20px 24px;background:#faf5ff;border-radius:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:14px;font-weight:600;color:#374151;">전체 완성도</span>
        <span style="font-size:20px;font-weight:800;color:#7c3aed;">${rate}%</span>
      </div>
      <div style="background:#e9d5ff;border-radius:99px;height:10px;overflow:hidden;">
        <div style="background:linear-gradient(90deg,#7c3aed,#a855f7);width:${rate}%;height:100%;border-radius:99px;"></div>
      </div>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;text-align:center;">이번 달 총 ${totalGenerated}회 생성</p>
    </div>

    <!-- 완성/미완성 -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="50%" style="vertical-align:top;padding-right:12px;">
          <h3 style="margin:0 0 8px;font-size:13px;color:#374151;">✅ 완성 과목 (${completedSubjects.length})</h3>
          <ul style="margin:0;padding-left:16px;font-size:13px;line-height:2;">
            ${completedList}
          </ul>
        </td>
        <td width="50%" style="vertical-align:top;padding-left:12px;">
          <h3 style="margin:0 0 8px;font-size:13px;color:#374151;">📋 미완성 과목 (${remainingSubjects.length})</h3>
          <ul style="margin:0;padding-left:16px;font-size:13px;line-height:2;">
            ${remainingList}
          </ul>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">
      ${emailBtn(`${APP_URL}/dashboard`, '대시보드에서 확인하기 →')}
    </div>
  `;

  return emailLayout(title, body);
}

// ─── 3. 재활성화 이메일 ──────────────────────────────────────────
export function reactivationEmailHtml(name: string, daysSince: number): string {
  const msg =
    daysSince >= 60
      ? { emoji: '😢', line: '60일 동안 세특 작업이 없었네요. 놓친 건 없는지 확인해 보세요.' }
      : daysSince >= 30
      ? { emoji: '😟', line: '한 달째 접속이 없으셨군요. 세특, 괜찮으신가요?' }
      : { emoji: '👀', line: `${daysSince}일간 새로운 세특 작업이 없었어요.` };

  const title = `${name}님, 세특 잊지 않으셨죠? ${msg.emoji}`;

  const body = `
    <p style="margin:0;font-size:16px;color:#374151;">안녕하세요, <strong style="color:#7c3aed;">${name}</strong>님 👋</p>

    <div style="margin:24px 0;padding:24px;background:#faf5ff;border-radius:12px;text-align:center;">
      <p style="margin:0;font-size:48px;">${msg.emoji}</p>
      <p style="margin:12px 0 0;font-size:16px;font-weight:600;color:#374151;">${msg.line}</p>
    </div>

    <p style="font-size:14px;color:#6b7280;line-height:1.7;">
      생기부 세특은 <strong>담임/교과 선생님 제출 마감</strong>이 있습니다.<br/>
      지금 미리 준비해 두면 나중에 여유 있게 수정할 수 있어요.
    </p>

    <div style="background:#fffbeb;border-radius:10px;padding:16px 20px;border:1px solid #fde68a;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">💡 지금 시작하면 5분 만에 완성!</p>
      <ul style="margin:8px 0 0;padding-left:16px;font-size:13px;color:#78350f;line-height:1.8;">
        <li>과목 선택 → 주제 자동 추천 (AI)</li>
        <li>탐구보고서 또는 세특 500자 즉시 생성</li>
        <li>수정 후 선생님께 제출</li>
      </ul>
    </div>

    <div style="text-align:center;">
      ${emailBtn(`${APP_URL}/generate`, '다시 시작하기 →')}
    </div>
  `;

  return emailLayout(title, body);
}
