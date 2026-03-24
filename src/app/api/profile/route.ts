import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: '사용자 없음' }, { status: 404 });

  return NextResponse.json({
    name: user.name,
    school: user.school,
    grade: user.grade,
    classNumber: user.classNumber,
    targetUniv: user.targetUniv,
    targetMajor: user.targetMajor,
    careerTags: user.careerTags,
    examDate: user.examDate?.toISOString().slice(0, 10) ?? null,
    referralCode: user.referralCode,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: body.name,
      school: body.school ?? null,
      grade: body.grade ?? null,
      classNumber: body.classNumber ?? null,
      targetUniv: body.targetUniv ?? null,
      targetMajor: body.targetMajor ?? null,
      careerTags: body.careerTags ?? [],
      examDate: body.examDate ? new Date(body.examDate) : null,
    },
  });

  return NextResponse.json({ ok: true });
}
