import { NextRequest, NextResponse } from 'next/server';
import { generateReport, generateSetech } from '@/lib/ai';
import type { LengthOption, ToneOption, TeacherStyle } from '@/types';

interface BatchItem {
  subject: string;
  subjectId: string;
  subjectName: string;
  subjectEmoji: string;
  topic: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, length = 'medium', tone = 'neutral', teacherStyle } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: '생성할 과목을 선택해주세요.' }, { status: 400 });
    }

    if (items.length > 4) {
      return NextResponse.json({ error: '최대 4개 과목까지 생성 가능합니다.' }, { status: 400 });
    }

    for (const item of items as BatchItem[]) {
      if (!item.subject || !item.topic) {
        return NextResponse.json({ error: '모든 과목의 주제를 입력해주세요.' }, { status: 400 });
      }
    }

    const results = await Promise.all(
      (items as BatchItem[]).map(async (item) => {
        const report = await generateReport({
          subject: item.subjectName || item.subject,
          topic: item.topic,
          length,
          tone,
          teacherStyle,
        });
        const setech = await generateSetech({
          subject: item.subjectName || item.subject,
          topic: item.topic,
          reportContent: report,
          teacherStyle,
        });
        return {
          subjectId: item.subjectId,
          subjectName: item.subjectName,
          subjectEmoji: item.subjectEmoji,
          topic: item.topic,
          report,
          setech,
        };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Batch generation error:', error);
    return NextResponse.json({ error: '생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
