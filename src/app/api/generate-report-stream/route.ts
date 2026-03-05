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

    const rawStream = await generateReportStream({ subject, topic, length, tone, profile, coaching, teacherStyle });

    const sseStream = new ReadableStream({
      async start(controller) {
        const reader = rawStream.getReader();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              break;
            }
            const text = decoder.decode(value, { stream: true });
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(text)}\n\n`));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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
