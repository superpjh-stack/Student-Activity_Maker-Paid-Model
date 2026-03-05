import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SUBJECTS } from '@/lib/subjects';

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();
    if (!keyword?.trim()) {
      return NextResponse.json({ error: '키워드를 입력해주세요.' }, { status: 400 });
    }

    const subjectList = SUBJECTS.map((s) => `${s.id}(${s.name})`).join(', ');

    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `당신은 대한민국 고등학생의 세부능력특기사항(세특) 탐구 주제를 추천하는 전문가입니다.

키워드: "${keyword}"

다음 8개 과목 중 이 키워드와 연결 가능한 과목들을 선택하여 각 과목당 1~2개의 탐구 주제를 추천하세요.
과목 목록: ${subjectList}

각 주제는 한국 고등학생이 실제로 탐구할 수 있는 구체적인 주제여야 합니다.
총 8~16개의 주제를 추천하세요.

반드시 다음 JSON 형식으로 응답하세요:
{
  "topics": [
    {
      "subject": "과목명(한글)",
      "subjectId": "과목ID(영문)",
      "topic": "탐구 주제 (구체적으로)"
    }
  ]
}`,
        },
      ],
    });

    const raw = JSON.parse(response.choices[0]?.message?.content ?? '{"topics":[]}');
    const colorMap: Record<string, string> = {
      math: 'blue', english: 'green', korean: 'red',
      physics: 'yellow', chemistry: 'purple', biology: 'emerald',
      social: 'orange', hist: 'amber',
    };

    const topics = (raw.topics ?? []).map((t: { subject: string; subjectId: string; topic: string }) => ({
      ...t,
      color: colorMap[t.subjectId] ?? 'blue',
    }));

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('expand-topics error:', error);
    return NextResponse.json({ error: '주제 탐색 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
