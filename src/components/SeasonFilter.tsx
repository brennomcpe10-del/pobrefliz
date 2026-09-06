import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface SeasonFilterProps {
  seasons: number[];
  selectedSeason: number | 'all';
  onSelectSeason: (season: number | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'number' | 'date' | 'title';
  onSortChange: (sort: 'number' | 'date' | 'title') => void;
  filteredCount: number;
}

export const SeasonFilter: React.FC<SeasonFilterProps> = ({
  seasons,
  selectedSeason,
  onSelectSeason,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filteredCount,
}) => {
  return (
    <div className="w-full space-y-4 pt-2">
      {/* Search and Sort controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por título ou descrição..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:outline-none text-white text-xs sm:text-sm placeholder-neutral-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-white cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Sort and Count */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">
            {filteredCount} {filteredCount === 1 ? 'episódio encontrado' : 'episódios'}
          </span>

          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-2xl px-3 py-2 text-xs text-neutral-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="number" className="bg-neutral-900 text-neutral-100">
                Ordem padrão
              </option>
              <option value="date" className="bg-neutral-900 text-neutral-100">
                Mais recentes
              </option>
              <option value="title" className="bg-neutral-900 text-neutral-100">
                Título (A-Z)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Season Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => onSelectSeason('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
            selectedSeason === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          Todas as Temporadas
        </button>

        {seasons.map((seasonNum) => (
          <button
            key={seasonNum}
            onClick={() => onSelectSeason(seasonNum)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              selectedSeason === seasonNum
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Temporada {seasonNum}
          </button>
        ))}
      </div>
    </div>
  );
};
