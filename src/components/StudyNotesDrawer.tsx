import React, { useEffect, useState } from 'react';
import { Check, Copy, NotebookPen, X } from 'lucide-react';

interface StudyNotesDrawerProps {
  isOpen: boolean;
  chapterId: string;
  chapterNumber: string;
  chapterTitle: string;
  noteText: string;
  onChangeNote: (chapterId: string, text: string) => void;
  onClose: () => void;
}

export const StudyNotesDrawer: React.FC<StudyNotesDrawerProps> = ({
  isOpen,
  chapterId,
  chapterNumber,
  chapterTitle,
  noteText,
  onChangeNote,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `# Chapter ${chapterNumber}: ${chapterTitle}\n\n${noteText}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-stone-950/45 backdrop-blur-[1px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Chapter ${chapterNumber} study notes`}
    >
      <div
        className="w-full max-w-md h-full flex flex-col bg-[#FBF9F5] dark:bg-[#121820] border-l border-stone-200 dark:border-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-mono text-stone-500 dark:text-slate-400">
              <NotebookPen className="h-3.5 w-3.5" />
              <span>Chapter {chapterNumber} Scratchpad</span>
            </div>
            <h2 className="mt-0.5 font-display text-base font-semibold text-stone-900 dark:text-white truncate">
              {chapterTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close study notes"
            className="rounded-md p-1.5 text-stone-500 hover:bg-stone-200/70 hover:text-stone-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 p-5 flex flex-col">
          <label htmlFor="chapter-notes-textarea" className="text-xs text-stone-600 dark:text-slate-400 mb-2">
            Work through exercise calculations, record thesis criteria, or save key formulas. Automatically saved in your browser.
          </label>
          <textarea
            id="chapter-notes-textarea"
            value={noteText}
            onChange={(e) => onChangeNote(chapterId, e.target.value)}
            placeholder="Example: Exercise 5 — E = 0.60(40) - 0.40(70) - 2 = -$6/trade..."
            className="flex-1 w-full resize-none rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-sm font-mono leading-relaxed text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:border-[#1E3A8A] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between border-t border-stone-200 dark:border-slate-800 px-5 py-3.5 text-xs">
          <span className="font-mono tabular-nums text-stone-500 dark:text-slate-400">
            {noteText.length} characters saved
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={noteText.trim().length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 font-medium text-stone-800 dark:text-slate-200 disabled:opacity-45"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied Markdown' : 'Copy Notes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
