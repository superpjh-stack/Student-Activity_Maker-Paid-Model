# 아키텍처 설계서

## 기술스택

| 구분 | 기술 | 버전/비고 |
|------|------|-----------|
| 프레임워크 | Next.js 14 | App Router |
| 언어 | TypeScript | strict mode |
| 스타일링 | Tailwind CSS | utility-first |
| AI API | Anthropic SDK | claude-sonnet-4-6 |
| 런타임 | Node.js | v18+ |

## 폴더 구조

```
Student-Activity-Maker/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 루트 레이아웃 (한국어, Tailwind)
│   │   ├── page.tsx            # 메인 페이지 (과목/주제 선택)
│   │   ├── globals.css         # 글로벌 스타일
│   │   └── api/
│   │       ├── generate-report/
│   │       │   └── route.ts    # 탐구보고서 생성 API
│   │       └── generate-setech/
│   │           └── route.ts    # 세특 500자 생성 API
│   ├── components/
│   │   ├── SubjectSelector.tsx  # 과목 선택 컴포넌트
│   │   ├── TopicSelector.tsx    # 주제 선택 컴포넌트
│   │   ├── ReportForm.tsx       # 보고서 옵션 폼
│   │   ├── ReportResult.tsx     # 보고서 결과 표시
│   │   └── SetechResult.tsx     # 세특 결과 표시
│   ├── lib/
│   │   ├── anthropic.ts         # Anthropic 클라이언트 설정
│   │   ├── prompts.ts           # AI 프롬프트 템플릿
│   │   └── subjects.ts          # 과목/주제 데이터
│   └── types/
│       └── index.ts             # 타입 정의
├── docs/
├── public/
├── .env.local                   # 환경변수 (git 제외)
├── .env.local.example           # 환경변수 예시
├── CLAUDE.md
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 데이터 흐름도

```
[사용자]
  │
  ▼
[메인 페이지 (page.tsx)] ──── Server Component
  │
  ▼
[SubjectSelector] ──── Client Component ('use client')
  │  과목 선택 (8개)
  ▼
[TopicSelector] ──── Client Component ('use client')
  │  주제 선택 (과목당 5개)
  ▼
[ReportForm] ──── Client Component ('use client')
  │  길이/톤 옵션 설정
  │
  ├──────────────────────────────────┐
  ▼                                  ▼
[POST /api/generate-report]    [POST /api/generate-setech]
  │                                  │
  ▼                                  ▼
[Anthropic SDK]                [Anthropic SDK]
  │  claude-sonnet-4-6               │  claude-sonnet-4-6
  ▼                                  ▼
[ReportResult]                 [SetechResult]
  │  탐구보고서 표시                   │  세특 500자 표시
  ▼                                  ▼
[사용자] ──── 복사/다운로드
```

## 환경변수 목록

| 변수명 | 설명 | 필수 | 기본값 |
|--------|------|------|--------|
| `ANTHROPIC_API_KEY` | Anthropic API 인증 키 | Yes | - |
