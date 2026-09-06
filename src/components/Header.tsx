import React from 'react';
import { Plus, Edit3, Tv, Film, Lock, ShieldCheck, ShieldAlert, Sparkles, Smartphone } from 'lucide-react';
import { Series, Episode } from '../types';

interface HeaderProps {
  seriesInfo: Series;
  allSeries: Series[];
  episodes: Episode[];
  isAdmin?: boolean;
  onRequestAdmin?: () => void;
  onLogoutAdmin?: () => void;
  onOpenUpload: () => void;
  onOpenEditSeries: () => void;
  onOpenSeriesList: () => void;
  onOpenNewSeries?: () => void;
  onOpenSyncDevices?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  seriesInfo,
  allSeries,
  isAdmin = false,
  onRequestAdmin,
  onLogoutAdmin,
  onOpenUpload,
  onOpenEditSeries,
  onOpenSeriesList,
  onOpenNewSeries,
  onOpenSyncDevices,
}) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-900/60 border border-neutral-800/80 p-3.5 sm:px-6 sm:py-4 rounded-2xl sm:rounded-3xl gap-3 sm:gap-4 shadow-sm backdrop-blur-md">
      {/* Brand & Series Info */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2.5">
          <div 
            onClick={onOpenSeriesList}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-white shadow-md shadow-blue-600/30 cursor-pointer hover:scale-105 transition-transform"
            title="Ver catálogo de séries"
          >
            <Film className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenSeriesList}
                className="text-sm sm:text-lg font-bold tracking-tight text-white hover:text-blue-300 transition-colors flex items-center gap-1 text-left cursor-pointer"
              >
                <span className="truncate max-w-[160px] sm:max-w-[280px]">{seriesInfo.title}</span>
                <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 rounded ml-1">
                  {allSeries.length} {allSeries.length === 1 ? 'série' : 'séries'}
                </span>
              </button>
            </div>

            <p className="text-[10px] sm:text-xs text-neutral-400 font-medium flex items-center gap-1.5">
              <span>{seriesInfo.genre || 'Geral'}</span>
              <span>•</span>
              <span>{seriesInfo.year || '2025'}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-neutral-500">Player HD & Downloads</span>
            </p>
          </div>
        </div>

        {/* Status Badge on Mobile */}
        <div className="sm:hidden flex items-center gap-1.5">
          {onOpenSyncDevices && (
            <button
              type="button"
              onClick={onOpenSyncDevices}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-700/50 cursor-pointer"
              title="Conectar celular ao servidor"
            >
              <Smartphone className="w-3 h-3" />
              <span>Celular</span>
            </button>
          )}
          {isAdmin ? (
            <button
              onClick={onLogoutAdmin}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin</span>
            </button>
          ) : (
            <button
              onClick={onRequestAdmin}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700 cursor-pointer"
            >
              <Lock className="w-3 h-3 text-blue-400" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Actions & Admin Pill */}
      <div className="hidden sm:flex items-center gap-2.5">
        {onOpenSyncDevices && (
          <button
            type="button"
            id="header-btn-sync-devices"
            onClick={onOpenSyncDevices}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 rounded-xl text-xs font-bold transition-all cursor-pointer mr-1"
            title="Sincronização entre computador e celular"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Conectar Celular</span>
          </button>
        )}
        {isAdmin ? (
          <div className="flex items-center gap-2 mr-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Modo Admin Ativo</span>
            </span>
            <button
              onClick={onLogoutAdmin}
              className="text-[11px] text-neutral-400 hover:text-rose-400 underline cursor-pointer"
              title="Sair do modo administrador"
            >
              Sair
            </button>
          </div>
        ) : (
          <button
            onClick={onRequestAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Admin</span>
          </button>
        )}

        {onOpenNewSeries && (
          <button
            id="header-btn-new-series"
            onClick={onOpenNewSeries}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800/90 hover:bg-neutral-700/90 rounded-xl text-xs font-semibold text-neutral-200 border border-neutral-700/70 transition-all cursor-pointer"
            title="Cadastrar nova série no catálogo"
          >
            <Film className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Nova Série</span>
          </button>
        )}

        <button
          id="btn-edit-series"
          onClick={() => {
            if (isAdmin) {
              onOpenEditSeries();
            } else {
              onRequestAdmin?.();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800/90 hover:bg-neutral-700/90 rounded-xl text-xs font-semibold text-neutral-200 border border-neutral-700/70 transition-all cursor-pointer"
          title={isAdmin ? 'Configurar série' : 'Requer acesso de administrador'}
        >
          <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
          <span>Configurar Série</span>
        </button>

        <button
          id="btn-add-episode"
          onClick={() => {
            if (isAdmin) {
              onOpenUpload();
            } else {
              onRequestAdmin?.();
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow-md shadow-blue-900/20 transition-all cursor-pointer hover:scale-102"
          title={isAdmin ? 'Adicionar novo episódio' : 'Requer acesso de administrador'}
        >
          <Plus className="w-4 h-4" />
          <span>Novo Episódio</span>
        </button>
      </div>
    </header>
  );
};
