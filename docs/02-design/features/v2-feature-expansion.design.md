# Design: AI 생기부 Maker v2 — 기능 확장 설계

> 작성일: 2026-03-05
> 작성: 아키텍트 + 설계자 팀
> 기반 문서: docs/01-plan/features/v2-feature-expansion.plan.md
> 버전: v1.0

---

## 0. 설계 범위 (Sprint 1 — P0)

이 설계서는 v2 Sprint 1 기능 3개를 대상으로 한다:

| 기능 ID | 기능명 | 우선순위 |
|---------|--------|---------|
| F-01 | 스트리밍 생성 + 인라인 편집 | P0 |
| F-02 | A/B 비교 생성 | P0 |
| F-03 | 나만의 진로 프로필 맞춤화 (Lite) | P0 |

---

## 1. 아키텍처 변경 설계 (아키텍트 팀)

### 1.1 기존 아키텍처 vs v2 변경점

```
[v1 흐름]                          [v2 흐름]
POST /api/generate-report    →     GET /api/generate-report-stream (SSE)
  (결과 대기 후 JSON 반환)              (텍스트 청크 실시간 스트리밍)

POST /api/generate-setech    →     GET /api/generate-setech-stream (SSE)

[신규 추가]
POST /api/generate-ab              A/B 두 버전 병렬 생성
GET  /api/profile                  사용자 프로필 조회 (localStorage 기반, 서버 없음)
```

### 1.2 스트리밍 아키텍처 (F-01)

```
[Client: ResultDisplay]
  │ fetch('/api/generate-report-stream', { method: 'POST' })
  │
  ▼
[Next.js Route Handler: /api/generate-report-stream/route.ts]
  │ OpenAI SDK stream: true
  │ ReadableStream 생성
  │
  ▼
[OpenAI gpt-4o] ──── 청크 단위 응답
  │
  ▼
[TransformStream] ──── data: {...}\n\n 형태로 변환
  │
  ▼
[Client] ──── EventSource / fetch ReadableStream reader
  │  reader.read() 루프
  ▼
[StreamingTextDisplay] ──── 실시간 텍스트 누적 렌더링
```

**구현 방식**: Next.js App Router `StreamingTextResponse` 패턴

```typescript
// /api/generate-report-stream/route.ts 핵심 구조
export async function POST(request: Request) {
  const { subject, topic, length, tone, profile } = await request.json();

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [/* 기존 프롬프트 + profile 주입 */],
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

### 1.3 A/B 병렬 생성 아키텍처 (F-02)

```
[Client: AbCompareButton 클릭]
  │
  ▼
[POST /api/generate-ab]
  │ Promise.all([
  │   generateReport(params, seed='A'),   ← temperature: 0.7
  │   generateReport(params, seed='B'),   ← temperature: 1.0
  │ ])
  │
  ▼
{ reportA: string, reportB: string, setechA: string, setechB: string }
  │
  ▼
[AbCompareView] ──── 좌우 패널 비교 UI
```

**핵심**: 같은 파라미터, 다른 `temperature`로 다양성 확보

### 1.4 프로필 저장 아키텍처 (F-03)

```
[ProfileSetupModal] ──── 'use client'
  │ 입력: 진로/관심사 (선택사항)
  ▼
[localStorage: 'sam_profile']
  { career: string, interests: string, savedAt: string }
  │
  ▼
[generate/page.tsx] ──── localStorage에서 프로필 읽기
  │ 프롬프트에 profile 컨텍스트 주입
  ▼
[API Route] ──── profile 파라미터 수신 → 프롬프트 동적 강화
```

서버 없음 — 완전 클라이언트 측 저장, 향후 로그인 시 마이그레이션 가능

---

## 2. API 명세 변경/추가 (아키텍트 팀)

### 2.1 신규: POST /api/generate-report-stream

스트리밍 탐구보고서 생성

**Request**
```json
{
  "subject": "string",
  "topic": "string",
  "length": "short" | "medium" | "long",
  "tone": "academic" | "friendly" | "neutral",
  "profile": {
    "career": "string",      // 선택사항
    "interests": "string"    // 선택사항
  }
}
```

**Response**: `text/plain; charset=utf-8` — 스트리밍 텍스트 청크

**Error**: 500 → `{ "error": "..." }` JSON

---

### 2.2 신규: POST /api/generate-setech-stream

스트리밍 세특 생성

**Request** (기존 generate-setech와 동일 + profile 추가)
```json
{
  "subject": "string",
  "topic": "string",
  "reportContent": "string",   // 선택사항
  "profile": { "career": "string", "interests": "string" }
}
```

**Response**: `text/plain; charset=utf-8` — 스트리밍 텍스트 청크

---

### 2.3 신규: POST /api/generate-ab

A/B 두 버전 동시 생성

**Request**
```json
{
  "subject": "string",
  "topic": "string",
  "length": "short" | "medium" | "long",
  "tone": "academic" | "friendly" | "neutral",
  "profile": { "career": "string", "interests": "string" }
}
```

**Response**
```json
{
  "versionA": {
    "report": "string",
    "setech": "string"
  },
  "versionB": {
    "report": "string",
    "setech": "string"
  }
}
```

**처리 방식**: `Promise.all` 병렬 처리, 타임아웃 30초

---

### 2.4 기존 API 유지 (하위호환)

- `POST /api/generate-report` — 유지 (히스토리 재생성, 폴백용)
- `POST /api/generate-setech` — 유지

---

## 3. 타입 시스템 변경 (아키텍트 팀)

```typescript
// src/types/index.ts 추가 타입

export interface UserProfile {
  career: string;       // 희망 진로/학과 (예: "AI/컴퓨터공학")
  interests: string;    // 관심사/특기 (예: "코딩, 수학 올림피아드")
  savedAt: string;      // ISO 날짜
}

export interface AbGenerateRequest {
  subject: string;
  topic: string;
  length: LengthOption;
  tone: ToneOption;
  profile?: Partial<UserProfile>;
}

export interface AbGenerateResponse {
  versionA: { report: string; setech: string };
  versionB: { report: string; setech: string };
}

export type StreamingState = 'idle' | 'streaming' | 'done' | 'error';

export interface InlineEditState {
  isEditing: boolean;
  reportText: string;
  setechText: string;
  hasEdited: boolean;
}
```

---

## 4. 폴더 구조 변경 (아키텍트 팀)

```
src/
├── app/
│   ├── api/
│   │   ├── generate-report/route.ts          (기존 유지)
│   │   ├── generate-setech/route.ts          (기존 유지)
│   │   ├── generate-report-stream/
│   │   │   └── route.ts                      ← 신규 (F-01)
│   │   ├── generate-setech-stream/
│   │   │   └── route.ts                      ← 신규 (F-01)
│   │   └── generate-ab/
│   │       └── route.ts                      ← 신규 (F-02)
│   └── generate/
│       └── page.tsx                          (수정: 스트리밍 클라이언트)
├── components/
│   ├── ui/
│   │   └── (기존 유지)
│   └── features/
│       ├── ResultDisplay.tsx                 (수정: 스트리밍 + 인라인 편집)
│       ├── StreamingTextDisplay.tsx          ← 신규 (F-01)
│       ├── InlineEditor.tsx                  ← 신규 (F-01)
│       ├── AbCompareView.tsx                 ← 신규 (F-02)
│       └── ProfileSetupModal.tsx             ← 신규 (F-03)
├── lib/
│   ├── ai.ts                                 (수정: stream 함수 추가, profile 주입)
│   ├── profile.ts                            ← 신규 (F-03: localStorage 관리)
│   └── (기존 유지)
└── types/
    └── index.ts                              (수정: 신규 타입 추가)
```

---

## 5. 컴포넌트 설계 (설계자 팀)

### 5.1 StreamingTextDisplay (신규)

**역할**: 스트리밍 중인 텍스트를 실시간으로 타이핑 효과로 렌더링

```typescript
interface StreamingTextDisplayProps {
  text: string;                  // 누적된 스트리밍 텍스트
  state: StreamingState;         // idle | streaming | done | error
  onTextChange?: (text: string) => void;   // 인라인 편집 콜백
  editable?: boolean;            // 완료 후 편집 가능 여부
  placeholder?: string;
}
```

**상태별 UI**
| state | 커서 | 배경 | 액션 |
|-------|------|------|------|
| idle | 없음 | `bg-gray-50` | 시작 대기 |
| streaming | 깜빡이는 `|` 커서 | `bg-white` | 텍스트 누적 |
| done | 없음 | `bg-white` | contenteditable 활성화 |
| error | 없음 | `bg-red-50` | 에러 메시지 표시 |

**스트리밍 커서 CSS**
```css
/* Tailwind arbitrary value */
.streaming-cursor::after {
  content: '|';
  animation: blink 1s step-end infinite;
}
@keyframes blink { 50% { opacity: 0 } }
```

---

### 5.2 InlineEditor (신규)

**역할**: 생성 완료 후 텍스트를 바로 수정하는 인라인 에디터

```typescript
interface InlineEditorProps {
  initialText: string;
  onSave: (text: string) => void;
  onDiscard: () => void;
  maxLength?: number;
  showCharCount?: boolean;
}
```

**UI 구성**
```
┌──────────────────────────────────────────────┐
│ [텍스트 영역 - contenteditable div]           │
│                                              │
│                                    1024 / 2000│
├──────────────────────────────────────────────┤
│ [수정 취소]              [저장하고 복사하기]    │
└──────────────────────────────────────────────┘
```

---

### 5.3 AbCompareView (신규)

**역할**: A/B 두 버전을 나란히 비교하고 원하는 버전 선택

```typescript
interface AbCompareViewProps {
  versionA: { report: string; setech: string };
  versionB: { report: string; setech: string };
  activeTab: 'report' | 'setech';
  onSelect: (version: 'A' | 'B') => void;
  onMix: (reportVersion: 'A' | 'B', setechVersion: 'A' | 'B') => void;
}
```

**레이아웃**
```
Mobile (< 768px): 탭 방식 (A 탭 | B 탭 전환)
Desktop (>= 768px): 좌우 2열 분할

┌───────────────┬───────────────┐
│   버전 A      │   버전 B      │
│               │               │
│ [탐구보고서]  │ [탐구보고서]  │
│   내용...     │   내용...     │
│               │               │
│ [이 버전 선택]│ [이 버전 선택]│
└───────────────┴───────────────┘
         [믹스앤매치 모드]
```

**믹스앤매치 UI**
```
보고서: [A 선택] [B 선택]
세 특: [A 선택] [B 선택]
          [이 조합 사용하기]
```

---

### 5.4 ProfileSetupModal (신규)

**역할**: 나만의 진로 프로필 설정 (선택사항, 한 번 설정 후 자동 적용)

```typescript
interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  initialProfile?: Partial<UserProfile>;
}
```

**UI 구성**
```
┌─────────────────────────────────┐
│  내 진로 프로필 설정             │  ← 모달 헤더
│  (설정하면 더 맞춤화된 결과를 받아요) │
├─────────────────────────────────┤
│  희망 진로/학과 (선택사항)        │
│  [______________________________]│  ← 텍스트 입력
│  예: 컴퓨터공학, 의대, 경영학과   │
│                                  │
│  관심사/특기 (선택사항)            │
│  [______________________________]│  ← 텍스트 입력
│  예: 코딩, 수학 올림피아드, 독서  │
│                                  │
│  [나중에 설정]    [프로필 저장]   │
└─────────────────────────────────┘
```

**진입 방법**
- 생성 옵션 페이지 우측 상단 "내 프로필" 아이콘 버튼
- 프로필 미설정 시 첫 생성 전 배너 표시 (닫기 가능)

---

### 5.5 ResultDisplay 수정 (기존 컴포넌트 확장)

현재 `ResultDisplay.tsx`에 다음을 추가:

```typescript
// 기존 props에 추가
interface ResultDisplayProps {
  // ... 기존 props 유지 ...
  streamingState: StreamingState;      // 추가
  onRegenerateAb: () => void;          // 추가: A/B 비교 생성 트리거
  showAbButton?: boolean;              // 추가
}
```

**결과 페이지 UI 변경**
```
[기존]                              [v2]
┌──────────────────┐               ┌──────────────────────────────┐
│ 탐구보고서       │               │ 탐구보고서         [수정하기] │
│ [정적 텍스트]   │     →         │ [스트리밍 텍스트]  (done 후)  │
│                  │               │                              │
│ [복사] [재생성] │               │ [복사] [다른 버전 보기] [재생성]│
└──────────────────┘               └──────────────────────────────┘
```

---

## 6. lib/ai.ts 수정 설계 (아키텍트 팀)

### 6.1 신규 함수: generateReportStream

```typescript
export async function generateReportStream(params: {
  subject: string;
  topic: string;
  length: LengthOption;
  tone: ToneOption;
  profile?: Partial<UserProfile>;
}): Promise<ReadableStream<Uint8Array>>
```

**프로필 주입 프롬프트 패턴**
```typescript
const profileContext = profile?.career || profile?.interests
  ? `\n\n[학생 프로필 - 이 탐구에 적극 반영할 것]
- 희망 진로/학과: ${profile.career || '미설정'}
- 관심사/특기: ${profile.interests || '미설정'}
→ 진로연계 단락에서 위 학생의 진로와 명확히 연결 지어 작성할 것`
  : '';
```

### 6.2 신규 함수: generateAb

```typescript
export async function generateAb(params: AbGenerateRequest): Promise<AbGenerateResponse>
// 내부: Promise.all([
//   generateReport({ ...params, temperature: 0.7 }),
//   generateReport({ ...params, temperature: 1.0 }),
// ].map(async (p) => ({ report: await p, setech: await generateSetech(...) })))
```

---

## 7. lib/profile.ts 신규 설계 (설계자 팀)

```typescript
// src/lib/profile.ts

const PROFILE_KEY = 'sam_profile';   // Student Activity Maker

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({
    ...profile,
    savedAt: new Date().toISOString(),
  }));
}

export function loadProfile(): UserProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}
```

---

## 8. 상태 흐름 설계 (설계자 팀)

### 8.1 스트리밍 생성 흐름

```
generate/page.tsx (client)

[생성 시작 클릭]
  → setStreamingState('streaming')
  → fetch('/api/generate-report-stream', { body: JSON.stringify(params) })
  → const reader = response.body.getReader()
  → while (true) {
      const { done, value } = await reader.read()
      if (done) { setStreamingState('done'); break; }
      setReportText(prev => prev + decode(value))
    }
  → 세특도 순차 스트리밍 시작 (보고서 완료 후)
  → setStreamingState('done')
```

### 8.2 A/B 생성 흐름

```
[다른 버전 보기] 클릭
  → setIsAbLoading(true)
  → fetch('/api/generate-ab', { body: JSON.stringify(params) })
  → const { versionA, versionB } = await response.json()
  → setAbResult({ versionA, versionB })
  → setIsAbLoading(false)
  → AbCompareView 렌더링
```

### 8.3 프로필 흐름

```
앱 마운트 시
  → loadProfile() from localStorage
  → profile 상태 설정 (null이면 배너 표시)

[프로필 저장] 클릭
  → saveProfile(profile)
  → 이후 생성 요청에 profile 자동 포함
```

---

## 9. 마이그레이션 전략 (아키텍트 팀)

### 단계 1: 병렬 운영
- `/api/generate-report` (기존) → 유지
- `/api/generate-report-stream` (신규) → 기본 경로로 사용
- `generate/page.tsx`에서 스트리밍 실패 시 기존 API로 폴백

```typescript
// 폴백 패턴
try {
  await fetchWithStreaming('/api/generate-report-stream', params);
} catch {
  // 스트리밍 미지원 브라우저 또는 에러
  const result = await fetch('/api/generate-report', { ... });
}
```

### 단계 2: 완전 전환 (Sprint 2)
- 기존 비스트리밍 API는 히스토리 재생성 전용으로만 남김

---

## 10. 구현 우선순위 (개발자 팀 전달)

### 구현 순서

```
1. src/types/index.ts — 신규 타입 추가 (5분)
2. src/lib/profile.ts — 신규 파일 생성 (10분)
3. src/lib/ai.ts — generateReportStream, generateSetechStream, generateAb 추가 (30분)
4. src/app/api/generate-report-stream/route.ts — 신규 (15분)
5. src/app/api/generate-setech-stream/route.ts — 신규 (10분)
6. src/app/api/generate-ab/route.ts — 신규 (15분)
7. src/components/features/StreamingTextDisplay.tsx — 신규 (20분)
8. src/components/features/InlineEditor.tsx — 신규 (20분)
9. src/components/features/ProfileSetupModal.tsx — 신규 (25분)
10. src/components/features/AbCompareView.tsx — 신규 (30분)
11. src/components/features/ResultDisplay.tsx — 기존 수정 (20분)
12. src/app/generate/page.tsx — 스트리밍 클라이언트 연동 (30분)
```

**총 예상 구현 시간**: 약 3-4시간

---

## 11. 검증 체크리스트 (QA 팀 전달)

### F-01 스트리밍
- [ ] 생성 시작 시 즉시 텍스트가 나타나기 시작한다
- [ ] 스트리밍 중 커서(|)가 깜빡인다
- [ ] 완료 후 인라인 편집 모드가 활성화된다
- [ ] 편집 후 복사 버튼이 수정된 텍스트를 복사한다
- [ ] 네트워크 에러 시 에러 상태가 표시되고 재시도 버튼이 나온다

### F-02 A/B 비교
- [ ] "다른 버전 보기" 클릭 시 로딩 상태가 표시된다
- [ ] A/B 두 버전이 나란히 표시된다 (데스크톱)
- [ ] 모바일에서 탭으로 전환된다
- [ ] "이 버전 선택" 클릭 시 메인 결과로 반영된다
- [ ] 믹스앤매치로 보고서 A + 세특 B 조합이 가능하다

### F-03 프로필
- [ ] 프로필 저장 후 다음 생성에 자동 적용된다
- [ ] 프로필 미설정 시 기존과 동일하게 동작한다 (선택사항)
- [ ] 프로필이 localStorage에 올바르게 저장/로드된다
- [ ] 프로필 삭제 후 기본 모드로 복귀된다

---

*아키텍트 팀 서명: 2026-03-05*
*설계자 팀 서명: 2026-03-05*
*다음 단계: `/pdca do v2-feature-expansion` — 개발자 팀 구현 착수*
