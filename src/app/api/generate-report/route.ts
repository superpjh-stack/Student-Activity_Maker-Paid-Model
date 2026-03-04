import { NextRequest, NextResponse } from 'next/server';
import { generateReport } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, topic, length = 'medium', tone = 'neutral' } = body;

    if (!subject || !topic) {
      return NextResponse.json(
        { error: '과목과 주제를 입력해주세요.' },
        { status: 400 }
      );
    }

    const validLengths = ['short', 'medium', 'long'];
    const validTones = ['academic', 'friendly', 'neutral'];

    if (!validLengths.includes(length)) {
      return NextResponse.json(
        { error: '길이는 short, medium, long 중 하나여야 합니다.' },
        { status: 400 }
      );
    }

    if (!validTones.includes(tone)) {
      return NextResponse.json(
        { error: '톤은 academic, friendly, neutral 중 하나여야 합니다.' },
        { status: 400 }
      );
    }

    const report = await generateReport({ subject, topic, length, tone });
    return NextResponse.json({ report, wordCount: report.length });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: '생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
