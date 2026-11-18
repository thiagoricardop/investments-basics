import React, { useMemo, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { CHART_PLATES } from '../data/curriculum';

interface ChartPlatesGalleryProps {
  initialFilter?: string;
  onOpenLightbox: (src: string, alt: string) => void;
  onJumpToChapter: (chapterId: string) => void;
}

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Plates (25)' },
  { id: '01', label: 'Ch. 01' },
  { id: '02', label: 'Ch. 02' },
  { id: '03', label: 'Ch. 03' },
  { id: '04', label: 'Ch. 04' },
  { id: '05', label: 'Ch. 05' },
  { id: '06', label: 'Ch. 06 Supplemental' },
];

export const ChartPlatesGallery: React.FC<ChartPlatesGalleryProps> = ({
  initialFilter = 'all',
  onOpenLightbox,
  onJumpToChapter,
}) => {
  const [filter, setFilter] = useState<string>(initialFilter);

  const filteredPlates = useMemo(() => {
    if (filter === 'all') return CHART_PLATES;
    return CHART_PLATES.filter((p) => p.chapter === filter);
  }, [filter]);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-8 py-8 sm:py-10">
      <div className="mb-8 border-b border-stone-200 dark:border-slate-800 pb-6">
        <p className="text-xs font-medium tracking-wider uppercase text-stone-500 dark:text-slate-400">
          Visual Archive · 25 Repository Figure Plates
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Quantitative Figures &amp; Supplemental Plates
        </h1>
        <p className="mt-2.5 max-w-2xl text-sm sm:text-base leading-relaxed text-stone-600 dark:text-slate-300">
          Inspect every synthetic chart and analytical figure included in the repository—covering order-book depth, DCF sensitivity matrices, futures curves, backtest splits, and paper-bot safety gates.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-100/80 dark:bg-slate-900 p-1 w-fit">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter(opt.id)}
              className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === opt.id
                  ? 'bg-white dark:bg-slate-800 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlates.map((plate) => (
          <article
            key={plate.id}
            className="flex flex-col justify-between rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A22] overflow-hidden"
          >
            <div>
              <div className="group relative aspect-[16/10] w-full overflow-hidden border-b border-stone-200 dark:border-slate-800 bg-white">
                <img
                  src={plate.url}
                  alt={plate.title}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onClick={() => onOpenLightbox(plate.url, `${plate.title} — ${plate.caption}`)}
                  className="h-full w-full cursor-zoom-in object-contain p-2 transition-transform duration-200 group-hover:scale-[1.02]"
                />
                <button
                  type="button"
                  onClick={() => onOpenLightbox(plate.url, `${plate.title} — ${plate.caption}`)}
                  aria-label={`Expand ${plate.title}`}
                  className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded border border-stone-300 bg-white/95 px-2 py-1 text-xs font-medium text-stone-800 shadow-sm opacity-90 hover:opacity-100"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>Zoom</span>
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
                  <span>Chapter {plate.chapter}</span>
                  <span aria-hidden="true">·</span>
                  <span>{plate.embeddedInChapter ? 'Inline Figure' : 'Supplemental Plate'}</span>
                </div>
                <h2 className="mt-1.5 font-display text-base font-semibold text-stone-900 dark:text-white">
                  {plate.title}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-stone-600 dark:text-slate-300">
                  {plate.caption}
                </p>
              </div>
            </div>

            {Number(plate.chapter) <= 5 && (
              <div className="border-t border-stone-100 dark:border-slate-800/80 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => onJumpToChapter(`ch${plate.chapter}`)}
                  className="text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline"
                >
                  Open Chapter {plate.chapter} →
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
