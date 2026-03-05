# Design: v2 Sprint 3

> 작성일: 2026-03-05 | 아키텍트 + 설계자 팀
> 기반: docs/01-plan/features/v2-sprint3.plan.md

---

## F-07: PDF 다운로드

### 구현 방식
브라우저 `window.print()` + CSS `@media print` 활용. 외부 라이브러리 불필요.

**print CSS 설계** (`src/app/globals.css`):
```css
@media print {
  body * { visibility: hidden; }
  #print-area, #print-area * { visibility: visible; }
  #print-area { position: fixed; top: 0; left: 0; width: 100%; }
  /* 버튼, 헤더, 네비 숨김 */
  .no-print { display: none !important; }
}
```

**UI 변경** (`src/app/generate/page.tsx`):
- 기존 [.docx 다운로드] 버튼 옆에 [PDF 저장] 버튼 추가
- 클릭 → `window.print()` 호출
- 인쇄 영역: 탐구보고서 + 세특 섹션에 `id="print-area"` 추가

**신규 파일**: 없음 (globals.css 수정 + generate/page.tsx 수정)

---

## F-08: 교사 스타일 뱅크

### 타입 추가 (`src/types/index.ts`)
```typescript
export type TeacherStyle =
  | 'analytical'    // 분석형
  | 'narrative'     // 서사형
  | 'competency'    // 역량 중심형
  | 'concise'       // 간결형
  | 'encouraging';  // 격려형

export const TEACHER_STYLE_LABELS: Record<TeacherStyle, string> = {
  analytical: '분석형',
  narrative: '서사형',
  competency: '역량 중심형',
  concise: '간결형',
  encouraging: '격려형',
};
```

### AI 프롬프트 주입 (`src/lib/ai.ts`)
```typescript
const TEACHER_STYLE_INSTRUCTIONS: Record<TeacherStyle, string> = {
  analytical: `문체 스타일: 분석형 교사
- "~을 분석하고 ~임을 확인하였다", "데이터를 토대로 ~결론을 도출하였다" 형식 사용
- 수치, 비교, 인과관계를 명확히 서술
- 이과/실험 교사 관점의 객관적 문체`,

  narrative: `문체 스타일: 서사형 교사
- "학생은 ~에 관심을 가지고 ~을 탐구하기 시작했다" 형식 사용
- 학생의 성장 과정과 변화를 스토리로 서술
- 탐구의 계기 → 과정 → 깨달음 흐름 강조`,

  competency: `문체 스타일: 역량 중심형 교사
- "비판적 사고력", "창의적 문제해결", "협업 능력" 등 핵심역량 키워드 명시
- 학생이 보여준 역량을 구체적 행동과 연결하여 서술
- 입시에서 빛나는 역량 중심 표현`,

  concise: `문체 스타일: 간결형 교사
- 군더더기 없는 간결한 서술, 핵심만 명확하게
- 명사형 종결 선호 ("~을 이해함", "~을 확인함")
- 불필요한 수식어 최소화`,

  encouraging: `문체 스타일: 격려형 교사
- "적극적으로 탐구에 임하며", "뛰어난 탐구 의지를 보여" 형식 사용
- 학생의 열정과 노력을 긍정적으로 강조
- 담임 교사 특유의 따뜻하고 응원하는 어조`,
};
```

### generate/page.tsx UI 변경
기존 톤 선택 섹션 아래에 교사 스타일 선택 추가:
```
[옵션 섹션]
  톤: [학술적] [친근하게] [중립적]
  교사 스타일: [분석형] [서사형] [역량중심형] [간결형] [격려형]  ← 신규
```

### API 파라미터 확장
기존 streaming route들에 `teacherStyle?: TeacherStyle` 파라미터 추가.
기존 non-streaming API도 동일 확장 (하위 호환 — 미전달 시 기존 동작).

---

## F-09: 멀티 과목 배치 생성

### 신규 파일 목록
```
src/app/batch/page.tsx                          ← 배치 생성 페이지
src/app/api/batch-generate/route.ts             ← 배치 생성 API
src/components/features/BatchSubjectSelector.tsx← 과목+주제 선택 컴포넌트
```

### API 명세

#### POST /api/batch-generate

**Request**:
```typescript
interface BatchItem {
  subject: string;    // 과목 ID (예: 'math')
  topic: string;      // 주제 텍스트
  length: LengthOption;
  tone: ToneOption;
  teacherStyle?: TeacherStyle;
  profile?: Partial<UserProfile>;
}

interface BatchGenerateRequest {
  items: BatchItem[];  // 최대 4개
}
```

**Response**:
```typescript
interface BatchResult {
  subject: string;
  subjectName: string;
  topic: string;
  report: string;
  setech: string;
}

interface BatchGenerateResponse {
  results: BatchResult[];
}
```

**구현**: `Promise.all` 병렬 처리, 타임아웃 60초

### 컴포넌트: BatchSubjectSelector

```typescript
interface BatchSubjectSelectorProps {
  items: BatchItem[];
  onChange: (items: BatchItem[]) => void;
  maxItems?: number;  // 기본 4
}
```

**UI 구조**:
```
[과목 1]  과목 선택 ▾  |  주제 입력 / 선택       | [삭제]
[과목 2]  과목 선택 ▾  |  주제 입력 / 선택       | [삭제]
[+ 과목 추가]  (최대 4개)

공통 옵션:
  길이: [단] [중] [장]
  톤: [학술적] [친근하게] [중립적]
```

### 배치 결과 UI (batch/page.tsx)
```
[생성 완료] - 탭 방식 결과 표시

[수학] [물리] [화학] [생물]  ← 과목 탭

탭 내용:
  탐구보고서 (스크롤)
  세특 500자
  [복사] [docx 저장]

하단: [전체 결과 복사] (구분선 포함 모든 과목 결과)
```

---

## 아키텍처 검토 사항

### 1. API 비용 관리
- 배치 생성: 과목당 2회 호출(보고서+세특) × 최대 4개 = 최대 8회 동시 호출
- 미티게이션: 서버에서 `Promise.all` 사용, 클라이언트에게는 단일 응답
- 타임아웃: 60초 설정 (Vercel/Cloud Run 기본 30초 초과 → Cloud Run max 300초 OK)

### 2. 인쇄 영역 지정
- `id="print-area"` div로 탐구보고서 + 세특 구역만 인쇄
- 한국어 폰트 인쇄 호환성: 시스템 폰트 fallback 사용 (별도 임베딩 불필요)

### 3. teacherStyle 하위 호환
- 기존 API route들에 `teacherStyle` 파라미터 추가 (optional)
- undefined 시 기존 동작 그대로 (기존 사용자에 영향 없음)

---

## 구현 순서 (개발자 팀 전달)

```
1. src/types/index.ts — TeacherStyle 타입 추가 (5분)
2. src/lib/ai.ts — TEACHER_STYLE_INSTRUCTIONS + 파라미터 주입 (20분)
3. src/app/globals.css — @media print CSS 추가 (10분)
4. src/app/generate/page.tsx — PDF 버튼 + 교사 스타일 선택 UI (30분)
5. src/app/api/generate-report-stream/route.ts — teacherStyle 파라미터 (10분)
6. src/app/api/generate-setech-stream/route.ts — teacherStyle 파라미터 (10분)
7. src/app/api/generate-ab/route.ts — teacherStyle 파라미터 (5분)
8. src/components/features/BatchSubjectSelector.tsx — 신규 (40분)
9. src/app/api/batch-generate/route.ts — 신규 API (30분)
10. src/app/batch/page.tsx — 배치 생성 페이지 (40분)
11. src/app/page.tsx — 배치 생성 진입 버튼 추가 (10분)
```

총 예상: 약 3-3.5시간

---

## 검증 체크리스트 (QA)

### F-07 PDF
- [ ] [PDF 저장] 버튼 클릭 → 브라우저 인쇄 다이얼로그 열림
- [ ] 인쇄 미리보기에서 버튼/헤더 숨겨지고 본문만 표시
- [ ] 한국어 텍스트 인쇄 정상 출력

### F-08 교사 스타일
- [ ] 5가지 스타일 선택 UI 정상 표시
- [ ] 분석형 선택 시 생성 결과에 "분석" 어조 확인
- [ ] 서사형 선택 시 생성 결과에 학생 스토리 형식 확인
- [ ] teacherStyle 미선택(기본값) 시 기존과 동일한 결과

### F-09 배치 생성
- [ ] 과목 최대 4개 선택 가능, 5개부터 추가 버튼 비활성화
- [ ] 생성 중 로딩 상태 표시
- [ ] 결과 탭으로 과목별 전환 가능
- [ ] 과목별 복사 정상 동작

---

*아키텍트 팀 서명: 2026-03-05*
*설계자 팀 서명: 2026-03-05*
*다음 단계: `/pdca do v2-sprint3` — 개발자 팀 구현 착수*
