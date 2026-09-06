import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Download,
  SkipBack,
  SkipForward,
  Check,
  HardDrive,
  Clock,
  Film,
  Maximize2,
  Tv,
} from 'lucide-react';
import { Episode, SeriesInfo } from '../types';
import { formatBytes, formatDuration, downloadEpisodeFile } from '../utils/helpers';

interface VideoPlayerModalProps {
  episode: Episode | null;
  seriesInfo: SeriesInfo;
  allEpisodes: Episode[];
  onClose: () => void;
  onSelectEpisode: (ep: Episode) => void;
  onToggleWatched: (ep: Episode) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  episode,
  seriesInfo,
  allEpisodes,
  onClose,
  onSelectEpisode,
  onToggleWatched,
}) => {
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isBlobUrl, setIsBlobUrl] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Set up video source from Blob or URL
  useEffect(() => {
    if (!episode) {
      setVideoSrc('');
      return;
    }

    let url = '';
    let createdBlob = false;

    if (episode.videoBlob) {
      url = URL.createObjectURL(episode.videoBlob);
      createdBlob = true;
    } else if (episode.videoUrl) {
      url = episode.videoUrl;
    }

    setVideoSrc(url);
    setIsBlobUrl(createdBlob);

    // Auto mark as watched after starting to watch
    const timer = setTimeout(() => {
      if (episode && !episode.watched) {
        onToggleWatched(episode);
      }
    }, 15000);

    return () => {
      clearTimeout(timer);
      if (createdBlob && url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [episode?.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!episode) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [episode, onClose]);

  if (!episode) return null;

  // Find previous and next episodes
  const currentIndex = allEpisodes.findIndex((e) => e.id === episode.id);
  const prevEpisode = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;

  const handleDownload = () => {
    downloadEpisodeFile(episode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div 
        id="video-player-modal"
        className="relative w-full max-w-5xl bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]"
      >
        {/* Player Top Navigation Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-neutral-900 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <Tv className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                {seriesInfo.title} • Temporada {episode.season}
              </p>
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                Episódio {episode.episodeNumber}: {episode.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Download Button in Player */}
            <button
              id="player-download-btn"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow-md transition-all cursor-pointer"
              title="Baixar arquivo de vídeo deste episódio"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo</span>
              {episode.fileSize ? (
                <span className="opacity-70 text-[10px]">({formatBytes(episode.fileSize)})</span>
              ) : null}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Fechar player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Screen Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              autoPlay
              playsInline
              className="w-full h-full max-h-[65vh] object-contain"
            >
              Seu navegador não suporta a reprodução deste arquivo de vídeo.
            </video>
          ) : (
            <div className="p-8 text-center text-neutral-500">
              <Film className="w-12 h-12 mx-auto mb-2 text-neutral-600" />
              <p className="text-sm">Nenhum arquivo de vídeo disponível para este episódio.</p>
            </div>
          )}
        </div>

        {/* Bottom Details & Episode Controls */}
        <div className="p-4 sm:p-6 bg-neutral-900/90 border-t border-neutral-800 overflow-y-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-blue-600 text-[10px] uppercase font-bold rounded-full tracking-wider text-white">
                  S{String(episode.season).padStart(2, '0')}E{String(episode.episodeNumber).padStart(2, '0')}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {episode.title}
                </h3>
              </div>
              {episode.description && (
                <p className="mt-2 text-sm text-neutral-300/90 leading-relaxed max-w-3xl">
                  {episode.description}
                </p>
              )}
            </div>

            {/* Next / Previous Episode Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                disabled={!prevEpisode}
                onClick={() => prevEpisode && onSelectEpisode(prevEpisode)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-neutral-700"
                title={prevEpisode ? `Anterior: ${prevEpisode.title}` : 'Sem episódio anterior'}
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <button
                disabled={!nextEpisode}
                onClick={() => nextEpisode && onSelectEpisode(nextEpisode)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-md shadow-blue-900/30"
                title={nextEpisode ? `Próximo: ${nextEpisode.title}` : 'Sem próximo episódio'}
              >
                <span>Próximo</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Technical Details Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-neutral-400 border-t border-neutral-800/80">
            {episode.duration ? (
              <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 text-[10px] font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span>Duração: <strong className="text-neutral-200">{formatDuration(episode.duration)}</strong></span>
              </div>
            ) : null}

            {episode.fileSize ? (
              <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 text-[10px] font-bold uppercase tracking-wider">
                <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
                <span>Tamanho: <strong className="text-neutral-200">{formatBytes(episode.fileSize)}</strong></span>
              </div>
            ) : null}

            {episode.fileName ? (
              <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 truncate max-w-xs text-[10px] font-bold uppercase tracking-wider">
                <Film className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">Arquivo: <span className="text-neutral-200 font-mono text-[11px] lowercase">{episode.fileName}</span></span>
              </div>
            ) : null}

            <button
              onClick={() => onToggleWatched(episode)}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                episode.watched
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{episode.watched ? 'Assistido' : 'Marcar como assistido'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
