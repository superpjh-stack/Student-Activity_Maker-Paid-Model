import OpenAI from 'openai';
import type { LengthOption, ToneOption, TeacherStyle, UserProfile, AbGenerateResponse, SourceItem } from '@/types';

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

// ─── KF-01: 생기부 건강 진단 ───────────────────────────────────────────────

export interface DiagnosisItem {
  id: string;
  name: string;
  score: number;
  weight: number;
  feedback: string;
}

export interface DiagnosisResult {
  items: DiagnosisItem[];
  totalScore: number;
  weakPoints: string[];
  message: string;
}

export async function generateDiagnosis(
  text: string,
  type: 'seteok' | 'report'
): Promise<DiagnosisResult> {
  const typeLabel = type === 'seteok' ? '세특(세부능력및특기사항)' : '탐구보고서';

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1500,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `당신은 한국 대입 입시 전문가입니다. 다음 ${typeLabel}을 분석하여 7개 항목을 JSON으로 평가해주세요.

[평가 기준]
1. authenticity (진정성): 1인칭 경험 서술, 구체적 에피소드 비율 (가중치 0.25)
2. major_alignment (전공연계성): 희망 학과 키워드 밀도, 진로 연결 명확성 (가중치 0.20)
3. logic_structure (논리구조): 도입-전개-결론 완결성, 인과관계 명확성 (가중치 0.15)
4. depth (심화깊이): 단순 요약 vs 자기 해석/확장 비율 (가중치 0.20)
5. language_variety (언어다양성): 반복 단어 빈도, 문장 구조 다양성 (가중치 0.10)
6. ai_risk (AI감지리스크): AI 특유 표현 패턴 — 낮을수록 좋음, score 0이 최악 100이 최고 (가중치 0.10)
7. completeness (완성도): 권장 분량 대비 충족률, Pass=100 Fail=0

[분석할 텍스트]
${text}

[응답 형식] JSON만 반환 (설명 없이):
{
  "items": [
    { "id": "authenticity", "name": "진정성", "score": 75, "weight": 0.25, "feedback": "구체적인 경험 서술이 있으나 에피소드가 더 필요합니다." },
    { "id": "major_alignment", "name": "전공연계성", "score": 60, "weight": 0.20, "feedback": "진로 연결이 결론에만 언급되어 있습니다." },
    { "id": "logic_structure", "name": "논리구조", "score": 80, "weight": 0.15, "feedback": "도입-전개-결론이 명확합니다." },
    { "id": "depth", "name": "심화깊이", "score": 55, "weight": 0.20, "feedback": "자기 해석보다 요약이 많습니다." },
    { "id": "language_variety", "name": "언어다양성", "score": 70, "weight": 0.10, "feedback": "반복 표현이 일부 있습니다." },
    { "id": "ai_risk", "name": "AI감지리스크", "score": 65, "weight": 0.10, "feedback": "AI 특유 표현이 일부 감지됩니다." },
    { "id": "completeness", "name": "완성도", "score": 100, "weight": 0, "feedback": "분량이 충분합니다." }
  ],
  "totalScore": 68,
  "weakPoints": ["depth", "major_alignment"],
  "message": ""
}`,
      },
    ],
  });

  try {
    const raw = JSON.parse(response.choices[0]?.message?.content ?? '{}') as DiagnosisResult;
    raw.message = getDiagnosisMessage(raw.totalScore);
    return raw;
  } catch {
    throw new Error('진단 결과 파싱 실패');
  }
}

function getDiagnosisMessage(score: number): string {
  if (score < 50) return '솔직히 말하면, 지금 이 글은 입시에서 기억에 남지 않을 확률이 높아요.';
  if (score < 65) return '가능성은 있지만, 사정관의 시선을 붙잡기엔 조금 더 다듬어야 해요.';
  if (score < 80) return '준비가 잘 되고 있어요. 취약한 항목만 보완하면 강해집니다.';
  return '이 정도면 사정관의 시선을 멈출 수 있어요. 한 단계만 더!';
}

// ─── KF-04: 주제 희소성 스코어 ────────────────────────────────────────────

export interface TopicAngle {
  title: string;
  targetMajor: string;
  competitionLevel: 'low' | 'medium' | 'high';
  emoji: string;
}

export interface TopicRarityResult {
  rarityScore: number;
  competitionLevel: 'low' | 'medium' | 'high';
  angles: TopicAngle[];
}

export async function generateTopicRarity(
  subjectName: string,
  topic: string
): Promise<TopicRarityResult> {
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `당신은 한국 고등학교 입시 전문가입니다.

다음 탐구 주제의 "입시 경쟁 밀도"를 추정하고, 차별화된 탐구 각도 5가지를 JSON으로 제안하세요.

- 과목: ${subjectName}
- 주제: ${topic}

[경쟁 밀도 기준]
- high: 매년 수만 명이 탐구하는 일반적인 주제 (rarityScore 10~35)
- medium: 적당히 알려진 주제 (rarityScore 36~65)
- low: 독창적이거나 특수한 관점 (rarityScore 66~95)

[응답 형식] JSON만 반환:
{
  "rarityScore": 30,
  "competitionLevel": "high",
  "angles": [
    { "title": "수직 농업 환경에서 인공광 파장별 광합성 효율 비교", "targetMajor": "농업공학, 식품공학", "competitionLevel": "low", "emoji": "🔬" },
    { "title": "광감각제를 이용한 암 치료(PDT)에서의 광합성 원리 응용", "targetMajor": "의예과, 약학", "competitionLevel": "low", "emoji": "💊" },
    { "title": "식물 광수용체 메커니즘의 바이오센서 응용 가능성", "targetMajor": "전자공학, 생명공학", "competitionLevel": "low", "emoji": "🤖" },
    { "title": "고온·건조 스트레스 조건에서 C4 식물의 적응 전략", "targetMajor": "환경학, 생태학", "competitionLevel": "medium", "emoji": "🌿" },
    { "title": "태양전지 효율 개선을 위한 광합성 전자전달계 모방 연구", "targetMajor": "에너지공학, 화학공학", "competitionLevel": "low", "emoji": "⚡" }
  ]
}`,
      },
    ],
  });

  try {
    return JSON.parse(response.choices[0]?.message?.content ?? '{}') as TopicRarityResult;
  } catch {
    throw new Error('희소성 분석 결과 파싱 실패');
  }
}

// ─── KF-05: 진로 키워드 DNA ────────────────────────────────────────────────

export interface DnaActivity {
  name: string;
}

export interface DnaResult {
  keywords: string[];
  identity: string;
  description: string;
  recommendedMajors: string[];
  activities: DnaActivity[];
  sharableText: string;
}

export async function generateDna(
  historyItems: { subjectName: string; topic: string; type: string }[]
): Promise<DnaResult> {
  const historyText = historyItems
    .map((h) => `[${h.subjectName}] ${h.topic} (${h.type === 'seteok' ? '세특' : '탐구보고서'})`)
    .join('\n');

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1000,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `당신은 대학 입시 전문 카운슬러입니다.
아래 고등학생의 탐구/세특 히스토리를 분석하여 이 학생의 "학문적 정체성"을 발굴해주세요.

[탐구 히스토리]
${historyText}

[분석 관점]
- 반복적으로 나타나는 주제/관심사 패턴
- 탐구 스타일 (실험형, 이론형, 사회연계형 등)
- 가장 강하게 드러나는 역량

[응답 형식] JSON만 반환:
{
  "keywords": ["데이터 분석", "에너지 전환", "사회 문제 해결"],
  "identity": "수치 뒤 패턴을 찾는 분석형 탐구자",
  "description": "이 학생은 수치와 데이터를 통해 현상의 본질을 파악하려는 강한 탐구 성향을 보입니다...",
  "recommendedMajors": ["환경공학", "에너지경제학"],
  "activities": [
    { "name": "한국에너지공단 청소년 탐구 공모전" },
    { "name": "환경부 청소년 환경 챌린지" }
  ],
  "sharableText": "AI가 분석한 내 학문적 정체성: '수치 뒤 패턴을 찾는 분석형 탐구자' 🧬"
}`,
      },
    ],
  });

  try {
    return JSON.parse(response.choices[0]?.message?.content ?? '{}') as DnaResult;
  } catch {
    throw new Error('DNA 분석 결과 파싱 실패');
  }
}

export async function generateSources(params: {
  subject: string;
  topic: string;
}): Promise<SourceItem[]> {
  const { subject, topic } = params;

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `당신은 한국 고등학생의 탐구보고서를 위한 참고문헌 목록을 생성하는 AI입니다.

다음 탐구 주제와 관련하여 참고할 수 있는 학술 자료 4개를 JSON 형식으로 반환해주세요.

- 과목: ${subject}
- 탐구 주제: ${topic}

반환 형식 (반드시 이 JSON 구조만 반환):
{
  "sources": [
    {
      "title": "논문 또는 자료 제목 (한국어)",
      "author": "저자명 또는 기관명",
      "year": "발행연도 (예: 2022)",
      "keyword": "검색에 사용할 핵심 키워드 (한국어, 공백 포함 가능)"
    }
  ]
}

조건:
- 탐구 주제와 직접 관련된 실제로 존재할 법한 학술 자료를 추천
- 고등학생 수준에서 접근 가능한 자료 위주
- keyword는 RISS/Google Scholar 검색에 적합한 2~4어절 이내
- 연도는 2015~2024년 범위 내`,
      },
    ],
  });

  try {
    const content = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content) as { sources?: SourceItem[] };
    return parsed.sources ?? [];
  } catch {
    return [];
  }
}
