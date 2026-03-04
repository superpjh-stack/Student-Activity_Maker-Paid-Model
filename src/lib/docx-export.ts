import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import type { HistoryItem } from '@/types';

const TONE_LABEL: Record<string, string> = {
  academic: '학술적',
  friendly: '친근한',
  neutral: '중립적',
};

const LENGTH_LABEL: Record<string, string> = {
  short: '단 (500자)',
  medium: '중 (1000자)',
  long: '장 (2000자)',
};

function makeMetaParagraph(label: string, value: string) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20 }),
      new TextRun({ text: value, size: 20 }),
    ],
    spacing: { after: 80 },
  });
}

function makeBodyParagraphs(text: string): Paragraph[] {
  return text.split('\n').map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line || ' ', size: 22 })],
        spacing: { line: 360, after: 0 },
      })
  );
}

export async function exportToDocx(item: HistoryItem): Promise<void> {
  const createdAt = new Date(item.createdAt).toLocaleString('ko-KR');
  const sections: Paragraph[] = [];

  // 제목
  sections.push(
    new Paragraph({
      text: `${item.subjectEmoji} ${item.subjectName} - ${item.topic}`,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // 메타 정보
  sections.push(makeMetaParagraph('생성일시', createdAt));
  sections.push(makeMetaParagraph('과목', `${item.subjectEmoji} ${item.subjectName}`));
  sections.push(makeMetaParagraph('주제', item.topic));
  if (item.report) {
    sections.push(makeMetaParagraph('길이', LENGTH_LABEL[item.length] ?? item.length));
    sections.push(makeMetaParagraph('문체', TONE_LABEL[item.tone] ?? item.tone));
  }

  // 구분선
  sections.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '4F46E5' } },
      spacing: { before: 200, after: 400 },
    })
  );

  // 탐구보고서
  if (item.report) {
    sections.push(
      new Paragraph({
        text: '탐구보고서',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      })
    );
    sections.push(...makeBodyParagraphs(item.report));
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `총 ${item.report.length}자`,
            color: '888888',
            size: 18,
            italics: true,
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { before: 120, after: 400 },
      })
    );
  }

  // 세특 500자
  if (item.setech) {
    sections.push(
      new Paragraph({
        text: '세부능력 및 특기사항 (세특 500자)',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      })
    );
    sections.push(...makeBodyParagraphs(item.setech));
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `총 ${item.setech.length}자`,
            color: '888888',
            size: 18,
            italics: true,
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { before: 120 },
      })
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `생기부_${item.subjectName}_${item.topic.slice(0, 20)}.docx`;
  saveAs(blob, fileName);
}
