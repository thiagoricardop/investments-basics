import React, { useRef, useState } from 'react';
import { AlertCircle, Headphones, Pause, Play, RotateCcw, Video, X } from 'lucide-react';
import { getMediaForChapter, type MediaItem } from '../data/media';

interface ChapterMediaStripProps {
  chapterId: string;
  activePodcast: MediaItem | null;
  isPodcastPlaying: boolean;
  onPlayPodcast: (item: MediaItem) => void;
  onOpenMediaLibrary: (chapterId?: string) => void;
}

export const ChapterMediaStrip: React.FC<ChapterMediaStripProps> = ({
  chapterId,
  activePodcast,
  isPodcastPlaying,
  onPlayPodcast,
  onOpenMediaLibrary,
}) => {
  const { video, podcast } = getMediaForChapter(chapterId);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [videoRate, setVideoRate] = useState(1);
  const [videoError, setVideoError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!video && !podcast) return null;

  const isThisPodcastActive = podcast && activePodcast?.id === podcast.id;

  const handleVideoRate = (rate: number) => {
    setVideoRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  return (
    <div className="mb-8 rounded-xl border border-stone-200 dark:border-slate-800 bg-[#F3EFE6]/75 dark:bg-[#141A22] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80 dark:border-slate-800">
        <div className="text-xs font-medium text-stone-600 dark:text-slate-300">
          Chapter {video?.chapterNumber ?? podcast?.chapterNumber} Companion Media
        </div>
        <button
          type="button"
          onClick={() => onOpenMediaLibrary(chapterId)}
          className="text-xs font-medium text-[#1E3A8A] dark:text-blue-300 hover:underline whitespace-nowrap"
        >
          Browse All Videos &amp; Podcasts →
        </button>
      </div>

      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {video && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-3.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-500 dark:text-slate-400 whitespace-nowrap">
                <Video className="h-3.5 w-3.5 shrink-0" />
                <span>Video</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{video.sizeLabel}</span>
              </div>
              <div className="mt-1 text-sm font-semibold leading-snug text-stone-900 dark:text-white line-clamp-2">
                {video.title}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setVideoExpanded((v) => !v);
                setVideoError(false);
              }}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-stone-300 dark:border-slate-700 bg-[#FAF8F3] dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-stone-900 dark:text-white hover:border-[#1E3A8A] dark:hover:border-blue-400 transition-colors whitespace-nowrap"
            >
              {videoExpanded ? (
                <>
                  <X className="h-3.5 w-3.5" />
                  <span>Hide Video</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Watch</span>
                </>
              )}
            </button>
          </div>
        )}

        {podcast && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-3.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-500 dark:text-slate-400 whitespace-nowrap">
                <Headphones className="h-3.5 w-3.5 shrink-0" />
                <span>Podcast</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{podcast.sizeLabel}</span>
              </div>
              <div className="mt-1 text-sm font-semibold leading-snug text-stone-900 dark:text-white line-clamp-2">
                {podcast.title}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onPlayPodcast(podcast)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                isThisPodcastActive && isPodcastPlaying
                  ? 'bg-[#1E3A8A] text-white dark:bg-blue-500'
                  : 'border border-stone-300 dark:border-slate-700 bg-[#FAF8F3] dark:bg-slate-800 text-stone-900 dark:text-white hover:border-[#1E3A8A] dark:hover:border-blue-400'
              }`}
            >
              {isThisPodcastActive && isPodcastPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>{isThisPodcastActive ? 'Resume' : 'Listen'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {video && videoExpanded && (
        <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 dark:border-slate-800 bg-black">
          {videoError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-stone-200">
              <AlertCircle className="h-6 w-6 text-amber-400" />
              <p className="mt-2 text-sm font-medium">Video stream could not load.</p>
              <button
                type="button"
                onClick={() => {
                  setVideoError(false);
                  setReloadNonce((n) => n + 1);
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded border border-stone-600 bg-stone-800 px-3 py-1.5 text-xs text-white hover:bg-stone-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              key={`${video.id}-${reloadNonce}`}
              controls
              preload="metadata"
              playsInline
              onError={() => setVideoError(true)}
              onLoadedMetadata={() => {
                if (videoRef.current) videoRef.current.playbackRate = videoRate;
              }}
              className="w-full max-h-[440px] bg-black"
            >
              <source src={video.streamUrl} type="video/mp4" />
            </video>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-900 px-3.5 py-2 text-xs text-stone-300">
            <span className="truncate">{video.title}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">Speed:</span>
              {[1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleVideoRate(rate)}
                  className={`rounded px-2 py-0.5 font-mono tabular-nums ${
                    videoRate === rate
                      ? 'bg-blue-600 text-white'
                      : 'text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  {rate}×
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
