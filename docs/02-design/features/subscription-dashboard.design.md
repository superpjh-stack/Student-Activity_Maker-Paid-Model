---
feature: subscription-dashboard
type: design
created: 2026-03-19
author: UX-B (구독자 대시보드 & 마이페이지 디자이너)
---

# AI 생기부 Maker — 구독자 대시보드 & 마이페이지 UX 기획서

**버전**: 1.0 | **작성일**: 2026-03-19
**프로토타입**: `docs/prototypes/subscription-dashboard.html`

---

## 1. 설계 원칙

| 원칙 | 설명 | 적용 방법 |
|------|------|----------|
| **진도 가시화** | 남은 일이 보여야 돌아온다 | 세특 완성도 트래커 전면 배치 |
| **긴박감 활용** | 수능 D-day + 미완성 과목 | 빨간 뱃지, 카운트다운 위젯 |
| **마찰 최소화** | 카드 클릭 → 즉시 생성 페이지 | 중간 단계 없는 딥링크 |
| **소유감 강화** | 내 포트폴리오 = 내 기록 | 과목별 세특 보관함 개념 |
| **업셀 자연스럽게** | 제한에 걸렸을 때만 노출 | Contextual upsell, 모달 남용 금지 |

---

## 2. 정보 구조 (IA)

```
/dashboard          대시보드 (구독자 홈)
  ├── 학생 정보 + D-day 위젯
  ├── 오늘의 추천 행동
  ├── 세특 완성도 트래커 (8과목)
  ├── 이번 달 사용 현황 + 업셀 배너
  ├── 최근 활동 카드
  └── 친구 초대 소셜 인센티브

/my                 마이페이지
  ├── 프로필 탭 (기본정보 + 진로목표)
  ├── 구독 탭 (현재 플랜 + 결제 수단)
  ├── 포트폴리오 탭 (과목별 세특 목록)
  └── 알림 설정 탭
```

---

## 3. 대시보드 상세 설계

### 3-1. 헤더 영역

**학생 정보 카드**
- 이름 + 학년 + 구독 플랜 배지 (FREE/STANDARD/PREMIUM 색상 구분)
- 학교명 + 목표 대학/학과

**수능 D-day 카운트다운**
- 수능일: 매년 11월 둘째 목요일 (자동 계산)
- D-30 이내: 빨간색 강조
- D-100 이내: 노란색 경고
- D-100 초과: 보라/핑크 기본

**오늘의 추천 행동 우선순위**
1. 한 번도 생성 안 한 과목이 있을 때 → "[과목] 세특이 아직 없어요"
2. 마지막 생성 후 7일 이상 경과
3. 사용량 80% 이상
4. 기본 동기부여 문구

---

### 3-2. 세특 완성도 트래커

**3단계 완성도 시각화**
| 상태 | 스타일 | 레이블 |
|------|--------|--------|
| 미시작 | 회색 점선 카드 | "시작하기" / "미시작!" (빨간) |
| 진행중 | 연보라 카드 | "N회 생성" |
| 완성 | 핑크-보라 그라디언트 + 체크 배지 | "완성 ✨" |

**레이아웃**: 모바일 2열 / 태블릿+ 4열

**상단 요약 바**: "전체 진행률 X/8 완성" 프로그레스 바

---

### 3-3. 이번 달 사용 현황

| 플랜 | 세특 한도 | 탐구 한도 |
|------|---------|---------|
| FREE | 3개/월 | 1개/월 |
| STANDARD | 20개/월 | 10개/월 |
| PREMIUM | 무제한 | 무제한 |

**진행 바 색상**:
- 0~70%: 초록 (여유 있어요 👍)
- 70~90%: 노랑 (⚠️ 이번 달 X회만 남았어요!)
- 90~100%: 빨강 (한도 초과 임박)

**업그레이드 유도 배너** (70% 이상 시 노출):
- "PREMIUM으로 업그레이드" + "세특·탐구 무제한 + 공유 링크"
- [업그레이드] CTA 버튼

---

### 3-4. 최근 활동 카드

- 최근 3~5건 세특/탐구보고서 카드
- 각 카드: 과목 아이콘 + 제목 + 날짜 + 글자수/유형 태그
- hover 시: [복사] [재생성] 버튼 노출 (opacity 0 → 1 전환)

---

### 3-5. 친구 초대 소셜 인센티브

- 그라디언트 배너 (fuchsia → pink → rose)
- 6자리 추천 코드 + 복사 버튼
- [카카오톡 공유] [링크 복사] 버튼 2개
- 조건: FREE 플랜만 표시 (STANDARD+ 는 대시보드 하단 소형)

---

## 4. 마이페이지 상세 설계

### 4-1. 프로필 탭

**기본 정보 섹션**
- 이름, 학교명, 학년 (select), 반/번호

**진로 목표 섹션**
- 희망 대학, 희망 학과/계열
- 관심 진로 태그 (최대 3개, pill 형태)
- 수능 응시일 (date picker)

---

### 4-2. 구독 탭

**현재 플랜 카드** (그라디언트 배경, 화이트 텍스트)
- 플랜명 + 상태 배지 (구독중/취소됨)
- 월 가격 + 다음 결제일
- 플랜 포함 기능 그리드

**업그레이드 박스** (하위 플랜 사용자만)
- 현재 플랜 vs 다음 플랜 차이점 리스트
- [업그레이드] CTA 버튼

**결제 수단**
- 카드 번호 마스킹 + 만료일
- [변경] 링크

**구독 취소** (의도적 prominence 최소화)
- 섹션 최하단 회색 소형 텍스트 링크
- 찾을 수 있지만 우연 클릭은 없는 위치

---

### 4-3. 포트폴리오 탭

**상단 필터 탭**
- "전체 (N)" + 과목별 탭 (가로 스크롤)

**일괄 다운로드 배너**
- "전체 N개 세특을 PDF로 저장"
- STANDARD 이상만 활성화

**세특 카드 목록**
- 과목 아이콘 + 제목 + 날짜 + 글자수/유형 태그
- 본문 미리보기 2줄
- [복사] [PDF] [공유 링크 PRO] 버튼
- 공유 링크: PREMIUM 전용 배지 표시

---

### 4-4. 알림 설정 탭

토글 스위치 (ON/OFF):
- 마감 임박 알림 (D-30, D-14, D-7)
- 세특 미완성 알림 (매주 일요일)
- 신기능 & 업데이트 알림
- 이벤트/프로모션 알림 (기본 OFF)

---

## 5. 업셀 & 제한 UX

### 5-1. 인라인 제한 배너 (90% 이상)
위치: 대시보드 사용 현황 섹션 직하단
문구: "이번 달 [2개]만 남았어요. 업그레이드하면 무제한!"

### 5-2. 한도 초과 모달
트리거: 생성 버튼 클릭 시 한도 초과 확인
레이아웃: 모바일 Bottom sheet / 데스크탑 센터 모달
구성: 현재 vs 다음 플랜 비교표 + 업그레이드 CTA + "다음 달까지 기다리기"

### 5-3. 소셜 인센티브 (FREE만)
"친구 1명 초대하면 생성 횟수 +3개!"
공유: 카카오톡, 링크 복사, 추천 코드 6자리

### 5-4. 프리미엄 잠금 표시
카드 우측 상단 🔒 아이콘
클릭: 기능 설명 + 업그레이드 유도 팝오버

---

## 6. 컴포넌트 매핑 (Mockup → Next.js)

| Mockup 섹션 | Next.js 경로 | 핵심 Props |
|------------|-------------|-----------|
| D-day 위젯 | `components/dashboard/DdayWidget.tsx` | `examDate: Date` |
| 세특 트래커 | `components/dashboard/SubjectTracker.tsx` | `subjects: SubjectProgress[]` |
| 최근 활동 | `components/dashboard/RecentActivity.tsx` | `activities: Activity[]` |
| 사용량 바 | `components/dashboard/UsageBar.tsx` | `used, limit, plan` |
| 업셀 배너 | `components/upsell/UsageBanner.tsx` | `remaining, plan` |
| 업셀 모달 | `components/upsell/UpgradeModal.tsx` | `trigger, feature?` |
| 프로필 폼 | `components/my/ProfileForm.tsx` | `profile: UserProfile` |
| 구독 카드 | `components/my/SubscriptionCard.tsx` | `subscription` |
| 포트폴리오 탭 | `components/my/PortfolioTabs.tsx` | `seteok: Seteok[]` |

---

## 7. 데이터 모델

```typescript
interface UserProfile {
  id: string;
  name: string;
  school: string;
  grade: 1 | 2 | 3;
  classNumber?: number;
  targetUniversity?: string;
  targetMajor?: string;
  careerTags: string[];      // 최대 3개
  examDate: string;          // ISO 날짜
}

interface SubjectProgress {
  subjectId: string;
  subjectName: string;
  emoji: string;
  status: 'none' | 'in_progress' | 'done';
  generationCount: number;
  lastGeneratedAt?: string;
}

interface UsageStats {
  plan: 'free' | 'standard' | 'premium';
  seteokUsed: number;
  seteokLimit: number | null;   // null = 무제한
  reportUsed: number;
  reportLimit: number | null;
  resetDate: string;
}

interface Subscription {
  plan: 'free' | 'standard' | 'premium';
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodEnd: string;
  nextBillingDate?: string;
  price?: number;
}
```

---

## 8. 접근성 & 반응형

**접근성 체크리스트**
- 모든 인터랙티브 요소에 aria-label 제공
- 색상만으로 상태 구분 안 함 (아이콘 + 텍스트 병행)
- 포커스 트랩: 모달 열릴 때 포커스 이동
- 터치 타겟: 최소 44×44px
- 명도비: WCAG AA 기준 4.5:1 이상

**반응형 전략**
| 영역 | 모바일 | 태블릿+ |
|------|--------|--------|
| 세특 트래커 | 2열 그리드 | 4열 그리드 |
| 최근 활동 | 세로 스택 | 2열 카드 |
| 마이페이지 | 탭 형식 | 사이드바 + 메인 |

---

## 9. 설계 의사결정 근거

**D-day 위젯을 헤더에 고정한 이유**
고3 학생에게 시간적 긴박감은 가장 강력한 재방문 동기. D-238처럼 구체적인 숫자가 보일 때 "오늘 뭔가 해야 한다"는 감각이 발동됨.

**세특 트래커를 메인 영역에 배치한 이유**
Duolingo의 streak 메커니즘과 동일 원리. "8개 중 5개 완성"이 보이면 나머지를 채우고 싶어지는 완성 욕구 발동.

**업셀 모달 트리거를 생성 버튼 클릭 시로 한정한 이유**
방문 즉시 팝업은 이탈 유발. 제한에 걸린 순간이 업그레이드 의도가 가장 높은 컨텍스트.

**구독 취소 링크 위치 (최하단 회색 소형)**
Dark pattern이 아닌 prominence 최소화 방식. 취소 의도가 있는 사용자는 찾을 수 있지만 우연 클릭 없음.

---

*작성: UX-B (구독자 대시보드 & 마이페이지 디자이너) | 2026-03-19*
