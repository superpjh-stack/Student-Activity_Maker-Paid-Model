export type LengthOption = 'short' | 'medium' | 'long';
export type ToneOption = 'academic' | 'friendly' | 'neutral';

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
