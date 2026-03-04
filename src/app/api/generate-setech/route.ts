import { NextRequest, NextResponse } from 'next/server';
import { generateSetech } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, topic, reportContent } = body;

    if (!subject || !topic) {
      return NextResponse.json(
        { error: '과목과 주제를 입력해주세요.' },
        { status: 400 }
      );
    }

    const setech = await generateSetech({ subject, topic, reportContent });
    return NextResponse.json({ setech, charCount: setech.length });
  } catch (error) {
    console.error('Setech generation error:', error);
    return NextResponse.json(
      { error: '생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
