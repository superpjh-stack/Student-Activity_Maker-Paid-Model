# 컴포넌트 명세서 - AI 생기부 Maker

*작성일: 2026-03-04*
*버전: v1.0*
*기술 스택: Next.js (App Router) + React + TypeScript + Tailwind CSS*

---

## 1. 컴포넌트 트리 구조

```
app/
├── layout.tsx                    # RootLayout
│   └── <html> / <body>
│       └── AppHeader             # 공통 헤더 (뒤로가기, 로고, 단계)
│
├── page.tsx                      # LandingPage (/)
│   ├── HeroSection               # 제목 + 일러스트 + 설명
│   ├── FeatureList               # 3단계 기능 안내 리스트
│   └── StartButton               # "시작하기" CTA 버튼
│
├── select-subject/
│   └── page.tsx                  # SubjectSelectPage (/select-subject)
│       ├── PageTitle             # "어떤 과목의 탐구를 작성할까요?"
│       ├── SubjectCardGrid       # 8개 과목 카드 그리드
│       │   └── SubjectCard[]     # 개별 과목 카드 (아이콘 + 이름)
│       └── NextButton            # 선택 시 활성화되는 "다음" 버튼
│
├── select-topic/
│   └── page.tsx                  # TopicSelectPage (/select-topic)
│       ├── PageTitle             # "탐구 주제를 선택하세요"
│       ├── SubjectBadge          # 선택된 과목 표시 배지
│       ├── TopicList             # 추천 주제 5개 목록
│       │   └── TopicItem[]       # 개별 주제 라디오 아이템
│       ├── Divider               # "또는 직접 입력" 구분선
│       ├── CustomTopicInput      # 직접 입력 텍스트필드
│       └── NextButton            # 선택/입력 시 활성화
│
├── set-options/
│   └── page.tsx                  # OptionsPage (/set-options)
│       ├── PageTitle
│       ├── LengthSelector        # 길이 옵션 (단/중/장)
│       │   └── OptionToggle[]    # 개별 토글 버튼
│       ├── ToneSelector          # 톤 옵션 (학술/친근/중립)
│       │   └── OptionToggle[]
│       ├── SelectionSummary      # 선택 요약 카드
│       └── GenerateButton        # "AI 생성 시작" 버튼
│
├── generating/
│   └── page.tsx                  # GeneratingPage (/generating)
│       ├── LoadingSpinner        # 애니메이션 스피너
│       ├── ProgressBar           # 가짜 진행 바
│       ├── StatusMessage         # "탐구보고서와 세특을 작성하고 있어요"
│       └── CancelButton          # 취소 버튼
│
└── result/
    └── page.tsx                  # ResultPage (/result)
        ├── ResultMeta            # 과목/주제/옵션 요약 정보
        ├── ResultTabs            # 탐구보고서 | 세특 탭 스위처
        ├── ReportPanel           # 탐구보고서 패널 (탭 콘텐츠)
        │   ├── ReportContent     # 섹션별 본문 렌더링
        │   └── CopyButton        # 탐구보고서 복사 버튼
        ├── SetechPanel           # 세특 500자 패널 (탭 콘텐츠)
        │   ├── SetechContent     # 구조화 세특 + 글자 수 표시
        │   └── CopyButton        # 세특 복사 버튼
        ├── RegenerateButton      # 재생성 버튼
        └── RestartButton         # "처음으로 돌아가기"
```

**공통 컴포넌트 (components/ui/)**
```
components/
├── ui/
│   ├── AppHeader.tsx             # 헤더 (뒤로가기 + 로고 + 단계)
│   ├── StepIndicator.tsx         # ●●●○ 단계 표시
│   ├── ProgressBar.tsx           # 퍼센트 진행 바
│   ├── Toast.tsx                 # 알림 토스트
│   ├── Button.tsx                # Primary / Secondary 버튼
│   ├── Card.tsx                  # 기본 카드 컨테이너
│   └── Badge.tsx                 # 과목 배지
```

---

## 2. 컴포넌트 상세 명세

---

### 2.1 AppHeader

**역할**: 모든 페이지의 상단 고정 헤더

```typescript
interface AppHeaderProps {
  /** 뒤로가기 버튼 표시 여부 (기본: true) */
  showBack?: boolean
  /** 뒤로가기 콜백 (없으면 router.back()) */
  onBack?: () => void
  /** 현재 단계 (없으면 단계 표시 숨김) */
  currentStep?: 1 | 2 | 3 | 4
  /** 전체 단계 수 (기본: 4) */
  totalSteps?: number
}
```

---

### 2.2 StepIndicator

**역할**: 현재 진행 단계를 점(●○)으로 시각화

```typescript
interface StepIndicatorProps {
  currentStep: number   // 1-based
  totalSteps: number    // 기본 4
}
```

**렌더 예시**: `currentStep=2, totalSteps=4` → `●●○○`

---

### 2.3 SubjectCard

**역할**: 과목 선택 그리드의 개별 카드

```typescript
interface SubjectCardProps {
  subject: Subject
  /** 현재 선택된 상태 */
  isSelected: boolean
  /** 클릭 핸들러 */
  onClick: (subjectId: SubjectId) => void
}
```

**상태별 스타일**
| 상태 | border | background | 아이콘색 |
|------|--------|------------|---------|
| 기본 | `#E2E8F0` | `#FFFFFF` | `#64748B` |
| 호버 | `#818CF8` | `#F5F3FF` | `#4F46E5` |
| 선택 | `#4F46E5` | `#EEF2FF` | `#4F46E5` |
| 포커스 | `ring-2 ring-offset-2 ring-indigo-500` | - | - |

---

### 2.4 SubjectCardGrid

**역할**: 8개 SubjectCard를 그리드로 배치

```typescript
interface SubjectCardGridProps {
  subjects: Subject[]
  selectedSubjectId: SubjectId | null
  onSelect: (subjectId: SubjectId) => void
}
```

**레이아웃**
- Mobile (< 768px): 2열 그리드 `grid-cols-2`
- Tablet (≥ 768px): 4열 그리드 `grid-cols-4`
- Desktop (≥ 1024px): 4열 그리드 `grid-cols-4`

---

### 2.5 TopicItem

**역할**: 추천 주제 목록의 개별 항목 (라디오 방식)

```typescript
interface TopicItemProps {
  topic: PresetTopic
  isSelected: boolean
  onClick: (topicId: string) => void
}
```

---

### 2.6 CustomTopicInput

**역할**: 직접 주제 입력 텍스트필드

```typescript
interface CustomTopicInputProps {
  value: string
  onChange: (value: string) => void
  /** 직접 입력 활성화 여부 (추천 주제 선택 시 흐리게) */
  isActive: boolean
  placeholder?: string
  maxLength?: number  // 기본: 100자
}
```

---

### 2.7 OptionToggle

**역할**: 길이/톤 옵션 선택 토글 버튼

```typescript
interface OptionToggleProps {
  label: string
  description: string
  subLabel?: string       // 예: "1000자 내외"
  isSelected: boolean
  onClick: () => void
}
```

---

### 2.8 LengthSelector

**역할**: 탐구보고서 길이 옵션 3개 그룹

```typescript
interface LengthSelectorProps {
  value: ReportLength
  onChange: (value: ReportLength) => void
}
```

---

### 2.9 ToneSelector

**역할**: 톤/문체 옵션 3개 그룹

```typescript
interface ToneSelectorProps {
  value: WritingTone
  onChange: (value: WritingTone) => void
}
```

---

### 2.10 SelectionSummary

**역할**: 옵션 설정 페이지의 선택 요약 카드

```typescript
interface SelectionSummaryProps {
  subject: Subject
  topic: SelectedTopic
  options: GenerationOptions
}
```

---

### 2.11 ProgressBar

**역할**: 생성 중 페이지의 진행 바

```typescript
interface ProgressBarProps {
  /** 0~100 */
  progress: number
  /** 애니메이션 적용 여부 */
  animated?: boolean
}
```

---

### 2.12 ResultTabs

**역할**: 결과 페이지의 탭 스위처

```typescript
interface ResultTabsProps {
  activeTab: ResultTab
  onTabChange: (tab: ResultTab) => void
}
```

---

### 2.13 ReportContent

**역할**: 탐구보고서 섹션 렌더링

```typescript
interface ReportContentProps {
  sections: ReportSection[]
  charCount: number
}
```

---

### 2.14 SetechContent

**역할**: 세특 500자 구조화 렌더링

```typescript
interface SetechContentProps {
  structure: SetechStructure
  fullText: string
  charCount: number
}
```

**렌더 방식**: 구조 태그 `[동기]`, `[활동]`, `[결과]`, `[연계]` 앞에 인라인 배지 표시 후 내용 이어붙임

---

### 2.15 CopyButton

**역할**: 클립보드 복사 + 상태 피드백

```typescript
interface CopyButtonProps {
  /** 복사할 텍스트 */
  text: string
  /** 버튼 레이블 (예: "탐구보고서") */
  label: string
  /** 복사 완료 콜백 */
  onCopied?: () => void
}
```

**내부 상태**: `CopyStatus` ('idle' | 'copied'), 복사 후 2초 뒤 idle 복귀

---

### 2.16 Toast

**역할**: 성공/실패 알림 토스트

```typescript
interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  /** 자동 닫힘 (ms, 기본 3000) */
  duration?: number
  /** 추가 액션 (예: "재시도") */
  action?: {
    label: string
    onClick: () => void
  }
}
```

---

### 2.17 Button

**역할**: 공통 버튼 컴포넌트

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'  // 기본: 'md'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  onClick?: () => void
  children: React.ReactNode
}
```

---

## 3. 상태 관리 구조

```typescript
// Zustand store (또는 React Context)

interface AppStore {
  // 현재 세션
  session: Partial<GenerationSession>

  // 액션
  setSubject: (subject: Subject) => void
  setTopic: (topic: SelectedTopic) => void
  setOptions: (options: GenerationOptions) => void
  startGeneration: () => Promise<void>
  resetSession: () => void

  // UI 상태
  activeResultTab: ResultTab
  setActiveResultTab: (tab: ResultTab) => void
}
```

---

## 4. 페이지별 사용 컴포넌트 매핑

| 페이지 | 주요 컴포넌트 |
|--------|-------------|
| `/` | HeroSection, FeatureList, Button |
| `/select-subject` | AppHeader, StepIndicator, SubjectCardGrid, SubjectCard, Button |
| `/select-topic` | AppHeader, StepIndicator, SubjectBadge, TopicItem, CustomTopicInput, Button |
| `/set-options` | AppHeader, StepIndicator, LengthSelector, ToneSelector, OptionToggle, SelectionSummary, Button |
| `/generating` | AppHeader, LoadingSpinner, ProgressBar, Button, Toast |
| `/result` | AppHeader, StepIndicator, ResultTabs, ReportContent, SetechContent, CopyButton, Button, Toast |

---

*컴포넌트 설계 담당: 설계자*
*기반 문서: docs/01-plan/requirements.md, docs/02-design/ui-spec.md, docs/02-design/data-model.md*
