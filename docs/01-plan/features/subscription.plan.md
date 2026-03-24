---
feature: subscription
type: plan
phase: plan
created: 2026-03-19
status: active
level: Dynamic
---

# AI 생기부 Maker — 구독 서비스 전환 Plan

> **PDCA Phase**: Plan
> **Feature**: subscription
> **Created**: 2026-03-19
> **Authors**: PM-A (구독 모델), PM-B (사용자 여정), UX-A (랜딩 UI), UX-B (대시보드 UI)

---

## 1. 개요 (Overview)

### 배경
AI 생기부 Maker는 현재 완전 무료로 운영 중이다. 서비스 품질과 지속 가능성을 위해 구독 기반 수익 모델로 전환한다.

### 목표
- 6개월 내 MAU 10,000명, 유료 전환율 8%, MRR 500만 원 달성
- 고등학생이 매일 접속하고 싶어지는 습관형 서비스로 성장
- B2B (학원/학교) 채널로 확장

### 레벨 분류
- **Dynamic** — 프론트엔드 + 인증 + 결제 API 연동 포함

---

## 2. 구독 티어 (Subscription Tiers)

| 티어 | 이름 | 월 가격 | 연간 가격 | 핵심 특징 |
|------|------|---------|----------|----------|
| FREE | 탐구생 | 0원 | — | 세특 월 3회, 3과목 |
| STANDARD | 준비생 | 9,900원 | 79,000원 | 세특 월 20회, 8과목 전체 |
| PREMIUM | 입시생 | 19,900원 | 149,000원 | 무제한 + SKY 분석 + 선생님 공유 |
| B2B | 캠퍼스 | 50,000~300,000원 | 별도 협의 | 학원/학교 단체 라이선스 |

---

## 3. 요구사항 (Requirements)

### F-01: 사용량 제한 및 카운터
- 사용자별 월별 세특/탐구보고서 생성 횟수 추적
- 무료 3회 소진 시 업셀 모달 자동 노출
- 다음 달 1일 자정 자동 리셋
- **수용 기준**: 한도 초과 시 생성 API 차단, 400 에러 반환

### F-02: 구독 결제 플로우
- 토스페이먼츠 또는 아임포트 연동 (카드 + 카카오페이)
- 구독 생성/갱신/취소 웹훅 처리
- 7일 이내 환불 정책 구현
- **수용 기준**: 결제 완료 후 즉시 플랜 업그레이드

### F-03: 구독자 대시보드 (/dashboard)
- 수능 D-day 위젯
- 8과목 세특 완성도 트래커 (미시작/진행중/완성)
- 이번 달 사용 현황 진행 바
- 최근 활동 3~5건
- 친구 초대 소셜 인센티브 (무료 플랜만)
- **수용 기준**: 첫 로딩 2초 이내, 모바일 완전 최적화

### F-04: 마이페이지 (/my)
- 학생 프로필 (이름, 학교, 학년, 목표 대학/학과, 진로 태그)
- 현재 구독 플랜 + 결제일 + 업그레이드 CTA
- 세특 포트폴리오 (과목별 탭, PDF 일괄 다운로드)
- 알림 설정 (마감 알림, 신기능 알림)
- **수용 기준**: 프로필 저장 즉시 반영

### F-05: 랜딩 페이지 (/) 개선
- 구독 전환 최적화 랜딩 페이지
- Hero: "대입의 20%가 지금 이 순간 결정된다"
- Before/After 세특 비교 섹션
- 프라이싱 카드 (월간/연간 토글)
- 소셜 프루프 (학생 수, 생성 건수, 만족도)
- 업셀 모달 (무료 한도 소진 시)
- **수용 기준**: Lighthouse Performance ≥ 90

### F-06: 업셀 & 전환 UX
- 무료 한도 소진 시 Bottom sheet/모달 자동 노출
- 제한된 기능 클릭 시 잠금 아이콘 + 팝오버
- 구독 취소 설득 플로우 (3단계: 경고 → 이유 선택 → 맞춤 오퍼)
- **수용 기준**: Paywall Hit Rate 30% 이상 목표

### F-07: 이메일 알림 시스템
- 마감 D-14, D-3 알림 이메일
- 주간 세특 완성도 리포트 (매주 월요일 07:00)
- 재활성화 이메일 (14일/30일/60일 비접속)
- **수용 기준**: 이메일 발송률 ≥ 99%

### F-08: 친구 초대 (Refer-a-Friend)
- 추천 코드 6자리 자동 발급
- 친구 가입 + 첫 생성 시 쌍방 크레딧 지급
- 카카오톡 공유 + 링크 복사
- **수용 기준**: 추천 코드 추적 정확도 100%

---

## 4. 비기능 요구사항 (Non-Functional Requirements)

| 항목 | 목표 |
|------|------|
| 페이지 로딩 | < 2초 (FCP) |
| API 응답 | < 500ms |
| 가용성 | 99.9% uptime |
| 모바일 | iOS Safari, Android Chrome 완전 지원 |
| 보안 | 결제 정보 서버 비보관, PG사 토큰화 처리 |

---

## 5. 기술 스택 (Technical Stack)

| 레이어 | 기술 | 용도 |
|--------|------|------|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS | UI |
| 인증 | NextAuth.js + 카카오 OAuth | 로그인 |
| 결제 | 토스페이먼츠 or 아임포트 | 구독 결제 |
| DB | Supabase (PostgreSQL) | 사용자/구독 데이터 |
| 이메일 | Resend or Nodemailer | 알림 발송 |
| AI | Claude API (claude-sonnet-4-6) | 세특 생성 |

---

## 6. 데이터 모델 (Data Model)

```typescript
// 사용자 확장
interface User {
  id: string;
  email: string;
  name: string;
  school?: string;
  grade?: 1 | 2 | 3;
  classNumber?: number;
  targetUniversity?: string;
  targetMajor?: string;
  careerTags?: string[];     // 최대 3개
  examDate?: string;         // 수능일 ISO
  referralCode: string;      // 6자리 추천 코드
  createdAt: string;
}

// 구독
interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'standard' | 'premium';
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  pgSubscriptionId?: string; // PG사 구독 ID
}

// 사용량
interface UsageRecord {
  id: string;
  userId: string;
  type: 'seteok' | 'report';
  month: string;             // YYYY-MM
  count: number;
}

// 세특 이력
interface SeteokHistory {
  id: string;
  userId: string;
  subject: string;
  type: 'seteok' | 'report';
  content: string;
  charCount: number;
  createdAt: string;
}

// 추천 코드 추적
interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  completedAt?: string;      // 첫 생성 완료 시점
  creditsGranted: boolean;
}
```

---

## 7. 스프린트 계획 (Sprint Plan)

### Sprint 1 — 구독 핵심 인프라 (1~2주)
- [ ] F-01: 사용량 카운터 + 한도 체크 로직
- [ ] F-02: 결제 API 연동 (토스페이먼츠)
- [ ] F-06: 업셀 모달 기본 버전
- [ ] 인증: 카카오 소셜 로그인

### Sprint 2 — 구독자 UX (2~3주)
- [ ] F-03: 대시보드 페이지 (/dashboard)
- [ ] F-04: 마이페이지 (/my)
- [ ] F-05: 랜딩 페이지 개선

### Sprint 3 — 성장 기능 (3~4주)
- [ ] F-07: 이메일 알림 시스템
- [ ] F-08: 친구 초대 시스템
- [ ] 구독 취소 설득 플로우 (F-06 완성)
- [ ] 연간 구독 할인 처리

---

## 8. 성공 지표 (Success Metrics)

| KPI | 3개월 목표 | 6개월 목표 |
|-----|------------|------------|
| MAU | 10,000명 | 30,000명 |
| 유료 전환율 | 5% | 10% |
| Paywall Hit Rate | 20% | 30% |
| 3개월 구독 유지율 | 65% | 75% |
| MRR | 500만 원 | 2,000만 원 |
| B2B 파트너 | 10개 | 50개 |

---

## 9. 연관 문서 (Related Documents)

- 구독 모델 전략: `docs/01-plan/features/subscription-model.plan.md`
- 사용자 여정: `docs/01-plan/features/subscription-user-journey.plan.md`
- 랜딩 UI 설계: `docs/02-design/features/subscription-landing.design.md`
- 대시보드 UI 설계: `docs/02-design/features/subscription-dashboard.design.md`
- 랜딩 프로토타입: `docs/prototypes/subscription-landing.html`
- 대시보드 프로토타입: `docs/prototypes/subscription-dashboard.html`

---

## 10. 리스크 (Risks)

| 리스크 | 심각도 | 완화 방안 |
|--------|--------|----------|
| AI 대필 논란 (교육부 규제) | 높음 | "AI 보조 도구" 포지셔닝, 학생 수정 UX 명시 |
| 결제 연동 개발 지연 | 중간 | 토스페이먼츠 샌드박스로 선행 검증 |
| 방학 중 이탈률 급증 | 중간 | 구독 일시 중지(Pause) 기능 |
| 경쟁 서비스 등장 | 중간 | 탐구 주제 데이터베이스 독점화 |

---

*PDCA Plan Phase 완료 | 다음 단계: `/pdca design subscription`*
