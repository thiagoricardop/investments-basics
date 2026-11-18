import React, { useState } from 'react';
import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from 'lucide-react';
import { CHAPTER_QUIZZES } from '../data/quizzes';

interface ChapterQuizProps {
  chapterId: string;
  chapterNumber: string;
  savedScore?: number;
  onSaveScore: (chapterId: string, score: number, total: number) => void;
}

export const ChapterQuiz: React.FC<ChapterQuizProps> = ({
  chapterId,
  chapterNumber,
  savedScore,
  onSaveScore,
}) => {
  const questions = CHAPTER_QUIZZES[chapterId] ?? [];
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (questions.length === 0) return null;

  const answeredCount = Object.keys(answers).length;
  const score = questions.reduce(
    (acc, q) => (answers[q.id] === q.correctIndex ? acc + 1 : acc),
    0
  );

  const handleSubmit = () => {
    setSubmitted(true);
    onSaveScore(chapterId, score, questions.length);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <section
      aria-label={`Chapter ${chapterNumber} knowledge checkpoint`}
      className="mt-12 rounded-xl border border-stone-200 dark:border-slate-800 bg-[#F5F1E8]/70 dark:bg-[#141A22] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-stone-500 dark:text-slate-400">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Chapter {chapterNumber} Knowledge Checkpoint</span>
            {typeof savedScore === 'number' && !submitted && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#1E3A8A] dark:text-blue-300 font-medium">
                  Best recorded: {savedScore}/{questions.length}
                </span>
              </>
            )}
          </div>
          <h2 className="mt-1 font-display text-xl font-semibold text-stone-900 dark:text-white">
            Verify Your Understanding
          </h2>
        </div>

        {submitted && (
          <div className="flex items-center gap-3">
            <span
              className={`rounded-md border px-3 py-1 text-xs font-mono font-semibold tabular-nums ${
                score === questions.length
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
              }`}
            >
              Score: {score}/{questions.length}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-6">
        {questions.map((q, qIdx) => {
          const selected = answers[q.id];
          const isCorrect = selected === q.correctIndex;

          return (
            <div
              key={q.id}
              className="rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4"
            >
              <div className="text-xs font-mono text-stone-500 dark:text-slate-400">
                Question {qIdx + 1} of {questions.length}
              </div>
              <p className="mt-1 text-sm font-medium leading-relaxed text-stone-900 dark:text-white">
                {q.prompt}
              </p>

              <div className="mt-3 space-y-2">
                {q.options.map((opt, optIdx) => {
                  const chosen = selected === optIdx;
                  const showCorrect = submitted && optIdx === q.correctIndex;
                  const showWrong = submitted && chosen && optIdx !== q.correctIndex;

                  return (
                    <label
                      key={optIdx}
                      className={`flex items-start gap-3 rounded-md border px-3 py-2.5 text-xs sm:text-sm transition-colors ${
                        submitted ? 'cursor-default' : 'cursor-pointer'
                      } ${
                        showCorrect
                          ? 'border-emerald-400 bg-emerald-50/80 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100'
                          : showWrong
                            ? 'border-rose-400 bg-rose-50/80 text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100'
                            : chosen
                              ? 'border-[#1E3A8A] bg-blue-50/50 text-stone-900 dark:border-blue-400 dark:bg-blue-950/30 dark:text-white'
                              : 'border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-300 hover:border-stone-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={optIdx}
                        checked={chosen}
                        disabled={submitted}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                        className="mt-0.5 accent-[#1E3A8A] dark:accent-blue-400"
                      />
                      <span className="flex-1">{opt}</span>
                      {showCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      )}
                      {showWrong && (
                        <XCircle className="h-4 w-4 text-rose-700 dark:text-rose-400 shrink-0" />
                      )}
                    </label>
                  );
                })}
              </div>

              {submitted && (
                <div className="mt-3 rounded-md border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900 px-3.5 py-2.5 text-xs leading-relaxed text-stone-700 dark:text-slate-300">
                  <span className="font-semibold text-stone-900 dark:text-white">
                    {isCorrect ? 'Correct: ' : 'Review: '}
                  </span>
                  {q.explanation}
                  <div className="mt-1 font-mono text-[11px] text-stone-500 dark:text-slate-400">
                    Reference: {q.sectionRef}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-stone-500 dark:text-slate-400 font-mono tabular-nums">
            {answeredCount}/{questions.length} answered
          </span>
          <button
            type="button"
            disabled={answeredCount < questions.length}
            onClick={handleSubmit}
            className="rounded-lg bg-[#1E3A8A] dark:bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-[#172E6E] disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
          >
            Check Answers
          </button>
        </div>
      )}
    </section>
  );
};
