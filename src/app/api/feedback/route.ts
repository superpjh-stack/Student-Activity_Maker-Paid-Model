import { NextRequest } from 'next/server';
import OpenAI from 'openai';

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
  try {
    const { text, type } = await request.json();
    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: '텍스트를 입력해주세요.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isSetech = type === 'setech';
    const typeLabel = isSetech ? '세특(세부능력및특기사항)' : '탐구보고서';
    const lengthGuide = isSetech
      ? '적절 분량: 500자(±10자). 현재 분량과 차이를 명시하세요.'
      : '적절 분량: 학생이 선택한 길이 기준. 전반적 충실도를 평가하세요.';

    const stream = await getClient().chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages: [
        {
          role: 'user',
          content: `당신은 대한민국 고등학교 교사로서 학생이 작성한 ${typeLabel}을 검토합니다.

아래 글을 분석하고 다음 형식으로 피드백을 작성하세요:

## 종합 점수
- 분량 적절성: X/20점
- 구조 완성도: X/30점
- 표현 자연성: X/25점
- 교사 문체 적합성: X/25점
- **총점: X/100점**

## 항목별 피드백

### 분량
${lengthGuide}
(분량 평가 작성)

### 구조
${isSetech ? '동기→활동→결과→진로연계 4단계 구조 포함 여부 확인' : '탐구동기→방법→결과분석→진로연계→결론 구조 확인'}
(구조 평가 작성)

### 표현
어색하거나 반복되는 표현, 개선이 필요한 부분을 구체적으로 지적하세요.
(표현 평가 작성)

### 교사 관점
실제 교사가 쓴 것처럼 자연스러운지, 개선점이 있다면 지적하세요.
(교사 관점 평가 작성)

## 개선 제안
구체적인 수정 제안 3가지를 작성하세요.

## 수정 버전 (핵심 부분만)
가장 개선이 시급한 1~2문장의 수정 버전을 제안하세요.

---
분석할 글:
${text}`,
        },
      ],
    });

    const readableStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const t = chunk.choices[0]?.delta?.content ?? '';
            if (t) controller.enqueue(encoder.encode(t));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    console.error('feedback error:', error);
    return new Response(JSON.stringify({ error: '피드백 생성 중 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
