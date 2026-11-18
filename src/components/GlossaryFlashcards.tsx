import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCw, Search } from 'lucide-react';
import { ALL_GLOSSARY_TERMS } from '../data/curriculum';

interface GlossaryFlashcardsProps {
  onJumpToChapter: (chapterId: string) => void;
}

export const GlossaryFlashcards: React.FC<GlossaryFlashcardsProps> = ({ onJumpToChapter }) => {
  const [chapterFilter, setChapterFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'flashcards' | 'directory'>('flashcards');
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('ib_known_terms');
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  const filteredTerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_GLOSSARY_TERMS.filter((entry) => {
      if (chapterFilter !== 'all' && entry.chapterNumber !== chapterFilter) return false;
      if (q && !entry.term.toLowerCase().includes(q) && !entry.definition.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [chapterFilter, query]);

  const safeIdx = filteredTerms.length > 0 ? Math.min(cardIndex, filteredTerms.length - 1) : 0;
  const currentCard = filteredTerms[safeIdx] ?? null;

  const knownCount = useMemo(
    () => ALL_GLOSSARY_TERMS.filter((t) => knownIds[t.id]).length,
    [knownIds]
  );

  const toggleKnown = (id: string) => {
    setKnownIds((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('ib_known_terms', JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const handleNext = () => {
    if (filteredTerms.length === 0) return;
    setFlipped(false);
    setCardIndex((safeIdx + 1) % filteredTerms.length);
  };

  const handlePrev = () => {
    if (filteredTerms.length === 0) return;
    setFlipped(false);
    setCardIndex((safeIdx - 1 + filteredTerms.length) % filteredTerms.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-100/80 dark:bg-slate-900 p-1 w-fit">
          <button
            type="button"
            onClick={() => setMode('flashcards')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'flashcards'
                ? 'bg-white dark:bg-slate-800 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-slate-400'
            }`}
          >
            Flashcard Drill
          </button>
          <button
            type="button"
            onClick={() => setMode('directory')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'directory'
                ? 'bg-white dark:bg-slate-800 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-slate-400'
            }`}
          >
            Full Glossary ({ALL_GLOSSARY_TERMS.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono tabular-nums text-stone-600 dark:text-slate-400">
            Mastered: {knownCount}/{ALL_GLOSSARY_TERMS.length} terms
          </span>

          <select
            aria-label="Filter glossary by chapter"
            value={chapterFilter}
            onChange={(e) => {
              setChapterFilter(e.target.value);
              setCardIndex(0);
              setFlipped(false);
            }}
            className="rounded-md border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-stone-800 dark:text-slate-200"
          >
            <option value="all">All Chapters</option>
            <option value="01">Chapter 01</option>
            <option value="02">Chapter 02</option>
            <option value="03">Chapter 03</option>
            <option value="04">Chapter 04</option>
            <option value="05">Chapter 05</option>
          </select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCardIndex(0);
              }}
              placeholder="Filter terms…"
              className="rounded-md border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-stone-900 dark:text-white placeholder:text-stone-400"
            />
          </div>
        </div>
      </div>

      {filteredTerms.length === 0 ? (
        <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A22] p-10 text-center text-sm text-stone-500 dark:text-slate-400">
          No glossary terms match your current filter.
        </div>
      ) : mode === 'flashcards' && currentCard ? (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A22] p-6 sm:p-8 min-h-[260px] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
              <span className="font-mono">
                Chapter {currentCard.chapterNumber} · Card {safeIdx + 1} of {filteredTerms.length}
              </span>
              <button
                type="button"
                onClick={() => toggleKnown(currentCard.id)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  knownIds[currentCard.id]
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{knownIds[currentCard.id] ? 'Mastered' : 'Mark Mastered'}</span>
              </button>
            </div>

            <div className="my-6 text-center">
              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-white">
                {currentCard.term}
              </h3>

              {flipped ? (
                <div className="mt-5 rounded-lg border border-stone-200 dark:border-slate-800 bg-[#F5F1E8]/70 dark:bg-slate-900/60 p-4 text-sm leading-relaxed text-stone-700 dark:text-slate-200 text-left">
                  {currentCard.definition}
                </div>
              ) : (
                <p className="mt-4 text-xs text-stone-500 dark:text-slate-400">
                  Recall the definition and context before revealing the answer.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-slate-200 hover:border-stone-400"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] dark:bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-[#172E6E] transition-colors"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>{flipped ? 'Hide Definition' : 'Reveal Definition'}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-slate-200 hover:border-stone-400"
              >
                <span>Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-stone-200 dark:divide-slate-800 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A22]">
          {filteredTerms.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 sm:px-5"
            >
              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-semibold text-stone-900 dark:text-white">
                    {entry.term}
                  </span>
                  <span className="text-xs font-mono text-stone-500 dark:text-slate-400">
                    · Ch. {entry.chapterNumber}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-slate-300">
                  {entry.definition}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onJumpToChapter(entry.chapterId)}
                className="shrink-0 text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline self-start"
              >
                Read Ch. {entry.chapterNumber} →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
