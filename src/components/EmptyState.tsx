import React from 'react';
import { Film, Plus, Sparkles, RefreshCw, Lock } from 'lucide-react';

interface EmptyStateProps {
  isSearch: boolean;
  isAdmin?: boolean;
  onRequestAdmin?: () => void;
  onOpenUpload: () => void;
  onResetSamples?: () => void;
  onClearSearch?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isSearch,
  isAdmin = false,
  onRequestAdmin,
  onOpenUpload,
  onResetSamples,
  onClearSearch,
}) => {
  return (
    <div className="w-full py-16 px-6 flex flex-col items-center justify-center text-center bg-neutral-900/50 rounded-3xl border border-neutral-800">
      <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
        <Film className="w-8 h-8" />
      </div>

      {isSearch ? (
        <>
          <h3 className="text-lg font-bold text-white mb-1">
            Nenhum episódio encontrado
          </h3>
          <p className="text-sm text-neutral-400 max-w-md mb-6">
            Tente pesquisar por outro termo ou limpe a barra de pesquisa para ver todos os episódios.
          </p>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors cursor-pointer border border-neutral-700"
            >
              Limpar Pesquisa
            </button>
          )}
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold text-white mb-1">
            Nenhum episódio cadastrado nesta visualização
          </h3>
          <p className="text-sm text-neutral-400 max-w-md mb-6 leading-relaxed">
            {isAdmin
              ? 'Adicione facilmente novos episódios colocando o arquivo de vídeo e o título, ou restaure os episódios de demonstração.'
              : 'Nenhum episódio encontrado aqui. Como visualizador você pode assistir a outros episódios ou solicitar acesso admin para cadastrar novos.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              id="empty-add-episode-btn"
              onClick={() => {
                if (isAdmin) {
                  onOpenUpload();
                } else {
                  onRequestAdmin?.();
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black hover:bg-neutral-200 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Primeiro Episódio</span>
              {!isAdmin && <Lock className="w-3.5 h-3.5 text-neutral-500" />}
            </button>

            {onResetSamples && (
              <button
                onClick={onResetSamples}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer"
                title="Carregar episódios de exemplo para teste rápido"
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Restaurar Amostras</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

