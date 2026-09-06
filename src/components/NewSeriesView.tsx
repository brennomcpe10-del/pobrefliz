import React, { useState, useRef } from 'react';
import {
  Film,
  Tv,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowLeft,
  Sparkles,
  Upload,
  Link as LinkIcon,
  Eye,
  Lock,
  Unlock,
  Layers,
  Calendar,
  Tag,
  Shield,
  Loader2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Series } from '../types';
import { uploadMediaFile } from '../utils/api';

interface NewSeriesViewProps {
  isAdmin: boolean;
  onSaveSeries: (series: Series) => Promise<void>;
  onSaveAndAddEpisode?: (series: Series) => void;
  onCancel: () => void;
  onRequestAdmin: () => void;
  onAdminUnlock: () => void;
  existingSeries?: Series[];
}

// Age rating presets with standard Brazilian rating colors
const RATINGS = [
  { label: 'Livre', value: 'L', bg: 'bg-emerald-600', text: 'text-white', desc: 'Todas as idades' },
  { label: '10+', value: '10+', bg: 'bg-blue-600', text: 'text-white', desc: 'Não recomendado p/ menores de 10 anos' },
  { label: '12+', value: '12+', bg: 'bg-amber-500', text: 'text-black', desc: 'Não recomendado p/ menores de 12 anos' },
  { label: '14+', value: '14+', bg: 'bg-orange-600', text: 'text-white', desc: 'Não recomendado p/ menores de 14 anos' },
  { label: '16+', value: '16+', bg: 'bg-red-600', text: 'text-white', desc: 'Não recomendado p/ menores de 16 anos' },
  { label: '18+', value: '18+', bg: 'bg-neutral-900 border border-red-500', text: 'text-red-400', desc: 'Apenas para maiores de 18 anos' },
];

// Quick genre presets
const GENRE_TAGS = [
  'Ação',
  'Ficção Científica',
  'Aventura',
  'Drama',
  'Fantasia',
  'Suspense',
  'Anime',
  'Terror',
  'Comédia',
  'Crime',
  'Mistério',
  'Sobrenatural',
];

// High-quality cinematic cover presets
const COVER_PRESETS = [
  {
    name: 'Sci-Fi / Espaço',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
  },
  {
    name: 'Cyberpunk / Neon',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1920&auto=format&fit=crop',
  },
  {
    name: 'Fantasia / Natureza',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
  },
  {
    name: 'Drama / Noturno',
    url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1920&auto=format&fit=crop',
  },
];

export const NewSeriesView: React.FC<NewSeriesViewProps> = ({
  isAdmin,
  onSaveSeries,
  onSaveAndAddEpisode,
  onCancel,
  onRequestAdmin,
  onAdminUnlock,
  existingSeries = [],
}) => {
  const currentYear = new Date().getFullYear().toString();

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Ação • Ficção Científica');
  const [year, setYear] = useState(currentYear);
  const [synopsis, setSynopsis] = useState('');
  const [rating, setRating] = useState('14+');
  const [bannerUrl, setBannerUrl] = useState(COVER_PRESETS[0].url);

  // Status & states
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick genre toggle
  const handleToggleGenreTag = (tag: string) => {
    if (!genre.trim()) {
      setGenre(tag);
      return;
    }
    const parts = genre.split('•').map((s) => s.trim()).filter(Boolean);
    if (parts.includes(tag)) {
      const remaining = parts.filter((p) => p !== tag);
      setGenre(remaining.join(' • '));
    } else {
      if (parts.length >= 3) {
        setGenre([...parts.slice(1), tag].join(' • '));
      } else {
        setGenre([...parts, tag].join(' • '));
      }
    }
  };

  // Upload local cover file
  const handleBannerUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecione uma imagem válida (JPG, PNG ou WebP).');
      return;
    }
    setIsUploadingBanner(true);
    setUploadError('');
    try {
      const uploaded = await uploadMediaFile(file);
      setBannerUrl(uploaded.url);
    } catch {
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

  // Quick pin unlock on this page
  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin.trim() === '0409') {
      onAdminUnlock();
      setAdminPinError('');
    } else {
      setAdminPinError('Senha incorreta. Tente novamente.');
    }
  };

  // Fill sample synopsis
  const handleSampleSynopsis = () => {
    setSynopsis(
      'Em um futuro próximo onde tecnologias quânticas alteram a percepção temporal, uma equipe de especialistas se une para desvendar anomalias misteriosas antes que a realidade seja reescrita para sempre.'
    );
  };

  // Save series
  const handleSave = async (andAddEpisode = false) => {
    if (!title.trim()) {
      setUploadError('Digite o título da série antes de continuar.');
      return;
    }

    if (!isAdmin) {
      if (adminPin.trim() === '0409') {
        onAdminUnlock();
      } else {
        setAdminPinError('Digite a senha de administrador para autorizar a publicação.');
        return;
      }
    }

    setIsSaving(true);
    setUploadError('');

    try {
      const newSeries: Series = {
        id: `series-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        genre: genre.trim() || 'Geral',
        year: year.trim() || currentYear,
        synopsis: synopsis.trim() || 'Sem descrição cadastrada.',
        rating: rating,
        bannerUrl: bannerUrl.trim() || COVER_PRESETS[0].url,
        createdAt: Date.now(),
      };

      await onSaveSeries(newSeries);

      if (andAddEpisode && onSaveAndAddEpisode) {
        onSaveAndAddEpisode(newSeries);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar a série.';
      setUploadError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900/80 border border-neutral-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-md">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
            <button
              onClick={onCancel}
              className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Início</span>
            </button>
            <span>/</span>
            <span className="text-blue-400">Novo Cadastro</span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
              <Film className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span>Layout de Nova Série</span>
          </h1>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
            Cadastre uma nova série no catálogo. Ela ficará imediatamente disponível para streaming e download em todos os dispositivos sincronizados.
          </p>
        </div>

        {/* Admin status chip */}
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin ? (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs font-bold text-emerald-400 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Admin Autorizado</span>
            </div>
          ) : (
            <button
              onClick={onRequestAdmin}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs font-bold text-amber-300 hover:bg-amber-900/50 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Requer Senha Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Form (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (7 cols on lg) */}
        <div className="lg:col-span-7 bg-neutral-900/70 border border-neutral-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">Informações da Série</h2>
            </div>
            <span className="text-[11px] text-neutral-400">
              {existingSeries.length} {existingSeries.length === 1 ? 'série existente' : 'séries existentes'}
            </span>
          </div>

          {/* Error Message if any */}
          {uploadError && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
              Título da Série <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Stranger Things, The Last of Us, Arcane, etc."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-neutral-500 outline-none transition-all"
            />
          </div>

          {/* Genre Input & Quick Badges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                Gênero / Categorias
              </label>
              <span className="text-[10px] text-neutral-400">Clique para alternar tags</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {GENRE_TAGS.map((tag) => {
                const isSelected = genre.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleGenreTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-900/20'
                        : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Ex: Ficção Científica • Ação • Drama"
              className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Year and Age Rating row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Year */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center justify-between">
                <span>Ano de Lançamento</span>
                <span className="text-[10px] text-neutral-500 font-normal">4 dígitos</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder={currentYear}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
                <div className="flex items-center gap-1">
                  {['2026', '2025', '2024'].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(y)}
                      className={`px-2 py-1 text-[11px] rounded-lg border font-semibold cursor-pointer transition-colors ${
                        year === y
                          ? 'bg-neutral-800 border-neutral-600 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Age Rating */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                Classificação Indicativa
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {RATINGS.map((r) => {
                  const isSelected = rating === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRating(r.value)}
                      title={r.desc}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${r.bg} ${r.text} ${
                        isSelected
                          ? 'ring-2 ring-white scale-105 shadow-md'
                          : 'opacity-50 hover:opacity-100 hover:scale-102'
                      }`}
                    >
                      {r.value}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Synopsis */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                Sinopse / Descrição
              </label>
              <button
                type="button"
                onClick={handleSampleSynopsis}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Usar Sinopse Modelo</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Descreva a história, premissa e detalhes da série..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs sm:text-sm text-neutral-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Cover / Banner Section */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Imagem de Capa / Pôster</span>
              </label>
              <span className="text-[10px] text-neutral-500">Formato 16:9 ou pôster</span>
            </div>

            {/* Upload Button or URL Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleBannerUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingBanner}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800/80 border border-dashed border-neutral-700 hover:border-blue-500 text-neutral-300 hover:text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUploadingBanner ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Enviando imagem...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-blue-400" />
                      <span>Escolher Imagem do Dispositivo</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="Ou cole a URL da imagem da web..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Quick Presets Gallery */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                Capas Cinematográficas Prontas:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COVER_PRESETS.map((preset) => {
                  const isSelected = bannerUrl === preset.url;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setBannerUrl(preset.url)}
                      className={`relative rounded-xl overflow-hidden aspect-video border text-left transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/50 scale-102'
                          : 'border-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-1.5">
                        <span className="text-[10px] font-bold text-white leading-tight">
                          {preset.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Admin Unlock Box (if not already admin) */}
          {!isAdmin && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Lock className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Autorização de Administrador</h4>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Para evitar modificações acidentais no catálogo compartilhado, digite a senha de administrador:
              </p>

              <form onSubmit={handleUnlockPin} className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={10}
                  value={adminPin}
                  onChange={(e) => {
                    setAdminPin(e.target.value);
                    setAdminPinError('');
                    if (e.target.value === '0409') {
                      onAdminUnlock();
                    }
                  }}
                  placeholder="Digite a senha"
                  className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-sm font-mono text-white placeholder-neutral-500 focus:border-amber-400 outline-none w-36"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors cursor-pointer"
                >
                  Liberar Publicação
                </button>
              </form>

              {adminPinError && (
                <p className="text-[11px] text-rose-400 font-medium">{adminPinError}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 text-xs sm:text-sm font-semibold border border-neutral-800 transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>

            <button
              type="button"
              id="btn-save-series-only"
              onClick={() => handleSave(false)}
              disabled={isSaving || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-102 active:scale-98"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando Série...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar e Publicar Série</span>
                </>
              )}
            </button>

            {onSaveAndAddEpisode && (
              <button
                type="button"
                id="btn-save-and-add-ep"
                onClick={() => handleSave(true)}
                disabled={isSaving || !title.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-102 active:scale-98"
                title="Salva a série e abre a janela para upload do primeiro episódio"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar e Adicionar Episódio</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Preview Mockup (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Pré-visualização em Tempo Real</h3>
            </div>
            <span className="text-[11px] text-neutral-500">Como ficará no portal</span>
          </div>

          {/* Banner Hero Preview */}
          <div className="w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-xl relative aspect-[16/10] sm:aspect-video group">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt={title || 'Prévia'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-neutral-950 flex items-center justify-center text-neutral-600">
                <Tv className="w-12 h-12" />
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent flex flex-col justify-end p-4 sm:p-5">
              <div className="space-y-2">
                {/* Meta tags & Age rating badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                    NOVA SÉRIE
                  </span>

                  <span className="text-xs font-semibold text-neutral-300">
                    {year || currentYear}
                  </span>

                  <span className="text-neutral-500">•</span>

                  <span className="text-xs font-medium text-neutral-300 truncate max-w-[160px]">
                    {genre || 'Ação • Ficção'}
                  </span>

                  {/* Rating pill */}
                  {rating && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-neutral-900 border border-neutral-700 text-white">
                      {rating}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight">
                  {title.trim() || 'Título da Sua Nova Série'}
                </h2>

                {/* Synopsis snippet */}
                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                  {synopsis.trim() || 'A sinopse completa da sua série será exibida aqui para todos os espectadores do portal.'}
                </p>

                {/* Simulated action buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold shadow-sm opacity-90">
                    Assistir Agora
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-white text-[11px] font-semibold">
                    Ver 0 Episódios
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Catalog Mini Card Preview */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Visualização no Menu de Séries:
            </span>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="w-10 h-12 rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-neutral-800">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt={title || 'Prévia'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    <Tv className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase">
                  {genre.split('•')[0] || 'Gênero'} • {year || currentYear}
                </span>
                <h4 className="text-xs font-bold text-white truncate">
                  {title.trim() || 'Nome da Série'}
                </h4>
                <span className="text-[10px] text-neutral-500">0 episódios cadastrados</span>
              </div>
            </div>
          </div>

          {/* Features info card */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 text-xs text-neutral-400 space-y-2">
            <h4 className="text-white font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>O que acontece após salvar?</span>
            </h4>
            <ul className="space-y-1 text-[11px] text-neutral-400">
              <li>• A nova série aparecerá imediatamente na barra superior de seleção.</li>
              <li>• Você poderá adicionar episódios com upload de vídeos MP4/MKV e legendas.</li>
              <li>• Todos os aparelhos sincronizados terão acesso ao novo conteúdo em tempo real.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
