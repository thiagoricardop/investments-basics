import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { searchCurriculum } from '../utils/markdown';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (chapterId: string, headingId?: string) => void;
}

const SUGGESTED_TERMS = ['expectancy', 'order book', 'contango', 'Sharpe ratio', 'bootstrap', 'rebalancing'];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => searchCurriculum(query), [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-stone-950/50 backdrop-blur-[2px] px-4 pt-16 sm:pt-24"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search curriculum"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-stone-200 dark:border-slate-800 bg-[#FBF9F5] dark:bg-[#121820] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-stone-200 dark:border-slate-800 px-4 py-3.5">
          <Search className="h-4.5 w-4.5 text-stone-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all 5 chapters (e.g., slippage, DCF, RSI, bootstrap)…"
            className="w-full bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-md p-1.5 text-stone-500 hover:bg-stone-200/60 hover:text-stone-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 sm:p-4">
          {query.trim().length < 2 ? (
            <div className="py-4 px-2">
              <p className="text-xs font-medium text-stone-500 dark:text-slate-400 mb-3">
                Suggested study topics
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TERMS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="rounded-md border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-[#1E3A8A] hover:text-[#1E3A8A] dark:text-slate-300 dark:hover:border-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone-500 dark:text-slate-400">
              No sections matched “{query}”. Try a broader term such as “margin”, “ETF”, or “stop”.
            </div>
          ) : (
            <ul className="divide-y divide-stone-200/80 dark:divide-slate-800">
              {results.map((hit, idx) => (
                <li key={`${hit.chapterId}-${hit.headingId}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectResult(hit.chapterId, hit.headingId);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-3 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-[#1E3A8A] dark:text-blue-300">
                        Ch. {hit.chapterNumber} · {hit.headingText}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-slate-400 line-clamp-2">
                      {hit.snippet}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
