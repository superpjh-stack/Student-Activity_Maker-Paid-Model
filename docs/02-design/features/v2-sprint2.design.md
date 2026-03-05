# Design: v2 Sprint 2

> 작성일: 2026-03-05 | 아키텍트 + 설계자 팀

---

## A-2: 대화형 코칭 플로우

**흐름**: `/[subject]/page.tsx` 다음 버튼 클릭 → CoachingModal(3문답) → `/generate` 이동
**데이터 전달**: URL params `motivation`, `activity`, `curiosity` (선택사항)
**AI 반영**: generate/page.tsx에서 읽어 프롬프트 주입

신규 컴포넌트: `src/components/features/CoachingModal.tsx`
수정: `src/app/[subject]/page.tsx`, `src/app/generate/page.tsx`, `src/lib/ai.ts`

---

## B-1: 마인드맵 주제 확장기

**흐름**: 홈 페이지 하단 키워드 입력 → `POST /api/expand-topics` → 과목별 주제 카드 그리드
**클릭**: 과목+주제 선택 → CoachingModal → `/generate` 이동

신규: `src/app/api/expand-topics/route.ts`
신규: `src/components/features/TopicExpanderSection.tsx`
수정: `src/app/page.tsx`

---

## B-2: AI 내 글 피드백

**흐름**: `/feedback` 페이지 → 텍스트 붙여넣기 → `POST /api/feedback` → 스트리밍 피드백
**피드백 항목**: 분량/구조/표현/교사관점 + 개선 제안

신규: `src/app/api/feedback/route.ts`
신규: `src/app/feedback/page.tsx`

---

## API 명세

### POST /api/expand-topics
Request: `{ keyword: string }`
Response: `{ topics: Array<{ subject: string; subjectId: string; color: string; topic: string }> }`

### POST /api/feedback
Request: `{ text: string; type: "report" | "setech" }`
Response: streaming text (점수표 + 항목별 피드백 + 개선안)

---

## AI 함수 추가 (lib/ai.ts)
- `expandTopics(keyword)` → 과목별 주제 배열
- `generateFeedback(text, type)` → ReadableStream

---

## URL params 확장 (A-2)
```
/generate?subject=math&topic=...&motivation=...&activity=...&curiosity=...
```
