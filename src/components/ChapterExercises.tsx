import React, { useMemo, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import katex from 'katex';
import {
  ArrowUpRight,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  NotebookPen,
  Trash2,
} from 'lucide-react';
import {
  ALL_CHAPTER_EXERCISES,
  CHAPTERS,
  type ChapterExercise,
  type SuggestedLabTab,
} from '../data/curriculum';
import { preprocessStudyMarkdown } from '../utils/markdown';

interface ChapterExercisesProps {
  initialChapterFilter?: string;
  completedExercises: Record<string, boolean>;
  exerciseNotes: Record<string, string>;
  onToggleExerciseComplete: (exerciseId: string) => void;
  onChangeExerciseNote: (exerciseId: string, text: string) => void;
  onJumpToChapter: (chapterId: string, headingId?: string) => void;
  onOpenEquationsTab: (tab: SuggestedLabTab) => void;
}

function extractTextContent(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextContent).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractTextContent(node.props.children);
  }
  return '';
}

const MiniCodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-stone-200 dark:border-slate-800 bg-[#F3EFE6] dark:bg-[#0F141B]">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 px-3 py-1.5 text-[11px] text-stone-500 dark:text-slate-400">
        <span className="font-mono uppercase tracking-wider">{language || 'text'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-stone-600 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-700 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 text-xs leading-relaxed font-mono text-stone-800 dark:text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const EXERCISE_MD_COMPONENTS: Components = {
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#0F141B]">
      <table>{children}</table>
    </div>
  ),
  a: ({ href, children }) => {
    if (!href) return <span>{children}</span>;
    if (!href.startsWith('http://') && !href.startsWith('https://')) {
      return (
        <span className="font-mono text-[0.88em] text-stone-700 dark:text-slate-300 underline decoration-dotted decoration-stone-400">
          {children}
        </span>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-baseline gap-0.5"
      >
        <span>{children}</span>
        <ArrowUpRight className="inline h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
      </a>
    );
  },
  code: ({ className, children, ...props }) => {
    const rawText = extractTextContent(children).replace(/\n$/, '');
    if (!className && rawText.startsWith('__LATEX_INLINE__:')) {
      const expr = rawText.slice('__LATEX_INLINE__:'.length);
      const html = katex.renderToString(expr, { displayMode: false, throwOnError: false });
      return (
        <span
          className="inline-block align-baseline px-0.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    const langMatch = /language-([^\s]+)/.exec(className || '');
    const lang = langMatch ? langMatch[1] : '';

    if (lang === 'latex-block') {
      const html = katex.renderToString(rawText, { displayMode: true, throwOnError: false });
      return (
        <div
          className="my-4 overflow-x-auto rounded-lg border border-stone-200 dark:border-slate-800 bg-[#FAF8F3] dark:bg-[#0F141B] px-4 py-3 text-center"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    const isBlock = Boolean(lang) || rawText.includes('\n');
    if (isBlock) {
      return <MiniCodeBlock code={rawText} language={lang} />;
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
};

const LAB_TAB_LABEL: Record<SuggestedLabTab, string> = {
  expectancy: 'Test in Expectancy Lab',
  sizing: 'Test in Position Sizing Lab',
  drawdown: 'Test in Drawdown Lab',
  compounding: 'Test in Fee Drag Lab',
};

const ExerciseCard: React.FC<{
  exercise: ChapterExercise;
  isCompleted: boolean;
  noteText: string;
  onToggleComplete: () => void;
  onChangeNote: (text: string) => void;
  onJumpToChapter: (chapterId: string, headingId?: string) => void;
  onOpenEquationsTab: (tab: SuggestedLabTab) => void;
}> = ({
  exercise,
  isCompleted,
  noteText,
  onToggleComplete,
  onChangeNote,
  onJumpToChapter,
  onOpenEquationsTab,
}) => {
  const [solutionVisible, setSolutionVisible] = useState(false);
  const [scratchOpen, setScratchOpen] = useState(() => noteText.trim().length > 0);

  const promptMd = useMemo(
    () => preprocessStudyMarkdown(exercise.promptMarkdown),
    [exercise.promptMarkdown]
  );
  const solutionMd = useMemo(
    () => (exercise.solutionMarkdown ? preprocessStudyMarkdown(exercise.solutionMarkdown) : ''),
    [exercise.solutionMarkdown]
  );

  const hasSavedNote = noteText.trim().length > 0;

  return (
    <article
      className={`rounded-xl border transition-colors ${
        isCompleted
          ? 'border-emerald-300/80 dark:border-emerald-900/70 bg-white dark:bg-[#141A22]'
          : 'border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A22]'
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-stone-200/90 dark:border-slate-800 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
            <span className="font-mono font-medium text-stone-700 dark:text-slate-200">
              Chapter {exercise.chapterNumber}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {exercise.kind} {exercise.number}
            </span>
            {hasSavedNote && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#1E3A8A] dark:text-blue-300 font-medium">Workpad saved</span>
              </>
            )}
          </div>
          <h3 className="mt-1 font-display text-lg sm:text-xl font-semibold text-stone-900 dark:text-white leading-snug">
            {exercise.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleComplete}
            aria-pressed={isCompleted}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              isCompleted
                ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'border border-stone-300 dark:border-slate-700 bg-[#FAF8F3] dark:bg-slate-900 text-stone-700 dark:text-slate-200 hover:border-[#1E3A8A] dark:hover:border-blue-400'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
          </button>
        </div>
      </div>

      {/* Exercise Prompt */}
      <div className="px-5 py-5 sm:px-6">
        <div className="editorial-prose text-[15px]">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={EXERCISE_MD_COMPONENTS}>
            {promptMd}
          </ReactMarkdown>
        </div>

        {/* Interactive Student Scratchpad */}
        {scratchOpen && (
          <div className="mt-5 rounded-lg border border-stone-200 dark:border-slate-800 bg-[#FAF8F3] dark:bg-[#0F141B] p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label
                htmlFor={`workpad-${exercise.id}`}
                className="text-xs font-medium text-stone-700 dark:text-slate-300"
              >
                Your Calculation &amp; Reasoning (Saved Locally)
              </label>
              {hasSavedNote && (
                <button
                  type="button"
                  onClick={() => onChangeNote('')}
                  className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-rose-700 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
            <textarea
              id={`workpad-${exercise.id}`}
              rows={3}
              value={noteText}
              onChange={(e) => onChangeNote(e.target.value)}
              placeholder="Write your numbers, formulas, or thesis here before checking the worked solution..."
              className="w-full rounded-md border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm leading-relaxed text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:border-[#1E3A8A] dark:focus:border-blue-400 focus:outline-none"
            />
          </div>
        )}

        {/* Action Strip */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 dark:border-slate-800 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setScratchOpen((o) => !o)}
              aria-expanded={scratchOpen}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-slate-200 hover:border-stone-400 dark:hover:border-slate-500 transition-colors whitespace-nowrap"
            >
              <NotebookPen className="h-3.5 w-3.5" />
              <span>{scratchOpen ? 'Hide Workpad' : hasSavedNote ? 'Edit Workpad' : 'Open Workpad'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSolutionVisible((s) => !s)}
              aria-expanded={solutionVisible}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                solutionVisible
                  ? 'bg-[#1E3A8A] text-white dark:bg-blue-500'
                  : 'border border-stone-300 dark:border-slate-700 bg-[#F3EFE6] dark:bg-slate-800 text-stone-900 dark:text-white hover:border-[#1E3A8A] dark:hover:border-blue-400'
              }`}
            >
              {solutionVisible ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Hide Solution</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span>Reveal Worked Solution</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>

            {exercise.suggestedLabTab && (
              <button
                type="button"
                onClick={() => onOpenEquationsTab(exercise.suggestedLabTab!)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:border-[#1E3A8A] dark:hover:border-blue-400 transition-colors whitespace-nowrap"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>{LAB_TAB_LABEL[exercise.suggestedLabTab]}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onJumpToChapter(exercise.chapterId, exercise.headingId)}
            className="text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline whitespace-nowrap"
          >
            Read in Chapter {exercise.chapterNumber} →
          </button>
        </div>

        {/* Worked Solution Panel */}
        {solutionVisible && solutionMd && (
          <div className="mt-4 rounded-lg border border-stone-200 dark:border-slate-800 bg-[#F3EFE6]/70 dark:bg-[#0F141B] p-4 sm:p-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2.5">
              Answer Key · Chapter {exercise.chapterNumber} {exercise.kind} {exercise.number}
            </div>
            <div className="editorial-prose text-[15px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={EXERCISE_MD_COMPONENTS}>
                {solutionMd}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export const ChapterExercises: React.FC<ChapterExercisesProps> = ({
  initialChapterFilter = 'all',
  completedExercises,
  exerciseNotes,
  onToggleExerciseComplete,
  onChangeExerciseNote,
  onJumpToChapter,
  onOpenEquationsTab,
}) => {
  const [chapterFilter, setChapterFilter] = useState<string>(initialChapterFilter);
  const [statusFilter, setStatusFilter] = useState<'all' | 'remaining' | 'done'>('all');

  const totalCount = ALL_CHAPTER_EXERCISES.length;
  const completedCount = useMemo(
    () => ALL_CHAPTER_EXERCISES.filter((ex) => completedExercises[ex.id]).length,
    [completedExercises]
  );

  const chapterCounts = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    for (const ch of CHAPTERS) {
      map[ch.id] = { total: 0, done: 0 };
    }
    for (const ex of ALL_CHAPTER_EXERCISES) {
      const bucket = map[ex.chapterId];
      if (bucket) {
        bucket.total += 1;
        if (completedExercises[ex.id]) bucket.done += 1;
      }
    }
    return map;
  }, [completedExercises]);

  const filteredExercises = useMemo(() => {
    return ALL_CHAPTER_EXERCISES.filter((ex) => {
      if (chapterFilter !== 'all' && ex.chapterId !== chapterFilter) return false;
      const done = Boolean(completedExercises[ex.id]);
      if (statusFilter === 'remaining' && done) return false;
      if (statusFilter === 'done' && !done) return false;
      return true;
    });
  }, [chapterFilter, statusFilter, completedExercises]);

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress & Filter Toolbar */}
      <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-[#F3EFE6]/75 dark:bg-[#141A22] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-stone-500 dark:text-slate-400">
              Curriculum Problem Sets · Chapters 01–05
            </div>
            <div className="mt-1 flex items-baseline gap-2.5">
              <span className="font-display text-2xl font-semibold tabular-nums text-stone-900 dark:text-white">
                {completedCount} / {totalCount}
              </span>
              <span className="text-xs text-stone-600 dark:text-slate-300">
                exercises &amp; research labs completed ({progressPct}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 w-fit shrink-0">
            {(['all', 'remaining', 'done'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-[#1E3A8A] text-white dark:bg-blue-500'
                    : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {status === 'all' ? 'All Status' : status === 'remaining' ? 'Remaining' : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        {/* Hairline Completion Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-slate-800">
          <div
            className="h-full bg-[#1E3A8A] dark:bg-blue-400 transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Chapter Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setChapterFilter('all')}
            className={`whitespace-nowrap shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              chapterFilter === 'all'
                ? 'border-[#1E3A8A] bg-white text-[#1E3A8A] dark:border-blue-400 dark:bg-slate-900 dark:text-blue-300'
                : 'border-stone-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 text-stone-600 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            All Chapters ({totalCount})
          </button>

          {CHAPTERS.map((ch) => {
            const counts = chapterCounts[ch.id] ?? { total: 0, done: 0 };
            const active = chapterFilter === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setChapterFilter(ch.id)}
                className={`whitespace-nowrap shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors tabular-nums ${
                  active
                    ? 'border-[#1E3A8A] bg-white text-[#1E3A8A] dark:border-blue-400 dark:bg-slate-900 dark:text-blue-300'
                    : 'border-stone-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 text-stone-600 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Ch. {ch.number} ({counts.done}/{counts.total})
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise Cards */}
      {filteredExercises.length === 0 ? (
        <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A22] p-10 text-center">
          <p className="text-sm font-medium text-stone-800 dark:text-slate-200">
            No exercises match this chapter and status filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setChapterFilter('all');
              setStatusFilter('all');
            }}
            className="mt-3 text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline"
          >
            Reset Exercise Filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredExercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              isCompleted={Boolean(completedExercises[ex.id])}
              noteText={exerciseNotes[ex.id] ?? ''}
              onToggleComplete={() => onToggleExerciseComplete(ex.id)}
              onChangeNote={(text) => onChangeExerciseNote(ex.id, text)}
              onJumpToChapter={onJumpToChapter}
              onOpenEquationsTab={onOpenEquationsTab}
            />
          ))}
        </div>
      )}
    </div>
  );
};
