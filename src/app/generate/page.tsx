'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSubjectById } from '@/lib/subjects';
import { saveHistoryItem } from '@/lib/history';
import { exportToDocx } from '@/lib/docx-export';
import { loadProfile, saveProfile } from '@/lib/profile';
import ResultDisplay from '@/components/features/ResultDisplay';
import AbCompareView from '@/components/features/AbCompareView';
import ProfileSetupModal from '@/components/features/ProfileSetupModal';
import type { LengthOption, ToneOption, TeacherStyle, HistoryItem, StreamingState, UserProfile, AbGenerateResponse } from '@/types';
import { TEACHER_STYLE_LABELS } from '@/types';

const TONE_LABEL: Record<string, string> = {
  academic: '학술적',
  friendly: '친근한',
  neutral: '중립적',
};

const LENGTH_LABEL: Record<string, string> = {
  short: '단 (500자 내외)',
  medium: '중 (1000자 내외)',
  long: '장 (2000자 내외)',
};

interface PrintDocumentProps {
  subjectEmoji: string;
  subjectName: string;
  topic: string;
  length: LengthOption;
  tone: ToneOption;
  report: string;
  setech: string;
  createdAt: string;
  teacherStyle?: TeacherStyle;
}

function PrintDocument({ subjectEmoji, subjectName, topic, length, tone, report, setech, createdAt, teacherStyle }: PrintDocumentProps) {
  const createdAtStr = new Date(createdAt).toLocaleString('ko-KR');
  return (
    <div style={{ fontFamily: "'Noto Sans KR', 'Malgun Gothic', sans-serif", color: '#000', background: '#fff' }}>
      <h1 style={{ fontSize: '18pt', fontWeight: 'bold', textAlign: 'center', marginBottom: '6pt', lineHeight: 1.4 }}>
        {subjectEmoji} {subjectName} — {topic}
      </h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12pt', fontSize: '9.5pt', color: '#444' }}>
        <tbody>
          <tr>
            <td style={{ width: '25%', fontWeight: 'bold', paddingBottom: '3pt' }}>생성일시</td>
            <td style={{ paddingBottom: '3pt' }}>{createdAtStr}</td>
            <td style={{ width: '25%', fontWeight: 'bold', paddingBottom: '3pt' }}>과목</td>
            <td style={{ paddingBottom: '3pt' }}>{subjectEmoji} {subjectName}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', paddingBottom: '3pt' }}>길이</td>
            <td style={{ paddingBottom: '3pt' }}>{LENGTH_LABEL[length] ?? length}</td>
            <td style={{ fontWeight: 'bold', paddingBottom: '3pt' }}>문체</td>
            <td style={{ paddingBottom: '3pt' }}>{TONE_LABEL[tone] ?? tone}{teacherStyle ? ` · ${TEACHER_STYLE_LABELS[teacherStyle].label}` : ''}</td>
          </tr>
        </tbody>
      </table>
      <hr style={{ border: 'none', borderTop: '2px solid #7c3aed', marginBottom: '16pt' }} />
      {report && (
        <>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', marginBottom: '8pt', marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: '4pt' }}>탐구보고서</h2>
          <div style={{ fontSize: '10.5pt', lineHeight: 2, whiteSpace: 'pre-wrap', marginBottom: '4pt' }}>{report}</div>
          <p style={{ fontSize: '8.5pt', color: '#888', textAlign: 'right', marginBottom: '20pt', fontStyle: 'italic' }}>총 {report.length}자</p>
        </>
      )}
      {setech && (
        <>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', marginBottom: '8pt', marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: '4pt' }}>세부능력 및 특기사항 (세특 500자)</h2>
          <div style={{ fontSize: '10.5pt', lineHeight: 2, whiteSpace: 'pre-wrap', marginBottom: '4pt' }}>{setech}</div>
          <p style={{ fontSize: '8.5pt', color: '#888', textAlign: 'right', fontStyle: 'italic' }}>총 {setech.length}자</p>
        </>
      )}
    </div>
  );
}

const LENGTH_OPTIONS: { value: LengthOption; label: string; desc: string; emoji: string }[] = [
  { value: 'short',  label: '단',  desc: '500자 내외',  emoji: '📄' },
  { value: 'medium', label: '중',  desc: '1000자 내외', emoji: '📃' },
  { value: 'long',   label: '장',  desc: '2000자 내외', emoji: '📋' },
];

const TONE_OPTIONS: { value: ToneOption; label: string; desc: string; emoji: string }[] = [
  { value: 'academic',  label: '학술적', desc: '논문체',  emoji: '🎓' },
  { value: 'friendly',  label: '친근한', desc: '구어체',  emoji: '😊' },
  { value: 'neutral',   label: '중립적', desc: '일반체',  emoji: '⚖️' },
];

async function streamText(url: string, body: object, onChunk: (text: string) => void): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error('스트리밍 응답 오류');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      if (part.startsWith('data: ')) {
        const data = part.slice(6);
        if (data === '[DONE]') return;
        try { onChunk(JSON.parse(data)); } catch { /* ignore */ }
      }
    }
  }
}

const STEPS = ['과목 선택', '주제 선택', 'AI 생성'];

function GeneratePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const subjectId = searchParams.get('subject') || '';
  const topic = searchParams.get('topic') || '';
  const motivation = searchParams.get('motivation') || '';
  const activity = searchParams.get('activity') || '';
  const curiosity = searchParams.get('curiosity') || '';
  const subject = getSubjectById(subjectId);

  const coachingContext = motivation || activity || curiosity
    ? { motivation, activity, curiosity }
    : undefined;

  const [length, setLength] = useState<LengthOption>('medium');
  const [tone, setTone] = useState<ToneOption>('neutral');
  const [teacherStyle, setTeacherStyle] = useState<TeacherStyle | undefined>(undefined);

  const [report, setReport] = useState('');
  const [setech, setSetech] = useState('');
  const [reportStreamState, setReportStreamState] = useState<StreamingState>('idle');
  const [setechStreamState, setSetechStreamState] = useState<StreamingState>('idle');

  const [error, setError] = useState<string | null>(null);
  const [savedItem, setSavedItem] = useState<HistoryItem | null>(null);
  const [downloading, setDownloading] = useState(false);

  const [abResult, setAbResult] = useState<AbGenerateResponse | null>(null);
  const [abLoading, setAbLoading] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  if (!subject || !topic) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center">
          <span className="text-4xl">😅</span>
          <p className="mt-3 text-base font-medium text-slate-600">잘못된 접근입니다.</p>
          <button onClick={() => router.push('/')} className="mt-4 text-sm font-medium text-violet-600 hover:underline">
            처음으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const persistHistory = (newReport: string, newSetech: string) => {
    const item = saveHistoryItem({
      subjectId: subject.id,
      subjectName: subject.name,
      subjectEmoji: subject.emoji,
      topic,
      length,
      tone,
      report: newReport || null,
      setech: newSetech || null,
    });
    setSavedItem(item);
    return item;
  };

  const handleGenerate = async () => {
    setError(null);
    setReport('');
    setSetech('');
    setAbResult(null);
    setReportStreamState('streaming');
    setSetechStreamState('idle');

    const profilePayload = profile ? { career: profile.career, interests: profile.interests } : undefined;
    let finalReport = '';
    try {
      await streamText('/api/generate-report-stream', { subject: subject.name, topic, length, tone, profile: profilePayload, coaching: coachingContext, teacherStyle }, (chunk) => {
        finalReport += chunk;
        setReport(finalReport);
      });
      setReportStreamState('done');
    } catch {
      setReportStreamState('error');
      setError('탐구보고서 생성 중 오류가 발생했습니다.');
      return;
    }

    setSetechStreamState('streaming');
    let finalSetech = '';
    try {
      await streamText('/api/generate-setech-stream', { subject: subject.name, topic, reportContent: finalReport, profile: profilePayload, coaching: coachingContext, teacherStyle }, (chunk) => {
        finalSetech += chunk;
        setSetech(finalSetech);
      });
      setSetechStreamState('done');
      persistHistory(finalReport, finalSetech);
    } catch {
      setSetechStreamState('error');
      setError('세특 생성 중 오류가 발생했습니다.');
    }
  };

  const handleRequestAb = async () => {
    setAbLoading(true);
    setError(null);
    try {
      const profilePayload = profile ? { career: profile.career, interests: profile.interests } : undefined;
      const res = await fetch('/api/generate-ab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.name, topic, length, tone, profile: profilePayload, teacherStyle }),
      });
      if (!res.ok) throw new Error('A/B 생성 실패');
      const data = await res.json();
      setAbResult(data);
    } catch {
      setError('다른 버전 생성 중 오류가 발생했습니다.');
    } finally {
      setAbLoading(false);
    }
  };

  const handleAbSelect = (_version: 'A' | 'B', selectedReport: string, selectedSetech: string) => {
    setReport(selectedReport);
    setSetech(selectedSetech);
    setAbResult(null);
    persistHistory(selectedReport, selectedSetech);
  };

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    if (!savedItem) return;
    setDownloading(true);
    try {
      await exportToDocx({ ...savedItem, report: report || null, setech: setech || null });
    } finally {
      setDownloading(false);
    }
  };

  const hasResult = report || setech;
  const isGenerating = reportStreamState === 'streaming' || setechStreamState === 'streaming';

  return (
    <div className="pb-16 pt-4">
      {/* ── Steps ── */}
      <div className="mb-8 flex items-center justify-center gap-1.5 sm:gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1.5 sm:gap-2">
            <div className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-1 text-xs font-semibold bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md shadow-violet-200`}>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/30 text-white text-[10px]">
                {i < 2 ? '✓' : '3'}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="h-px w-3 sm:w-4 bg-violet-300" />}
          </div>
        ))}
      </div>

      {/* ── Selected info row ── */}
      <div className="mb-6 flex items-start gap-3">
        <div className="glass-card flex-1 rounded-2xl p-4">
          <p className="text-xs font-medium text-slate-400">선택 요약</p>
          <p className="mt-1 font-bold text-slate-800">{subject.emoji} {subject.name}</p>
          <p className="mt-0.5 text-sm text-slate-600 leading-relaxed">{topic}</p>
        </div>
        <button
          onClick={() => setShowProfileModal(true)}
          className="glass-card card-hover flex flex-col items-center rounded-2xl px-3 py-3 text-center"
          title="내 진로 프로필 설정"
        >
          <span className="text-2xl">👤</span>
          <span className="mt-1 text-xs font-medium text-slate-500">{profile?.career ? '프로필' : '설정'}</span>
        </button>
      </div>

      {/* ── Profile badge ── */}
      {profile?.career && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5">
          <span className="text-violet-500">✨</span>
          <span className="text-xs font-semibold text-violet-700">진로 맞춤 적용 중:</span>
          <span className="text-xs text-violet-800">{profile.career}</span>
        </div>
      )}

      {/* ── Length options ── */}
      <div className="mb-5">
        <p className="mb-3 text-sm font-bold text-slate-700">📏 탐구보고서 길이</p>
        <div className="grid grid-cols-3 gap-2.5">
          {LENGTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLength(opt.value)}
              className={`rounded-2xl border-2 p-3.5 text-center transition-all ${
                length === opt.value
                  ? 'border-violet-400 bg-gradient-to-br from-violet-50 to-pink-50 shadow-sm'
                  : 'glass-card border-transparent hover:border-violet-200'
              }`}
            >
              <span className="text-xl">{opt.emoji}</span>
              <p className="mt-1.5 text-sm font-bold text-slate-800">{opt.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tone options ── */}
      <div className="mb-5">
        <p className="mb-3 text-sm font-bold text-slate-700">🎨 문체 / 톤</p>
        <div className="grid grid-cols-3 gap-2.5">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTone(opt.value)}
              className={`rounded-2xl border-2 p-3.5 text-center transition-all ${
                tone === opt.value
                  ? 'border-violet-400 bg-gradient-to-br from-violet-50 to-pink-50 shadow-sm'
                  : 'glass-card border-transparent hover:border-violet-200'
              }`}
            >
              <span className="text-xl">{opt.emoji}</span>
              <p className="mt-1.5 text-sm font-bold text-slate-800">{opt.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Teacher style ── */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-bold text-slate-700">
          👩‍🏫 교사 문체 스타일{' '}
          <span className="text-xs font-normal text-slate-400">(선택사항)</span>
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {(Object.entries(TEACHER_STYLE_LABELS) as [TeacherStyle, { label: string; desc: string }][]).map(([value, info]) => (
            <button
              key={value}
              onClick={() => setTeacherStyle(teacherStyle === value ? undefined : value)}
              className={`rounded-2xl border-2 p-2.5 text-center transition-all ${
                teacherStyle === value
                  ? 'border-pink-400 bg-gradient-to-br from-pink-50 to-rose-50 shadow-sm'
                  : 'glass-card border-transparent hover:border-pink-200'
              }`}
            >
              <p className="text-xs font-bold text-slate-800">{info.label}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{info.desc}</p>
            </button>
          ))}
        </div>
        {teacherStyle && (
          <p className="mt-2 text-xs font-medium text-pink-600">
            ✅ {TEACHER_STYLE_LABELS[teacherStyle].label} 스타일 적용 중 (다시 클릭하면 해제)
          </p>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Generate button ── */}
      <div className="mb-5">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full rounded-2xl py-4 text-base font-bold text-white transition-all btn-gradient disabled:opacity-60"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              AI가 작성 중이에요...
            </span>
          ) : (
            '✨ AI 생성 시작 (보고서 + 세특)'
          )}
        </button>
      </div>

      {/* ── Action bar ── */}
      {hasResult && !isGenerating && (
        <div className="mb-8 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-pink-50 px-4 py-3">
          <p className="mb-2.5 text-sm font-medium text-violet-700">✅ 이력에 자동 저장되었습니다!</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-all active:scale-95"
            >
              {downloading ? '⏳ 변환 중' : '⬇️ .docx'}
            </button>
            <button
              onClick={handlePrint}
              className="rounded-xl bg-slate-600 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-all active:scale-95"
            >
              🖨️ PDF
            </button>
            <button
              onClick={() => router.push('/history')}
              className="rounded-xl border border-violet-300 py-2.5 text-sm font-semibold text-violet-600 hover:bg-violet-100 transition-all active:scale-95"
            >
              이력 보기
            </button>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      <div>
        <ResultDisplay
          report={report || null}
          setech={setech || null}
          reportLoading={false}
          setechLoading={false}
          reportStreamState={reportStreamState}
          setechStreamState={setechStreamState}
          onRequestAb={handleRequestAb}
          abLoading={abLoading}
        />

        {/* A/B Loading skeleton */}
        {abLoading && (
          <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-5">
            <div className="mb-4 h-4 w-24 animate-pulse rounded-full bg-violet-200" />
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
                  <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-3 w-4/6 animate-pulse rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        )}

        {abResult && !abLoading && (
          <AbCompareView
            versionA={abResult.versionA}
            versionB={abResult.versionB}
            onSelect={handleAbSelect}
          />
        )}
      </div>

      {/* ── Home link ── */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/')}
          className="text-sm font-medium text-slate-400 hover:text-violet-600 hover:underline transition-colors"
        >
          ← 처음으로 돌아가기
        </button>
      </div>

      {/* ── Print area ── */}
      <div id="print-area" aria-hidden="true">
        {hasResult && (
          <PrintDocument
            subjectEmoji={subject.emoji}
            subjectName={subject.name}
            topic={topic}
            length={length}
            tone={tone}
            teacherStyle={teacherStyle}
            report={report}
            setech={setech}
            createdAt={savedItem?.createdAt ?? new Date().toISOString()}
          />
        )}
      </div>

      {/* ── Profile modal ── */}
      <ProfileSetupModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        initialProfile={profile}
        onSave={(p) => {
          saveProfile(p);
          setProfile({ ...p, savedAt: new Date().toISOString() });
        }}
      />
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        </div>
      }
    >
      <GeneratePageContent />
    </Suspense>
  );
}
