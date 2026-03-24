import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as {
    subjectId: string;
    subjectName: string;
    type: 'seteok' | 'report';
    topic: string;
    content: string;
    charCount: number;
  };

  const record = await prisma.seteokHistory.create({
    data: {
      userId: session.user.id,
      subjectId: body.subjectId,
      subjectName: body.subjectName,
      type: body.type,
      topic: body.topic,
      content: body.content,
      charCount: body.charCount,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: record.id });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') ?? '20');

  const records = await prisma.seteokHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      subjectId: true,
      subjectName: true,
      type: true,
      topic: true,
      charCount: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ history: records.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })) });
}
