import React from 'react';
import { X, Tv, Film, Plus, Check, Settings2, Play } from 'lucide-react';
import { Series, Episode } from '../types';

interface SeriesDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesList: Series[];
  activeSeries: Series | null;
  episodes: Episode[];
  isAdmin: boolean;
  onSelectSeries: (series: Series) => void;
  onAddNewSeries: () => void;
  onEditSeries: (series: Series) => void;
}

export const SeriesDrawerModal: React.FC<SeriesDrawerModalProps> = ({
  isOpen,
  onClose,
  seriesList,
  activeSeries,
  episodes,
  isAdmin,
  onSelectSeries,
  onAddNewSeries,
  onEditSeries,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="series-drawer-modal"
        className="w-full sm:max-w-xl max-h-[85vh] bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100 animate-in slide-in-from-bottom-5 duration-200"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Catálogo de Séries</h2>
              <p className="text-[11px] text-neutral-400">Escolha uma série para assistir ou gerenciar</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onAddNewSeries();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Cadastrar nova série"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nova Série</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Series List */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 divide-y divide-neutral-800/40">
          {seriesList.map((series) => {
            const isActive = activeSeries?.id === series.id;
            const seriesEps = episodes.filter((e) => e.seriesId === series.id);

            return (
              <div
                key={series.id}
                className={`pt-3 first:pt-0 flex items-start gap-3 p-3 rounded-2xl transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-blue-600/10 border-blue-500/60 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-neutral-950/50 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-800/40'
                }`}
                onClick={() => {
                  onSelectSeries(series);
                  onClose();
                }}
              >
                {/* Poster Thumbnail */}
                <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0 relative">
                  {series.bannerUrl ? (
                    <img
                      src={series.bannerUrl}
                      alt={series.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <Tv className="w-6 h-6" />
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Series Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {series.title}
                    </h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 shrink-0">
                      {series.rating || '14+'}
                    </span>
                  </div>

                  <p className="text-[11px] text-blue-400 font-medium mt-0.5 truncate">
                    {series.genre} • {series.year}
                  </p>

                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                    {series.synopsis}
                  </p>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-neutral-800/60">
                    <span className="text-[11px] font-semibold text-neutral-400">
                      {seriesEps.length} {seriesEps.length === 1 ? 'episódio cadastrado' : 'episódios cadastrados'}
                    </span>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            onEditSeries(series);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                        >
                          Configurar
                        </button>
                      )}
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-800 text-neutral-300 group-hover:bg-neutral-700'
                      }`}>
                        {isActive ? 'Ativa' : 'Selecionar'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
