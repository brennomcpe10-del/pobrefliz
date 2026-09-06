import React from 'react';
import {
  Play,
  Download,
  Check,
  MoreVertical,
  Trash2,
  Edit2,
  Clock,
  HardDrive,
  FileVideo,
  Lock,
  Smartphone,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { Episode } from '../types';
import { formatBytes, formatDuration, downloadEpisodeFile, parseGoogleDriveUrl } from '../utils/helpers';

interface EpisodeCardProps {
  episode: Episode;
  isAdmin?: boolean;
  onRequestAdmin?: () => void;
  onPlay: (episode: Episode) => void;
  onEdit: (episode: Episode) => void;
  onDelete: (id: string) => void;
  onToggleWatched: (episode: Episode) => void;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  isAdmin = false,
  onRequestAdmin,
  onPlay,
  onEdit,
  onDelete,
  onToggleWatched,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadEpisodeFile(episode);
  };

  const codeString = `T${String(episode.season).padStart(2, '0')} • E${String(
    episode.episodeNumber
  ).padStart(2, '0')}`;

  return (
    <div
      id={`episode-card-${episode.id}`}
      className="group relative flex flex-col bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-3xl overflow-hidden transition-all duration-200 shadow-md hover:shadow-xl"
    >
      {/* Media Thumbnail Container */}
      <div
        onClick={() => onPlay(episode)}
        className="relative aspect-video w-full bg-neutral-950 overflow-hidden cursor-pointer"
      >
        {episode.thumbnailUrl ? (
          <img
            src={episode.thumbnailUrl}
            alt={episode.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950 text-neutral-600">
            <FileVideo className="w-12 h-12" />
          </div>
        )}

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-black/20 to-transparent group-hover:from-neutral-950/95 transition-all" />

        {/* Play Button Hover Target */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-950/60 transform scale-90 group-hover:scale-105 transition-all duration-200">
            <Play className="w-5 h-5 fill-white translate-x-0.5" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-600 text-[10px] uppercase font-bold rounded-full tracking-wider text-white shadow-sm">
            {codeString}
          </span>
          {parseGoogleDriveUrl(episode.videoUrl).isGoogleDrive ? (
            <span
              className="px-2 py-1 bg-black/70 backdrop-blur-md text-[10px] uppercase font-bold rounded-full tracking-wider text-amber-300 border border-amber-500/40 flex items-center gap-1"
              title="Streaming direto do Google Drive"
            >
              <Cloud className="w-3 h-3 text-amber-400" />
              Drive
            </span>
          ) : episode.videoUrl && (episode.videoUrl.startsWith('/uploads/') || episode.videoUrl.startsWith('http')) ? (
            <span
              className="px-2 py-1 bg-black/60 backdrop-blur-md text-[10px] uppercase font-bold rounded-full tracking-wider text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
              title="Disponível para assistir em qualquer celular e PC"
            >
              <Smartphone className="w-3 h-3" />
              Nuvem
            </span>
          ) : episode.videoBlob ? (
            <span
              className="px-2 py-1 bg-black/60 backdrop-blur-md text-[10px] uppercase font-bold rounded-full tracking-wider text-amber-400 border border-amber-500/30 flex items-center gap-1"
              title="Armazenado localmente, sincronizando com o servidor..."
            >
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              Local
            </span>
          ) : null}
          {episode.watched ? (
            <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-[10px] uppercase font-bold rounded-full tracking-wider text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Assistido
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-black/50 backdrop-blur-md text-[10px] uppercase font-bold rounded-full tracking-wider text-neutral-300 border border-white/10">
              HD
            </span>
          )}
        </div>

        {/* Bottom Badges */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-medium text-neutral-300">
          {episode.duration ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider">
              <Clock className="w-3 h-3 text-neutral-400" />
              {formatDuration(episode.duration)}
            </span>
          ) : (
            <span />
          )}

          {episode.fileSize ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider">
              <HardDrive className="w-3 h-3 text-neutral-400" />
              {formatBytes(episode.fileSize)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Body Info */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => onPlay(episode)}
              className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 cursor-pointer"
              title={episode.title}
            >
              {String(episode.episodeNumber).padStart(2, '0')}. {episode.title}
            </h3>

            {/* Context Menu Trigger */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Mais opções"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl z-30 py-1.5 text-xs">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onToggleWatched(episode);
                    }}
                    className="w-full px-3.5 py-2 text-left text-neutral-200 hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {episode.watched ? 'Marcar como não assistido' : 'Marcar como assistido'}
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (isAdmin) {
                        onEdit(episode);
                      } else {
                        onRequestAdmin?.();
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left text-neutral-200 hover:bg-neutral-800 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Editar informações</span>
                    </div>
                    {!isAdmin && <Lock className="w-3 h-3 text-neutral-500" />}
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (isAdmin) {
                        if (confirm(`Deseja realmente remover o episódio "${episode.title}"?`)) {
                          onDelete(episode.id);
                        }
                      } else {
                        onRequestAdmin?.();
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-400 hover:bg-rose-950/40 flex items-center justify-between gap-2 cursor-pointer border-t border-neutral-800"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir episódio</span>
                    </div>
                    {!isAdmin && <Lock className="w-3 h-3 text-neutral-500" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="mt-1.5 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
            {episode.description || 'Nenhuma sinopse informada para este episódio.'}
          </p>
        </div>

        {/* Action Buttons: Assistir & Baixar */}
        <div className="pt-3 border-t border-neutral-800 flex items-center gap-2.5">
          <button
            onClick={() => onPlay(episode)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors cursor-pointer border border-neutral-700"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span>Assistir</span>
          </button>

          <button
            id={`btn-download-${episode.id}`}
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer group/btn"
            title={`Baixar ${episode.fileName || 'arquivo de vídeo'}`}
          >
            <Download className="w-3.5 h-3.5 group-hover/btn:translate-y-0.5 transition-transform" />
            <span>Baixar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
