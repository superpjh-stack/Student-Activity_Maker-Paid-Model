# 데이터 모델 - AI 생기부 Maker

*작성일: 2026-03-04*
*버전: v1.0*

---

## 1. 핵심 타입 정의

```typescript
// ─────────────────────────────────────────────
// 과목 (Subject)
// ─────────────────────────────────────────────

/** 지원하는 8개 과목 식별자 */
export type SubjectId =
  | 'math'
  | 'english'
  | 'korean'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'social'
  | 'history'

/** 과목 메타데이터 */
export interface Subject {
  id: SubjectId
  /** 한국어 표시 이름 */
  name: string
  /** 아이콘 식별자 또는 이모지 */
  icon: string
  /** 카드 강조색 (Tailwind 클래스 또는 HEX) */
  color: string
}

/** 8개 과목 상수 목록 */
export const SUBJECTS: Subject[] = [
  { id: 'math',      name: '수학',   icon: 'pi',        color: '#4F46E5' },
  { id: 'english',   name: '영어',   icon: 'alphabet',  color: '#7C3AED' },
  { id: 'korean',    name: '국어',   icon: 'hangul',    color: '#6D28D9' },
  { id: 'physics',   name: '물리',   icon: 'lightning', color: '#2563EB' },
  { id: 'chemistry', name: '화학',   icon: 'flask',     color: '#0891B2' },
  { id: 'biology',   name: '생물',   icon: 'leaf',      color: '#059669' },
  { id: 'social',    name: '사회문화', icon: 'globe',   color: '#D97706' },
  { id: 'history',   name: '역사',   icon: 'scroll',    color: '#DC2626' },
]


// ─────────────────────────────────────────────
// 탐구 주제 (Topic)
// ─────────────────────────────────────────────

/** 탐구 주제 선택 방식 */
export type TopicSource = 'preset' | 'custom'

/** 추천 주제 (사전 정의) */
export interface PresetTopic {
  id: string
  subjectId: SubjectId
  /** 주제 제목 */
  title: string
  /** 주제 설명 (선택적, 툴팁용) */
  description?: string
}

/** 사용자가 최종 선택/입력한 주제 */
export interface SelectedTopic {
  source: TopicSource
  /** source === 'preset': PresetTopic.id */
  presetId?: string
  /** 최종 주제 텍스트 (preset이면 title, custom이면 직접 입력값) */
  text: string
}


// ─────────────────────────────────────────────
// 생성 옵션 (GenerationOptions)
// ─────────────────────────────────────────────

/** 탐구보고서 길이 */
export type ReportLength = 'short' | 'medium' | 'long'

/** 문체 / 톤 */
export type WritingTone = 'academic' | 'friendly' | 'neutral'

/** 탐구보고서 + 세특 생성 공통 옵션 */
export interface GenerationOptions {
  /** 탐구보고서 길이: short=500자 / medium=1000자 / long=2000자 */
  length: ReportLength
  /** 문체: academic=학술적 / friendly=친근한 / neutral=중립적 */
  tone: WritingTone
}

/** 길이 옵션 레이블 */
export const REPORT_LENGTH_LABELS: Record<ReportLength, { label: string; chars: string; description: string }> = {
  short:  { label: '단', chars: '500자 내외',  description: '요약형'  },
  medium: { label: '중', chars: '1000자 내외', description: '일반형'  },
  long:   { label: '장', chars: '2000자 내외', description: '상세형'  },
}

/** 톤 옵션 레이블 */
export const WRITING_TONE_LABELS: Record<WritingTone, { label: string; description: string }> = {
  academic: { label: '학술적', description: '논문체, 전문 용어 활용' },
  friendly: { label: '친근한', description: '구어체, 읽기 쉬운 표현' },
  neutral:  { label: '중립적', description: '일반적인 보고서 문체'   },
}


// ─────────────────────────────────────────────
// 생성 결과 (Results)
// ─────────────────────────────────────────────

/** 탐구보고서 섹션 구조 */
export interface ReportSection {
  /**
   * 섹션 제목
   * 4단계 구조: "1. 동기" | "2. 방법" | "3. 결과" | "4. 결론"
   */
  heading: string
  /** 섹션 본문 */
  content: string
}

/** 탐구보고서 생성 결과 */
export interface ReportResult {
  /**
   * 섹션 배열 - 4단계 구조 (content-strategy.md 기준)
   * [0] 동기: 주제 선정 이유 및 문제 인식
   * [1] 방법: 탐구 방법론 및 데이터 수집 절차
   * [2] 결과: 탐구를 통해 발견한 사실 + 근거
   * [3] 결론: 결과 해석, 한계점, 후속 탐구 방향
   */
  sections: ReportSection[]
  /** 전체 본문 (섹션 합산, 복사용) */
  fullText: string
  /** 총 글자 수 */
  charCount: number
  /** 생성 완료 시각 (ISO 8601) */
  generatedAt: string
}

/** 세특 500자 동기-활동-결과-연계 구조 */
export interface SetechStructure {
  /** [동기] 탐구하게 된 계기 */
  motivation: string
  /** [활동] 구체적으로 수행한 탐구 활동 */
  activity: string
  /** [결과] 탐구 결과 및 해석/인사이트 */
  result: string
  /** [연계] 타 학문/진로 연계 */
  connection: string
}

/** 세특 500자 생성 결과 */
export interface SetechResult {
  /** 구조화된 세특 구성 요소 */
  structure: SetechStructure
  /** 최종 통합 텍스트 (복사용) */
  fullText: string
  /** 총 글자 수 (목표 490~510자) */
  charCount: number
  /** 생성 완료 시각 (ISO 8601) */
  generatedAt: string
}


// ─────────────────────────────────────────────
// 전체 생성 세션 (GenerationSession)
// ─────────────────────────────────────────────

/** AI 생성 상태 */
export type GenerationStatus =
  | 'idle'       // 대기
  | 'loading'    // AI 생성 중
  | 'success'    // 생성 완료
  | 'error'      // 오류 발생

/** 하나의 생성 세션 전체 상태 */
export interface GenerationSession {
  /** 세션 고유 ID (UUID) */
  id: string
  /** 선택한 과목 */
  subject: Subject
  /** 선택한 주제 */
  topic: SelectedTopic
  /** 생성 옵션 */
  options: GenerationOptions
  /** 생성 상태 */
  status: GenerationStatus
  /** 탐구보고서 결과 (success 상태에서 존재) */
  reportResult?: ReportResult
  /** 세특 결과 (success 상태에서 존재) */
  setechResult?: SetechResult
  /** 오류 메시지 (error 상태에서 존재) */
  errorMessage?: string
  /** 세션 시작 시각 */
  startedAt: string
}


// ─────────────────────────────────────────────
// API 요청/응답 타입
// ─────────────────────────────────────────────

/** AI 생성 API 요청 Body */
export interface GenerateRequest {
  subjectId: SubjectId
  topicText: string
  options: GenerationOptions
}

/** AI 생성 API 응답 Body */
export interface GenerateResponse {
  report: ReportResult
  setech: SetechResult
}

/** API 오류 응답 */
export interface ApiError {
  code: string
  message: string
  retryable: boolean
}


// ─────────────────────────────────────────────
// UI 상태 타입 (프론트엔드 전용)
// ─────────────────────────────────────────────

/** 결과 페이지 활성 탭 */
export type ResultTab = 'report' | 'setech'

/** 복사 버튼 상태 */
export type CopyStatus = 'idle' | 'copied'

/** 앱 전역 UI 상태 (Zustand 또는 Context용) */
export interface AppState {
  currentSession: GenerationSession | null
  activeResultTab: ResultTab
  copyStatus: {
    report: CopyStatus
    setech: CopyStatus
  }
}
```

---

## 2. 데이터 흐름 요약

```
사용자 입력
  │
  ├── Subject (선택)
  ├── SelectedTopic (선택 또는 직접 입력)
  └── GenerationOptions (길이 + 톤)
         │
         ▼
  GenerateRequest (API 호출)
         │
         ▼
  GenerateResponse
  ├── ReportResult (탐구보고서)
  └── SetechResult (세특 500자)
         │
         ▼
  결과 페이지 표시 + 복사 기능
```

---

## 3. 로컬스토리지 스키마 (선택 구현)

```typescript
// key: 'aiseonggibu:history'
export interface LocalStorageHistory {
  sessions: Pick<GenerationSession, 'id' | 'subject' | 'topic' | 'options' | 'startedAt'>[]
  // 최대 10개 유지, 오래된 것부터 삭제
}
```

---

*데이터 모델 담당: 설계자*
*기반 문서: docs/01-plan/requirements.md*
