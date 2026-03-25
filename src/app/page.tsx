'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import SubjectCard from '@/components/ui/SubjectCard';
import TopicExpanderSection from '@/components/features/TopicExpanderSection';
import { SUBJECTS } from '@/lib/subjects';
import type { Grade } from '@/types';

const STEPS = ['과목 선택', '주제 선택', 'AI 생성'];

const GRADE_OPTIONS: { value: Grade; label: string; desc: string; color: string }[] = [
  { value: 'grade1', label: '고1', desc: '기초 탐구', color: 'from-sky-400 to-blue-500' },
  { value: 'grade2', label: '고2', desc: '심화 분석', color: 'from-violet-400 to-indigo-500' },
  { value: 'grade3', label: '고3', desc: '입시 직결', color: 'from-fuchsia-400 to-pink-500' },
];

const PAIN_POINTS = [
  { emoji: '😩', title: '뭘 써야 할지 모르겠어', desc: '책은 읽었는데 500자가 안 나와…' },
  { emoji: '⏰', title: '제출 기한은 내일인데', desc: '밤 11시에 아직 한 글자도 못 썼어…' },
  { emoji: '😤', title: '써도 어색하고 틀린 것 같아', desc: '친구 거 보면 훨씬 잘 쓴 것 같아…' },
];

const FEATURES = [
  { emoji: '✍️', title: '세특 500자 자동생성', desc: '과목·주제·진로 맞춤 500자 완성', wide: true },
  { emoji: '📑', title: '탐구보고서', desc: '실험 데이터 포함 심화 보고서' },
  { emoji: '🎯', title: '진로연계 단락', desc: '입시 관련 학과·직업 연계 필수 포함' },
  { emoji: '📦', title: '배치 생성', desc: '4개 과목 세특 한 번에', wide: true },
  { emoji: '🗂️', title: '이력 관리', desc: '내 모든 세특·보고서 보관' },
  { emoji: '📄', title: 'DOCX 다운로드', desc: '선생님 제출용 문서 즉시 출력' },
];

const REVIEWS = [
  { grade: '고2', subject: '수학', text: '진짜 나 이거 없었으면 세특 포기했을 것 같음' },
  { grade: '고3', subject: '생명과학', text: '탐구보고서 실험 데이터까지 넣어줘서 진짜 놀람' },
  { grade: '고1', subject: '국어', text: '처음엔 반신반의했는데 진짜 유용함' },
];

const FAQS = [
  { q: 'AI가 쓴 세특, 선생님이 알아차리나요?', a: 'AI가 초안을 제안하지만 내용과 구조는 학생의 실제 활동을 기반으로 합니다. 생성 후 본인의 언어로 자연스럽게 수정하면 문제없이 활용할 수 있어요.' },
  { q: '무료로도 충분히 쓸 수 있나요?', a: '무료 플랜은 하루 3회 생성이 가능합니다. 정기 제출 시즌에 더 많이 필요하다면 Pro 플랜을 추천해요.' },
  { q: '결제 후 환불이 되나요?', a: '결제일로부터 7일 이내에는 조건 없이 전액 환불해 드립니다. 고객센터로 연락하시면 바로 처리됩니다.' },
  { q: '모바일에서도 쓸 수 있나요?', a: '네, 모바일 최적화가 되어 있어 스마트폰에서도 편하게 세특을 작성할 수 있습니다.' },
  { q: '탐구보고서는 어느 정도 수준인가요?', a: '물리·화학·생물 과목은 실험 데이터(측정값, 오차 범위, 대조군 비교)를 자동 포함하며, 결론 앞에 진로연계 단락이 필수 삽입됩니다. 실제 고교 수준의 보고서 형식을 따릅니다.' },
];

const PRICING_PLANS = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ['하루 3회 생성', '8과목 기본 주제', '세특 500자'],
    highlight: false,
  },
  {
    name: 'Pro',
    badge: '가장 인기',
    monthlyPrice: 9900,
    yearlyMonthlyPrice: 6583,
    yearlyTotal: 79000,
    features: ['무제한 생성', '탐구보고서 포함', '이력 관리', 'DOCX 다운로드', '배치 생성'],
    highlight: true,
  },
  {
    name: 'Family',
    monthlyPrice: 19900,
    yearlyMonthlyPrice: 12416,
    yearlyTotal: 149000,
    features: ['자녀 3명 계정', '학부모 확인 기능', 'Pro 기능 전체', '우선 지원'],
    highlight: false,
  },
];

const TYPEWRITER_TEXT = `생명과학 세특 (고3)

이 수업을 통해 세포막의 선택적 투과성에 관한 탐구를 진행하였다. 삼투압 실험에서 감자 조각을 0%, 0.5%, 1.0%, 1.5%, 2.0% NaCl 용액에 각각 30분 침지한 결과, 1.0% NaCl에서 질량 변화율이 −0.2%로 등장액 조건임을 확인하였다. 실험군 1.5%에서는 −3.1%, 2.0%에서는 −5.8%의 질량 감소가 관찰되어 고장액 조건에서 원형질 분리가 유도됨을 정량적으로 검증하였다. 이 탐구는 의생명공학 분야의 약물 전달 시스템 설계와 직결되며…`;

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const s2 = useReveal(); const s3 = useReveal(); const s4 = useReveal();
  const s5 = useReveal(); const s6 = useReveal(); const s7 = useReveal(); const s8 = useReveal();

  const users = useCountUp(12400, 2000, s5.visible);
  const generated = useCountUp(38000, 2000, s5.visible);

  useEffect(() => {
    const saved = localStorage.getItem('sam_grade') as Grade | null;
    if (saved) setSelectedGrade(saved);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (typewriterIndex >= TYPEWRITER_TEXT.length) return;
    const timer = setTimeout(() => {
      setTypewriterIndex(i => i + 1);
    }, 28);
    return () => clearTimeout(timer);
  }, [typewriterIndex]);


  const handleGradeSelect = (grade: Grade) => {
    setSelectedGrade(grade);
    localStorage.setItem('sam_grade', grade);
  };

  const handleNext = () => {
    if (selectedSubject) {
      router.push(`/${selectedSubject}`);
    }
  };

  return (
    <div className="pb-16">

      {/* ══════════════════════════════════════════
          섹션 1: Hero
      ══════════════════════════════════════════ */}
      <div className="relative mb-12 pt-6">
        {/* 긴급성 배지 */}
        <div className="absolute right-0 top-4 hidden sm:flex items-center gap-1.5 rounded-full border border-pink-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-pink-600 shadow-sm backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
          </span>
          지금도 247명이 세특 생성 중
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          {/* 좌측: 카피 */}
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-1.5 text-xs font-medium text-pink-500">
              ✨ AI 기반 세특·탐구보고서 자동 완성
            </div>
            <h1 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
              대입의 20%가<br />
              <span className="gradient-text">지금 이 순간</span><br />
              결정된다
            </h1>
            <p className="mt-4 text-base text-slate-500 sm:text-lg">
              AI가 3분 만에 완성하는 세특 500자 · 탐구보고서<br />
              <span className="font-semibold text-slate-700">지금 경쟁자도 쓰고 있습니다</span>
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href={session ? '#subject-select' : '/login'}
                className="btn-gradient inline-flex h-14 items-center rounded-2xl px-8 text-base font-bold text-white shadow-lg"
                onClick={session ? (e) => { e.preventDefault(); document.getElementById('subject-select')?.scrollIntoView({ behavior: 'smooth' }); } : undefined}
              >
                지금 무료로 시작하기 →
              </Link>
            </div>

            {/* 소셜 프루프 Pills */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span className="rounded-full bg-white/80 border border-slate-100 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                🎓 고등학생 12,400명+
              </span>
              <span className="rounded-full bg-white/80 border border-slate-100 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                📝 세특 38,000건+ 생성
              </span>
              <span className="rounded-full bg-white/80 border border-slate-100 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                ⭐ 만족도 4.9/5.0
              </span>
            </div>
          </div>

          {/* 우측: 타이핑 프리뷰 카드 */}
          <div className="animate-float mx-auto w-full max-w-sm shrink-0 lg:mx-0">
            <div className="glass-card rounded-2xl p-5 shadow-xl">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-slate-400">AI 생성 중…</span>
              </div>
              <p className="min-h-[120px] whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                {TYPEWRITER_TEXT.slice(0, typewriterIndex)}
                <span className="animate-pulse text-fuchsia-400">|</span>
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-600">500자 완성</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">진로연계</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">실험데이터</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          섹션 2: Pain Point
      ══════════════════════════════════════════ */}
      <div ref={s2.ref} className={`mb-12 transition-all duration-700 ${s2.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="mb-6 text-center text-xl font-extrabold text-slate-900 sm:text-2xl">
          혹시 이런 고민, 해본 적 있나요?
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PAIN_POINTS.map((p, i) => (
            <div key={i} className="glass-card card-hover rounded-2xl p-5 text-center">
              <div className="mb-3 text-4xl">{p.emoji}</div>
              <h3 className="mb-1.5 text-sm font-bold text-slate-800">{p.title}</h3>
              <p className="text-xs text-slate-500">{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-sm font-semibold text-fuchsia-600">
          이 3가지 고통, AI 생기부 친구가 한 번에 해결합니다 →
        </p>
      </div>

      {/* ══════════════════════════════════════════
          섹션 3: Before / After
      ══════════════════════════════════════════ */}
      <div ref={s3.ref} className={`mb-12 transition-all duration-700 delay-100 ${s3.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="mb-6 text-center text-xl font-extrabold text-slate-900 sm:text-2xl">
          Before / After — 직접 보세요
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Before */}
          <div className="relative rounded-2xl border border-red-100 bg-red-50 p-5 opacity-70">
            <span className="mb-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-500">
              Before · 2시간 후에도 미완성
            </span>
            <p className="text-xs leading-relaxed text-slate-500 line-through">
              이번 학기 생명과학 수업에서 세포에 대해 배웠습니다. 세포막은 여러 가지 역할을 합니다.
              삼투압에 대해서도 배웠는데 흥미로웠습니다. 앞으로 이런 것들을 더 공부하고 싶습니다.
              생명과학은 어렵지만 열심히 하겠습니다…
            </p>
            <p className="mt-2 text-[10px] text-red-400">글자 수: 110자 / 500자</p>
          </div>

          {/* After */}
          <div className="relative rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-pink-50 p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-semibold text-fuchsia-600">
                After · AI 생성
              </span>
              <span className="text-xs text-slate-400">⏱ 2분 47초</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-700">
              세포막의 선택적 투과성을 탐구하기 위해 삼투압 실험을 설계하였다. 0%~2.0% NaCl 용액에 감자 조각을 침지한 결과 1.0%에서 질량 변화율 −0.2%의 등장액 조건을 확인하고, 1.5%에서 −3.1%, 2.0%에서 −5.8%의 감소를 관찰하여 고장액 조건에서의 원형질 분리를 정량 검증하였다. 이 결과는 의생명공학 약물 전달 시스템 설계에 직결되며, 생명공학과 진학 후 나노입자 기반 DDS 연구로 확장할 계획이다.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-600">500자 완성</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">진로연계</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">실험데이터</span>
            </div>
          </div>
        </div>
        <div className="mt-5 text-center">
          <Link
            href={session ? '#subject-select' : '/login'}
            onClick={session ? (e) => { e.preventDefault(); document.getElementById('subject-select')?.scrollIntoView({ behavior: 'smooth' }); } : undefined}
            className="inline-flex items-center gap-1 text-sm font-semibold text-fuchsia-600 hover:text-fuchsia-700"
          >
            나도 저렇게 쓰고 싶어 →
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          섹션 4: Feature Bento Grid
      ══════════════════════════════════════════ */}
      <div ref={s4.ref} className={`mb-12 transition-all duration-700 ${s4.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="mb-6 text-center text-xl font-extrabold text-slate-900 sm:text-2xl">
          한 플랫폼에서 모든 것을
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`glass-card card-hover rounded-2xl p-4 ${f.wide ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <div className="mb-2 text-2xl">{f.emoji}</div>
              <h3 className="text-sm font-bold text-slate-800">{f.title}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          섹션 5: 후기 + 통계
      ══════════════════════════════════════════ */}
      <div ref={s5.ref} className={`mb-12 transition-all duration-700 ${s5.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="mb-6 text-center text-xl font-extrabold text-slate-900 sm:text-2xl">
          실제 학생들의 이야기
        </h2>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <div key={i} className="glass-card rounded-2xl p-4">
              <p className="mb-3 text-sm leading-relaxed text-slate-700">"{r.text}"</p>
              <div className="flex items-center gap-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-400 text-xs font-bold text-white">
                  {r.grade[0]}
                </span>
                <span className="text-xs text-slate-500">{r.grade} · {r.subject}</span>
                <span className="ml-auto text-yellow-400 text-xs">★★★★★</span>
              </div>
            </div>
          ))}
        </div>

        {/* 통계 카운터 */}
        <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 p-5 text-center text-white">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-extrabold sm:text-3xl">{users.toLocaleString()}+</p>
              <p className="mt-0.5 text-xs text-white/80">누적 이용</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold sm:text-3xl">{generated.toLocaleString()}+</p>
              <p className="mt-0.5 text-xs text-white/80">세특·보고서 생성</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold sm:text-3xl">2분 53초</p>
              <p className="mt-0.5 text-xs text-white/80">평균 완성 시간</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          섹션 6: 인라인 프라이싱
      ══════════════════════════════════════════ */}
      <div ref={s6.ref} className={`mb-12 transition-all duration-700 ${s6.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="mb-2 text-center text-xl font-extrabold text-slate-900 sm:text-2xl">
          입시 한 달에 커피 두 잔값
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">합격의 가치에 비하면 아무것도 아닙니다</p>

        {/* 월간/연간 토글 */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-fuchsia-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            월간
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              billingPeriod === 'yearly'
                ? 'bg-fuchsia-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            연간
            <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
              2개월 무료
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PRICING_PLANS.map((plan, i) => {
            const price = billingPeriod === 'monthly'
              ? plan.monthlyPrice
              : (plan.yearlyMonthlyPrice ?? plan.monthlyPrice);
            const isHighlight = plan.highlight;
            return (
              <div
                key={i}
                className={`relative rounded-2xl p-5 transition-transform ${
                  isHighlight
                    ? 'bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-xl scale-[1.03]'
                    : 'glass-card'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 px-3 py-0.5 text-xs font-bold text-yellow-900 shadow-sm whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}
                <h3 className={`mb-1 text-base font-bold ${isHighlight ? 'text-white' : 'text-slate-800'}`}>
                  {plan.name}
                </h3>
                <p className={`mb-4 ${isHighlight ? 'text-white' : 'text-slate-800'}`}>
                  <span className="text-3xl font-extrabold">
                    {price === 0 ? '무료' : `${price.toLocaleString()}원`}
                  </span>
                  {price > 0 && <span className={`text-sm ${isHighlight ? 'text-white/70' : 'text-slate-400'}`}>/월</span>}
                  {billingPeriod === 'yearly' && plan.yearlyTotal && (
                    <span className={`block text-xs mt-0.5 ${isHighlight ? 'text-white/70' : 'text-slate-400'}`}>
                      연 {plan.yearlyTotal.toLocaleString()}원 일괄 결제
                    </span>
                  )}
                </p>
                <ul className="mb-5 space-y-1.5">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-1.5 text-xs ${isHighlight ? 'text-white/90' : 'text-slate-600'}`}>
                      <span className={isHighlight ? 'text-white' : 'text-fuchsia-500'}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={price === 0 ? (session ? '#subject-select' : '/login') : '/pricing'}
                  onClick={price === 0 && session ? (e) => { e.preventDefault(); document.getElementById('subject-select')?.scrollIntoView({ behavior: 'smooth' }); } : undefined}
                  className={`block w-full rounded-xl py-2.5 text-center text-sm font-bold transition-all active:scale-95 ${
                    isHighlight
                      ? 'bg-white text-fuchsia-600 hover:bg-white/90'
                      : 'border border-fuchsia-300 text-fuchsia-600 hover:bg-fuchsia-50'
                  }`}
                >
                  {price === 0 ? '무료로 시작' : `${plan.name} 시작하기`}
                </Link>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          💳 7일 이내 전액 환불 보장 · 언제든 해지 가능 · 카드/카카오페이
        </p>
      </div>

      {/* ══════════════════════════════════════════
          섹션 7: FAQ
      ══════════════════════════════════════════ */}
      <div ref={s7.ref} className={`mb-12 transition-all duration-700 ${s7.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="mb-6 text-center text-xl font-extrabold text-slate-900 sm:text-2xl">
          자주 묻는 질문
        </h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="glass-card overflow-hidden rounded-2xl">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-semibold text-slate-800">{faq.q}</span>
                <span className="ml-3 shrink-0 text-lg font-light text-fuchsia-500">
                  {openFaq === i ? '−' : '+'}
                </span>
              </button>
              {openFaq === i && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                  <p className="text-sm leading-relaxed text-slate-600">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          섹션 8: Final CTA
      ══════════════════════════════════════════ */}
      <div ref={s8.ref} className={`mb-12 transition-all duration-700 ${s8.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-400 p-8 text-center text-white shadow-2xl">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            경쟁자는 지금 쓰고 있습니다
          </h2>
          <p className="mt-3 text-sm text-white/80">
            신용카드 불필요 · 3분 안에 첫 세특 완성
          </p>
          <Link
            href={session ? '#subject-select' : '/login'}
            onClick={session ? (e) => { e.preventDefault(); document.getElementById('subject-select')?.scrollIntoView({ behavior: 'smooth' }); } : undefined}
            className="mt-5 inline-flex h-14 items-center rounded-2xl bg-white px-8 text-base font-bold text-fuchsia-600 shadow-lg hover:bg-white/90 transition-all active:scale-95"
          >
            지금 무료로 시작하기 →
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          기존: 과목 선택 섹션 (앱 핵심 기능)
      ══════════════════════════════════════════ */}
      <div id="subject-select" className="scroll-mt-6">
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-1.5 sm:gap-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-1.5 sm:gap-2">
              <div className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${
                i === 0
                  ? 'bg-gradient-to-r from-fuchsia-400 to-pink-300 text-white shadow-md shadow-pink-200'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  i === 0 ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-400'
                }`}>{i + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-px w-3 sm:w-4 bg-slate-200" />
              )}
            </div>
          ))}
        </div>

        {/* Grade selector */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <p className="text-sm font-bold text-slate-700">🎓 학년 선택</p>
            {selectedGrade && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                주제가 학년에 맞게 바뀌어요
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {GRADE_OPTIONS.map((g) => (
              <button
                key={g.value}
                onClick={() => handleGradeSelect(g.value)}
                className={`relative rounded-2xl border-2 p-3 text-center transition-all active:scale-95 ${
                  selectedGrade === g.value
                    ? 'border-transparent shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {selectedGrade === g.value && (
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${g.color} opacity-10`} />
                )}
                <p className={`text-lg font-extrabold ${selectedGrade === g.value ? 'text-slate-900' : 'text-slate-600'}`}>
                  {g.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{g.desc}</p>
                {selectedGrade === g.value && (
                  <span className="absolute right-2 top-2 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Subject heading */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-800">
            어떤 과목의 탐구를 작성할까요?
          </h2>
          <p className="mt-1 text-sm text-slate-500">관심 과목을 하나 선택하세요 👇</p>
        </div>

        {/* Subject grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {SUBJECTS.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              selected={selectedSubject === subject.id}
              onClick={() => setSelectedSubject(subject.id)}
            />
          ))}
        </div>

        {/* Next button */}
        <div className="mt-8">
          <button
            onClick={handleNext}
            disabled={!selectedSubject}
            className={`w-full sm:w-auto sm:mx-auto sm:block rounded-full px-10 py-4 text-base font-bold transition-all active:scale-95 ${
              selectedSubject
                ? 'btn-gradient text-white cursor-pointer'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            다음 단계 →
          </button>
        </div>
      </div>

      {/* ── Extra tools ── */}
      <div className="mt-12">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">추가 도구</p>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            onClick={() => document.getElementById('topic-expander')?.scrollIntoView({ behavior: 'smooth' })}
            className="glass-card card-hover flex items-start gap-3 rounded-2xl p-4 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-indigo-400 text-xl shadow-sm">
              🔍
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">탐구 주제 확장기</p>
              <p className="mt-0.5 text-xs text-slate-500">키워드 하나로 8과목 연계 주제 탐색</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/feedback')}
            className="glass-card card-hover flex items-start gap-3 rounded-2xl p-4 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 text-xl shadow-sm">
              📝
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">내 글 AI 피드백</p>
              <p className="mt-0.5 text-xs text-slate-500">직접 쓴 세특·보고서를 교사 관점으로 첨삭</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/batch')}
            className="glass-card card-hover flex items-start gap-3 rounded-2xl p-4 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 text-xl shadow-sm">
              📦
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">멀티 과목 배치 생성</p>
              <p className="mt-0.5 text-xs text-slate-500">여러 과목 세특을 한 번에 생성 (최대 4개)</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Topic Expander ── */}
      <div id="topic-expander" className="mt-10">
        <TopicExpanderSection />
      </div>

      {/* ── Footer note ── */}
      <p className="mt-10 text-center text-xs text-slate-400">
        🔒 카카오 로그인 · AI 기반 세특 생성 서비스
      </p>
    </div>
  );
}
