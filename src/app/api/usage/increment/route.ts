import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { incrementUsage } from '@/lib/usage';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { type } = body as { type: 'seteok' | 'report' };

  if (!type || !['seteok', 'report'].includes(type)) {
    return NextResponse.json({ error: 'type이 필요합니다 (seteok|report)' }, { status: 400 });
  }

  await incrementUsage(session.user.id, type);
  return NextResponse.json({ ok: true });
}
