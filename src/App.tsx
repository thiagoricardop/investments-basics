import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Headphones,
  Layers,
  List,
  Maximize2,
  Minimize2,
  Moon,
  NotebookPen,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  Sun,
  Video,
  X,
} from 'lucide-react';
import {
  ALL_CHAPTER_EXERCISES,
  ALL_GLOSSARY_TERMS,
  CHAPTERS,
  CHART_PLATES,
  getSupplementalPlatesForChapter,
} from './data/curriculum';
import { getMediaForChapter, type MediaItem } from './data/media';
import { CHAPTER_QUIZZES } from './data/quizzes';
import { getNextPrevChapters } from './utils/markdown';
import { MarkdownReader, type ReadingTextSize } from './components/MarkdownReader';
import { FinancialLab, type PracticeMode } from './components/FinancialLab';
import { ChartPlatesGallery } from './components/ChartPlatesGallery';
import { MediaLibrary } from './components/MediaLibrary';
import { ChapterMediaStrip } from './components/ChapterMediaStrip';
import { ChapterQuiz } from './components/ChapterQuiz';
import { StudyNotesDrawer } from './components/StudyNotesDrawer';
import { SearchModal } from './components/SearchModal';
import { BrandIcon } from './components/BrandIcon';

type ActiveView = 'overview' | 'reader' | 'media' | 'practice' | 'plates';

const FEATURED_HERO_PLATES = [
  { id: 'ch01-expectancy-heatmap', shortLabel: '01 Expectancy' },
  { id: 'ch02-contango-backwardation-curves', shortLabel: '02 Futures' },
  { id: 'ch03-compounding-fees', shortLabel: '03 Fee Drag' },
  { id: 'ch04-breakout-setup', shortLabel: '04 Breakout' },
  { id: 'ch05-chronological-splits', shortLabel: '05 Splits' },
];

function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function readStorageJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function App() {
  const [view, setView] = useState<ActiveView>('overview');
  const [practiceInitialMode, setPracticeInitialMode] = useState<PracticeMode>('exercises');
  const [practiceExerciseChapter, setPracticeExerciseChapter] = useState<string>('all');
  const [selectedMediaChapter, setSelectedMediaChapter] = useState<string>('ch01');
  const [activeChapterId, setActiveChapterId] = useState<string>(() => {
    try {
      return localStorage.getItem('ib_last_chapter') || 'ch01';
    } catch {
      return 'ch01';
    }
  });
  const [platesFilter, setPlatesFilter] = useState<string>('all');
  const [heroPlateIdx, setHeroPlateIdx] = useState<number>(0);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ib_theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [textSize, setTextSize] = useState<ReadingTextSize>(() => {
    try {
      const saved = localStorage.getItem('ib_text_size');
      if (saved === 'compact' || saved === 'standard' || saved === 'relaxed') return saved;
      return 'standard';
    } catch {
      return 'standard';
    }
  });
  const [focusMode, setFocusMode] = useState(false);

  // Persisted student study state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() =>
    readStorageJson('ib_mastery_checks', {})
  );
  const [completedChapters, setCompletedChapters] = useState<Record<string, boolean>>(() =>
    readStorageJson('ib_completed_chapters', {})
  );
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>(() =>
    readStorageJson('ib_completed_exercises', {})
  );
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>(() =>
    readStorageJson('ib_exercise_notes', {})
  );
  const [quizScores, setQuizScores] = useState<Record<string, number>>(() =>
    readStorageJson('ib_quiz_scores', {})
  );
  const [studyNotes, setStudyNotes] = useState<Record<string, string>>(() =>
    readStorageJson('ib_study_notes', {})
  );

  // Overlays & reader scroll tracking
  const [searchOpen, setSearchOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [answerKeyOpen, setAnswerKeyOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  // Persistent podcast audio state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activePodcast, setActivePodcast] = useState<MediaItem | null>(null);
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);
  const [podcastError, setPodcastError] = useState(false);
  const [podcastTime, setPodcastTime] = useState(0);
  const [podcastDuration, setPodcastDuration] = useState(0);
  const [podcastRate, setPodcastRate] = useState(1);

  const activeChapter = useMemo(
    () => CHAPTERS.find((c) => c.id === activeChapterId) ?? CHAPTERS[0],
    [activeChapterId]
  );

  const visibleHeadings = useMemo(() => {
    if (answerKeyOpen) return activeChapter.headings;
    const result: typeof activeChapter.headings = [];
    let insideAnswerKey = false;
    for (const h of activeChapter.headings) {
      const clean = h.text.replace(/^\d+\.\s*/, '').trim();
      if (h.level === 2) {
        insideAnswerKey = /^answer key\b/i.test(clean);
        result.push(h);
      } else if (!insideAnswerKey) {
        result.push(h);
      }
    }
    return result;
  }, [activeChapter.headings, answerKeyOpen]);

  const supplementalPlates = useMemo(
    () => getSupplementalPlatesForChapter(activeChapter.number),
    [activeChapter.number]
  );

  const { prev: prevChapter, next: nextChapter } = useMemo(
    () => getNextPrevChapters(CHAPTERS, activeChapter.id),
    [activeChapter.id]
  );

  const heroPlates = useMemo(() => {
    return FEATURED_HERO_PLATES.map((item) => ({
      ...item,
      plate: CHART_PLATES.find((p) => p.id === item.id) ?? CHART_PLATES[0],
    }));
  }, []);

  const currentHeroEntry = heroPlates[heroPlateIdx] ?? heroPlates[0];

  // Aggregate student progress metrics
  const totalChecklistCount = useMemo(
    () => CHAPTERS.reduce((acc, ch) => acc + ch.checklistCount, 0),
    []
  );
  const totalCheckedCount = useMemo(
    () => Object.values(checkedItems).filter(Boolean).length,
    [checkedItems]
  );
  const totalCompletedChapters = useMemo(
    () => CHAPTERS.filter((ch) => completedChapters[ch.id]).length,
    [completedChapters]
  );
  const totalCompletedExercises = useMemo(
    () => ALL_CHAPTER_EXERCISES.filter((ex) => completedExercises[ex.id]).length,
    [completedExercises]
  );
  const totalPassedCheckpoints = useMemo(
    () =>
      CHAPTERS.filter((ch) => {
        const totalQ = (CHAPTER_QUIZZES[ch.id] ?? []).length;
        return totalQ > 0 && (quizScores[ch.id] ?? 0) === totalQ;
      }).length,
    [quizScores]
  );

  const overallCurriculumPct = useMemo(() => {
    const chapterWeight = totalCompletedChapters / CHAPTERS.length;
    const exerciseWeight = totalCompletedExercises / Math.max(1, ALL_CHAPTER_EXERCISES.length);
    const checklistWeight = totalCheckedCount / Math.max(1, totalChecklistCount);
    return Math.round(((chapterWeight + exerciseWeight + checklistWeight) / 3) * 100);
  }, [totalCompletedChapters, totalCompletedExercises, totalCheckedCount, totalChecklistCount]);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('ib_theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage error
    }
  }, [isDark]);

  // Persist last visited chapter & reading text size
  useEffect(() => {
    try {
      localStorage.setItem('ib_last_chapter', activeChapterId);
    } catch {
      // Ignore storage error
    }
  }, [activeChapterId]);

  useEffect(() => {
    try {
      localStorage.setItem('ib_text_size', textSize);
    } catch {
      // Ignore storage error
    }
  }, [textSize]);

  // Cmd/Ctrl + K shortcut for search & Escape for lightbox
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape' && lightbox) {
        setLightbox(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightbox]);

  // Track scroll depth and active heading scrollspy in reader mode
  useEffect(() => {
    if (view !== 'reader') {
      setScrollProgress(0);
      setActiveHeadingId('');
      return;
    }

    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress =
        docHeight <= 0
          ? 0
          : Math.round(Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)));
      setScrollProgress((prev) => (prev === nextProgress ? prev : nextProgress));

      let currentId = visibleHeadings[0]?.id ?? '';
      for (const h of visibleHeadings) {
        const el = document.getElementById(h.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 130) {
            currentId = h.id;
          } else {
            break;
          }
        }
      }
      setActiveHeadingId((prev) => (prev === currentId ? prev : currentId));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [view, visibleHeadings]);

  const handleToggleChecklist = useCallback((key: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('ib_mastery_checks', JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  }, []);

  const handleToggleChapterComplete = (chapterId: string) => {
    setCompletedChapters((prev) => {
      const next = { ...prev, [chapterId]: !prev[chapterId] };
      try {
        localStorage.setItem('ib_completed_chapters', JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const handleToggleExerciseComplete = (exerciseId: string) => {
    setCompletedExercises((prev) => {
      const next = { ...prev, [exerciseId]: !prev[exerciseId] };
      try {
        localStorage.setItem('ib_completed_exercises', JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const handleChangeExerciseNote = (exerciseId: string, text: string) => {
    setExerciseNotes((prev) => {
      const next = { ...prev, [exerciseId]: text };
      try {
        localStorage.setItem('ib_exercise_notes', JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const handleSaveQuizScore = (chapterId: string, score: number, _total?: number) => {
    setQuizScores((prev) => {
      const best = Math.max(prev[chapterId] ?? 0, score);
      const next = { ...prev, [chapterId]: best };
      try {
        localStorage.setItem('ib_quiz_scores', JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const handleChangeStudyNote = (chapterId: string, text: string) => {
    setStudyNotes((prev) => {
      const next = { ...prev, [chapterId]: text };
      try {
        localStorage.setItem('ib_study_notes', JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const getChapterCheckedCount = (chapterId: string): number => {
    return Object.entries(checkedItems).filter(
      ([k, val]) => val && k.startsWith(`${chapterId}_chk_`)
    ).length;
  };

  const getChapterExerciseProgress = (chapterId: string) => {
    const items = ALL_CHAPTER_EXERCISES.filter((ex) => ex.chapterId === chapterId);
    const done = items.filter((ex) => completedExercises[ex.id]).length;
    return { done, total: items.length, kind: items[0]?.kind ?? 'Exercise' };
  };

  const handleToggleAnswerKey = useCallback(() => {
    setAnswerKeyOpen((open) => !open);
  }, []);

  const handleOpenLightbox = useCallback((src: string, alt: string) => {
    setLightbox({ src, alt });
  }, []);

  const navigateToChapter = useCallback((chapterId: string, headingId?: string) => {
    setActiveChapterId((prev) => {
      if (chapterId !== prev) {
        setAnswerKeyOpen(false);
      }
      return chapterId;
    });
    setView('reader');
    setMobileTocOpen(false);
    if (headingId) {
      setTimeout(() => {
        const el = document.getElementById(headingId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 90);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const openPlatesGallery = useCallback((chapterFilter?: string) => {
    setPlatesFilter(chapterFilter || 'all');
    setView('plates');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openPractice = (mode: PracticeMode = 'exercises', chapterFilter: string = 'all') => {
    setPracticeInitialMode(mode);
    setPracticeExerciseChapter(chapterFilter);
    setView('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openMediaLibrary = (chapterId?: string) => {
    if (chapterId) {
      setSelectedMediaChapter(chapterId);
    }
    setView('media');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayPodcast = (item: MediaItem) => {
    const audio = audioRef.current;
    if (!audio) return;

    setPodcastError(false);

    if (activePodcast?.id === item.id) {
      if (isPodcastPlaying) {
        audio.pause();
      } else {
        void audio.play().catch(() => setPodcastError(true));
      }
      return;
    }

    setActivePodcast(item);
    setPodcastTime(0);
    setPodcastDuration(0);
    audio.src = item.streamUrl;
    audio.playbackRate = podcastRate;
    void audio.play().catch(() => setPodcastError(true));
  };

  const handleSeekPodcast = (nextTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = nextTime;
    setPodcastTime(nextTime);
  };

  const handleSkipPodcast = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.min(podcastDuration || Infinity, Math.max(0, audio.currentTime + delta));
    audio.currentTime = target;
    setPodcastTime(target);
  };

  const handleCyclePodcastRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(podcastRate) + 1) % rates.length];
    setPodcastRate(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const handleClosePodcast = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    setActivePodcast(null);
    setIsPodcastPlaying(false);
    setPodcastError(false);
    setPodcastTime(0);
    setPodcastDuration(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3] text-[#181614] dark:bg-[#0C1016] dark:text-[#E7E5E4]">
      {/* Reading progress bar */}
      {view === 'reader' && (
        <div
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent pointer-events-none"
        >
          <div
            className="h-full bg-[#1E3A8A] dark:bg-blue-400 transition-[width] duration-100"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-stone-200 dark:border-slate-800 bg-[#FAF8F3]/95 dark:bg-[#0C1016]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-8">
          {/* Zone 1: Brand Emblem + Single-line Wordmark */}
          <button
            type="button"
            onClick={() => {
              setView('overview');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-stone-900 dark:text-white whitespace-nowrap shrink-0 group"
          >
            <BrandIcon className="h-7 w-7 shrink-0 shadow-xs transition-transform duration-150 group-hover:scale-[1.03]" />
            <span>Investments Basics</span>
          </button>

          {/* Zone 2: 5 Concise Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <button
              type="button"
              onClick={() => setView('overview')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                view === 'overview'
                  ? 'border-[#1E3A8A] text-stone-900 dark:border-blue-400 dark:text-white'
                  : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setView('reader')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                view === 'reader'
                  ? 'border-[#1E3A8A] text-stone-900 dark:border-blue-400 dark:text-white'
                  : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Curriculum
            </button>
            <button
              type="button"
              onClick={() => openMediaLibrary()}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                view === 'media'
                  ? 'border-[#1E3A8A] text-stone-900 dark:border-blue-400 dark:text-white'
                  : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Media
            </button>
            <button
              type="button"
              onClick={() => openPractice('exercises', 'all')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                view === 'practice'
                  ? 'border-[#1E3A8A] text-stone-900 dark:border-blue-400 dark:text-white'
                  : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Practice
            </button>
            <button
              type="button"
              onClick={() => openPlatesGallery('all')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                view === 'plates'
                  ? 'border-[#1E3A8A] text-stone-900 dark:border-blue-400 dark:text-white'
                  : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Plates
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-stone-800 dark:text-slate-200 hover:border-stone-400 dark:hover:border-slate-500 transition-colors whitespace-nowrap shrink-0"
            >
              <Search className="h-3.5 w-3.5 text-stone-500 dark:text-slate-400" />
              <span>Search Guide</span>
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Utility Strip (mobile switcher, context metrics, theme toggle) */}
      <div className="border-b border-stone-200/90 dark:border-slate-800/90 bg-[#F3EFE6]/75 dark:bg-[#11161F]">
        <div className="mx-auto flex max-w-7xl flex-col md:flex-row md:items-center justify-between gap-2 px-4 sm:px-8 py-2 text-xs text-stone-600 dark:text-slate-400">
          {/* Mobile view switcher */}
          <div className="flex md:hidden items-center gap-1 overflow-x-auto pb-1 border-b border-stone-200/70 dark:border-slate-800/70">
            {(['overview', 'reader', 'media', 'practice', 'plates'] as ActiveView[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  if (v === 'practice') openPractice('exercises', 'all');
                  else if (v === 'media') openMediaLibrary();
                  else setView(v);
                }}
                className={`whitespace-nowrap shrink-0 rounded px-2.5 py-1 text-xs font-medium ${
                  view === v
                    ? 'bg-[#1E3A8A] text-white dark:bg-blue-500'
                    : 'text-stone-600 dark:text-slate-300'
                }`}
              >
                {v === 'overview'
                  ? 'Overview'
                  : v === 'reader'
                    ? 'Chapters'
                    : v === 'media'
                      ? 'Media'
                      : v === 'practice'
                        ? 'Practice'
                        : 'Plates'}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2 min-w-0">
              {view === 'reader' ? (
                <>
                  <span className="font-mono font-medium text-stone-800 dark:text-slate-200 whitespace-nowrap">
                    Ch. {activeChapter.number} / 05
                  </span>
                  <span className="hidden sm:inline" aria-hidden="true">·</span>
                  <span className="hidden sm:inline whitespace-nowrap">{activeChapter.studyTime} study</span>
                  <span className="hidden md:inline" aria-hidden="true">·</span>
                  <span className="hidden md:inline whitespace-nowrap">{activeChapter.readingMinutes} min read</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums whitespace-nowrap">{Math.round(scrollProgress)}% read</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline font-medium text-stone-700 dark:text-slate-300">
                    Trading &amp; Investing Study Guide
                  </span>
                  <span className="hidden sm:inline" aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">5 Chapters</span>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">{ALL_CHAPTER_EXERCISES.length} Exercises</span>
                  <span className="hidden sm:inline" aria-hidden="true">·</span>
                  <span className="hidden sm:inline whitespace-nowrap">10 Media</span>
                  <span className="hidden md:inline" aria-hidden="true">·</span>
                  <span className="hidden md:inline whitespace-nowrap">{ALL_GLOSSARY_TERMS.length} Glossary Terms</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {view === 'reader' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMobileTocOpen(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 rounded border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-stone-700 dark:text-slate-200"
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>Outline</span>
                  </button>

                  <div
                    role="group"
                    aria-label="Reading text size"
                    className="hidden sm:flex items-center rounded border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5"
                  >
                    {(['compact', 'standard', 'relaxed'] as ReadingTextSize[]).map((sz, i) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setTextSize(sz)}
                        title={`Text size: ${sz}`}
                        className={`rounded px-1.5 py-0.5 text-[11px] font-mono transition-colors ${
                          textSize === sz
                            ? 'bg-stone-900 text-white dark:bg-slate-700'
                            : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                        }`}
                      >
                        {i === 0 ? 'A-' : i === 1 ? 'A' : 'A+'}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setFocusMode((f) => !f)}
                    className={`hidden lg:inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                      focusMode
                        ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white dark:border-blue-500 dark:bg-blue-500'
                        : 'border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-200'
                    }`}
                  >
                    {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    <span>{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotesOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-stone-700 hover:border-stone-400 dark:text-slate-200 transition-colors whitespace-nowrap"
                  >
                    <NotebookPen className="h-3.5 w-3.5" />
                    <span>Notes</span>
                    {(studyNotes[activeChapter.id]?.trim().length ?? 0) > 0 && (
                      <span className="font-mono text-[10px] text-[#1E3A8A] dark:text-blue-300">
                        (Saved)
                      </span>
                    )}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsDark((d) => !d)}
                className="inline-flex items-center gap-1.5 rounded border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-stone-700 hover:text-stone-900 dark:text-slate-200 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                aria-label={isDark ? 'Switch to Light Paper theme' : 'Switch to Dark Slate theme'}
              >
                {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-stone-600" />}
                <span>{isDark ? 'Light Paper' : 'Dark Slate'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {/* OVERVIEW VIEW */}
        {view === 'overview' && (
          <div className="mx-auto max-w-6xl px-4 sm:px-8 py-10 sm:py-14">
            {/* Editorial Asymmetric Hero */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch pb-10">
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-mono font-medium uppercase tracking-[0.14em] text-stone-500 dark:text-slate-400">
                    Investments Basics · Self-Paced Study Architecture
                  </p>
                  <h1 className="mt-3 font-display text-4xl sm:text-[3.1rem] font-semibold tracking-tight leading-[1.07] text-stone-900 dark:text-white max-w-2xl [text-wrap:balance]">
                    Market mechanics, portfolio construction, and testable trading rules.
                  </h1>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600 dark:text-slate-300">
                    Study five rigorous chapters alongside 41 worked exercises &amp; backtesting labs, interactive equations, companion audio &amp; video lessons, and checkpoint quizzes.
                  </p>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigateToChapter(activeChapterId)}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] dark:bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-[#172E6E] dark:hover:bg-blue-600 transition-colors whitespace-nowrap shrink-0"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>
                        {activeChapterId === 'ch01' && !completedChapters.ch01
                          ? 'Start Chapter 01'
                          : `Resume Chapter ${activeChapter.number}`}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openPractice('exercises', 'all')}
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-stone-800 dark:text-slate-200 hover:border-[#1E3A8A] dark:hover:border-blue-400 transition-colors whitespace-nowrap shrink-0"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      <span>Practice Exercises ({ALL_CHAPTER_EXERCISES.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openMediaLibrary()}
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-200 dark:border-slate-800 bg-[#F3EFE6]/70 dark:bg-[#141A23] px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-slate-300 hover:border-stone-400 dark:hover:border-slate-600 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Headphones className="h-4 w-4" />
                      <span>Videos &amp; Podcasts</span>
                    </button>
                  </div>
                </div>

                <div className="mt-8 border-t border-stone-200 dark:border-slate-800 pt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-slate-400">
                  <span>40–55 hours structured study</span>
                  <span className="hidden sm:inline" aria-hidden="true">·</span>
                  <span>Spoiler-protected answer keys</span>
                  <span className="hidden sm:inline" aria-hidden="true">·</span>
                  <span>Zero personalized financial advice</span>
                </div>
              </div>

              {/* Right Column: Interactive Plate Showcase */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A23] p-4 sm:p-5">
                {currentHeroEntry && (
                  <>
                    <div className="flex items-center justify-between gap-2 pb-3">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400">
                        Plate Specimen · Ch. {currentHeroEntry.plate.chapter}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setLightbox({
                              src: currentHeroEntry.plate.url,
                              alt: `${currentHeroEntry.plate.title} — ${currentHeroEntry.plate.caption}`,
                            })
                          }
                          aria-label={`Inspect ${currentHeroEntry.plate.title}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white whitespace-nowrap"
                        >
                          <Maximize2 className="h-3 w-3" />
                          <span>Inspect</span>
                        </button>
                        <span className="text-stone-300 dark:text-slate-700" aria-hidden="true">|</span>
                        <button
                          type="button"
                          onClick={() => openPlatesGallery('all')}
                          className="text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline whitespace-nowrap"
                        >
                          All 25 Plates →
                        </button>
                      </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-lg border border-stone-200/80 dark:border-slate-800 bg-white flex-1 flex items-center justify-center min-h-[220px]">
                      <img
                        src={currentHeroEntry.plate.url}
                        alt={currentHeroEntry.plate.title}
                        referrerPolicy="no-referrer"
                        onClick={() =>
                          setLightbox({
                            src: currentHeroEntry.plate.url,
                            alt: `${currentHeroEntry.plate.title} — ${currentHeroEntry.plate.caption}`,
                          })
                        }
                        className="w-full h-full max-h-60 object-contain p-2.5 cursor-zoom-in transition-transform duration-200 group-hover:scale-[1.01]"
                      />
                    </div>

                    <div className="mt-3.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h2 className="font-display text-sm font-semibold text-stone-900 dark:text-white">
                          {currentHeroEntry.plate.title}
                        </h2>
                        <button
                          type="button"
                          onClick={() => navigateToChapter(`ch${currentHeroEntry.plate.chapter}`)}
                          className="text-[11px] font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline whitespace-nowrap shrink-0"
                        >
                          Ch. {currentHeroEntry.plate.chapter} →
                        </button>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-stone-500 dark:text-slate-400 line-clamp-2">
                        {currentHeroEntry.plate.caption}
                      </p>

                      {/* 5-Chapter Specimen Selector */}
                      <div className="mt-3.5 grid grid-cols-5 gap-1 rounded-lg border border-stone-200 dark:border-slate-800 bg-[#FAF8F3] dark:bg-slate-900 p-1">
                        {heroPlates.map((entry, idx) => (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => setHeroPlateIdx(idx)}
                            className={`rounded py-1 px-1 text-[10px] font-mono tabular-nums truncate transition-colors ${
                              heroPlateIdx === idx
                                ? 'bg-[#1E3A8A] text-white dark:bg-blue-500'
                                : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                            title={entry.plate.title}
                          >
                            Ch.{entry.plate.chapter}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Full-Width Student Study Telemetry Strip */}
            <section
              aria-label="Curriculum study progress"
              className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A23] overflow-hidden mb-12"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-stone-200 dark:border-slate-800 bg-[#F3EFE6]/60 dark:bg-[#11161F]">
                <span className="text-xs font-medium text-stone-700 dark:text-slate-300">
                  Student Progress &amp; Study Ledger
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-28 sm:w-40 h-1.5 rounded-full bg-stone-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#1E3A8A] dark:bg-blue-400 transition-[width] duration-300"
                      style={{ width: `${overallCurriculumPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-semibold tabular-nums text-stone-900 dark:text-white">
                    {overallCurriculumPct}% overall
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-200 dark:bg-slate-800">
                <div className="bg-white dark:bg-[#141A23] p-4 sm:p-5">
                  <div className="text-xs text-stone-500 dark:text-slate-400">Chapters Completed</div>
                  <div className="mt-1 text-2xl font-mono font-semibold tabular-nums text-stone-900 dark:text-white">
                    {totalCompletedChapters} <span className="text-sm font-normal text-stone-400">/ 5</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-[#141A23] p-4 sm:p-5">
                  <div className="text-xs text-stone-500 dark:text-slate-400">Exercises &amp; Labs Done</div>
                  <div className="mt-1 text-2xl font-mono font-semibold tabular-nums text-[#1E3A8A] dark:text-blue-300">
                    {totalCompletedExercises} <span className="text-sm font-normal text-stone-400">/ {ALL_CHAPTER_EXERCISES.length}</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-[#141A23] p-4 sm:p-5">
                  <div className="text-xs text-stone-500 dark:text-slate-400">Mastery Checklist Items</div>
                  <div className="mt-1 text-2xl font-mono font-semibold tabular-nums text-stone-900 dark:text-white">
                    {totalCheckedCount} <span className="text-sm font-normal text-stone-400">/ {totalChecklistCount}</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-[#141A23] p-4 sm:p-5">
                  <div className="text-xs text-stone-500 dark:text-slate-400">Checkpoints Passed</div>
                  <div className="mt-1 text-2xl font-mono font-semibold tabular-nums text-stone-900 dark:text-white">
                    {totalPassedCheckpoints} <span className="text-sm font-normal text-stone-400">/ 5</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 5-Chapter Syllabus Directory */}
            <section className="pb-12 border-b border-stone-200 dark:border-slate-800">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">
                    Curriculum Roadmap
                  </h2>
                  <p className="mt-1 text-sm text-stone-600 dark:text-slate-400 max-w-2xl">
                    Follow the five-stage progression: read the chapter, review its companion video or podcast, work through chapter exercises, and verify mastery via the checkpoint quiz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openPractice('exercises', 'all')}
                  className="text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline whitespace-nowrap"
                >
                  Open All {ALL_CHAPTER_EXERCISES.length} Exercises →
                </button>
              </div>

              <div className="divide-y divide-stone-200 dark:divide-slate-800 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A23] overflow-hidden">
                {CHAPTERS.map((ch) => {
                  const checkedCount = getChapterCheckedCount(ch.id);
                  const exProg = getChapterExerciseProgress(ch.id);
                  const isDone = Boolean(completedChapters[ch.id]);
                  const quizBest = quizScores[ch.id];
                  const quizTotal = (CHAPTER_QUIZZES[ch.id] ?? []).length;
                  const { video, podcast } = getMediaForChapter(ch.id);
                  const isThisPodcastPlaying =
                    podcast && activePodcast?.id === podcast.id && isPodcastPlaying;

                  return (
                    <div
                      key={ch.id}
                      className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 sm:px-6 hover:bg-[#FAF8F3]/70 dark:hover:bg-slate-800/25 transition-colors"
                    >
                      <div className="flex items-start gap-4 sm:gap-5 max-w-2xl">
                        <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-200 dark:border-slate-700 bg-[#FAF8F3] dark:bg-slate-900 font-mono text-sm font-semibold tabular-nums text-stone-700 dark:text-slate-200 mt-0.5">
                          {ch.number}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
                            <span className="font-mono font-semibold text-stone-800 dark:text-slate-200 sm:hidden">
                              Ch. {ch.number}
                            </span>
                            <span className="sm:hidden" aria-hidden="true">·</span>
                            <span>{ch.level}</span>
                            <span aria-hidden="true">·</span>
                            <span>{ch.studyTime}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              Exercises: {exProg.done}/{exProg.total}
                            </span>
                            {ch.checklistCount > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">
                                  Mastery: {checkedCount}/{ch.checklistCount}
                                </span>
                              </>
                            )}
                            {typeof quizBest === 'number' && quizTotal > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums text-[#1E3A8A] dark:text-blue-300">
                                  Quiz: {quizBest}/{quizTotal}
                                </span>
                              </>
                            )}
                            {isDone && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Completed
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="mt-1 font-display text-xl font-semibold text-stone-900 dark:text-white">
                            {ch.title}
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-slate-300">
                            {ch.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 lg:justify-end">
                        {podcast && (
                          <button
                            type="button"
                            onClick={() => handlePlayPodcast(podcast)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                              isThisPodcastPlaying
                                ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white dark:border-blue-500 dark:bg-blue-500'
                                : 'border-stone-200 dark:border-slate-700 bg-[#FAF8F3] dark:bg-slate-900 text-stone-700 dark:text-slate-200 hover:border-stone-400'
                            }`}
                          >
                            {isThisPodcastPlaying ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Headphones className="h-3.5 w-3.5" />
                            )}
                            <span>{isThisPodcastPlaying ? 'Pause' : 'Podcast'}</span>
                          </button>
                        )}
                        {video && (
                          <button
                            type="button"
                            onClick={() => openMediaLibrary(ch.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-slate-700 bg-[#FAF8F3] dark:bg-slate-900 px-3 py-2 text-xs font-medium text-stone-700 dark:text-slate-200 hover:border-stone-400 transition-colors whitespace-nowrap"
                          >
                            <Video className="h-3.5 w-3.5" />
                            <span>Video</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openPractice('exercises', ch.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-slate-700 bg-[#FAF8F3] dark:bg-slate-900 px-3 py-2 text-xs font-medium text-stone-700 dark:text-slate-200 hover:border-[#1E3A8A] hover:text-[#1E3A8A] dark:hover:border-blue-400 dark:hover:text-blue-300 transition-colors whitespace-nowrap"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5" />
                          <span>Exercises ({exProg.total})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateToChapter(ch.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-medium text-stone-900 dark:text-white hover:border-[#1E3A8A] hover:text-[#1E3A8A] dark:hover:border-blue-400 dark:hover:text-blue-300 transition-colors whitespace-nowrap"
                        >
                          <span>{isDone ? 'Review' : 'Read Chapter'}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Three Interactive Study Stations */}
            <section className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A23] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-stone-500 dark:text-slate-400">
                    <ClipboardCheck className="h-4 w-4 text-[#1E3A8A] dark:text-blue-300" />
                    <span>01 · Problem Solving</span>
                  </div>
                  <h3 className="mt-2.5 font-display text-lg font-semibold text-stone-900 dark:text-white">
                    Chapter Exercises &amp; Labs
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-slate-300">
                    Solve all {ALL_CHAPTER_EXERCISES.length} chapter exercises and backtesting labs with local workpads and spoiler-protected answer keys.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => openPractice('exercises', 'all')}
                    className="text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline whitespace-nowrap"
                  >
                    Open Chapter Exercises →
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A23] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-stone-500 dark:text-slate-400">
                    <Calculator className="h-4 w-4 text-[#1E3A8A] dark:text-blue-300" />
                    <span>02 · Quantitative Simulators</span>
                  </div>
                  <h3 className="mt-2.5 font-display text-lg font-semibold text-stone-900 dark:text-white">
                    Equations Laboratory
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-slate-300">
                    Experiment interactively with expectancy break-even rates, fixed-risk share sizing, drawdown asymmetry, and long-term fee drag.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => openPractice('equations')}
                    className="text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline whitespace-nowrap"
                  >
                    Open Equations Lab →
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A23] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-stone-500 dark:text-slate-400">
                    <Layers className="h-4 w-4 text-[#1E3A8A] dark:text-blue-300" />
                    <span>03 · Drills &amp; Visual Plates</span>
                  </div>
                  <h3 className="mt-2.5 font-display text-lg font-semibold text-stone-900 dark:text-white">
                    Glossary &amp; 25 Chart Plates
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-slate-300">
                    Drill {ALL_GLOSSARY_TERMS.length} market microstructure and backtesting terms or browse all 25 quantitative plates including Ch. 06 automation gates.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-slate-800 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => openPractice('glossary')}
                    className="text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline whitespace-nowrap"
                  >
                    Flashcard Drill →
                  </button>
                  <button
                    type="button"
                    onClick={() => openPlatesGallery('06')}
                    className="text-xs font-medium text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:underline whitespace-nowrap"
                  >
                    Ch. 06 Plates →
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* READER VIEW */}
        {view === 'reader' && (
          <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8">
            <div className={`flex flex-col lg:flex-row gap-8 xl:gap-12 items-start ${focusMode ? 'justify-center' : ''}`}>
              {/* Left Sidebar: Chapter Navigation */}
              {!focusMode && (
                <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
                  <div className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-3">
                    Curriculum Index
                  </div>
                  <nav className="space-y-1">
                    {CHAPTERS.map((ch) => {
                      const isActive = ch.id === activeChapter.id;
                      const done = getChapterCheckedCount(ch.id);
                      const isChCompleted = Boolean(completedChapters[ch.id]);
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => navigateToChapter(ch.id)}
                          className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors border ${
                            isActive
                              ? 'border-stone-300 dark:border-slate-700 bg-white dark:bg-[#141A23] text-stone-900 dark:text-white shadow-xs'
                              : 'border-transparent text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-slate-400">
                            <span>CH {ch.number}</span>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              {isChCompleted && (
                                <CheckCircle2 className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
                              )}
                              {ch.checklistCount > 0 && `${done}/${ch.checklistCount}`}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs font-medium leading-snug">
                            {ch.shortTitle}
                          </div>
                        </button>
                      );
                    })}
                  </nav>

                  <div className="mt-6 border-t border-stone-200 dark:border-slate-800 pt-5 space-y-2">
                    <button
                      type="button"
                      onClick={() => openPractice('exercises', activeChapter.id)}
                      className="w-full text-left rounded-lg border border-stone-200 dark:border-slate-800 bg-[#F3EFE6]/75 dark:bg-[#141A23] px-3 py-2.5 text-xs font-medium text-stone-800 dark:text-slate-200 hover:border-[#1E3A8A] dark:hover:border-blue-400 transition-colors"
                    >
                      Practice Ch. {activeChapter.number} Exercises →
                    </button>
                    <button
                      type="button"
                      onClick={() => openPractice('equations')}
                      className="w-full text-left rounded-lg border border-stone-200 dark:border-slate-800 bg-[#F3EFE6]/75 dark:bg-[#141A23] px-3 py-2.5 text-xs font-medium text-stone-800 dark:text-slate-200 hover:border-[#1E3A8A] dark:hover:border-blue-400 transition-colors"
                    >
                      Open Equations Lab →
                    </button>
                    <button
                      type="button"
                      onClick={() => openPractice('glossary')}
                      className="w-full text-left rounded-lg border border-stone-200 dark:border-slate-800 bg-[#F3EFE6]/75 dark:bg-[#141A23] px-3 py-2.5 text-xs font-medium text-stone-800 dark:text-slate-200 hover:border-[#1E3A8A] dark:hover:border-blue-400 transition-colors"
                    >
                      Drill Glossary Flashcards →
                    </button>
                    <button
                      type="button"
                      onClick={() => openPlatesGallery(activeChapter.number)}
                      className="w-full text-left rounded-lg border border-stone-200 dark:border-slate-800 bg-[#F3EFE6]/75 dark:bg-[#141A23] px-3 py-2.5 text-xs font-medium text-stone-800 dark:text-slate-200 hover:border-[#1E3A8A] dark:hover:border-blue-400 transition-colors"
                    >
                      View Ch. {activeChapter.number} Chart Plates →
                    </button>
                  </div>
                </aside>
              )}

              {/* Center Reading Column */}
              <div className={`w-full min-w-0 flex-1 ${focusMode ? 'max-w-[76ch] mx-auto' : 'max-w-[74ch]'}`}>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
                    <span>Chapter {activeChapter.number}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeChapter.level}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeChapter.studyTime}</span>
                    {activeChapter.checklistCount > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Mastery checked: {getChapterCheckedCount(activeChapter.id)}/{activeChapter.checklistCount}
                        </span>
                      </>
                    )}
                  </div>

                  {completedChapters[activeChapter.id] && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Completed</span>
                    </span>
                  )}
                </div>

                <ChapterMediaStrip
                  chapterId={activeChapter.id}
                  activePodcast={activePodcast}
                  isPodcastPlaying={isPodcastPlaying}
                  onPlayPodcast={handlePlayPodcast}
                  onOpenMediaLibrary={(chId) => openMediaLibrary(chId)}
                />

                <MarkdownReader
                  chapter={activeChapter}
                  isDark={isDark}
                  textSize={textSize}
                  checkedItems={checkedItems}
                  answerKeyOpen={answerKeyOpen}
                  onToggleAnswerKey={handleToggleAnswerKey}
                  onToggleChecklist={handleToggleChecklist}
                  onNavigateChapter={navigateToChapter}
                  onOpenLightbox={handleOpenLightbox}
                  onOpenPlates={openPlatesGallery}
                />

                {/* Supplemental Chart Plates */}
                {supplementalPlates.length > 0 && (
                  <section className="mt-12 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A23] p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-stone-200 dark:border-slate-800">
                      <div>
                        <div className="text-xs font-mono text-stone-500 dark:text-slate-400">
                          Chapter {activeChapter.number} Supplemental Figures
                        </div>
                        <h2 className="mt-1 font-display text-xl font-semibold text-stone-900 dark:text-white">
                          Additional Repository Chart Plates
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => openPlatesGallery(activeChapter.number)}
                        className="text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline"
                      >
                        Open Plates Gallery →
                      </button>
                    </div>
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {supplementalPlates.map((plate) => (
                        <figure
                          key={plate.id}
                          className="rounded-lg border border-stone-200 dark:border-slate-800 bg-[#FAF8F3] dark:bg-slate-900/50 p-3"
                        >
                          <img
                            src={plate.url}
                            alt={plate.title}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            onClick={() => setLightbox({ src: plate.url, alt: `${plate.title} — ${plate.caption}` })}
                            className="w-full h-44 object-contain rounded bg-white p-1.5 cursor-zoom-in"
                          />
                          <figcaption className="mt-2.5 text-xs">
                            <div className="font-semibold text-stone-900 dark:text-white">{plate.title}</div>
                            <div className="mt-0.5 text-stone-600 dark:text-slate-400 leading-relaxed">{plate.caption}</div>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </section>
                )}

                {/* Chapter Knowledge Checkpoint Quiz */}
                <ChapterQuiz
                  key={activeChapter.id}
                  chapterId={activeChapter.id}
                  chapterNumber={activeChapter.number}
                  savedScore={quizScores[activeChapter.id]}
                  onSaveScore={handleSaveQuizScore}
                />

                {/* Mark Chapter Complete Bar */}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A23] p-5">
                  <div>
                    <div className="text-sm font-semibold text-stone-900 dark:text-white">
                      Finished studying Chapter {activeChapter.number}?
                    </div>
                    <div className="mt-0.5 text-xs text-stone-600 dark:text-slate-400">
                      Record your completion or jump to this chapter&apos;s interactive exercises.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openPractice('exercises', activeChapter.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-[#FAF8F3] dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-stone-800 dark:text-slate-200 hover:border-[#1E3A8A] dark:hover:border-blue-400 transition-colors whitespace-nowrap"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      <span>Chapter Exercises</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleChapterComplete(activeChapter.id)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                        completedChapters[activeChapter.id]
                          ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-[#1E3A8A] text-white dark:bg-blue-500 hover:bg-[#172E6E]'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {completedChapters[activeChapter.id]
                          ? 'Chapter Completed'
                          : 'Mark Chapter Complete'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Prev / Next Chapter Footer */}
                <nav
                  aria-label="Chapter pagination"
                  className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-200 dark:border-slate-800 pt-8"
                >
                  {prevChapter ? (
                    <button
                      type="button"
                      onClick={() => navigateToChapter(prevChapter.id)}
                      className="flex flex-col items-start rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A23] p-4 text-left hover:border-stone-400 dark:hover:border-slate-600 transition-colors"
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-slate-400">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Previous · Ch. {prevChapter.number}</span>
                      </span>
                      <span className="mt-1 font-display text-base font-semibold text-stone-900 dark:text-white">
                        {prevChapter.shortTitle}
                      </span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextChapter && (
                    <button
                      type="button"
                      onClick={() => navigateToChapter(nextChapter.id)}
                      className="flex flex-col items-end rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A23] p-4 text-right hover:border-stone-400 dark:hover:border-slate-600 transition-colors"
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-slate-400">
                        <span>Next · Ch. {nextChapter.number}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                      <span className="mt-1 font-display text-base font-semibold text-stone-900 dark:text-white">
                        {nextChapter.shortTitle}
                      </span>
                    </button>
                  )}
                </nav>
              </div>

              {/* Right Sidebar: Section Outline with Active Scrollspy */}
              {!focusMode && (
                <aside className="hidden xl:block w-60 shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-3">
                    On This Page
                  </div>
                  <ul className="space-y-1 text-xs border-l border-stone-200 dark:border-slate-800">
                    {visibleHeadings.map((h) => {
                      const isActiveHeading = activeHeadingId === h.id;
                      return (
                        <li key={h.id}>
                          <a
                            href={`#${h.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              const el = document.getElementById(h.id);
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`block py-1 transition-colors border-l-2 -ml-[1px] ${
                              isActiveHeading
                                ? 'border-[#1E3A8A] text-[#1E3A8A] font-semibold dark:border-blue-400 dark:text-blue-300'
                                : 'border-transparent hover:text-[#1E3A8A] dark:hover:text-blue-300'
                            } ${
                              h.level === 2
                                ? `pl-3 ${isActiveHeading ? '' : 'font-medium text-stone-700 dark:text-slate-300'}`
                                : `pl-5 ${isActiveHeading ? '' : 'text-stone-500 dark:text-slate-400'}`
                            }`}
                          >
                            {h.text}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </aside>
              )}
            </div>
          </div>
        )}

        {/* MEDIA VIEW */}
        {view === 'media' && (
          <MediaLibrary
            key={selectedMediaChapter}
            initialChapterId={selectedMediaChapter}
            activePodcast={activePodcast}
            isPodcastPlaying={isPodcastPlaying}
            onPlayPodcast={handlePlayPodcast}
            onJumpToChapter={(id) => navigateToChapter(id)}
          />
        )}

        {/* PRACTICE SUITE (CHAPTER EXERCISES + EQUATIONS LAB + GLOSSARY FLASHCARDS) */}
        {view === 'practice' && (
          <FinancialLab
            key={`${practiceInitialMode}-${practiceExerciseChapter}`}
            initialMode={practiceInitialMode}
            initialExerciseChapter={practiceExerciseChapter}
            completedExercises={completedExercises}
            exerciseNotes={exerciseNotes}
            onToggleExerciseComplete={handleToggleExerciseComplete}
            onChangeExerciseNote={handleChangeExerciseNote}
            onJumpToChapter={(id, headingId) => navigateToChapter(id, headingId)}
          />
        )}

        {/* PLATES VIEW */}
        {view === 'plates' && (
          <ChartPlatesGallery
            key={platesFilter}
            initialFilter={platesFilter}
            onOpenLightbox={(src, alt) => setLightbox({ src, alt })}
            onJumpToChapter={(id) => navigateToChapter(id)}
          />
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className={`border-t border-stone-200 dark:border-slate-800 py-8 mt-12 ${activePodcast ? 'pb-24' : ''}`}>
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-8 text-xs text-stone-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <BrandIcon className="h-4 w-4 shrink-0" />
            <span>
              Investments Basics · Trading &amp; Investing Study Guide (Chapters 01–05) · Educational Material Only
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => setView('overview')} className="hover:underline">
              Overview
            </button>
            <button type="button" onClick={() => openMediaLibrary()} className="hover:underline">
              Media
            </button>
            <button type="button" onClick={() => openPractice('exercises', 'all')} className="hover:underline">
              Exercises
            </button>
            <button type="button" onClick={() => openPractice('equations')} className="hover:underline">
              Equations Lab
            </button>
            <button type="button" onClick={() => openPlatesGallery('all')} className="hover:underline">
              Plates
            </button>
          </div>
        </div>
      </footer>

      {/* Shared Audio Element for Persistent Podcast Playback */}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => {
          setIsPodcastPlaying(true);
          setPodcastError(false);
        }}
        onPause={() => setIsPodcastPlaying(false)}
        onEnded={() => setIsPodcastPlaying(false)}
        onError={() => {
          setIsPodcastPlaying(false);
          setPodcastError(true);
        }}
        onTimeUpdate={() => {
          if (audioRef.current) setPodcastTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setPodcastDuration(audioRef.current.duration || 0);
        }}
      />

      {/* Compact Persistent Podcast Mini-Player */}
      {activePodcast && (
        <div
          role="region"
          aria-label="Podcast player"
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 dark:border-slate-800 bg-[#FAF8F3]/95 dark:bg-[#121820]/95 backdrop-blur-sm"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-8 py-2.5">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => handlePlayPodcast(activePodcast)}
                aria-label={isPodcastPlaying ? 'Pause podcast' : 'Play podcast'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-white dark:bg-blue-500 hover:bg-[#172E6E] transition-colors"
              >
                {isPodcastPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
              </button>

              <div className="min-w-0 flex-1 max-w-xs">
                <div className="text-[11px] font-mono text-stone-500 dark:text-slate-400">
                  Ch. {activePodcast.chapterNumber} Podcast
                </div>
                <div className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                  {activePodcast.title}
                </div>
              </div>

              {podcastError ? (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Audio stream error — click Play to retry</span>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2.5 flex-1 max-w-md">
                  <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-slate-400 w-10 text-right">
                    {formatAudioTime(podcastTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={podcastDuration || 100}
                    step={1}
                    value={Math.min(podcastTime, podcastDuration || 100)}
                    onChange={(e) => handleSeekPodcast(Number(e.target.value))}
                    aria-label="Seek podcast timeline"
                    className="w-full accent-[#1E3A8A] dark:accent-blue-400"
                  />
                  <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-slate-400 w-10">
                    {formatAudioTime(podcastDuration)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleSkipPodcast(-15)}
                aria-label="Skip back 15 seconds"
                className="hidden sm:inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-mono text-stone-600 hover:bg-stone-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3 w-3" />
                <span>15s</span>
              </button>
              <button
                type="button"
                onClick={() => handleSkipPodcast(15)}
                aria-label="Skip forward 15 seconds"
                className="hidden sm:inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-mono text-stone-600 hover:bg-stone-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCw className="h-3 w-3" />
                <span>15s</span>
              </button>
              <button
                type="button"
                onClick={handleCyclePodcastRate}
                aria-label="Change playback speed"
                className="rounded border border-stone-300 dark:border-slate-700 px-2 py-1 text-xs font-mono tabular-nums text-stone-700 dark:text-slate-200 hover:border-stone-400"
              >
                {podcastRate}×
              </button>
              <button
                type="button"
                onClick={handleClosePodcast}
                aria-label="Close podcast player"
                className="rounded p-1.5 text-stone-500 hover:bg-stone-200/70 hover:text-stone-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Chapters & Outline Drawer */}
      {mobileTocOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-stone-950/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileTocOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Chapters and outline"
        >
          <div
            className="w-80 max-w-[85vw] h-full overflow-y-auto bg-[#FAF8F3] dark:bg-[#121820] border-r border-stone-200 dark:border-slate-800 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="font-display text-base font-semibold text-stone-900 dark:text-white">
                Chapters &amp; Sections
              </span>
              <button
                type="button"
                onClick={() => setMobileTocOpen(false)}
                aria-label="Close drawer"
                className="rounded p-1 text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 mb-6">
              {CHAPTERS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => navigateToChapter(ch.id)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-xs font-medium ${
                    ch.id === activeChapter.id
                      ? 'bg-[#1E3A8A] text-white dark:bg-blue-500'
                      : 'text-stone-700 hover:bg-stone-200/60 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {ch.number}. {ch.shortTitle}
                </button>
              ))}
            </div>

            <div className="border-t border-stone-200 dark:border-slate-800 pt-4">
              <div className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2">
                Chapter {activeChapter.number} Outline
              </div>
              <ul className="space-y-1 text-xs">
                {visibleHeadings.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => navigateToChapter(activeChapter.id, h.id)}
                      className={`w-full text-left py-1 text-stone-600 dark:text-slate-300 hover:text-[#1E3A8A] dark:hover:text-blue-300 ${
                        h.level === 3 ? 'pl-3 text-stone-500 dark:text-slate-400' : 'font-medium'
                      }`}
                    >
                      {h.text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Study Notes Drawer */}
      <StudyNotesDrawer
        isOpen={notesOpen}
        chapterId={activeChapter.id}
        chapterNumber={activeChapter.number}
        chapterTitle={activeChapter.title}
        noteText={studyNotes[activeChapter.id] ?? ''}
        onChangeNote={handleChangeStudyNote}
        onClose={() => setNotesOpen(false)}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectResult={(chapterId, headingId) => navigateToChapter(chapterId, headingId)}
      />

      {/* Image Lightbox Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-4 sm:p-8"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Chart inspection"
        >
          <div
            className="relative max-w-5xl w-full rounded-xl border border-stone-700 bg-white dark:bg-[#141A23] p-3 sm:p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close chart lightbox"
              className="absolute right-3 top-3 rounded-lg border border-stone-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900 p-2 text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="max-h-[75vh] overflow-auto rounded bg-white flex items-center justify-center">
              <img
                src={lightbox.src}
                alt={lightbox.alt}
                referrerPolicy="no-referrer"
                className="max-h-[72vh] w-auto object-contain"
              />
            </div>
            <p className="mt-3 text-xs sm:text-sm text-stone-600 dark:text-slate-300 pr-8">
              {lightbox.alt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
