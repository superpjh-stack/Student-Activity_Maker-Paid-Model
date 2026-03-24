import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSubscription, getUsageStats } from '@/lib/subscription';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [subscription, usage] = await Promise.all([
    getSubscription(session.user.id),
    getUsageStats(session.user.id),
  ]);

  return NextResponse.json({ subscription, usage });
}
