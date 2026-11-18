import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Headphones, Pause, Play, RotateCcw, Video } from 'lucide-react';
import { MEDIA_ITEMS, type MediaItem } from '../data/media';

type MediaFilter = 'all' | 'video' | 'podcast';

interface MediaLibraryProps {
  initialChapterId?: string;
  initialFilter?: MediaFilter;
  activePodcast: MediaItem | null;
  isPodcastPlaying: boolean;
  onPlayPodcast: (item: MediaItem) => void;
  onJumpToChapter: (chapterId: string) => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  initialChapterId,
  initialFilter = 'all',
  activePodcast,
  isPodcastPlaying,
  onPlayPodcast,
  onJumpToChapter,
}) => {
  const [filter, setFilter] = useState<MediaFilter>(initialFilter);
  const [selectedVideo, setSelectedVideo] = useState<MediaItem>(() => {
    if (initialChapterId) {
      const match = MEDIA_ITEMS.find(
        (m) => m.kind === 'video' && m.chapterId === initialChapterId
      );
      if (match) return match;
    }
    return MEDIA_ITEMS.find((m) => m.kind === 'video') ?? MEDIA_ITEMS[0];
  });
  const [videoRate, setVideoRate] = useState<number>(1);
  const [videoError, setVideoError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return MEDIA_ITEMS;
    return MEDIA_ITEMS.filter((item) => item.kind === filter);
  }, [filter]);

  const videos = useMemo(() => MEDIA_ITEMS.filter((m) => m.kind === 'video'), []);
  const podcasts = useMemo(() => MEDIA_ITEMS.filter((m) => m.kind === 'podcast'), []);

  const handleSelectVideo = (item: MediaItem) => {
    setSelectedVideo(item);
    setVideoError(false);
    setReloadNonce(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVideoRate = (rate: number) => {
    setVideoRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-8 py-8 sm:py-10">
      <div className="mb-8 border-b border-stone-200 dark:border-slate-800 pb-6">
        <p className="text-xs font-medium tracking-wider uppercase text-stone-500 dark:text-slate-400">
          Audio &amp; Video Companions · Chapters 01–05
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Video Lessons &amp; Podcast Episodes
        </h1>
        <p className="mt-2.5 max-w-2xl text-sm sm:text-base leading-relaxed text-stone-600 dark:text-slate-300">
          Stream all five chapter video walkthroughs and five companion audio podcasts directly from the curriculum repository while reading or practicing.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-100/80 dark:bg-slate-900 p-1 w-fit">
          {[
            { id: 'all' as MediaFilter, label: 'All Media (10)' },
            { id: 'video' as MediaFilter, label: 'Video Lessons (5)' },
            { id: 'podcast' as MediaFilter, label: 'Podcasts (5)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`whitespace-nowrap shrink-0 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-white dark:bg-slate-800 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Video Stage */}
      {(filter === 'all' || filter === 'video') && (
        <div className="mb-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 overflow-hidden rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A22] flex flex-col">
            <div className="bg-black aspect-video w-full relative flex items-center justify-center">
              {videoError ? (
                <div className="p-6 text-center text-stone-200 max-w-sm">
                  <AlertCircle className="h-7 w-7 mx-auto text-amber-400" />
                  <p className="mt-2.5 text-sm font-medium">
                    Unable to load video stream right now.
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    Verify your network connection or reload the stream for Chapter {selectedVideo.chapterNumber}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoError(false);
                      setReloadNonce((n) => n + 1);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-stone-600 bg-stone-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retry Stream</span>
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  key={`${selectedVideo.id}-${reloadNonce}`}
                  controls
                  preload="metadata"
                  playsInline
                  onError={() => setVideoError(true)}
                  onLoadedMetadata={() => {
                    if (videoRef.current) videoRef.current.playbackRate = videoRate;
                  }}
                  className="h-full w-full bg-black"
                >
                  <source src={selectedVideo.streamUrl} type="video/mp4" />
                </video>
              )}
            </div>
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
                  <span>Chapter {selectedVideo.chapterNumber} Video</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{selectedVideo.sizeLabel}</span>
                </div>
                <h2 className="mt-1 font-display text-xl font-semibold text-stone-900 dark:text-white">
                  {selectedVideo.title}
                </h2>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-slate-300">
                  {selectedVideo.description}
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                <div className="flex items-center gap-1 rounded-md border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 p-1">
                  {[1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleVideoRate(rate)}
                      className={`rounded px-2 py-0.5 text-xs font-mono tabular-nums ${
                        videoRate === rate
                          ? 'bg-[#1E3A8A] text-white dark:bg-blue-500'
                          : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      {rate}×
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onJumpToChapter(selectedVideo.chapterId)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline whitespace-nowrap"
                >
                  <span>Read Chapter {selectedVideo.chapterNumber}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-[#F3EFE6]/80 dark:bg-[#141A22] p-4 sm:p-5 flex flex-col">
            <h3 className="font-display text-base font-semibold text-stone-900 dark:text-white mb-3">
              Video Playlist (01–05)
            </h3>
            <div className="space-y-2 flex-1">
              {videos.map((v) => {
                const active = v.id === selectedVideo.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVideo(v)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      active
                        ? 'border-[#1E3A8A] bg-white dark:border-blue-400 dark:bg-slate-900'
                        : 'border-stone-200 dark:border-slate-800 bg-white/75 dark:bg-slate-900/40 hover:border-stone-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-slate-400">
                      <span>CH {v.chapterNumber} · MP4</span>
                      {active && (
                        <span className="text-[#1E3A8A] dark:text-blue-300 font-semibold">Selected</span>
                      )}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-stone-900 dark:text-white">
                      {v.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Podcast Episodes */}
      {(filter === 'all' || filter === 'podcast') && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl font-semibold text-stone-900 dark:text-white">
              Podcast Episodes
            </h2>
            <span className="text-xs text-stone-500 dark:text-slate-400">
              Audio continues playing while you read chapters or solve exercises
            </span>
          </div>

          <div className="divide-y divide-stone-200 dark:divide-slate-800 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A22]">
            {podcasts.map((ep) => {
              const isCurrent = activePodcast?.id === ep.id;
              return (
                <div
                  key={ep.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-stone-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
                      <Headphones className="h-3.5 w-3.5" />
                      <span className="font-mono">Chapter {ep.chapterNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{ep.sizeLabel}</span>
                    </div>
                    <h3 className="mt-1 font-display text-lg font-semibold text-stone-900 dark:text-white">
                      {ep.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-slate-300">
                      {ep.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onJumpToChapter(ep.chapterId)}
                      className="rounded-lg border border-stone-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-stone-700 dark:text-slate-200 hover:border-stone-400 transition-colors whitespace-nowrap"
                    >
                      Read Ch. {ep.chapterNumber}
                    </button>
                    <button
                      type="button"
                      onClick={() => onPlayPodcast(ep)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                        isCurrent && isPodcastPlaying
                          ? 'bg-[#1E3A8A] text-white dark:bg-blue-500'
                          : 'border border-stone-300 dark:border-slate-700 bg-[#FAF8F3] dark:bg-slate-900 text-stone-900 dark:text-white hover:border-[#1E3A8A] dark:hover:border-blue-400'
                      }`}
                    >
                      {isCurrent && isPodcastPlaying ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          <span>{isCurrent ? 'Resume' : 'Play Episode'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Video Directory when filtered specifically to videos */}
      {filter === 'video' && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#141A22] p-4"
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
                  <Video className="h-3.5 w-3.5" />
                  <span className="font-mono">Chapter {item.chapterNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{item.sizeLabel}</span>
                </div>
                <div className="mt-1 font-display text-base font-semibold text-stone-900 dark:text-white">
                  {item.title}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectVideo(item)}
                className="shrink-0 rounded-lg border border-stone-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-stone-900 dark:text-white hover:border-[#1E3A8A] dark:hover:border-blue-400 whitespace-nowrap"
              >
                Load in Player
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
