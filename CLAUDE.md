# Gerardo의 AI 생기부 Maker

## Level: Dynamic
## Stack: Next.js 14 App Router, TypeScript, Tailwind CSS, Claude API (claude-sonnet-4-6)

## 프로젝트 개요
대한민국 고등학생을 위한 AI 기반 세특/탐구보고서 자동생성 서비스

## 핵심 기능
- 8개 과목 × 5개 세부활동 주제 제공
- 탐구보고서 생성 (길이/톤 커스터마이징)
- 세특 500자 자동 생성

## 개발 규칙
- Next.js 14 App Router 사용
- Server Components 기본, 필요시만 'use client'
- Tailwind CSS만 사용
- 한국어 UI
- OpenAI API 모델: gpt-4o

## AI 생성 규칙 (필수 준수)

### Rule 1. 과목별 추천 주제 일일 캐시
- 각 과목은 10개의 주제 풀(pool)을 보유한다.
- 매일 00:00 기준으로 날짜 시드(YYYY-MM-DD)를 사용해 풀에서 5개를 선택한다.
- 선택된 5개는 localStorage에 날짜 키와 함께 캐시하여 하루 동안 재사용한다.
- 구현 위치: `src/lib/topics-cache.ts`

### Rule 2. 과학 과목 실험 데이터 필수 포함
- 대상 과목: 물리, 화학, 생물
- 탐구보고서 생성 시 반드시 구체적인 실험 데이터를 포함해야 한다.
  - 측정값, 단위, 오차 범위 등 수치 데이터
  - 실험 조건 (온도, 농도, 시간 등)
  - 대조군/실험군 비교 결과
- AI 프롬프트에 과학 과목 여부를 감지하여 실험 데이터 지시를 추가한다.
- 구현 위치: `src/lib/ai.ts` — isScience 플래그 활용

### Rule 3. 탐구보고서 후반부 진로연계 단락 필수
- 모든 과목의 탐구보고서 결론 앞 또는 마지막 단락에 진로연계 및 심화 확장 내용을 포함한다.
- 포함 요소:
  - 이 탐구가 어떤 진로/학과와 연결되는지
  - 더 심화하면 어떤 연구/활동으로 확장 가능한지
- AI 프롬프트에 명시적으로 요구한다.
- 구현 위치: `src/lib/ai.ts` — generateReport 프롬프트

---

## Cloud Build 배포 규칙 (필수 준수)

### 배포 전 체크리스트
1. **TypeScript strict 빌드 검증 필수**
   - `npm run build` 로컬 실행 후 에러 없음 확인
   - Prisma `.map()` 콜백 파라미터에 반드시 타입 명시
     ```ts
     // ❌ 금지
     records.map(r => r.userId)
     // ✅ 필수
     records.map((r: { userId: string }) => r.userId)
     ```
   - `tsconfig.json` strict 모드 활성화 상태이므로 암묵적 any 불허

2. **Cloud Build CLI 실행 시 필수 옵션**
   ```bash
   gcloud builds submit --config cloudbuild.yaml \
     --project student-activity-maker-paid \
     --substitutions=COMMIT_SHA=$(git rev-parse HEAD)
   # ⚠️ --no-source 옵션 절대 금지 (Dockerfile 못 찾음)
   ```

3. **서비스 계정 필수 권한** (`538568210871-compute@developer.gserviceaccount.com`)
   - `roles/cloudbuild.builds.builder`
   - `roles/logging.logWriter`
   - `roles/storage.objectAdmin` (버킷: `student-activity-maker-paid_cloudbuild`)
   - Cloud Build Service Agent(`service-538568210871@gcp-sa-cloudbuild.iam.gserviceaccount.com`)에 `roles/iam.serviceAccountUser` 부여

4. **트리거 설정**
   - Approval Required: **OFF** (PENDING 무한 대기 방지)
   - `cloudbuild.yaml` → `options.logging: CLOUD_LOGGING_ONLY` 사용 중

5. **에러 로그 확인 방법**
   ```bash
   gcloud logging read "resource.labels.build_id=\"{BUILD_ID}\"" \
     --project student-activity-maker-paid \
     --limit=300 --format="value(textPayload)" --order=asc
   ```
