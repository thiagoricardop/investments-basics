import React, { useEffect, useMemo, useState } from 'react';
import mermaid from 'mermaid';
import { Maximize2, X } from 'lucide-react';
import {
  getMermaidCacheKey,
  normalizeMermaidChart,
  prepareMermaidSvg,
  type PreparedMermaidSvg,
} from '../utils/mermaidUtils';

interface MermaidDiagramProps {
  chart: string;
  isDark: boolean;
}

// Persistent in-memory cache across chapter switches and re-renders (instant, zero flicker).
const SVG_CACHE = new Map<string, PreparedMermaidSvg>();

// Deduplicate concurrent requests for the exact same (theme, chart) key.
const IN_FLIGHT = new Map<string, Promise<PreparedMermaidSvg>>();

// Serialize Mermaid's global config + DOM measurement queue.
let renderQueue: Promise<void> = Promise.resolve();
let initializedTheme: 'dark' | 'light' | null = null;
let renderSeq = 0;

function waitForFontsReady(timeoutMs = 400): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document) || !document.fonts?.ready) {
    return Promise.resolve();
  }
  return Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

function ensureMermaidTheme(isDark: boolean): void {
  const desired = isDark ? 'dark' : 'light';
  if (initializedTheme === desired) return;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    suppressErrorRendering: true,
    flowchart: {
      htmlLabels: true,
      useMaxWidth: true,
      curve: 'basis',
    },
    theme: isDark ? 'dark' : 'base',
    themeVariables: isDark
      ? {
          primaryColor: '#1e293b',
          primaryTextColor: '#f1f5f9',
          primaryBorderColor: '#475569',
          lineColor: '#94a3b8',
          secondaryColor: '#0f172a',
          tertiaryColor: '#1e293b',
          fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
        }
      : {
          primaryColor: '#f5f1e8',
          primaryTextColor: '#1c1917',
          primaryBorderColor: '#cfc6b6',
          lineColor: '#57534e',
          secondaryColor: '#fbf9f5',
          tertiaryColor: '#ece6da',
          fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
        },
  });

  initializedTheme = desired;
}

function renderMermaidCached(chart: string, isDark: boolean): Promise<PreparedMermaidSvg> {
  const normalized = normalizeMermaidChart(chart);
  const cacheKey = getMermaidCacheKey(normalized, isDark);

  const cached = SVG_CACHE.get(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  const existing = IN_FLIGHT.get(cacheKey);
  if (existing) {
    return existing;
  }

  const taskPromise = new Promise<PreparedMermaidSvg>((resolve, reject) => {
    const run = async () => {
      // Re-check cache in case an earlier queued task completed the exact same diagram.
      const again = SVG_CACHE.get(cacheKey);
      if (again) {
        resolve(again);
        return;
      }

      await waitForFontsReady();
      ensureMermaidTheme(isDark);

      const uniqueId = `mmd_svg_${++renderSeq}`;
      const sandbox = document.createElement('div');
      sandbox.setAttribute('aria-hidden', 'true');
      sandbox.style.position = 'fixed';
      sandbox.style.left = '-100000px';
      sandbox.style.top = '0';
      sandbox.style.width = '1280px';
      sandbox.style.visibility = 'hidden';
      sandbox.style.pointerEvents = 'none';
      document.body.appendChild(sandbox);

      try {
        const { svg: rawSvg } = await mermaid.render(uniqueId, normalized, sandbox);
        const prepared = prepareMermaidSvg(rawSvg);
        SVG_CACHE.set(cacheKey, prepared);
        resolve(prepared);
      } catch (err) {
        reject(err);
      } finally {
        sandbox.remove();
        // Clean up any temporary element Mermaid may have attached directly by ID.
        document.getElementById(uniqueId)?.remove();
        document.getElementById(`d${uniqueId}`)?.remove();
      }
    };

    renderQueue = renderQueue.then(run, run);
  }).finally(() => {
    IN_FLIGHT.delete(cacheKey);
  });

  IN_FLIGHT.set(cacheKey, taskPromise);
  return taskPromise;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = React.memo(({ chart, isDark }) => {
  const normalizedChart = useMemo(() => normalizeMermaidChart(chart), [chart]);
  const cacheKey = useMemo(
    () => getMermaidCacheKey(normalizedChart, isDark),
    [normalizedChart, isDark]
  );

  const [renderedState, setRenderedState] = useState<{
    normalizedChart: string;
    cacheKey: string;
    data: PreparedMermaidSvg;
  } | null>(() => {
    const cached = SVG_CACHE.get(cacheKey);
    return cached ? { normalizedChart, cacheKey, data: cached } : null;
  });
  const [error, setError] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    const immediate = SVG_CACHE.get(cacheKey);
    if (immediate) {
      setRenderedState({ normalizedChart, cacheKey, data: immediate });
      setError(false);
      return;
    }

    let cancelled = false;
    renderMermaidCached(normalizedChart, isDark)
      .then((prepared) => {
        if (!cancelled) {
          setRenderedState({ normalizedChart, cacheKey, data: prepared });
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, normalizedChart, isDark]);

  // Show exact cache hit synchronously, or keep previous theme's SVG for the *same* chart during
  // theme switches to prevent layout jump — never display a different chapter's stale diagram.
  const cachedExact = SVG_CACHE.get(cacheKey) ?? null;
  const rendered =
    cachedExact ??
    (renderedState && renderedState.normalizedChart === normalizedChart
      ? renderedState.data
      : null);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

  if (error && !rendered) {
    return (
      <pre className="my-6 overflow-x-auto rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-100/70 dark:bg-slate-900 p-4 text-xs font-mono text-stone-700 dark:text-slate-300">
        {chart}
      </pre>
    );
  }

  return (
    <>
      <figure
        data-mermaid-ready={cachedExact || renderedState?.cacheKey === cacheKey ? 'true' : 'false'}
        className="my-7 overflow-hidden rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A23]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-stone-200/80 dark:border-slate-800 bg-[#FAF8F3]/80 dark:bg-[#11161F] px-3.5 py-2 text-[11px] text-stone-500 dark:text-slate-400">
          <span className="font-mono uppercase tracking-wider">
            Process Diagram{rendered?.isWide ? ' · Scroll Horizontally' : ''}
          </span>
          {rendered && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label="Inspect diagram full screen"
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Expand</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto p-4 sm:p-6">
          {rendered ? (
            <div
              className={rendered.isWide ? 'w-max' : 'flex justify-center'}
              dangerouslySetInnerHTML={{ __html: rendered.svg }}
            />
          ) : (
            <div className="flex min-h-[180px] items-center justify-center text-xs font-mono text-stone-400 dark:text-slate-500">
              Rendering diagram…
            </div>
          )}
        </div>
      </figure>

      {expanded && rendered && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-4 sm:p-8"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded diagram view"
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-stone-700 bg-white dark:bg-[#141A23] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 px-4 py-3">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400">
                Process Diagram · Full Inspection
              </span>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Close expanded diagram"
                className="rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-auto p-6">
              <div
                className={rendered.isWide ? 'w-max' : 'flex justify-center'}
                dangerouslySetInnerHTML={{ __html: rendered.svg }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
});

MermaidDiagram.displayName = 'MermaidDiagram';
