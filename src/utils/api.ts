import { Series, Episode } from '../types';

export const DEFAULT_SERIES_INFO: Series = {
  id: 'series-cronicas-infinito',
  title: 'Crônicas do Infinito',
  synopsis: 'Em um mundo onde a tecnologia e o mistério se entrelaçam, uma equipe de exploradores desafia os limites do espaço e do tempo em busca de respostas sobre o passado esquecido da humanidade.',
  genre: 'Ficção Científica • Aventura • Mistério',
  year: '2025',
  bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
  rating: '14+',
  createdAt: Date.now(),
};

/**
 * Busca todas as séries salvas no servidor compartilhado.
 * Sincronizado para todos os celulares e computadores.
 */
export async function fetchAllSeries(): Promise<Series[]> {
  try {
    const res = await fetch('/api/series', {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: Series[] = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return [DEFAULT_SERIES_INFO];
  } catch (err) {
    console.warn('Servidor offline ou inicializando, usando série padrão:', err);
    return [DEFAULT_SERIES_INFO];
  }
}

/**
 * Salva ou atualiza uma série no servidor para que todos os aparelhos vejam.
 */
export async function saveSeriesToServer(series: Series): Promise<Series> {
  const res = await fetch('/api/series', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(series),
  });
  if (!res.ok) {
    throw new Error(`Falha ao salvar série (HTTP ${res.status})`);
  }
  return await res.json();
}

/**
 * Exclui uma série e seus episódios no servidor.
 */
export async function deleteSeriesFromServer(seriesId: string): Promise<void> {
  const res = await fetch(`/api/series/${encodeURIComponent(seriesId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Falha ao excluir série (HTTP ${res.status})`);
  }
}

/**
 * Busca todos os episódios do servidor. Pode filtrar por seriesId.
 */
export async function fetchAllEpisodes(seriesId?: string): Promise<Episode[]> {
  try {
    const url = seriesId ? `/api/episodes?seriesId=${encodeURIComponent(seriesId)}` : '/api/episodes';
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: Episode[] = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Erro ao carregar episódios do servidor:', err);
    return [];
  }
}

/**
 * Salva um episódio no servidor.
 */
export async function saveEpisodeToServer(episode: Episode): Promise<Episode> {
  // Strip non-serializable or heavy binary fields before posting to server
  const { videoBlob, ...cleanEpisode } = episode;

  const res = await fetch('/api/episodes', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(cleanEpisode),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Falha ao salvar episódio no servidor compartilhado (HTTP ${res.status}${errorText ? ': ' + errorText : ''})`);
  }
  return await res.json();
}

/**
 * Remove um episódio do servidor.
 */
export async function deleteEpisodeFromServer(episodeId: string): Promise<void> {
  const res = await fetch(`/api/episodes/${encodeURIComponent(episodeId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Falha ao excluir episódio (HTTP ${res.status})`);
  }
}

/**
 * Envia um arquivo de vídeo ou imagem para o armazenamento compartilhado do servidor.
 * Utiliza upload fragmentado (chunks de 2MB) para garantir que arquivos de qualquer tamanho (50MB, 200MB, 1GB+)
 * passem com sucesso sem atingir os limites de proxy reverso e com reconexão automática.
 * Retorna a URL pública `/uploads/...` acessível por qualquer celular ou PC.
 */
export async function uploadMediaFile(
  file: File | Blob,
  fileName?: string | ((percent: number) => void),
  fileType?: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; fileName: string; fileSize: number; fileType: string }> {
  let resolvedFileName = (file as any).name || 'arquivo.mp4';
  let resolvedFileType = file.type || 'video/mp4';
  let progressCallback = onProgress;

  if (typeof fileName === 'function') {
    progressCallback = fileName;
  } else if (typeof fileName === 'string' && fileName.trim()) {
    resolvedFileName = fileName.trim();
  }

  if (fileType && typeof fileType === 'string' && fileType.trim()) {
    resolvedFileType = fileType.trim();
  }

  const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB por pedaço (rápido e seguro)
  const actualSize = file.size;
  const totalChunks = Math.max(1, Math.ceil(actualSize / CHUNK_SIZE));
  const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  let finalResult: { url: string; fileName: string; fileSize: number; fileType: string } | null = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(actualSize, start + CHUNK_SIZE);
    const chunkBlob = file.slice(start, end);

    let attempts = 0;
    let success = false;
    let lastError: Error | null = null;

    while (attempts < 3 && !success) {
      attempts++;
      try {
        const result = await uploadSingleChunk(
          chunkBlob,
          uploadId,
          chunkIndex,
          totalChunks,
          resolvedFileName,
          actualSize,
          resolvedFileType,
          (chunkLoaded) => {
            if (progressCallback) {
              const uploadedBytes = start + chunkLoaded;
              const percent = Math.min(99, Math.round((uploadedBytes / actualSize) * 100));
              progressCallback(percent);
            }
          }
        );

        if (chunkIndex === totalChunks - 1 && result?.url) {
          finalResult = result;
          if (progressCallback) progressCallback(100);
        }
        success = true;
      } catch (err: any) {
        lastError = err;
        // Wait before retrying
        await new Promise((r) => setTimeout(r, 600 * attempts));
      }
    }

    if (!success) {
      throw lastError || new Error(`Falha ao enviar pedaço ${chunkIndex + 1} de ${totalChunks}`);
    }
  }

  if (!finalResult?.url) {
    throw new Error('Servidor não retornou a URL pública do vídeo');
  }

  return finalResult;
}

/**
 * Envia um único pedaço de vídeo para o endpoint /api/upload-chunk
 */
function uploadSingleChunk(
  chunk: Blob,
  uploadId: string,
  chunkIndex: number,
  totalChunks: number,
  fileName: string,
  fileSize: number,
  fileType: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<{ url: string; fileName: string; fileSize: number; fileType: string } | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    // Append metadata fields first before the binary chunk
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('fileName', fileName);
    formData.append('fileSize', fileSize.toString());
    formData.append('fileType', fileType);
    formData.append('chunk', chunk, 'chunk.bin');

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(e.loaded, e.total);
        }
      });
    }

    const queryUrl = `/api/upload-chunk?uploadId=${encodeURIComponent(uploadId)}&chunkIndex=${chunkIndex}&totalChunks=${totalChunks}&fileName=${encodeURIComponent(fileName)}&fileType=${encodeURIComponent(fileType)}`;
    xhr.open('POST', queryUrl);
    xhr.withCredentials = true; // Necessário para cookies e validação de sessão em iframes
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch {
          reject(new Error('Resposta inválida do servidor de upload'));
        }
      } else {
        let msg = `Erro HTTP ${xhr.status}`;
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (errRes.error) msg = errRes.error;
        } catch {}
        reject(new Error(`Erro ao enviar pedaço do vídeo: ${msg}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Falha de conexão com o servidor de upload'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Tempo limite excedido ao enviar pedaço do vídeo'));
    };

    xhr.timeout = 60000; // 60s timeout

    xhr.send(formData);
  });
}

/**
 * Sincroniza um episódio local que ainda não está no servidor ou cujo vídeo não foi enviado.
 */
export async function syncLocalEpisodeToServer(
  episode: Episode,
  onProgress?: (percent: number) => void
): Promise<Episode> {
  let updatedEp = { ...episode };

  // Se tem um videoBlob local e a videoUrl não aponta para o servidor compartilhado (/uploads/...)
  if (episode.videoBlob && (!episode.videoUrl || !episode.videoUrl.startsWith('/uploads/'))) {
    const uploadRes = await uploadMediaFile(
      episode.videoBlob,
      episode.fileName || `${episode.title}.mp4`,
      episode.fileType || 'video/mp4',
      onProgress
    );
    if (uploadRes?.url) {
      updatedEp.videoUrl = uploadRes.url;
    }
  }

  const saved = await saveEpisodeToServer(updatedEp);
  return { ...updatedEp, ...saved };
}

/**
 * Restaura dados de exemplo no servidor compartilhado.
 */
export async function resetServerData(): Promise<{ series: Series[]; episodes: Episode[] }> {
  const res = await fetch('/api/reset', { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao restaurar dados padrão');
  return await res.json();
}
