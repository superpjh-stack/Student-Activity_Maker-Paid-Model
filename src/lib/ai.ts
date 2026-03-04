import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LENGTH_MAP = {
  short: 500,
  medium: 1000,
  long: 2000,
} as const;

const TONE_MAP = {
  academic: '객관적 학술 용어와 논리적 근거를 사용하여',
  friendly: '고등학생이 쓴 것처럼 친근하고 이해하기 쉬운 표현으로',
  neutral: '균형 잡힌 중립적 시각으로',
} as const;

// Rule 2: 과학 과목 감지 (물리, 화학, 생물)
const SCIENCE_SUBJECTS = ['물리', '화학', '생물'];

function isScienceSubject(subject: string): boolean {
  return SCIENCE_SUBJECTS.some((s) => subject.includes(s));
}

// Rule 2: 과학 과목 실험 데이터 지시문
const SCIENCE_EXPERIMENT_INSTRUCTION = `
- **[과학 과목 필수]** 탐구 방법 및 결과 섹션에 구체적인 실험 데이터를 반드시 포함할 것:
  - 측정값과 단위 (예: 온도 25°C, 농도 0.1M, 시간 5분 등)
  - 실험 조건 명시 (대조군/실험군 구분)
  - 수치 데이터 표 또는 수치 비교 결과
  - 오차 범위 또는 반복 실험 결과 언급`;

// Rule 3: 진로연계 및 심화 확장 지시문
const CAREER_LINKAGE_INSTRUCTION = `
- **[필수]** 결론 앞 또는 마지막 단락에 반드시 다음 내용을 포함할 것:
  - 이 탐구 주제가 어떤 학과/진로와 연결되는지 (예: "이 탐구는 재료공학과, 화학공학 분야와 연계되며...")
  - 더 심화하면 어떤 연구나 활동으로 확장 가능한지 (예: "추후 X 방법으로 Y를 탐구할 수 있으며...")`;

export async function generateReport(params: {
  subject: string;
  topic: string;
  length: 'short' | 'medium' | 'long';
  tone: 'academic' | 'friendly' | 'neutral';
}): Promise<string> {
  const { subject, topic, length, tone } = params;
  const targetLength = LENGTH_MAP[length];
  const toneInstruction = TONE_MAP[tone];
  const isScience = isScienceSubject(subject);

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `당신은 한국 고등학생의 교과 탐구보고서 작성을 돕는 AI입니다.

다음 조건에 맞춰 탐구보고서를 작성해주세요:

- 과목: ${subject}
- 탐구 주제: ${topic}
- 분량: 약 ${targetLength}자 (한국어 기준)
- 문체: ${toneInstruction}
- 구조: 탐구 동기 → 탐구 방법 → 결과 분석 → [진로연계 및 심화 확장] → 결론 및 시사점
- 한국어로 작성
- 고등학생 수준에 맞는 내용과 표현 사용
${isScience ? SCIENCE_EXPERIMENT_INSTRUCTION : ''}
${CAREER_LINKAGE_INSTRUCTION}

보고서 본문만 작성해주세요. 제목이나 부가 설명 없이 바로 본문을 시작하세요.`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}

export async function generateSetech(params: {
  subject: string;
  topic: string;
  reportContent?: string;
}): Promise<string> {
  const { subject, topic, reportContent } = params;

  const referenceSection = reportContent
    ? `\n\n참고할 탐구보고서 내용:\n${reportContent}`
    : '';

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `당신은 한국 고등학교 교사로서 학생의 세부능력및특기사항(세특)을 작성합니다.

다음 조건에 맞춰 세특을 작성해주세요:

- 과목: ${subject}
- 탐구 주제: ${topic}
- **정확히 500자 (±20자)로 작성 필수**
- 교사가 학생의 세부능력및특기사항을 작성하는 형식
- 문체: "○○은(는) ~하였으며, ~을 탐구하여..." (3인칭, ○○은 학생 이름 자리)
- 필수 구성:
  1. 탐구 동기/배경 (약 75자)
  2. 실제 탐구 활동 내용 (약 200자)
  3. 결과 및 해석 (약 150자)
  4. 타 학문 연계 또는 진로 연계 (약 75자)
- 구체적 수치나 사례를 포함할 것
- 세특 본문만 작성해주세요. 부가 설명 없이 바로 시작하세요.${referenceSection}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}
