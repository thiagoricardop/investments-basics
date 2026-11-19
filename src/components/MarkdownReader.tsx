import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import katex from 'katex';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  ImageOff,
  Maximize2,
} from 'lucide-react';
import { ASSET_URL_MAP, CHAPTER_BY_FILENAME, ChapterMeta, slugifyHeading } from '../data/curriculum';
import { preprocessStudyMarkdown } from '../utils/markdown';
import {
  buildChapterLineMaps,
  splitAnswerKeySection,
  type SectionLineLookup,
} from '../utils/studyParser';
import { MermaidDiagram } from './MermaidDiagram';

export type ReadingTextSize = 'compact' | 'standard' | 'relaxed';

interface MarkdownReaderProps {
  chapter: ChapterMeta;
  isDark: boolean;
  textSize: ReadingTextSize;
  checkedItems: Record<string, boolean>;
  answerKeyOpen?: boolean;
  onToggleAnswerKey?: () => void;
  onToggleChecklist: (key: string) => void;
  onNavigateChapter: (chapterId: string, headingId?: string) => void;
  onOpenLightbox: (src: string, alt: string) => void;
  onOpenPlates: (chapterFilter?: string) => void;
}

interface ReaderRuntimeContextValue {
  chapterId: string;
  isDark: boolean;
  checkedItems: Record<string, boolean>;
  onToggleChecklist: (key: string) => void;
  onNavigateChapter: (chapterId: string, headingId?: string) => void;
  onOpenLightbox: (src: string, alt: string) => void;
  onOpenPlates: (chapterFilter?: string) => void;
}

const ReaderRuntimeContext = createContext<ReaderRuntimeContextValue | null>(null);
const SectionLookupContext = createContext<SectionLineLookup | null>(null);

function extractTextContent(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextContent).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractTextContent(node.props.children);
  }
  return '';
}

const CodeBlockWithCopy: React.FC<{ code: string; language?: string }> = React.memo(({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-stone-200 dark:border-slate-800 bg-[#F4F0E7] dark:bg-[#141A23]">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 px-3.5 py-2 text-xs text-stone-500 dark:text-slate-400">
        <span className="font-mono uppercase tracking-wider">{language || 'text'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed font-mono text-stone-800 dark:text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
});
CodeBlockWithCopy.displayName = 'CodeBlockWithCopy';

const ResilientFigure: React.FC<{
  src?: string;
  alt?: string;
  onOpenLightbox: (src: string, alt: string) => void;
}> = React.memo(({ src, alt, onOpenLightbox }) => {
  const [failed, setFailed] = useState(false);
  const cleanSrc = src ? src.replace(/^\.\//, '') : '';
  const resolvedUrl = ASSET_URL_MAP[cleanSrc] ?? src ?? '';

  if (!resolvedUrl || failed) {
    return (
      <div className="my-6 flex flex-col items-center justify-center gap-2 rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-100/70 dark:bg-slate-900/60 p-8 text-center">
        <ImageOff className="h-6 w-6 text-stone-400 dark:text-slate-500" />
        <p className="text-sm font-medium text-stone-700 dark:text-slate-300">{alt || 'Figure asset unavailable'}</p>
      </div>
    );
  }

  return (
    <figure className="my-7 rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A23] p-3 sm:p-4">
      <div className="group relative overflow-hidden rounded border border-stone-100 dark:border-slate-800/70 bg-white">
        <img
          src={resolvedUrl}
          alt={alt || 'Study guide figure'}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          onClick={() => onOpenLightbox(resolvedUrl, alt || 'Study guide figure')}
          className="w-full h-auto cursor-zoom-in object-contain transition-transform duration-200 group-hover:scale-[1.005]"
        />
        <button
          type="button"
          onClick={() => onOpenLightbox(resolvedUrl, alt || 'Study guide figure')}
          aria-label="Inspect chart full screen"
          className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1.5 rounded-md border border-stone-300/80 bg-white/95 px-2.5 py-1 text-xs font-medium text-stone-800 shadow-sm opacity-90 hover:opacity-100 transition-opacity"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Expand</span>
        </button>
      </div>
      {alt && (
        <figcaption className="mt-2.5 px-1 text-xs leading-relaxed text-stone-500 dark:text-slate-400">
          {alt}
        </figcaption>
      )}
    </figure>
  );
});
ResilientFigure.displayName = 'ResilientFigure';

// Module-level stable renderers prevent ReactMarkdown from unmounting/remounting
// Mermaid diagrams, figures, and code blocks when parent state updates (e.g. scroll or checkboxes).
const ParagraphRenderer: Components['p'] = ({ node, children }) => {
  const hasBlockMedia = node?.children?.some(
    (child) => child.type === 'element' && child.tagName === 'img'
  );
  if (hasBlockMedia) {
    return <div>{children}</div>;
  }
  return <p>{children}</p>;
};

const H2Renderer: Components['h2'] = ({ node, children }) => {
  const lookup = useContext(SectionLookupContext);
  const line = node?.position?.start?.line;
  const text = extractTextContent(children);
  const id = (line ? lookup?.headingIdByLine.get(line) : undefined) ?? slugifyHeading(text);
  return <h2 id={id}>{children}</h2>;
};

const H3Renderer: Components['h3'] = ({ node, children }) => {
  const lookup = useContext(SectionLookupContext);
  const line = node?.position?.start?.line;
  const text = extractTextContent(children);
  const id = (line ? lookup?.headingIdByLine.get(line) : undefined) ?? slugifyHeading(text);
  return <h3 id={id}>{children}</h3>;
};

const TableRenderer: Components['table'] = ({ children }) => (
  <div className="my-6 overflow-x-auto rounded-lg border border-stone-200 dark:border-slate-800 bg-white/70 dark:bg-[#141A23]">
    <table>{children}</table>
  </div>
);

const ImgRenderer: Components['img'] = ({ src, alt }) => {
  const ctx = useContext(ReaderRuntimeContext);
  return (
    <ResilientFigure
      src={src}
      alt={alt}
      onOpenLightbox={ctx?.onOpenLightbox ?? (() => {})}
    />
  );
};

const LinkRenderer: Components['a'] = ({ href, children }) => {
  const ctx = useContext(ReaderRuntimeContext);
  if (!href) return <span>{children}</span>;

  const cleanHref = href.split('#')[0].replace(/^\.\//, '');
  const targetChapter = CHAPTER_BY_FILENAME[cleanHref];
  if (targetChapter) {
    return (
      <a
        href={`#${targetChapter.id}`}
        onClick={(e) => {
          e.preventDefault();
          ctx?.onNavigateChapter(targetChapter.id);
        }}
      >
        {children}
      </a>
    );
  }

  if (href.includes('06-automated-trading-bot')) {
    return (
      <button
        type="button"
        onClick={() => ctx?.onOpenPlates('06')}
        className="inline-flex items-center gap-1 underline decoration-[#1E3A8A]/40 dark:decoration-blue-400/40 underline-offset-3 text-[#1E3A8A] dark:text-blue-300 hover:text-blue-700 font-inherit text-left"
      >
        <span>{children}</span>
        <span className="text-xs text-stone-500 dark:text-slate-400 no-underline">(View Ch. 06 Plates)</span>
      </button>
    );
  }

  if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#')) {
    return (
      <span className="font-mono text-[0.9em] text-stone-700 dark:text-slate-300 underline decoration-dotted decoration-stone-400">
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
};

const InputRenderer: Components['input'] = ({ node, type, checked }) => {
  const ctx = useContext(ReaderRuntimeContext);
  const lookup = useContext(SectionLookupContext);

  if (type === 'checkbox' && ctx) {
    const line = node?.position?.start?.line;
    const itemIndex = line !== undefined ? lookup?.checkboxIndexByLine.get(line) : undefined;
    const itemKey = `${ctx.chapterId}_chk_${itemIndex ?? line ?? 0}`;
    const isChecked = ctx.checkedItems[itemKey] ?? Boolean(checked);
    return (
      <input
        type="checkbox"
        checked={isChecked}
        onChange={() => ctx.onToggleChecklist(itemKey)}
        aria-label="Mastery checklist item"
        className="mr-2.5 h-4 w-4 translate-y-0.5 cursor-pointer rounded border-stone-300 dark:border-slate-600 accent-[#1E3A8A] dark:accent-blue-400"
      />
    );
  }
  return <input type={type} defaultChecked={checked} />;
};

const CodeRenderer: Components['code'] = ({ className, children, ...props }) => {
  const ctx = useContext(ReaderRuntimeContext);
  const rawText = extractTextContent(children).replace(/\n$/, '');

  if (!className && rawText.startsWith('__LATEX_INLINE__:')) {
    const expr = rawText.slice('__LATEX_INLINE__:'.length);
    const html = katex.renderToString(expr, {
      displayMode: false,
      throwOnError: false,
    });
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
    const html = katex.renderToString(rawText, {
      displayMode: true,
      throwOnError: false,
    });
    return (
      <div
        className="my-6 overflow-x-auto rounded-lg border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-[#141A23] px-5 py-4 text-center"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (lang === 'mermaid') {
    return <MermaidDiagram chart={rawText} isDark={Boolean(ctx?.isDark)} />;
  }

  const isBlock = Boolean(lang) || rawText.includes('\n');
  if (isBlock) {
    return <CodeBlockWithCopy code={rawText} language={lang} />;
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

const PreRenderer: Components['pre'] = ({ children }) => <>{children}</>;

const STABLE_MARKDOWN_COMPONENTS: Components = {
  p: ParagraphRenderer,
  h2: H2Renderer,
  h3: H3Renderer,
  table: TableRenderer,
  img: ImgRenderer,
  a: LinkRenderer,
  input: InputRenderer,
  code: CodeRenderer,
  pre: PreRenderer,
};

const REMARK_PLUGINS = [remarkGfm];

const MarkdownSection: React.FC<{ content: string; lookup: SectionLineLookup }> = React.memo(
  ({ content, lookup }) => (
    <SectionLookupContext.Provider value={lookup}>
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={STABLE_MARKDOWN_COMPONENTS}>
        {content}
      </ReactMarkdown>
    </SectionLookupContext.Provider>
  )
);
MarkdownSection.displayName = 'MarkdownSection';

export const MarkdownReader: React.FC<MarkdownReaderProps> = React.memo(({
  chapter,
  isDark,
  textSize,
  checkedItems,
  answerKeyOpen: controlledAnswerKeyOpen,
  onToggleAnswerKey,
  onToggleChecklist,
  onNavigateChapter,
  onOpenLightbox,
  onOpenPlates,
}) => {
  const [internalAnswerKeyOpen, setInternalAnswerKeyOpen] = useState(false);
  const answerKeyOpen = controlledAnswerKeyOpen ?? internalAnswerKeyOpen;
  const handleToggleAnswerKey = () => {
    if (onToggleAnswerKey) {
      onToggleAnswerKey();
    } else {
      setInternalAnswerKeyOpen((open) => !open);
    }
  };

  useEffect(() => {
    setInternalAnswerKeyOpen(false);
  }, [chapter.id]);

  const sections = useMemo(() => splitAnswerKeySection(chapter.rawMarkdown), [chapter.rawMarkdown]);

  const beforePreprocessed = useMemo(
    () => preprocessStudyMarkdown(sections.beforeAnswerKey),
    [sections.beforeAnswerKey]
  );
  const answerBodyPreprocessed = useMemo(
    () => (sections.answerKeyBody ? preprocessStudyMarkdown(sections.answerKeyBody) : ''),
    [sections.answerKeyBody]
  );
  const afterPreprocessed = useMemo(
    () => (sections.afterAnswerKey ? preprocessStudyMarkdown(sections.afterAnswerKey) : ''),
    [sections.afterAnswerKey]
  );

  const lineMaps = useMemo(
    () =>
      buildChapterLineMaps(
        beforePreprocessed,
        sections.answerKeyHeading,
        answerBodyPreprocessed,
        afterPreprocessed
      ),
    [beforePreprocessed, sections.answerKeyHeading, answerBodyPreprocessed, afterPreprocessed]
  );

  const runtimeContextValue = useMemo<ReaderRuntimeContextValue>(
    () => ({
      chapterId: chapter.id,
      isDark,
      checkedItems,
      onToggleChecklist,
      onNavigateChapter,
      onOpenLightbox,
      onOpenPlates,
    }),
    [chapter.id, isDark, checkedItems, onToggleChecklist, onNavigateChapter, onOpenLightbox, onOpenPlates]
  );

  const textSizeClass =
    textSize === 'compact'
      ? 'text-[15px]'
      : textSize === 'relaxed'
        ? 'text-[17px]'
        : 'text-base';

  return (
    <ReaderRuntimeContext.Provider value={runtimeContextValue}>
      <article className={`editorial-prose ${textSizeClass}`}>
        <MarkdownSection content={beforePreprocessed} lookup={lineMaps.before} />

        {sections.answerKeyHeading && (
          <div className="my-9 rounded-xl border border-stone-200 dark:border-slate-800 bg-[#F3EFE6]/70 dark:bg-[#141A23] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-mono text-stone-500 dark:text-slate-400">
                  Spoiler Protection Active · Attempt Exercises First
                </p>
                <h2
                  id={lineMaps.answerHeadingId}
                  className="!mt-1 !mb-0 !border-b-0 !pb-0 !text-xl"
                >
                  {sections.answerKeyHeading}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleToggleAnswerKey}
                aria-expanded={answerKeyOpen}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-stone-900 dark:text-white hover:border-[#1E3A8A] dark:hover:border-blue-400 transition-colors whitespace-nowrap"
              >
                {answerKeyOpen ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide Answer Key</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Reveal Answer Key</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            {answerKeyOpen && answerBodyPreprocessed && (
              <div className="mt-5 border-t border-stone-200 dark:border-slate-800 pt-5">
                <MarkdownSection content={answerBodyPreprocessed} lookup={lineMaps.answerBody} />
              </div>
            )}
          </div>
        )}

        {afterPreprocessed && (
          <MarkdownSection content={afterPreprocessed} lookup={lineMaps.after} />
        )}
      </article>
    </ReaderRuntimeContext.Provider>
  );
});

MarkdownReader.displayName = 'MarkdownReader';
