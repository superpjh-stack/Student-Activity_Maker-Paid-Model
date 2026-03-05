import OpenAI from 'openai';
import type { LengthOption, ToneOption, TeacherStyle, UserProfile, AbGenerateResponse } from '@/types';

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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

// F-08: 교사 스타일 뱅크
const TEACHER_STYLE_INSTRUCTIONS: Record<TeacherStyle, string> = {
  analytical: `[교사 문체 스타일: 분석형]
- "~을 분석하고 ~임을 확인하였다", "데이터를 토대로 ~결론을 도출하였다" 형식 사용
- 수치, 비교, 인과관계를 명확히 서술
- 이과/실험 교사 관점의 객관적 문체로 작성`,

  narrative: `[교사 문체 스타일: 서사형]
- "학생은 ~에 관심을 가지고 ~을 탐구하기 시작했다" 형식 사용
- 학생의 성장 과정과 변화를 스토리로 서술
- 탐구의 계기 → 과정 → 깨달음 흐름을 강조하여 작성`,

  competency: `[교사 문체 스타일: 역량 중심형]
- "비판적 사고력", "창의적 문제해결", "협업 능력" 등 핵심역량 키워드를 명시
- 학생이 보여준 역량을 구체적 행동과 연결하여 서술
- 입시에서 빛나는 역량 중심 표현으로 작성`,

  concise: `[교사 문체 스타일: 간결형]
- 군더더기 없는 간결한 서술, 핵심만 명확하게
- 명사형 종결 선호 ("~을 이해함", "~을 확인함")
- 불필요한 수식어를 최소화하여 작성`,

  encouraging: `[교사 문체 스타일: 격려형]
- "적극적으로 탐구에 임하며", "뛰어난 탐구 의지를 보여" 형식 사용
- 학생의 열정과 노력을 긍정적으로 강조
- 담임 교사 특유의 따뜻하고 응원하는 어조로 작성`,
};

function buildTeacherStyleContext(teacherStyle?: TeacherStyle): string {
  if (!teacherStyle) return '';
  return `\n\n${TEACHER_STYLE_INSTRUCTIONS[teacherStyle]}`;
}

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
  teacherStyle?: TeacherStyle;
}): Promise<string> {
  const { subject, topic, length, tone, teacherStyle } = params;
  const targetLength = LENGTH_MAP[length];
  const toneInstruction = TONE_MAP[tone];
  const isScience = isScienceSubject(subject);
  const teacherStyleContext = buildTeacherStyleContext(teacherStyle);

  const response = await getClient().chat.completions.create({
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
${teacherStyleContext}

보고서 본문만 작성해주세요. 제목이나 부가 설명 없이 바로 본문을 시작하세요.`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}

function buildCoachingContext(coaching?: { motivation?: string; activity?: string; curiosity?: string }): string {
  if (!coaching) return '';
  const parts: string[] = [];
  if (coaching.motivation) parts.push(`- 탐구 동기: ${coaching.motivation}`);
  if (coaching.activity) parts.push(`- 실제 해본 활동: ${coaching.activity}`);
  if (coaching.curiosity) parts.push(`- 알고 싶은 것: ${coaching.curiosity}`);
  if (parts.length === 0) return '';
  return `\n\n[학생이 직접 작성한 탐구 배경 - 반드시 보고서와 세특에 자연스럽게 녹여 반영할 것]
${parts.join('\n')}
→ 위 내용을 탐구 동기 및 실제 활동 파트에 학생의 경험으로 구체화하여 포함할 것`;
}

function buildProfileContext(profile?: Partial<UserProfile>): string {
  if (!profile?.career && !profile?.interests) return '';
  return `\n\n[학생 프로필 - 탐구 내용에 적극 반영할 것]
- 희망 진로/학과: ${profile.career || '미설정'}
- 관심사/특기: ${profile.interests || '미설정'}
→ 진로연계 단락에서 위 학생의 진로와 명확히 연결 지어 작성할 것`;
}

export async function generateReportStream(params: {
  subject: string;
  topic: string;
  length: LengthOption;
  tone: ToneOption;
  profile?: Partial<UserProfile>;
  coaching?: { motivation?: string; activity?: string; curiosity?: string };
  teacherStyle?: TeacherStyle;
}): Promise<ReadableStream<Uint8Array>> {
  const { subject, topic, length, tone, profile, coaching, teacherStyle } = params;
  const targetLength = LENGTH_MAP[length];
  const toneInstruction = TONE_MAP[tone];
  const isScience = isScienceSubject(subject);
  const profileContext = buildProfileContext(profile);
  const coachingContext = buildCoachingContext(coaching);
  const teacherStyleContext = buildTeacherStyleContext(teacherStyle);

  const stream = await getClient().chat.completions.create({
    model: 'gpt-4o',
    stream: true,
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
${profileContext}
${coachingContext}
${teacherStyleContext}

보고서 본문만 작성해주세요. 제목이나 부가 설명 없이 바로 본문을 시작하세요.`,
      },
    ],
  });

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        }
      } finally {
        controller.close();
      }
    },
  });
}

export async function generateSetechStream(params: {
  subject: string;
  topic: string;
  reportContent?: string;
  profile?: Partial<UserProfile>;
  coaching?: { motivation?: string; activity?: string; curiosity?: string };
  teacherStyle?: TeacherStyle;
}): Promise<ReadableStream<Uint8Array>> {
  const { subject, topic, reportContent, profile, coaching, teacherStyle } = params;
  const profileContext = buildProfileContext(profile);
  const coachingContext = buildCoachingContext(coaching);
  const teacherStyleContext = buildTeacherStyleContext(teacherStyle);

  const referenceSection = reportContent
    ? `\n\n참고할 탐구보고서 내용:\n${reportContent}`
    : '';

  const stream = await getClient().chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [
      {
        role: 'user',
        content: `당신은 한국 고등학교 교사로서 학생의 세부능력및특기사항(세특)을 작성합니다.

다음 조건에 맞춰 세특을 작성해주세요:

- 과목: ${subject}
- 탐구 주제: ${topic}
- **정확히 500자 (±10자)로 작성 필수**
- 교사가 학생의 세부능력및특기사항을 작성하는 형식
- 문체: "○○은(는) ~하였으며, ~을 탐구하여..." (3인칭, ○○은 학생 이름 자리)
- 필수 구성:
  1. 탐구 동기/배경 (약 75자)
  2. 실제 탐구 활동 내용 (약 200자)
  3. 결과 및 해석 (약 150자)
  4. 타 학문 연계 또는 진로 연계 (약 75자)
- 구체적 수치나 사례를 포함할 것
${profileContext}
${coachingContext}
${teacherStyleContext}
- 세특 본문만 작성해주세요. 부가 설명 없이 바로 시작하세요.${referenceSection}`,
      },
    ],
  });

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        }
      } finally {
        controller.close();
      }
    },
  });
}

export async function generateAb(params: {
  subject: string;
  topic: string;
  length: LengthOption;
  tone: ToneOption;
  profile?: Partial<UserProfile>;
  teacherStyle?: TeacherStyle;
}): Promise<AbGenerateResponse> {
  const { subject, topic, length, tone, profile, teacherStyle } = params;

  const makeReport = (temperature: number) =>
    getClient().chat.completions.create({
      model: 'gpt-4o',
      temperature,
      messages: [
        {
          role: 'user',
          content: buildReportPrompt(subject, topic, length, tone, profile, teacherStyle),
        },
      ],
    });

  const makeSetech = (reportContent: string) =>
    getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: buildSetechPrompt(subject, topic, reportContent, profile, teacherStyle),
        },
      ],
    });

  const [resA, resB] = await Promise.all([makeReport(0.7), makeReport(1.0)]);
  const reportA = resA.choices[0]?.message?.content ?? '';
  const reportB = resB.choices[0]?.message?.content ?? '';

  const [resSetechA, resSetechB] = await Promise.all([
    makeSetech(reportA),
    makeSetech(reportB),
  ]);

  return {
    versionA: { report: reportA, setech: resSetechA.choices[0]?.message?.content ?? '' },
    versionB: { report: reportB, setech: resSetechB.choices[0]?.message?.content ?? '' },
  };
}

function buildReportPrompt(
  subject: string,
  topic: string,
  length: LengthOption,
  tone: ToneOption,
  profile?: Partial<UserProfile>,
  teacherStyle?: TeacherStyle
): string {
  const targetLength = LENGTH_MAP[length];
  const toneInstruction = TONE_MAP[tone];
  const isScience = isScienceSubject(subject);
  return `당신은 한국 고등학생의 교과 탐구보고서 작성을 돕는 AI입니다.

다음 조건에 맞춰 탐구보고서를 작성해주세요:

- 과목: ${subject}
- 탐구 주제: ${topic}
- 분량: 약 ${targetLength}자
- 문체: ${toneInstruction}
- 구조: 탐구 동기 → 탐구 방법 → 결과 분석 → [진로연계 및 심화 확장] → 결론 및 시사점
${isScience ? SCIENCE_EXPERIMENT_INSTRUCTION : ''}
${CAREER_LINKAGE_INSTRUCTION}
${buildProfileContext(profile)}
${buildTeacherStyleContext(teacherStyle)}

보고서 본문만 작성해주세요.`;
}

function buildSetechPrompt(
  subject: string,
  topic: string,
  reportContent: string,
  profile?: Partial<UserProfile>,
  teacherStyle?: TeacherStyle
): string {
  return `당신은 한국 고등학교 교사로서 학생의 세부능력및특기사항(세특)을 작성합니다.

- 과목: ${subject}
- 탐구 주제: ${topic}
- **정확히 500자 (±10자)로 작성 필수**
- 3인칭 교사 문체 ("○○은(는) ~하였으며...")
- 필수 구성: 동기(75자) → 활동(200자) → 결과(150자) → 진로연계(75자)
${buildProfileContext(profile)}
${buildTeacherStyleContext(teacherStyle)}

참고 보고서:\n${reportContent}

세특 본문만 작성하세요.`;
}

export async function generateSetech(params: {
  subject: string;
  topic: string;
  reportContent?: string;
  teacherStyle?: TeacherStyle;
}): Promise<string> {
  const { subject, topic, reportContent, teacherStyle } = params;
  const teacherStyleContext = buildTeacherStyleContext(teacherStyle);

  const referenceSection = reportContent
    ? `\n\n참고할 탐구보고서 내용:\n${reportContent}`
    : '';

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `당신은 한국 고등학교 교사로서 학생의 세부능력및특기사항(세특)을 작성합니다.

다음 조건에 맞춰 세특을 작성해주세요:

- 과목: ${subject}
- 탐구 주제: ${topic}
- **정확히 500자 (±10자)로 작성 필수**
- 교사가 학생의 세부능력및특기사항을 작성하는 형식
- 문체: "○○은(는) ~하였으며, ~을 탐구하여..." (3인칭, ○○은 학생 이름 자리)
- 필수 구성:
  1. 탐구 동기/배경 (약 75자)
  2. 실제 탐구 활동 내용 (약 200자)
  3. 결과 및 해석 (약 150자)
  4. 타 학문 연계 또는 진로 연계 (약 75자)
- 구체적 수치나 사례를 포함할 것
${teacherStyleContext}
- 세특 본문만 작성해주세요. 부가 설명 없이 바로 시작하세요.${referenceSection}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}
