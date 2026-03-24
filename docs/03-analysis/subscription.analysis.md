---
feature: subscription
type: analysis
phase: check
created: 2026-03-22
version: v5
matchRate: 90
status: active
---

# Subscription — Gap Analysis Report (v5)

> **PDCA Phase**: Check
> **Feature**: subscription
> **Date**: 2026-03-23
> **Match Rate**: **90%**
> **Previous Match Rate**: 82% (v4, 2026-03-22 — F-05 랜딩 미구현)

---

## Overall Scores

| 요구사항 | 가중치 | 점수 | 상태 | 비고 |
|---------|:-----:|:----:|:----:|------|
| F-01: 사용량 제한 & 카운터 | 3x | 100% | PASS | checkUsage, incrementUsage, PLAN_LIMITS 완전 구현 |
| F-02: 결제 플로우 (토스페이먼츠) | 3x | 100% | PASS | Billing key, webhook HMAC-SHA256, create/cancel/status |
| F-03: 구독자 대시보드 | 2x | 100% | PASS | 5개 위젯 모두 구현, auth guard 포함 |
| F-04: 마이페이지 | 2x | 95% | PASS | 4개 탭 완성, NotificationSettings 서버 저장 구현 완료 |
| F-05: 랜딩 페이지 개선 | 2x | 95% | PASS | 8개 섹션 전체 구현 (Hero/PainPoint/BeforeAfter/Bento/후기/프라이싱/FAQ/CTA) |
| F-06: 업셀 & 전환 UX | 1.5x | 100% | PASS | UpgradeModal 프리미엄 잠금 아이콘 추가, PremiumLock 컴포넌트 신규 |
| F-07: 이메일 알림 | 1.5x | 0% | FAIL | 미구현 (Sprint 6 계획) |
| F-08: 친구 초대 | 1.5x | 100% | PASS | generate/apply API, InviteBanner, 크레딧 지급 완전 구현 |

**가중 평균 Match Rate: 90%**

---

## Sprint 5 완료 항목

### F-05: 랜딩 페이지 — 8섹션 구현 완료

`src/app/page.tsx` 에 conversion funnel 8개 섹션 전체 구현.

| 설계 섹션 | 상태 | 구현 내용 |
|---------|:----:|------|
| Section 1: Hero ("대입의 20%가 지금 이 순간 결정된다") | 완료 | 타이핑 애니메이션 프리뷰 카드, FOMO 배지(ping), 소셜 프루프 Pills |
| Section 2: Pain Point (공감 3 glass cards) | 완료 | 3개 glass card (😩⏰😤) |
| Section 3: Before/After 세특 비교 | 완료 | Before(흐릿/취소선), After(태그 배지 포함) |
| Section 4: Feature Bento Grid | 완료 | 6개 기능 카드 2×3 그리드 |
| Section 5: 후기 카드 + 통계 카운터 | 완료 | 후기 3개 + countUp 애니메이션 통계 배너 |
| Section 6: 인라인 프라이싱 (월간/연간 토글) | 완료 | 3플랜 카드, Pro 강조(scale), 연간 토글 |
| Section 7: FAQ (5 질문, 아코디언) | 완료 | 5개 질문 +/− 아코디언 |
| Section 8: Final CTA ("경쟁자는 지금 쓰고 있습니다") | 완료 | 그라디언트 글래스 카드 CTA |

### F-04: NotificationSettings 서버 저장

- 신규: `src/app/api/profile/notifications/route.ts` (GET/PATCH)
- `src/components/my/NotificationSettings.tsx`: 서버 로드 + 낙관적 업데이트 + 저장 상태 표시

### F-06: 프리미엄 잠금 아이콘 + 팝오버

- 신규: `src/components/upsell/PremiumLock.tsx` — 재사용 가능한 잠금 아이콘 + 팝오버 컴포넌트
- `src/components/upsell/UpgradeModal.tsx`: 모달 헤더에 프리미엄 잠금 아이콘 추가

### 기타

- `.env.example`: Supabase 환경변수 3개 추가 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)

---

## 잔여 미구현 항목

### F-07: 이메일 알림 — 전체 미구현 (Sprint 6)

| 설계 항목 | 상태 |
|---------|:----:|
| D-14, D-3 마감 알림 이메일 | 미구현 |
| 주간 세특 완성도 리포트 (매주 월요일 07:00) | 미구현 |
| 재활성화 이메일 (14/30/60일 비접속) | 미구현 |
| Resend / Nodemailer 연동 | 미구현 |

### F-05: 남은 소규모 항목

| 항목 | 영향도 |
|-----|:------:|
| 섹션 진입 scroll-reveal 애니메이션 (translateY) | LOW |

---

## 추가 구현 항목 (Design X, Implementation O)

| 항목 | 위치 | 설명 |
|-----|------|------|
| `CancelFlow.tsx` 3단계 해지 방어 | `src/components/my/CancelFlow.tsx` | 설계 초안보다 풍부한 구현 (6가지 사유, 맞춤형 오퍼) |
| `cancelledAt`, `cancellationReason` 필드 | `prisma/schema.prisma` | 설계 SQL에 없는 추가 필드 |
| `payment/success/`, `payment/fail/` 페이지 | `src/app/payment/` | 결제 결과 처리 페이지 |
| `PLAN_LABELS`, `PLAN_COLORS` 상수 | `src/types/subscription.ts` | UI 일관성을 위한 추가 |
| `PricingCards.tsx` 분리 컴포넌트 | `src/components/payment/` | 재사용 가능한 컴포넌트로 분리 |
| `PremiumLock.tsx` 컴포넌트 | `src/components/upsell/` | 설계에 없는 재사용 컴포넌트 추가 |

---

## API 엔드포인트 검증

| Method | 경로 | 파일 | 상태 |
|--------|------|------|:----:|
| POST | `/api/subscription/create` | `subscription/create/route.ts` | 완료 |
| POST | `/api/subscription/cancel` | `subscription/cancel/route.ts` | 완료 |
| POST | `/api/subscription/webhook` | `subscription/webhook/route.ts` | 완료 |
| GET | `/api/subscription/status` | `subscription/status/route.ts` | 완료 |
| GET | `/api/usage/check` | `usage/check/route.ts` | 완료 |
| POST | `/api/usage/increment` | `usage/increment/route.ts` | 완료 |
| GET/PATCH | `/api/profile` | `profile/route.ts` | 완료 |
| GET/PATCH | `/api/profile/notifications` | `profile/notifications/route.ts` | 완료 (신규) |
| GET | `/api/referral/generate` | `referral/generate/route.ts` | 완료 |
| POST | `/api/referral/apply` | `referral/apply/route.ts` | 완료 |
| GET/POST | `/api/history` (추가) | `history/route.ts` | 완료 (추가) |

---

## Match Rate 계산

| 카테고리 | 가중치 | 최대 | 실제 | 가중 점수 |
|---------|:------:|:----:|:----:|:--------:|
| F-01 | 3x | 300 | 300 | 300 |
| F-02 | 3x | 300 | 300 | 300 |
| F-03 | 2x | 200 | 200 | 200 |
| F-04 | 2x | 200 | 190 | 190 |
| F-05 | 2x | 200 | 190 | 190 |
| F-06 | 1.5x | 150 | 150 | 150 |
| F-07 | 1.5x | 150 | 0 | 0 |
| F-08 | 1.5x | 150 | 150 | 150 |
| **합계** | | **1650** | **1480** | **90%** |

---

> **다음 단계**: Match Rate 90% — 목표 달성
> F-07 이메일 알림 구현 시 97%+ 도달 가능
> `/pdca-report subscription` 으로 최종 보고서 작성 권장

*분석 by: pdca-iterator agent | 2026-03-23*
