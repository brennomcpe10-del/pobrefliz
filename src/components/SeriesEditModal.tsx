import React, { useState, useEffect, useRef } from 'react';
import { X, Tv, Image as ImageIcon, CheckCircle2, Trash2, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Series } from '../types';
import { uploadMediaFile } from '../utils/api';

interface SeriesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  series: Series | null; // null if creating a new series
  isNew?: boolean;
  canDelete?: boolean;
  onSaveSeries: (series: Series) => Promise<void>;
  onDeleteSeries?: (id: string) => Promise<void>;
}

export const SeriesEditModal: React.FC<SeriesEditModalProps> = ({
  isOpen,
  onClose,
  series,
  isNew = false,
  canDelete = false,
  onSaveSeries,
  onDeleteSeries,
}) => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [rating, setRating] = useState('14+');
  const [bannerUrl, setBannerUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setConfirmDelete(false);
      if (series && !isNew) {
        setTitle(series.title);
        setGenre(series.genre);
        setYear(series.year);
        setSynopsis(series.synopsis);
        setRating(series.rating || '14+');
        setBannerUrl(series.bannerUrl || '');
      } else {
        setTitle('');
        setGenre('Ação • Ficção Científica');
        setYear(new Date().getFullYear().toString());
        setSynopsis('');
        setRating('14+');
        setBannerUrl('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop');
      }
    }
  }, [isOpen, series, isNew]);

  if (!isOpen) return null;

  const handleBannerUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor selecione um arquivo de imagem (JPG, PNG, WebP).');
      return;
    }
    setIsUploadingBanner(true);
    setErrorMsg('');
    try {
      const uploaded = await uploadMediaFile(file);
      setBannerUrl(uploaded.url);
    } catch {
      // Fallback to local DataURL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setBannerUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('O título da série é obrigatório.');
      return;
    }
    setIsSaving(true);
    setErrorMsg('');
    try {
      const seriesData: Series = {
        id: series && !isNew ? series.id : `series-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        genre: genre.trim() || 'Geral',
        year: year.trim() || new Date().getFullYear().toString(),
        synopsis: synopsis.trim() || 'Sem sinopse cadastrada.',
        rating: rating.trim() || '14+',
        bannerUrl: bannerUrl.trim() || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
        createdAt: series && !isNew ? series.createdAt : Date.now(),
      };
      await onSaveSeries(seriesData);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar série:', err);
      setErrorMsg('Falha ao salvar série. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!series || !onDeleteSeries) return;
    setIsDeleting(true);
    try {
      await onDeleteSeries(series.id);
      onClose();
    } catch (err) {
      console.error('Erro ao excluir série:', err);
      setErrorMsg('Falha ao excluir série.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="series-edit-modal"
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-neutral-100"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              {isNew ? <Plus className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  {isNew ? 'Nova Série' : 'Configurações da Série'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {isNew ? 'Cadastrar Nova Série' : `Editar: ${series?.title || 'Série'}`}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Título da Série *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Stranger Things, Breaking Bad, Cyberpunk..."
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:outline-none text-white text-sm placeholder-neutral-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Gênero(s)
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Ex: Ação • Ficção • Suspense"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:outline-none text-white text-sm placeholder-neutral-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Ano de Lançamento
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Ex: 2025"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:outline-none text-white text-sm placeholder-neutral-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Classificação Indicativa
            </label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:outline-none text-white text-sm transition-colors cursor-pointer"
            >
              <option value="Livre">Livre (para todos os públicos)</option>
              <option value="10+">10+ (Não recomendado para menores de 10 anos)</option>
              <option value="12+">12+ (Não recomendado para menores de 12 anos)</option>
              <option value="14+">14+ (Não recomendado para menores de 14 anos)</option>
              <option value="16+">16+ (Não recomendado para menores de 16 anos)</option>
              <option value="18+">18+ (Apenas para maiores de 18 anos)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Sinopse da Série
            </label>
            <textarea
              rows={3}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Descreva a história e premissa da série..."
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:outline-none text-white text-sm placeholder-neutral-500 transition-colors resize-none"
            />
          </div>

          {/* Banner / Poster */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center justify-between">
              <span>Imagem de Capa / Banner (URL ou Upload)</span>
              {isUploadingBanner && <span className="text-blue-400 flex items-center gap-1 text-[11px]"><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</span>}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://exemplo.com/poster.jpg"
                className="flex-1 px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:outline-none text-white text-xs placeholder-neutral-500 transition-colors"
              />
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleBannerUpload(e.target.files[0]);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => bannerFileInputRef.current?.click()}
                disabled={isUploadingBanner}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-neutral-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                Upload
              </button>
            </div>

            {bannerUrl && (
              <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-neutral-800 mt-2">
                <img
                  src={bannerUrl}
                  alt="Pré-visualização da capa"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>

          {/* Delete action if allowed */}
          {!isNew && canDelete && onDeleteSeries && (
            <div className="pt-2 border-t border-neutral-800/80">
              {confirmDelete ? (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2">
                  <p className="text-xs text-rose-200">
                    Tem certeza? Isso excluirá a série <strong>{series?.title}</strong> e todos os seus episódios permanentemente para todos os aparelhos!
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isDeleting ? 'Excluindo...' : 'Sim, Excluir Definitivamente'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir esta série e seus episódios</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploadingBanner}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-blue-900/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isNew ? 'Criar Série' : 'Salvar Alterações'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
