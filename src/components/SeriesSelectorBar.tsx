import React from 'react';
import { Tv, Plus, Settings2, Sparkles, Check, ChevronRight } from 'lucide-react';
import { Series, Episode } from '../types';

interface SeriesSelectorBarProps {
  seriesList: Series[];
  activeSeries: Series | null;
  episodes: Episode[];
  isAdmin: boolean;
  onSelectSeries: (series: Series) => void;
  onAddNewSeries: () => void;
  onEditActiveSeries: () => void;
  onRequestAdmin: () => void;
}

export const SeriesSelectorBar: React.FC<SeriesSelectorBarProps> = ({
  seriesList,
  activeSeries,
  episodes,
  isAdmin,
  onSelectSeries,
  onAddNewSeries,
  onEditActiveSeries,
  onRequestAdmin,
}) => {
  return (
    <div className="w-full bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-2.5 sm:p-3 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Tv className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Séries Disponíveis ({seriesList.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && activeSeries && (
            <button
              onClick={onEditActiveSeries}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Editar dados da série ativa"
            >
              <Settings2 className="w-3 h-3" />
              <span className="hidden sm:inline">Editar Série</span>
            </button>
          )}

          <button
            id="btn-add-new-series"
            onClick={onAddNewSeries}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm shadow-blue-900/30 transition-all cursor-pointer hover:scale-102 active:scale-98"
            title="Abrir o layout de cadastro de nova série"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nova Série</span>
          </button>
        </div>
      </div>

      {/* Horizontal scrollable series list */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-neutral-800 no-scrollbar">
        {seriesList.map((series) => {
          const isActive = activeSeries?.id === series.id;
          const seriesEpisodes = episodes.filter((e) => e.seriesId === series.id);
          const count = seriesEpisodes.length;

          return (
            <button
              key={series.id}
              onClick={() => onSelectSeries(series)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all shrink-0 cursor-pointer border ${
                isActive
                  ? 'bg-blue-600/15 border-blue-500/80 text-white shadow-md shadow-blue-900/20 ring-1 ring-blue-500/30'
                  : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              {/* Mini thumbnail if exists */}
              {series.bannerUrl ? (
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-neutral-700/60 bg-neutral-950">
                  <img
                    src={series.bannerUrl}
                    alt={series.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {series.title.charAt(0)}
                </div>
              )}

              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-xs font-bold truncate max-w-[140px] sm:max-w-[180px]">
                  {series.title}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                  <span>{series.year || '2025'}</span>
                  <span>•</span>
                  <span>{count} {count === 1 ? 'ep' : 'eps'}</span>
                </div>
              </div>

              {isActive && (
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse ml-0.5" />
              )}
            </button>
          );
        })}

        {isAdmin && (
          <button
            onClick={onAddNewSeries}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-neutral-700/80 hover:border-blue-500/60 bg-neutral-900/40 hover:bg-blue-600/10 text-neutral-400 hover:text-blue-300 text-xs font-medium transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Adicionar Série</span>
          </button>
        )}
      </div>
    </div>
  );
};
