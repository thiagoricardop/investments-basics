export interface HeadingItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  chapterId: string;
  chapterNumber: string;
}

export interface SplitMarkdownSections {
  beforeAnswerKey: string;
  answerKeyHeading: string | null;
  answerKeyBody: string | null;
  afterAnswerKey: string;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function extractHeadings(markdown: string): HeadingItem[] {
  const lines = markdown.split('\n');
  const headings: HeadingItem[] = [];
  let inCodeFence = false;
  const seenIds = new Map<string, number>();

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    const rawText = match[2].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*_]/g, '');
    const baseId = slugifyHeading(rawText);
    const count = seenIds.get(baseId) ?? 0;
    seenIds.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count}`;

    headings.push({ id, text: rawText, level });
  }

  return headings;
}

/**
 * Splits a chapter markdown string so the Answer Key section (## ... Answer key ...)
 * can be placed inside a student-friendly spoiler-protected disclosure panel.
 */
export function splitAnswerKeySection(markdown: string): SplitMarkdownSections {
  const lines = markdown.split('\n');
  let inCodeFence = false;
  let answerStartIdx = -1;
  let answerHeading = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const match = /^##\s+(.+?)\s*$/.exec(line);
    if (match) {
      const stripped = match[1].replace(/^\d+\.\s*/, '').trim();
      if (/^answer key\b/i.test(stripped)) {
        answerStartIdx = i;
        answerHeading = match[1].trim();
        break;
      }
    }
  }

  if (answerStartIdx === -1) {
    return {
      beforeAnswerKey: markdown,
      answerKeyHeading: null,
      answerKeyBody: null,
      afterAnswerKey: '',
    };
  }

  // Find the next ## heading after answerStartIdx
  let answerEndIdx = lines.length;
  inCodeFence = false;
  for (let i = answerStartIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    if (/^##\s+/.test(line)) {
      answerEndIdx = i;
      break;
    }
  }

  return {
    beforeAnswerKey: lines.slice(0, answerStartIdx).join('\n'),
    answerKeyHeading: answerHeading,
    answerKeyBody: lines.slice(answerStartIdx + 1, answerEndIdx).join('\n').trim(),
    afterAnswerKey: lines.slice(answerEndIdx).join('\n'),
  };
}

/**
 * Extracts glossary bullet items (- **Term:** definition) from the Glossary section of a chapter.
 */
export function extractGlossaryTerms(
  markdown: string,
  chapterId: string,
  chapterNumber: string
): GlossaryEntry[] {
  const lines = markdown.split('\n');
  let inGlossary = false;
  let inCodeFence = false;
  const entries: GlossaryEntry[] = [];

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const h2Match = /^##\s+(.+?)\s*$/.exec(line);
    if (h2Match) {
      if (inGlossary) break;
      if (/glossary/i.test(h2Match[1])) {
        inGlossary = true;
      }
      continue;
    }

    if (!inGlossary) continue;

    // Match formats like: - **Term:** Definition  OR  - **Term** — Definition
    const bulletMatch = /^-\s+\*\*(.+?)\*\*\s*(?:[:—–-]\s*)?(.+)$/.exec(line.trim());
    if (bulletMatch) {
      const term = bulletMatch[1].replace(/[:：]\s*$/, '').trim();
      const definition = bulletMatch[2].replace(/^[:—–-]\s*/, '').trim();
      if (term && definition) {
        entries.push({
          id: `${chapterId}_${slugifyHeading(term)}`,
          term,
          definition,
          chapterId,
          chapterNumber,
        });
      }
    }
  }

  return entries;
}

export type SuggestedLabTab = 'expectancy' | 'sizing' | 'drawdown' | 'compounding';

export interface ChapterExercise {
  id: string;
  chapterId: string;
  chapterNumber: string;
  kind: 'Exercise' | 'Lab';
  number: number;
  headingId: string;
  title: string;
  fullHeading: string;
  promptMarkdown: string;
  solutionMarkdown: string;
  suggestedLabTab?: SuggestedLabTab;
}

function detectSuggestedLabTab(title: string, prompt: string): SuggestedLabTab | undefined {
  const combined = `${title} ${prompt}`.toLowerCase();
  if (/expectancy/.test(combined)) return 'expectancy';
  if (/size a position|position siz|share size and planned risk/.test(combined)) return 'sizing';
  if (/drawdown and recovery/.test(combined)) return 'drawdown';
  if (/fee drag|contribution timing and fee/.test(combined)) return 'compounding';
  return undefined;
}

function parseAnswerKeyMap(answerKeyBody: string | null): Map<string, string> {
  const solutions = new Map<string, string>();
  if (!answerKeyBody) return solutions;

  const lines = answerKeyBody.split('\n');
  let inCodeFence = false;
  let currentKey: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentKey) {
      const content = buffer.join('\n').trim();
      if (content) {
        solutions.set(currentKey, content);
      }
    }
    buffer = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeFence = !inCodeFence;
      if (currentKey) buffer.push(line);
      continue;
    }

    if (!inCodeFence) {
      // Style 1 (Ch 01-04): ### Exercise 1 — optional subtitle
      const headingMatch = /^###\s+(Exercise|Lab)\s+(\d+)\b.*$/i.exec(line.trim());
      if (headingMatch) {
        flush();
        currentKey = `${headingMatch[1].toLowerCase()}_${Number(headingMatch[2])}`;
        continue;
      }

      // Style 2 (Ch 05): - **Lab 1:** explanation...
      const bulletMatch = /^-\s+\*\*(Exercise|Lab)\s+(\d+)\s*:?\*\*\s*:?\s*(.*)$/i.exec(line.trim());
      if (bulletMatch) {
        flush();
        currentKey = `${bulletMatch[1].toLowerCase()}_${Number(bulletMatch[2])}`;
        if (bulletMatch[3]) {
          buffer.push(bulletMatch[3].trim());
        }
        continue;
      }
    }

    if (currentKey) {
      buffer.push(line);
    }
  }

  flush();
  return solutions;
}

/**
 * Extracts all chapter exercises/labs (### Exercise N — Title or ### Lab N — Title)
 * and pairs each prompt with its matching Answer Key solution.
 */
export function extractChapterExercises(
  markdown: string,
  chapterId: string,
  chapterNumber: string
): ChapterExercise[] {
  const split = splitAnswerKeySection(markdown);
  const answerMap = parseAnswerKeyMap(split.answerKeyBody);
  const lines = split.beforeAnswerKey.split('\n');

  const exercises: ChapterExercise[] = [];
  let inCodeFence = false;
  let current: {
    kind: 'Exercise' | 'Lab';
    number: number;
    fullHeading: string;
    title: string;
    headingId: string;
    lines: string[];
  } | null = null;

  const flush = () => {
    if (!current) return;
    // Strip trailing horizontal dividers ---
    const cleaned = [...current.lines];
    while (cleaned.length > 0 && (cleaned[cleaned.length - 1].trim() === '' || cleaned[cleaned.length - 1].trim() === '---')) {
      cleaned.pop();
    }
    const promptMarkdown = cleaned.join('\n').trim();
    const key = `${current.kind.toLowerCase()}_${current.number}`;
    const solutionMarkdown = answerMap.get(key) ?? '';
    exercises.push({
      id: `${chapterId}_${key}`,
      chapterId,
      chapterNumber,
      kind: current.kind,
      number: current.number,
      headingId: current.headingId,
      title: current.title,
      fullHeading: current.fullHeading,
      promptMarkdown,
      solutionMarkdown,
      suggestedLabTab: detectSuggestedLabTab(current.title, promptMarkdown),
    });
    current = null;
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeFence = !inCodeFence;
      if (current) current.lines.push(line);
      continue;
    }

    if (!inCodeFence) {
      if (/^##\s+/.test(line)) {
        flush();
        continue;
      }

      const exMatch = /^###\s+(Exercise|Lab)\s+(\d+)\s*(?:[—–-]\s*(.+))?$/i.exec(line.trim());
      if (exMatch) {
        flush();
        const kind = exMatch[1].toLowerCase() === 'lab' ? 'Lab' : 'Exercise';
        const num = Number(exMatch[2]);
        const rawFull = line.replace(/^###\s+/, '').trim();
        const cleanHeading = rawFull.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*_]/g, '');
        const title = (exMatch[3] ?? `${kind} ${num}`).trim();
        current = {
          kind,
          number: num,
          fullHeading: cleanHeading,
          title,
          headingId: slugifyHeading(cleanHeading),
          lines: [],
        };
        continue;
      }
    }

    if (current) {
      current.lines.push(line);
    }
  }

  flush();
  return exercises;
}

export interface SectionLineLookup {
  headingIdByLine: Map<number, string>;
  checkboxIndexByLine: Map<number, number>;
}

export interface ChapterLineMaps {
  before: SectionLineLookup;
  answerHeadingId: string;
  answerBody: SectionLineLookup;
  after: SectionLineLookup;
}

function scanSectionLines(
  markdown: string,
  seenHeadingIds: Map<string, number>,
  checkboxCounter: { value: number }
): SectionLineLookup {
  const headingIdByLine = new Map<number, string>();
  const checkboxIndexByLine = new Map<number, number>();
  if (!markdown) return { headingIdByLine, checkboxIndexByLine };

  const lines = markdown.split('\n');
  let inCodeFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    if (line.trim().startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const headingMatch = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (headingMatch) {
      const rawText = headingMatch[2]
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[`*_]/g, '');
      const baseId = slugifyHeading(rawText);
      const count = seenHeadingIds.get(baseId) ?? 0;
      seenHeadingIds.set(baseId, count + 1);
      headingIdByLine.set(lineNumber, count === 0 ? baseId : `${baseId}-${count}`);
      continue;
    }

    if (/^\s*[-*+]\s+\[[ xX]\]\s+/.test(line)) {
      checkboxIndexByLine.set(lineNumber, checkboxCounter.value);
      checkboxCounter.value += 1;
    }
  }

  return { headingIdByLine, checkboxIndexByLine };
}

/**
 * Deterministically maps line numbers across split chapter sections to exact heading IDs
 * and sequential checklist indices so Markdown rendering has zero render-time mutation.
 */
export function buildChapterLineMaps(
  beforeMarkdown: string,
  answerKeyHeading: string | null,
  answerBodyMarkdown: string,
  afterMarkdown: string
): ChapterLineMaps {
  const seenHeadingIds = new Map<string, number>();
  const checkboxCounter = { value: 0 };

  const before = scanSectionLines(beforeMarkdown, seenHeadingIds, checkboxCounter);

  let answerHeadingId = '';
  if (answerKeyHeading) {
    const clean = answerKeyHeading
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[`*_]/g, '');
    const baseId = slugifyHeading(clean);
    const count = seenHeadingIds.get(baseId) ?? 0;
    seenHeadingIds.set(baseId, count + 1);
    answerHeadingId = count === 0 ? baseId : `${baseId}-${count}`;
  }

  const answerBody = scanSectionLines(answerBodyMarkdown, seenHeadingIds, checkboxCounter);
  const after = scanSectionLines(afterMarkdown, seenHeadingIds, checkboxCounter);

  return { before, answerHeadingId, answerBody, after };
}


