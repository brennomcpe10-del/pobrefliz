import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileVideo,
  CheckCircle2,
  Image as ImageIcon,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
  Tv,
} from 'lucide-react';
import { Episode, Series } from '../types';
import {
  formatBytes,
  formatDuration,
  cleanFileNameToTitle,
  generateVideoThumbnail,
} from '../utils/helpers';
import { uploadMediaFile } from '../utils/api';

interface EpisodeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEpisode: (episode: Episode) => Promise<void>;
  existingEpisodes: Episode[];
  episodeToEdit?: Episode | null;
  seriesList: Series[];
  activeSeriesId?: string;
}

export const EpisodeUploadModal: React.FC<EpisodeUploadModalProps> = ({
  isOpen,
  onClose,
  onSaveEpisode,
  existingEpisodes,
  episodeToEdit,
  seriesList,
  activeSeriesId,
}) => {
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Form Fields
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [season, setSeason] = useState(1);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [duration, setDuration] = useState<number>(0);
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('');

  // UI States
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const customThumbInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when opening
  useEffect(() => {
    if (!isOpen) return;

    setUploadProgress(null);

    const defaultSeries = activeSeriesId || seriesList[0]?.id || '';
    setSelectedSeriesId(episodeToEdit?.seriesId || defaultSeries);

    if (episodeToEdit) {
      setTitle(episodeToEdit.title);
      setSeason(episodeToEdit.season);
      setEpisodeNumber(episodeToEdit.episodeNumber);
      setDescription(episodeToEdit.description || '');
      setThumbnailUrl(episodeToEdit.thumbnailUrl || '');
      setDuration(episodeToEdit.duration || 0);
      setFileSize(episodeToEdit.fileSize || 0);
      setFileName(episodeToEdit.fileName || '');
      setVideoUrlInput(episodeToEdit.videoUrl || '');
      setUploadMode(episodeToEdit.videoUrl?.startsWith('/uploads/') ? 'file' : 'url');
      setSelectedFile(null);
    } else {
      // Find latest season and suggest next episode number for the selected series
      const seriesEps = existingEpisodes.filter(
        (e) => e.seriesId === (activeSeriesId || seriesList[0]?.id)
      );
      const maxSeason = seriesEps.length > 0 ? Math.max(...seriesEps.map((e) => e.season)) : 1;
      const epsInSeason = seriesEps.filter((e) => e.season === maxSeason);
      const nextEpNum = epsInSeason.length > 0 ? Math.max(...epsInSeason.map((e) => e.episodeNumber)) + 1 : 1;

      setSeason(maxSeason);
      setEpisodeNumber(nextEpNum);
      setTitle('');
      setDescription('');
      setThumbnailUrl('');
      setDuration(0);
      setFileSize(0);
      setFileName('');
      setSelectedFile(null);
      setVideoUrlInput('');
      setUploadMode('file');
      setErrorMsg('');
    }
  }, [isOpen, episodeToEdit, existingEpisodes, seriesList, activeSeriesId]);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mkv|webm|avi|mov|m4v)$/i)) {
      setErrorMsg('Por favor, selecione um arquivo de vídeo válido (MP4, WebM, MKV, MOV, etc).');
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);
    setFileName(file.name);
    setFileSize(file.size);

    if (!title || title.trim() === '') {
      setTitle(cleanFileNameToTitle(file.name));
    }

    // Process thumbnail and duration from the video file locally
    setIsProcessingFile(true);
    try {
      const result = await generateVideoThumbnail(file);
      if (result.thumbnailUrl && !thumbnailUrl) {
        setThumbnailUrl(result.thumbnailUrl);
      }
      if (result.duration > 0) {
        setDuration(result.duration);
      }
    } catch (err) {
      console.warn('Erro ao extrair miniatura do vídeo:', err);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleCustomThumbnail = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('O arquivo de miniatura precisa ser uma imagem (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setThumbnailUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg('Por favor, informe o título do episódio.');
      return;
    }

    if (uploadMode === 'file' && !selectedFile && !episodeToEdit?.videoUrl && !episodeToEdit?.videoBlob) {
      setErrorMsg('Por favor, selecione um arquivo de vídeo para o episódio.');
      return;
    }

    if (uploadMode === 'url' && !videoUrlInput.trim() && !episodeToEdit) {
      setErrorMsg('Por favor, informe a URL direta do vídeo.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      let finalVideoUrl = episodeToEdit?.videoUrl || '';

      // If user selected a local file, upload it to the server so ALL devices (phones, tablets, PCs) can watch it!
      if (uploadMode === 'file' && selectedFile) {
        setUploadProgress(1);
        try {
          const uploadRes = await uploadMediaFile(
            selectedFile,
            selectedFile.name,
            selectedFile.type || 'video/mp4',
            (percent) => {
              setUploadProgress(percent);
            }
          );
          if (uploadRes?.url) {
            finalVideoUrl = uploadRes.url;
          } else {
            throw new Error('O servidor não retornou a URL pública do vídeo');
          }
        } catch (uploadErr: any) {
          console.error('Falha no upload do vídeo:', uploadErr);
          throw new Error(`Falha no upload do vídeo para o servidor: ${uploadErr?.message || 'Erro de conexão'}`);
        }
      } else if (uploadMode === 'url') {
        finalVideoUrl = videoUrlInput.trim();
      }

      if (!finalVideoUrl && !selectedFile && !episodeToEdit?.videoBlob) {
        throw new Error('Nenhum vídeo válido fornecido. Selecione um arquivo ou URL de vídeo.');
      }

      const epId = episodeToEdit?.id || `ep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const newEpisode: Episode = {
        id: epId,
        seriesId: selectedSeriesId || activeSeriesId || seriesList[0]?.id || 'series-default',
        title: title.trim(),
        season: Number(season) || 1,
        episodeNumber: Number(episodeNumber) || 1,
        description: description.trim(),
        duration: duration || (episodeToEdit?.duration || 0),
        thumbnailUrl: thumbnailUrl || episodeToEdit?.thumbnailUrl || '',
        videoUrl: finalVideoUrl,
        videoBlob: selectedFile || episodeToEdit?.videoBlob,
        fileName: fileName || (selectedFile?.name || episodeToEdit?.fileName || `episodio_${season}x${episodeNumber}.mp4`),
        fileSize: fileSize || selectedFile?.size || episodeToEdit?.fileSize || 0,
        fileType: selectedFile?.type || episodeToEdit?.fileType || 'video/mp4',
        createdAt: episodeToEdit?.createdAt || Date.now(),
        watched: episodeToEdit?.watched || false,
      };

      await onSaveEpisode(newEpisode);
      onClose();
    } catch (err: any) {
      console.error('Falha ao salvar episódio:', err);
      setErrorMsg(err?.message || 'Erro ao salvar episódio. Verifique se o servidor está ativo.');
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="episode-upload-modal"
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-neutral-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileVideo className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Sincronização em Nuvem
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {episodeToEdit ? 'Editar Episódio' : 'Publicar Novo Episódio'}
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Series Selection */}
          {seriesList.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-blue-400" />
                <span>Série de Destino *</span>
              </label>
              <select
                value={selectedSeriesId}
                onChange={(e) => setSelectedSeriesId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:outline-none text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.year})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                uploadMode === 'file'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-blue-400" />
              Arquivo do Dispositivo
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('url')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                uploadMode === 'url'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LinkIcon className="w-4 h-4 text-blue-400" />
              Link Direto Web
            </button>
          </div>

          {/* Video Selection Area */}
          {uploadMode === 'file' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,.mp4,.mkv,.webm,.avi,.mov,.m4v"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : selectedFile || episodeToEdit?.fileName
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-neutral-800 hover:border-blue-500/50 bg-neutral-950/40 hover:bg-neutral-950/80'
                }`}
              >
                {isProcessingFile ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-sm font-medium text-neutral-300">
                      Processando vídeo e gerando capa automática...
                    </p>
                  </div>
                ) : selectedFile || episodeToEdit?.fileName ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full text-left">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {selectedFile ? selectedFile.name : episodeToEdit?.fileName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-400">
                        <span>Tamanho: <strong className="text-neutral-200">{formatBytes(fileSize || selectedFile?.size)}</strong></span>
                        {duration > 0 && (
                          <>
                            <span>•</span>
                            <span>Duração: <strong className="text-neutral-200">{formatDuration(duration)}</strong></span>
                          </>
                        )}
                        <span className="text-emerald-400 font-medium ml-auto">Clique para trocar</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold text-blue-400">Escolha o arquivo de vídeo</span> ou arraste até aqui
                    </div>
                    <p className="text-xs text-neutral-400">
                      Formatos: MP4, WebM, MKV, AVI • Arquivo sincronizado automaticamente para todos os aparelhos
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                URL Direta do Arquivo de Vídeo
              </label>
              <input
                type="url"
                value={videoUrlInput}
                onChange={(e) => {
                  setVideoUrlInput(e.target.value);
                  if (!title && e.target.value) {
                    const parts = e.target.value.split('/');
                    const last = parts[parts.length - 1];
                    if (last) setTitle(cleanFileNameToTitle(last));
                  }
                }}
                placeholder="https://exemplo.com/videos/episodio_01.mp4"
                className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:outline-none text-white text-sm placeholder-neutral-500 transition-colors"
              />
            </div>
          )}

          {/* Episode Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center justify-between">
              <span>Título do Episódio *</span>
              <span className="text-[10px] text-neutral-500 lowercase">obrigatório</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: 01. O Início de Tudo"
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:outline-none text-white text-sm placeholder-neutral-500 transition-colors"
            />
          </div>

          {/* Season & Episode Number */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Temporada
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="99"
                  required
                  value={season}
                  onChange={(e) => setSeason(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:outline-none text-white text-sm transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-bold">
                  TEMP
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Número do Episódio
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="999"
                  required
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:outline-none text-white text-sm transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-bold">
                  EP
                </span>
              </div>
            </div>
          </div>

          {/* Synopsis / Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center justify-between">
              <span>Sinopse / Descrição</span>
              <span className="text-[10px] text-neutral-500">opcional</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve resumo sobre o que acontece neste episódio..."
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:outline-none text-white text-sm placeholder-neutral-500 transition-colors resize-none"
            />
          </div>

          {/* Thumbnail / Cover */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center justify-between">
              <span>Capa / Miniatura</span>
              {thumbnailUrl && (
                <button
                  type="button"
                  onClick={() => setThumbnailUrl('')}
                  className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  Remover
                </button>
              )}
            </label>

            <div className="flex items-center gap-3">
              {thumbnailUrl ? (
                <div className="relative w-28 h-16 sm:w-36 sm:h-20 rounded-xl overflow-hidden border border-neutral-700 shrink-0">
                  <img
                    src={thumbnailUrl}
                    alt="Miniatura"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-28 h-16 sm:w-36 sm:h-20 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 flex flex-col items-center justify-center text-neutral-500 shrink-0">
                  <ImageIcon className="w-5 h-5 mb-1 text-neutral-600" />
                  <span className="text-[10px]">Sem capa</span>
                </div>
              )}

              <div className="flex-1 space-y-1.5">
                <input
                  ref={customThumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleCustomThumbnail(e.target.files[0]);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => customThumbInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-neutral-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  Personalizar Imagem
                </button>
              </div>
            </div>
          </div>

          {/* Upload Progress Bar if uploading file to server */}
          {uploadProgress !== null && (
            <div className="space-y-1.5 p-3 rounded-xl bg-blue-950/40 border border-blue-800/60">
              <div className="flex items-center justify-between text-xs text-blue-300">
                <span>Enviando vídeo para o servidor compartilhado...</span>
                <span className="font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-150 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold text-neutral-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-save-episode"
              type="submit"
              disabled={isSaving || isProcessingFile}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white transition-all duration-150 shadow-lg shadow-blue-900/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publicando no Servidor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{episodeToEdit ? 'Salvar Alterações' : 'Publicar Episódio'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
