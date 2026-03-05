# Design: AI 생기부 Maker v2 Sprint 4

> 작성일: 2026-03-05
> Phase: Design
> 참조: docs/01-plan/features/v2-sprint4.plan.md

---

## 1. 설계 개요

Sprint 4는 5개 피처로 구성된다. 구현 우선순위 순으로 설계한다.

| Feature | 핵심 변경 | 신규 파일 수 |
|---------|-----------|------------|
| F-10 SEO | layout.tsx 메타데이터 강화, sitemap.ts, robots.txt | 3 |
| F-11 InlineEditor | InlineEditor.tsx + ResultDisplay.tsx 수정 | 2 |
| F-12 Portfolio | portfolio/page.tsx, api/generate-portfolio, history 수정 | 4 |
| F-13 PWA | manifest.json, next.config.ts 수정 | 2 |
| F-14 CareerRoadmap | NextTopicRecommend.tsx, api/recommend-topics | 2 |

---

## 2. F-10: SEO 최적화 + 랜딩 페이지 개편

### 2-1. 제약사항: 'use client' 이슈

`src/app/page.tsx`는 `useState`, `useRouter`를 사용하므로 `'use client'`가 필수다.
Next.js App Router에서 클라이언트 컴포넌트는 `export const metadata`를 사용할 수 없다.

**해결책**: `layout.tsx`에 전체 메타데이터를 배치한다 (이미 서버 컴포넌트).
`page.tsx`는 그대로 클라이언트 컴포넌트로 유지한다.

### 2-2. layout.tsx 메타데이터 업그레이드

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "AI 생기부 Maker — 세특·탐구보고서 5분 완성",
  description: "AI가 세특 500자와 탐구보고서를 5분 만에 작성해 드립니다. 수학·과학·영어 등 8개 과목 지원. 완전 무료.",
  keywords: ["세특", "생기부", "탐구보고서", "AI 세특 생성", "세특 자동 완성", "생활기록부"],
  openGraph: {
    title: "AI 생기부 Maker — 세특·탐구보고서 5분 완성",
    description: "AI가 세특 500자와 탐구보고서를 자동 생성. 8개 과목 지원, 무료.",
    url: "https://your-domain.com",
    siteName: "AI 생기부 Maker",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 생기부 Maker",
    description: "세특·탐구보고서 AI 자동 생성",
  },
  robots: { index: true, follow: true },
};
```

### 2-3. sitemap.ts 신규 생성

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://your-domain.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://your-domain.com/feedback', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://your-domain.com/batch', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];
}
```

### 2-4. public/robots.txt 신규 생성

```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://your-domain.com/sitemap.xml
```

### 2-5. page.tsx FAQ 섹션 추가

홈 페이지 Footer note 위에 FAQ 섹션 삽입 (클라이언트 컴포넌트 내 순수 JSX, SEO는 layout.tsx 메타데이터로 커버).

```tsx
// page.tsx 하단 (Footer note 직전)
{/* ── FAQ ── */}
<div className="mt-12">
  <h2 className="mb-4 text-base font-bold text-slate-800">자주 묻는 질문</h2>
  <div className="flex flex-col gap-3">
    {FAQ_ITEMS.map((faq) => <FaqItem key={faq.q} {...faq} />)}
  </div>
</div>
```

FAQ 데이터 (페이지 상단 상수로 정의):
```typescript
const FAQ_ITEMS = [
  { q: "세특이 뭔가요?", a: "세부능력 및 특기사항의 줄임말로, 생활기록부에 기재되는 과목별 학습 활동 기록입니다." },
  { q: "AI가 생성한 세특을 그대로 제출해도 되나요?", a: "생성된 내용은 초안입니다. 자신의 실제 경험을 반영해 수정 후 사용하세요." },
  { q: "무료인가요?", a: "완전 무료입니다. 회원가입도 필요 없습니다." },
  { q: "어떤 과목을 지원하나요?", a: "수학, 물리, 화학, 생물, 역사, 영어, 국어, 사회 8개 과목을 지원합니다." },
];
```

`FaqItem`은 `useState`로 열림/닫힘 토글하는 아코디언 컴포넌트 (page.tsx 내부에 인라인 정의).

---

## 3. F-11: 인라인 에디터 (InlineEditor)

### 3-1. InlineEditor 컴포넌트 인터페이스

```typescript
// src/components/features/InlineEditor.tsx
interface InlineEditorProps {
  text: string;                   // 초기(원본) 텍스트
  label: string;                  // "탐구보고서" | "세특 500자"
  isSetech?: boolean;             // 세특이면 500자 카운터 표시
  onSave: (newText: string) => void;
}
```

**내부 상태**:
```typescript
const [isEditing, setIsEditing] = useState(false);
const [draft, setDraft] = useState(text);
```

**뷰 모드** (`isEditing === false`):
- 우측 상단 `[수정하기]` 버튼 (연필 아이콘)
- 텍스트 `whitespace-pre-wrap` 표시
- 글자 수 표시

**편집 모드** (`isEditing === true`):
- `<textarea>` (pre-filled with `draft`)
- 세특일 때: 실시간 글자수 배지 `{draft.length}자` + 색상 (490~510: 초록, 그 외: 주황)
- `[저장]` 버튼: `onSave(draft)` 호출 후 `setIsEditing(false)`
- `[취소]` 버튼: `setDraft(text)` 후 `setIsEditing(false)`

### 3-2. ResultDisplay.tsx 수정 계획

현재 탐구보고서/세특 탭의 "완료" 상태 (`reportStreamState === 'done'` 또는 비스트리밍 report 표시 부분)에서 텍스트를 `InlineEditor`로 감싼다.

**수정 방식**:
- `ResultDisplayProps`에 `onReportEdit?: (text: string) => void`, `onSetechEdit?: (text: string) => void` 추가
- 보고서 완료 표시 영역: `<InlineEditor text={report} label="탐구보고서" onSave={onReportEdit} />`
- 세특 완료 표시 영역: `<InlineEditor text={setech} label="세특 500자" isSetech onSave={onSetechEdit} />`

**generate/page.tsx에서 콜백 처리**:
```typescript
// 편집 저장 시 state 업데이트 + 이력 재저장
const handleReportEdit = (text: string) => {
  setReport(text);
  // 이력 업데이트: saveHistory or updateHistoryItem
};
```

### 3-3. 글자수 배지 스펙 (세특 전용)

| 범위 | 배지 색상 | 라벨 |
|------|-----------|------|
| 490~510자 | 초록 (green-100/600) | 적정 |
| 450~489자, 511~550자 | 주황 (orange-100/600) | 조금 짧음/김 |
| 그 외 | 빨강 (red-100/600) | 수정 필요 |

---

## 4. F-12: 포트폴리오 생성기

### 4-1. 타입 추가 (types/index.ts)

```typescript
export interface PortfolioRequest {
  items: HistoryItem[];           // 선택한 이력 (1~6개)
  profile?: UserProfile;
}

export interface PortfolioResult {
  content: string;               // 마크다운 포트폴리오 텍스트
  generatedAt: string;
}
```

### 4-2. history/page.tsx 수정 계획

**체크박스 모드 추가**:
```typescript
const [selectMode, setSelectMode] = useState(false);
const [selected, setSelected] = useState<Set<string>>(new Set());
```

- 헤더에 `[포트폴리오 만들기]` 버튼 추가 → `setSelectMode(true)`
- 선택 모드일 때: 각 이력 카드 좌측에 체크박스, 선택 수 표시
- `[포트폴리오 생성 (N개)]` 버튼 → 선택 항목을 쿼리 파라미터로 `/portfolio?ids=id1,id2,...` 이동
- 취소 버튼으로 selectMode 해제

**제약**: 최소 2개, 최대 6개 선택. 범위 초과시 버튼 비활성화 + 안내 메시지.

### 4-3. API: POST /api/generate-portfolio

```typescript
// src/app/api/generate-portfolio/route.ts
// Request body:
interface Body {
  items: HistoryItem[];
  profile?: UserProfile;
}
// Response: ReadableStream (스트리밍)
```

스트리밍 방식 (`generate-report-stream`과 동일한 패턴):
```typescript
const stream = new ReadableStream({ ... });
return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
```

### 4-4. ai.ts: generatePortfolio() 함수 추가

```typescript
export async function generatePortfolio(
  items: HistoryItem[],
  profile?: UserProfile
): Promise<ReadableStream<Uint8Array>>
```

**프롬프트 구조**:
```
당신은 대한민국 고등학교 진학 전문 컨설턴트입니다.
아래 학생의 과목별 탐구 활동(세특/보고서)을 분석하여 하나의 일관된 포트폴리오 문서를 작성하세요.

[학생 프로필]
${profile ? `진로: ${profile.career}, 관심사: ${profile.interests}` : '미제공'}

[탐구 활동 목록]
${items.map((item, i) => `
## ${i+1}. ${item.subjectEmoji} ${item.subjectName} — ${item.topic}
${item.report || item.setech || '내용 없음'}
`).join('\n')}

포트폴리오를 다음 구조로 작성하세요:
1. 학습 여정 요약 (200자 내외)
2. 과목별 탐구 활동 요약 (과목당 2-3줄)
3. 탐구 활동의 공통 주제 / 핵심 역량
4. 진로 연계 스토리 (진로와의 연결, 발전 방향)
```

### 4-5. portfolio/page.tsx 설계

```typescript
// src/app/portfolio/page.tsx — 'use client'
// URL params: ?ids=id1,id2,...
```

**페이지 흐름**:
1. `useSearchParams()`로 ids 파싱 → localStorage에서 해당 HistoryItem 로드
2. 마운트 시 자동으로 스트리밍 API 호출
3. `StreamingTextDisplay` (기존 컴포넌트 재사용)로 결과 표시
4. 완료 후: 복사 버튼 + PDF 저장 버튼 (window.print() 패턴 재사용)

---

## 5. F-13: PWA 모바일 최적화

### 5-1. public/manifest.json

```json
{
  "name": "AI 생기부 Maker",
  "short_name": "AI 생기부",
  "description": "세특·탐구보고서 AI 자동 생성",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#faf7ff",
  "theme_color": "#7c3aed",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 5-2. layout.tsx에 manifest 링크 추가

```typescript
// layout.tsx의 <head> 내부에 추가
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#7c3aed" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

**주의**: `next-pwa` 패키지는 Cloud Run 배포 시 서비스워커 복잡성을 야기할 수 있다.
MVP 구현은 manifest.json + 메타태그만으로 홈화면 추가(Add to Home Screen) 기능을 지원한다.
서비스워커(오프라인 지원)는 Phase 2로 미룬다.

### 5-3. 아이콘 준비

`public/icons/icon-192.png`, `public/icons/icon-512.png`를 현재 로고(📝 emoji 기반) 기준으로 생성.
(실제 이미지 파일은 구현 단계에서 placeholder로 대체)

---

## 6. F-14: 진로 로드맵 추천 (NextTopicRecommend)

### 6-1. API: POST /api/recommend-topics

```typescript
// src/app/api/recommend-topics/route.ts
interface Body {
  subject: string;       // 과목명
  topic: string;         // 탐구 주제
  setech?: string;       // 세특 내용 (컨텍스트용)
}
// Response: JSON
interface Response {
  recommendations: Array<{
    subject: string;
    subjectEmoji: string;
    title: string;
    description: string;
  }>;
}
```

AI 프롬프트:
```
다음 탐구 활동과 연계된 다음 탐구 주제 3개를 추천하세요.
과목: {subject}, 주제: {topic}

각 추천은 JSON 배열로 반환하세요:
[{"subject": "과목명", "subjectEmoji": "이모지", "title": "탐구 제목", "description": "한줄 설명"}]
```

응답 파싱: `JSON.parse()` 사용 (스트리밍 아님, 빠른 응답).

### 6-2. NextTopicRecommend 컴포넌트

```typescript
// src/components/features/NextTopicRecommend.tsx
interface NextTopicRecommendProps {
  subject: string;
  topic: string;
  setech?: string;
}
```

**렌더링**:
- 마운트 시 자동 API 호출 (로딩 스피너)
- 3개 카드: `[과목 뱃지] 수학 / 추천 주제 제목 / 한줄 설명 / [이 주제로 탐구 시작] 버튼`
- `[이 주제로 탐구 시작]` 클릭: `router.push(`/${subjectId}?topic=제목`)` (향후 확장을 위한 준비)

### 6-3. generate/page.tsx 통합

세특 스트리밍 완료 후 하단에 렌더링:

```tsx
{setechStreamState === 'done' && setech && (
  <div className="mt-10">
    <div className="mb-3 flex items-center gap-2">
      <div className="h-px flex-1 bg-slate-200" />
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">다음 탐구 추천</p>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
    <NextTopicRecommend subject={subjectName} topic={topic} setech={setech} />
  </div>
)}
```

---

## 7. 구현 순서 및 파일 목록

### Phase 1: F-10 SEO (설정 위주, 30분)
```
수정: src/app/layout.tsx          — Metadata 강화, manifest 링크
신규: src/app/sitemap.ts          — 사이트맵
신규: public/robots.txt           — 크롤링 허용
수정: src/app/page.tsx            — FAQ 섹션 추가
```

### Phase 2: F-11 InlineEditor (1.5시간)
```
신규: src/components/features/InlineEditor.tsx
수정: src/components/features/ResultDisplay.tsx  — InlineEditor 통합
수정: src/app/generate/page.tsx                  — onReportEdit, onSetechEdit 콜백
```

### Phase 3: F-12 Portfolio (3시간)
```
수정: src/types/index.ts                         — PortfolioRequest, PortfolioResult
수정: src/app/history/page.tsx                   — 체크박스 선택 UI
신규: src/app/portfolio/page.tsx                 — 포트폴리오 결과 페이지
신규: src/app/api/generate-portfolio/route.ts    — 스트리밍 API
수정: src/lib/ai.ts                              — generatePortfolio() 함수
```

### Phase 4: F-14 진로 추천 (1시간)
```
신규: src/app/api/recommend-topics/route.ts
신규: src/components/features/NextTopicRecommend.tsx
수정: src/app/generate/page.tsx                  — NextTopicRecommend 통합
```

### Phase 5: F-13 PWA (30분)
```
신규: public/manifest.json
신규: public/icons/icon-192.png (placeholder)
신규: public/icons/icon-512.png (placeholder)
수정: src/app/layout.tsx                         — manifest + apple meta 태그
```

---

## 8. 의존성

| 기능 | 외부 패키지 | 설치 여부 |
|------|------------|---------|
| F-10 SEO | 없음 (Next.js 내장) | - |
| F-11 InlineEditor | 없음 | - |
| F-12 Portfolio | 없음 | - |
| F-13 PWA | 없음 (manifest만) | - |
| F-14 진로 추천 | 없음 | - |

신규 패키지 설치 없음. 기존 스택 활용.

---

## 9. 완료 체크리스트

- [ ] F-10: 구글 검색에서 og:title 정상 표시 확인
- [ ] F-10: FAQ 섹션 4개 항목 아코디언 동작
- [ ] F-11: [수정하기] → textarea 전환 → [저장] → 텍스트 업데이트
- [ ] F-11: 세특 편집 중 글자수 배지 실시간 업데이트
- [ ] F-12: 이력 2~6개 선택 → /portfolio 이동 → 스트리밍 생성
- [ ] F-12: 포트폴리오 복사/PDF 저장
- [ ] F-13: /manifest.json 200 응답, 브라우저 홈화면 추가 프롬프트 표시
- [ ] F-14: 세특 완료 후 추천 카드 3개 표시, [이 주제로 탐구 시작] 클릭 동작

---

*설계자 승인: 2026-03-05*
*다음 단계: `/pdca do v2-sprint4` — 구현 시작*
