import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkUsage } from '@/lib/usage';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { allowed: false, reason: 'unauthenticated' },
      { status: 401 }
    );
  }

  const type = request.nextUrl.searchParams.get('type') as 'seteok' | 'report' | null;
  if (!type || !['seteok', 'report'].includes(type)) {
    return NextResponse.json({ error: 'type 파라미터가 필요합니다 (seteok|report)' }, { status: 400 });
  }

  const result = await checkUsage(session.user.id, type);
  return NextResponse.json(result);
}
