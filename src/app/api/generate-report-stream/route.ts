import { NextRequest } from 'next/server';
import { generateReportStream } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, topic, length = 'medium', tone = 'neutral', profile, coaching, teacherStyle } = body;

    if (!subject || !topic) {
      return new Response(JSON.stringify({ error: '과목과 주제를 입력해주세요.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stream = await generateReportStream({ subject, topic, length, tone, profile, coaching, teacherStyle });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Report stream error:', error);
    return new Response(JSON.stringify({ error: '생성 중 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
