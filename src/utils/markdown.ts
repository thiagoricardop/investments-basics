import { CHAPTERS, ChapterMeta, slugifyHeading } from '../data/curriculum';

export interface SearchHit {
  chapterId: string;
  chapterNumber: string;
  chapterTitle: string;
  headingId: string;
  headingText: string;
  snippet: string;
}

/**
 * Transforms LaTeX delimiters (\[ ... \] and \( ... \)) into safe fenced blocks
 * and tagged inline code tokens without disturbing code blocks or currency values ($50.00).
 */
export function preprocessStudyMarkdown(raw: string): string {
  const lines = raw.split('\n');
  const out: string[] = [];
  let inCodeFence = false;
  let inDisplayMath = false;
  let mathBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeFence = !inCodeFence;
      out.push(line);
      continue;
    }

    if (inCodeFence) {
      out.push(line);
      continue;
    }

    if (!inDisplayMath && trimmed === '\\[') {
      inDisplayMath = true;
      mathBuffer = [];
      continue;
    }

    if (inDisplayMath) {
      if (trimmed === '\\]') {
        inDisplayMath = false;
        out.push('```latex-block');
        out.push(mathBuffer.join('\n').trim());
        out.push('```');
        mathBuffer = [];
      } else {
        mathBuffer.push(line);
      }
      continue;
    }

    // Handle single-line \[ ... \] just in case
    let processed = line.replace(/\\\[(.+?)\\\]/g, (_m, expr: string) => {
      return `\n\`\`\`latex-block\n${expr.trim()}\n\`\`\`\n`;
    });

    // Handle inline \( ... \) without touching regular backticks
    processed = processed.replace(/\\\((.+?)\\\)/g, (_m, expr: string) => {
      const encoded = expr.trim().replace(/`/g, '');
      return `\`__LATEX_INLINE__:${encoded}\``;
    });

    out.push(processed);
  }

  return out.join('\n');
}

export function searchCurriculum(query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const hits: SearchHit[] = [];

  for (const ch of CHAPTERS) {
    const lines = ch.rawMarkdown.split('\n');
    let currentHeadingId = '';
    let currentHeadingText = ch.title;
    let inCodeFence = false;
    const seenSections = new Set<string>();
    const seenHeadingIds = new Map<string, number>();

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inCodeFence = !inCodeFence;
        continue;
      }
      if (inCodeFence) continue;

      const headingMatch = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
      if (headingMatch) {
        const cleanHeading = headingMatch[2]
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/[`*_]/g, '');
        const base = slugifyHeading(cleanHeading);
        const count = seenHeadingIds.get(base) ?? 0;
        seenHeadingIds.set(base, count + 1);
        currentHeadingId = count === 0 ? base : `${base}-${count}`;
        currentHeadingText = cleanHeading;
      }

      const lower = line.toLowerCase();
      if (lower.includes(q)) {
        const key = `${ch.id}:${currentHeadingId}`;
        if (seenSections.has(key)) continue;
        seenSections.add(key);

        const cleanLine = line
          .replace(/^#+\s*/, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/[*_`]/g, '')
          .trim();

        const idx = cleanLine.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 55);
        const end = Math.min(cleanLine.length, idx + q.length + 105);
        const snippet =
          (start > 0 ? '…' : '') +
          cleanLine.slice(start, end) +
          (end < cleanLine.length ? '…' : '');

        hits.push({
          chapterId: ch.id,
          chapterNumber: ch.number,
          chapterTitle: ch.title,
          headingId: currentHeadingId,
          headingText: currentHeadingText,
          snippet: snippet || currentHeadingText,
        });

        if (hits.length >= 30) return hits;
      }
    }
  }

  return hits;
}

export function getNextPrevChapters(
  chapters: ChapterMeta[],
  currentId: string
): { prev: ChapterMeta | null; next: ChapterMeta | null } {
  const index = chapters.findIndex((c) => c.id === currentId);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? chapters[index - 1] : null,
    next: index < chapters.length - 1 ? chapters[index + 1] : null,
  };
}
