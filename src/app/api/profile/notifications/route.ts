import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('notification_settings')
    .eq('id', session.user.id)
    .single();

  if (error) return NextResponse.json({ settings: null });
  return NextResponse.json({ settings: data?.notification_settings ?? null });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { settings } = body as { settings: Record<string, boolean> };

  if (!settings || typeof settings !== 'object') {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('users')
    .update({ notification_settings: settings, updated_at: new Date().toISOString() })
    .eq('id', session.user.id);

  if (error) {
    console.error('[notifications] update error:', error);
    return NextResponse.json({ error: '저장 실패' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
