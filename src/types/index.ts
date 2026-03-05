export type LengthOption = 'short' | 'medium' | 'long';
export type ToneOption = 'academic' | 'friendly' | 'neutral';
export type StreamingState = 'idle' | 'streaming' | 'done' | 'error';
export type TeacherStyle = 'analytical' | 'narrative' | 'competency' | 'concise' | 'encouraging';

export const TEACHER_STYLE_LABELS: Record<TeacherStyle, { label: string; desc: string }> = {
  analytical: { label: '분석형', desc: '수치·인과 중심' },
  narrative: { label: '서사형', desc: '성장 스토리 중심' },
  competency: { label: '역량 중심', desc: '핵심역량 키워드' },
  concise: { label: '간결형', desc: '핵심만 명확하게' },
  encouraging: { label: '격려형', desc: '열정·노력 강조' },
};

export interface UserProfile {
  career: string;
  interests: string;
  savedAt: string;
}

export interface AbGenerateRequest {
  subject: string;
  topic: string;
  length: LengthOption;
  tone: ToneOption;
  profile?: Partial<UserProfile>;
}

export interface AbGenerateResponse {
  versionA: { report: string; setech: string };
  versionB: { report: string; setech: string };
}

export interface Subject {
  id: string;
  name: string;
  emoji: string;
  color: string;
  topics: string[];
}

export interface GenerateReportRequest {
  subject: string;
  topic: string;
  length: LengthOption;
  tone: ToneOption;
}

export interface GenerateReportResponse {
  report: string;
  wordCount: number;
}

export interface GenerateSetechRequest {
  subject: string;
  topic: string;
  reportContent?: string;
}

export interface GenerateSetechResponse {
  setech: string;
  wordCount: number;
}

export interface HistoryItem {
  id: string;
  createdAt: string;
  subjectId: string;
  subjectName: string;
  subjectEmoji: string;
  topic: string;
  length: LengthOption;
  tone: ToneOption;
  report: string | null;
  setech: string | null;
}
