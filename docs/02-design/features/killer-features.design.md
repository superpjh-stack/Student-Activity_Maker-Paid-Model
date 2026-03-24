# killer-features Design Document

> **Plan Reference**: `docs/01-plan/features/killer-features.plan.md`
> **Version**: v1.0
> **Date**: 2026-03-24
> **Status**: Draft

---

## 1. Architecture Overview

### 1.1 구현 전략

기존 코드베이스를 최대한 재활용하며 Phase별로 점진적으로 추가한다.

```
Phase 1 (2주) — KF-01 + KF-04
  src/app/api/diagnosis/route.ts       신규
  src/app/api/topic-rarity/route.ts    신규
  src/components/features/DiagnosisReport.tsx  신규
  src/components/features/TopicRarityBadge.tsx 신규
  src/lib/ai.ts                        기존 확장

Phase 2 (2주) — KF-05
  src/app/api/dna/route.ts             신규
  src/components/features/DnaCard.tsx  신규

Phase 3 (3주) — KF-02
  src/app/api/admissions/route.ts      신규
  src/components/features/AdmissionsReport.tsx 신규

Phase 4 (3주) — KF-03
  prisma/schema.prisma                 grade/semester 컬럼 추가
  src/app/dashboard/timeline/page.tsx  신규
  src/components/features/GrowthTimeline.tsx 신규
```

### 1.2 구독 게이트 패턴 (전 기능 공통)

```typescript
// src/lib/subscription.ts 기존 checkPlan() 재사용
const plan = await getUserPlan(session.user.id);

// API 레벨에서 통일된 게이트 처리
function requirePlan(userPlan: Plan, minPlan: Plan) {
  const TIER = { free: 0, standard: 1, premium: 2 };
  if (TIER[userPlan] < TIER[minPlan]) {
    return NextResponse.json({ error: 'UPGRADE_REQUIRED', minPlan }, { status: 403 });
  }
}
```

---

## 2. KF-01: 생기부 건강 진단 리포트

### 2.1 API 설계

**Route**: `POST /api/diagnosis`

**Request**:
```typescript
{
  text: string;          // 세특 또는 탐구보고서 원문
  type: 'seteok' | 'report';
}
```

**Response**:
```typescript
{
  totalScore: number;    // 0~100 종합 점수
  items: DiagnosisItem[];
  weakPoints: string[];  // 취약 항목 상위 2개 이름
  message: string;       // 감성 카피 (점수 구간별)
  locked: boolean;       // free 플랜 시 세부 항목 잠금
}

type DiagnosisItem = {
  id: string;
  name: string;
  score: number;         // 0~100
  weight: number;        // 0.0~1.0
  feedback: string;
  locked: boolean;       // free: items[1..6] locked
}
```

**플랜별 접근 제어**:
| 필드 | Free | 준비생 | 입시생 |
|------|------|--------|--------|
| totalScore | ✅ | ✅ | ✅ |
| items[0] (진정성) | ✅ | ✅ | ✅ |
| items[1..5] (나머지) | 🔒 | ✅ | ✅ |
| weakPoints + 즉시보완 | 🔒 | ✅ (상위2개) | ✅ (전체) |
| 월 진단 횟수 | 1회 | 5회 | 무제한 |

### 2.2 AI 프롬프트 설계

```typescript
// src/lib/ai.ts에 추가
export async function generateDiagnosis(text: string, type: 'seteok' | 'report'): Promise<DiagnosisResult> {
  const prompt = `당신은 한국 대입 입시 전문가입니다. 다음 ${type === 'seteok' ? '세특(세부능력및특기사항)' : '탐구보고서'}을 분석하여 7개 항목을 JSON으로 평가해주세요.

[평가 기준]
1. authenticity (진정성): 1인칭 경험 서술, 구체적 에피소드 비율 (가중치 25%)
2. major_alignment (전공연계성): 희망 학과 키워드 밀도, 진로 연결 명확성 (가중치 20%)
3. logic_structure (논리구조): 도입-전개-결론 완결성, 인과관계 명확성 (가중치 15%)
4. depth (심화깊이): 단순 요약 vs 자기 해석/확장 비율 (가중치 20%)
5. language_variety (언어다양성): 반복 단어 빈도, 문장 구조 다양성 (가중치 10%)
6. ai_risk (AI감지리스크): AI 특유 표현 패턴 비율 — 낮을수록 좋음 (가중치 10%)
7. completeness (완성도): 권장 분량 대비 충족률 (Pass/Fail)

[분석할 텍스트]
${text}

[응답 형식] JSON만 반환:
{
  "items": [
    { "id": "authenticity", "name": "진정성", "score": 75, "feedback": "구체적인 실험 에피소드가 있으나..." },
    ...
  ],
  "totalScore": 78,
  "weakPoints": ["ai_risk", "depth"],
  "message": ""
}`;
```

### 2.3 컴포넌트 설계

**`src/components/features/DiagnosisReport.tsx`**

```
DiagnosisReport
├── DiagnosisInputArea        // 텍스트 입력 + 기록에서 불러오기
├── DiagnosisScoreRing        // 종합 점수 원형 게이지 (CSS animation)
├── DiagnosisRadarChart       // 6개 항목 레이더차트 (Recharts)
│   └── LockedOverlay         // free 플랜 블러 + 업셀 CTA
├── DiagnosisItemList         // 항목별 점수 바 + 피드백
└── DiagnosisActionButtons    // "즉시 보완하기" → /generate?topic=...
```

**감성 카피 로직**:
```typescript
function getDiagnosisMessage(score: number): string {
  if (score < 50) return "솔직히 말하면, 지금 이 세특은 입시에서 기억에 남지 않을 확률이 높아요.";
  if (score < 65) return "가능성은 있지만, 사정관의 시선을 붙잡기엔 조금 더 다듬어야 해요.";
  if (score < 80) return "준비가 잘 되고 있어요. 취약한 2가지만 보완하면 강해집니다.";
  return "이 정도면 사정관의 시선을 멈출 수 있어요. 한 단계만 더!";
}
```

### 2.4 사용량 추적

```typescript
// 기존 UsageRecord 모델 활용
// type: 'diagnosis', month: 'YYYY-MM', count++
await prisma.usageRecord.upsert({
  where: { userId_type_month: { userId, type: 'diagnosis', month } },
  update: { count: { increment: 1 } },
  create: { userId, type: 'diagnosis', month, count: 1 },
});
```

---

## 3. KF-04: 주제 희소성 스코어

### 3.1 API 설계

**Route**: `POST /api/topic-rarity`

**Request**:
```typescript
{
  subjectId: string;   // 'math', 'physics', etc.
  topic: string;       // 선택한 주제
  grade: number;       // 1, 2, 3
}
```

**Response**:
```typescript
{
  rarityScore: number;         // 0~100 (높을수록 희소)
  competitionLevel: 'low' | 'medium' | 'high';
  competitionLabel: string;    // "경쟁 높음" | "보통" | "차별화 유리"
  angles: TopicAngle[];        // 차별화 각도 (플랜별 개수 제한)
  locked: boolean;
}

type TopicAngle = {
  title: string;               // 차별화 주제명
  targetMajor: string;         // 적합 학과
  competitionLevel: 'low' | 'medium' | 'high';
  emoji: string;
}
```

**플랜별 접근 제어**:
| 항목 | Free | 준비생 | 입시생 |
|------|------|--------|--------|
| competitionLevel 배지 | ✅ | ✅ | ✅ |
| angles 개수 | 0 | 2개 | 5개 |

### 3.2 AI 프롬프트 설계

```typescript
export async function generateTopicRarity(subjectId: string, topic: string): Promise<TopicRarityResult> {
  const prompt = `당신은 한국 고등학교 입시 전문가입니다.

다음 탐구 주제의 "입시 경쟁 밀도"를 추정하고, 차별화된 탐구 각도 5가지를 JSON으로 제안하세요.

- 과목: ${subjectId}
- 주제: ${topic}

[경쟁 밀도 추정 기준]
- high: 매년 수만 명이 탐구할 것으로 예상되는 일반적인 주제
- medium: 적당히 알려진 주제
- low: 독창적이거나 특수한 관점의 주제

[응답 형식] JSON만 반환:
{
  "rarityScore": 30,
  "competitionLevel": "high",
  "angles": [
    {
      "title": "수직 농업 환경에서 인공광 파장별 광합성 효율 비교",
      "targetMajor": "농업공학, 식품공학",
      "competitionLevel": "low",
      "emoji": "🔬"
    }
  ]
}`;
```

### 3.3 주제 은행 배지 통합

기존 `src/components/ui/SubjectCard.tsx`에 배지 추가:

```typescript
// SubjectCard.tsx 확장 (props 추가)
interface SubjectCardProps {
  // 기존 props...
  rarityLevel?: 'low' | 'medium' | 'high';  // 추가
}

// 배지 렌더링
const RARITY_BADGE = {
  low:    { label: '차별화 유리', color: 'bg-green-100 text-green-700', dot: '🟢' },
  medium: { label: '보통',       color: 'bg-yellow-100 text-yellow-700', dot: '🟡' },
  high:   { label: '경쟁 높음',  color: 'bg-red-100 text-red-700', dot: '🔴' },
};
```

주제 은행 데이터(`src/lib/topics-cache.ts`)에 rarityLevel 메타데이터를 정적으로 추가한다.

---

## 4. KF-05: 진로 키워드 DNA

### 4.1 API 설계

**Route**: `POST /api/dna`

**Request**:
```typescript
{
  // body 없음 - 서버에서 session user의 SeteokHistory 전체 조회
}
```

**Response**:
```typescript
{
  keywords: string[];          // 핵심 키워드 3~5개
  identity: string;            // "수치 분석형 탐구자" 같은 정체성 한 줄
  description: string;         // 상세 설명 (준비생+ 해제)
  recommendedMajors: string[]; // 추천 학과 2~3개
  activities: DnaActivity[];   // 추천 활동 (준비생+ 해제)
  sharableText: string;        // 카카오톡 공유용 텍스트
  locked: boolean;
}

type DnaActivity = {
  name: string;
  url?: string;
}
```

**플랜별 접근 제어**:
| 항목 | Free | 준비생 | 입시생 |
|------|------|--------|--------|
| keywords | 3개 | 5개 | 5개 |
| identity | ✅ | ✅ | ✅ |
| description | 🔒 | ✅ | ✅ |
| activities | 🔒 | ✅ | ✅ |
| 자소서 연계 초안 | 🔒 | 🔒 | ✅ |
| 재생성 횟수 | 1회/월 | 3회/월 | 무제한 |

### 4.2 AI 프롬프트 설계

```typescript
export async function generateDna(historyItems: SeteokHistorySummary[]): Promise<DnaResult> {
  const historyText = historyItems
    .map(h => `[${h.subjectName}] ${h.topic} (${h.type})`)
    .join('\n');

  const prompt = `당신은 대학 입시 전문 카운슬러입니다.
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
  "description": "홍길동 학생은 수치와 데이터를 통해 현상의 본질을 파악하려는...",
  "recommendedMajors": ["환경공학", "에너지경제학"],
  "activities": [
    { "name": "한국에너지공단 청소년 탐구 공모전", "url": null }
  ],
  "sharableText": "AI가 분석한 내 학문적 정체성: '수치 뒤 패턴을 찾는 분석형 탐구자' 🧬"
}`;
```

### 4.3 컴포넌트 설계

**`src/components/features/DnaCard.tsx`**

```
DnaCard
├── DnaKeywordCloud            // 키워드 태그 + 잠금 처리
├── DnaIdentityText            // 정체성 한 줄 (강조 표시)
├── DnaDescription             // 상세 설명 (준비생+ 해제, blur overlay)
├── DnaRecommendations         // 추천 학과 + 활동 (준비생+ 해제)
├── DnaShareButtons
│   ├── KakaoShareButton       // 카카오톡 SDK 공유
│   └── ImageDownloadButton    // html-to-image → PNG 저장
└── DnaEssayLinkButton         // 입시생+ : 자소서 초안 생성 → /generate
```

**카카오 공유 구현**:
```typescript
// 카카오 SDK (window.Kakao) 활용
Kakao.Share.sendDefault({
  objectType: 'text',
  text: dna.sharableText + '\n\n나도 분석받기 👉',
  link: { mobileWebUrl: `${origin}/?ref=dna`, webUrl: `${origin}/?ref=dna` },
});
```

---

## 5. KF-02: AI 입시관

### 5.1 API 설계

**Route**: `POST /api/admissions`

**Request**:
```typescript
{
  text: string;          // 세특 또는 탐구보고서
  targetUniv: string;    // "연세대학교"
  targetMajor: string;   // "의예과"
  type: 'seteok' | 'report';
}
```

**Response** (Streaming):
```typescript
// SSE 스트림으로 응답 (기존 generateReportStream 패턴 동일)
// 최종 완성 시 JSON 구조:
{
  strengths: string[];       // 강점 2~3가지
  weaknesses: string[];      // 보완점 2~3가지
  interviewQuestions: string[]; // 면접 예상 질문 3개
  overallComment: string;    // 종합 평가
  score: number;             // 70~95 범위 (절대 점수 아님, 상대적 가이드)
}
```

**플랜별 접근 제어**:
| 항목 | Free | 준비생 | 입시생 |
|------|------|--------|--------|
| 기능 접근 | 맛보기 1회 | 월 3회 | 무제한 |
| 복수 대학 비교 | 🔒 | 🔒 | ✅ |
| PDF 다운로드 | 🔒 | ✅ | ✅ |

### 5.2 AI 프롬프트 설계

```typescript
export async function generateAdmissionsReview(params: {
  text: string;
  targetUniv: string;
  targetMajor: string;
  type: 'seteok' | 'report';
}): Promise<ReadableStream<Uint8Array>> {
  const prompt = `당신은 ${params.targetUniv} ${params.targetMajor}의 입학사정관 경력 10년의 전문가입니다.
아래 학생의 ${params.type === 'seteok' ? '세특' : '탐구보고서'}을 ${params.targetMajor} 지원자 관점에서 평가해주세요.

[평가 관점]
1. ${params.targetMajor} 전공에서 원하는 역량이 드러나는가?
2. 다른 지원자와 차별화되는 고유성이 있는가?
3. 학업 의지와 지적 호기심이 느껴지는가?
4. 사정관이 "면접에서 더 물어보고 싶다"고 느낄 포인트가 있는가?

[중요 주의사항]
- 특정 대학 합격 보장은 절대 언급하지 말 것
- "AI 시뮬레이션 평가"임을 자연스럽게 전제
- 면접 예상 질문은 실제로 물어볼 법한 구체적인 질문으로

[분석할 텍스트]
${params.text}

한국어로 따뜻하지만 날카롭게 평가해주세요. 강점 → 보완점 → 면접 예상 질문 순서로 서술하세요.`;
```

### 5.3 대학/학과 선택 UI

대학·학과 데이터는 초기에 JSON 파일로 관리한다.

```typescript
// src/data/universities.ts
export const TOP_UNIVERSITIES = [
  { id: 'snu', name: '서울대학교' },
  { id: 'yonsei', name: '연세대학교' },
  { id: 'korea', name: '고려대학교' },
  // ...SKY + 의대 + 주요 국립대 20개
];

export const MAJORS_BY_FIELD = {
  medicine: ['의예과', '치의예과', '한의예과', '간호학과'],
  engineering: ['전기전자공학', '컴퓨터공학', '화학공학', '기계공학'],
  // ...
};
```

---

## 6. KF-03: 세특 포트폴리오 타임라인

### 6.1 DB 스키마 변경

```prisma
// prisma/schema.prisma — SeteokHistory 모델 확장
model SeteokHistory {
  // 기존 필드 유지...
  grade    Int?    @default(null)    // 1, 2, 3 (고1, 고2, 고3)
  semester Int?    @default(null)    // 1, 2

  @@map("seteok_history")
}
```

**마이그레이션**: 기존 레코드는 grade/semester를 null로 유지, 신규 생성 시 입력받음.

### 6.2 API 설계

**Route**: `GET /api/history/timeline`

**Response**:
```typescript
{
  timeline: TimelineGroup[];
  narrative?: string;    // AI 성장 내러티브 (입시생+ 플랜)
}

type TimelineGroup = {
  grade: number;         // 1 | 2 | 3
  semester: number;      // 1 | 2
  label: string;         // "고2 2학기"
  items: TimelineItem[];
}

type TimelineItem = {
  id: string;
  subjectName: string;
  type: 'seteok' | 'report';
  topic: string;
  charCount: number;
  createdAt: string;
}
```

**플랜별 접근 제어**:
| 항목 | Free | 준비생 | 입시생 |
|------|------|--------|--------|
| 열람 가능 기록 | 최근 3개 | 전체 | 전체 |
| 타임라인 그룹핑 | 🔒 | ✅ | ✅ |
| AI 성장 내러티브 | 🔒 | 🔒 | ✅ |
| 자소서 연계 버튼 | 🔒 | 🔒 | ✅ |

### 6.3 컴포넌트 설계

**`src/components/features/GrowthTimeline.tsx`**

```
GrowthTimeline
├── TimelineHeader             // 전체 요약 (총 N개, N과목)
├── TimelineTrack              // 수평 타임라인 바
│   └── TimelineNode × N      // 각 기록 노드
├── TimelineGroupList          // 학년/학기별 카드 그룹
│   └── TimelineItemCard × N  // 개별 세특/탐구 카드
├── NarrativeSection           // AI 성장 내러티브 (입시생+)
│   └── LockedOverlay          // 잠금 블러 + 업셀
└── EssayLinkSection           // 자소서 연계 버튼 (입시생+)
```

### 6.4 학년/학기 입력 UX

탐구보고서 생성 완료 후 "기록 저장" 시 grade/semester를 선택받는다.

```
[이 기록을 저장하시겠어요?]
학년: [고1] [고2] [고3]
학기: [1학기] [2학기]
[저장하기]
```

---

## 7. 공통 업셀 UX 패턴

### 7.1 UpgradeGate 컴포넌트

```typescript
// src/components/upsell/UpgradeGate.tsx (기존 확장)
interface UpgradeGateProps {
  feature: 'diagnosis' | 'dna' | 'admissions' | 'timeline';
  requiredPlan: 'standard' | 'premium';
  children: React.ReactNode;
}

// 사용법
<UpgradeGate feature="diagnosis" requiredPlan="standard">
  <DiagnosisItemList items={items} />
</UpgradeGate>
```

### 7.2 업셀 트리거 카피

| 기능 | Free 잠금 메시지 | CTA 버튼 |
|------|----------------|----------|
| KF-01 세부 항목 | "항목별 점수로 어디를 고쳐야 할지 알 수 있어요" | "준비생 플랜으로 보기" |
| KF-04 각도 추천 | "10만 명과 다른 각도를 찾고 싶다면" | "차별화 각도 보기" |
| KF-05 상세 설명 | "내 이야기를 읽고 싶다면" | "내 정체성 확인하기" |
| KF-02 입시관 | "입시 전문가의 눈으로 내 세특 확인" | "AI 입시관 만나기" |
| KF-03 타임라인 | "3년의 성장이 한눈에 보입니다" | "성장 스토리 보기" |

---

## 8. 라우팅 & 네비게이션

### 8.1 신규 페이지

```
/my/diagnosis        세특 건강 진단
/my/dna              진로 키워드 DNA
/my/admissions       AI 입시관
/my/timeline         포트폴리오 타임라인
```

### 8.2 대시보드 진입점

기존 `/dashboard`에 킬러 기능 4개를 "내 생기부 관리" 섹션으로 추가한다.

```
대시보드
├── 빠른 생성 (기존)
└── 내 생기부 관리 (신규 섹션)
    ├── [건강 진단] → /my/diagnosis
    ├── [진로 DNA]  → /my/dna
    ├── [AI 입시관] → /my/admissions
    └── [성장 타임라인] → /my/timeline
```

---

## 9. 의존성 추가

```json
// package.json에 추가 필요
{
  "recharts": "^2.x",         // KF-01 레이더 차트
  "html-to-image": "^1.x"     // KF-05 DNA 카드 이미지 저장
}
```

카카오 공유 SDK는 `public/index.html` 또는 layout.tsx Script 태그로 로드.

---

## 10. Implementation Order

### Phase 1 (Week 1-2): KF-01 + KF-04

```
Day 1-2:  POST /api/diagnosis + generateDiagnosis() AI 함수
Day 3-4:  DiagnosisReport 컴포넌트 + 레이더 차트
Day 5:    /my/diagnosis 페이지 + 구독 게이트
Day 6-7:  generateTopicRarity() + TopicRarityBadge
Day 8:    주제 은행 카드 배지 통합
Day 9-10: 테스트 + 업셀 UX 조정
```

### Phase 2 (Week 3-4): KF-05

```
Day 1-2:  POST /api/dna + generateDna() AI 함수
Day 3-4:  DnaCard 컴포넌트 + 카카오 공유
Day 5:    html-to-image 이미지 저장
Day 6-7:  /my/dna 페이지 + 잠금 처리
Day 8-10: 자소서 연계 (입시생+) + 통합 테스트
```

### Phase 3 (Week 5-7): KF-02

```
Day 1-3:  대학/학과 데이터 JSON + 선택 UI
Day 4-6:  POST /api/admissions + 스트리밍 응답
Day 7-9:  AdmissionsReport 컴포넌트
Day 10-14: PDF 생성 + 복수 대학 비교 (입시생+)
```

### Phase 4 (Week 8-10): KF-03

```
Day 1-2:  DB 마이그레이션 (grade/semester 컬럼)
Day 3-4:  GET /api/history/timeline
Day 5-7:  GrowthTimeline 컴포넌트
Day 8-9:  AI 성장 내러티브 생성 (입시생+)
Day 10:   자소서 연계 + 통합 테스트
```

---

## 11. Success Criteria (Design → Do 전환 조건)

- [ ] 모든 API 엔드포인트 Request/Response 타입 확정
- [ ] 플랜별 접근 제어 로직 전체 설계 완료
- [ ] 컴포넌트 트리 설계 완료 (5개 신규 컴포넌트)
- [ ] DB 스키마 변경사항 확정 (KF-03)
- [ ] Phase 1 구현 시작 준비 완료

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-24 | Initial design document |
