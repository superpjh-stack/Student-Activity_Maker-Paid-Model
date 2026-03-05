import { NextRequest, NextResponse } from 'next/server';
import { generateAb } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, topic, length = 'medium', tone = 'neutral', profile, teacherStyle } = body;

    if (!subject || !topic) {
      return NextResponse.json({ error: '과목과 주제를 입력해주세요.' }, { status: 400 });
    }

    const result = await generateAb({ subject, topic, length, tone, profile, teacherStyle });
    return NextResponse.json(result);
  } catch (error) {
    console.error('A/B generation error:', error);
    return NextResponse.json({ error: '생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
