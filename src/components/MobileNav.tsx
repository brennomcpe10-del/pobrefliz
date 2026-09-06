import React from 'react';
import { Home, Tv, Film, Lock, ShieldCheck, Plus, Layers } from 'lucide-react';

interface MobileNavProps {
  currentTab: 'home' | 'episodes' | 'new-series';
  onChangeTab: (tab: 'home' | 'episodes' | 'new-series') => void;
  isAdmin: boolean;
  onOpenSeriesList: () => void;
  onOpenAdminAuth: () => void;
  onOpenAddEpisode: () => void;
  episodesCount: number;
  seriesCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onChangeTab,
  isAdmin,
  onOpenSeriesList,
  onOpenAdminAuth,
  onOpenAddEpisode,
  episodesCount,
  seriesCount,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/80 px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        {/* Início */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'home'
              ? 'text-blue-400 font-bold'
              : 'text-neutral-400 hover:text-white font-medium'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Início</span>
        </button>

        {/* Episódios */}
        <button
          onClick={() => onChangeTab('episodes')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer relative ${
            currentTab === 'episodes'
              ? 'text-blue-400 font-bold'
              : 'text-neutral-400 hover:text-white font-medium'
          }`}
        >
          <Tv className={`w-5 h-5 ${currentTab === 'episodes' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Episódios</span>
          {episodesCount > 0 && (
            <span className="absolute top-0.5 right-1 w-4 h-4 rounded-full bg-blue-600/90 text-[9px] font-bold text-white flex items-center justify-center">
              {episodesCount}
            </span>
          )}
        </button>

        {/* Layout de Nova Série */}
        <button
          id="mobile-nav-new-series"
          onClick={() => onChangeTab('new-series')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'new-series'
              ? 'text-blue-400 font-bold'
              : 'text-neutral-400 hover:text-white font-medium'
          }`}
        >
          <div className="relative">
            <Film className={`w-5 h-5 ${currentTab === 'new-series' ? 'stroke-[2.5]' : ''}`} />
            <Plus className="w-2.5 h-2.5 absolute -top-0.5 -right-1 text-blue-400 stroke-[3]" />
          </div>
          <span className="text-[10px] mt-0.5 whitespace-nowrap">Nova Série</span>
        </button>

        {/* Séries Drawer */}
        <button
          onClick={onOpenSeriesList}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-neutral-400 hover:text-white font-medium transition-all cursor-pointer relative"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Séries</span>
          {seriesCount > 0 && (
            <span className="absolute top-0.5 right-1 w-4 h-4 rounded-full bg-neutral-800 border border-neutral-700 text-[9px] font-bold text-neutral-300 flex items-center justify-center">
              {seriesCount}
            </span>
          )}
        </button>

        {/* Admin Action */}
        {isAdmin ? (
          <button
            onClick={onOpenAddEpisode}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-emerald-400 hover:text-emerald-300 font-medium transition-all cursor-pointer"
            title="Adicionar episódio"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[10px] mt-0.5">Novo Ep</span>
          </button>
        ) : (
          <button
            onClick={onOpenAdminAuth}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-neutral-400 hover:text-amber-400 font-medium transition-all cursor-pointer"
            title="Entrar como Administrador"
          >
            <Lock className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
};
