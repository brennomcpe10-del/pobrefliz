import { Episode, Series, SeriesInfo } from '../types';
import {
  DEFAULT_SERIES_INFO,
  fetchAllSeries,
  saveSeriesToServer,
  deleteSeriesFromServer,
  fetchAllEpisodes,
  saveEpisodeToServer,
  deleteEpisodeFromServer,
  resetServerData,
} from './api';
import { saveVideoBlob, deleteVideoBlob } from './idb';

export { DEFAULT_SERIES_INFO };

const LOCAL_EPISODES_KEY = 'portal_episodes_v2';
const LOCAL_SERIES_KEY = 'portal_series_v2';

function getLocalEpisodes(): Episode[] {
  try {
    const raw = localStorage.getItem(LOCAL_EPISODES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalEpisodes(episodes: Episode[]): void {
  try {
    // Strip binary/blob fields from localStorage cache
    const clean = episodes.map(({ videoBlob, ...rest }) => rest);
    localStorage.setItem(LOCAL_EPISODES_KEY, JSON.stringify(clean));
  } catch (err) {
    console.warn('Erro ao salvar episódios no cache local:', err);
  }
}

function getLocalSeries(): Series[] {
  try {
    const raw = localStorage.getItem(LOCAL_SERIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalSeries(series: Series[]): void {
  try {
    localStorage.setItem(LOCAL_SERIES_KEY, JSON.stringify(series));
  } catch (err) {
    console.warn('Erro ao salvar séries no cache local:', err);
  }
}

export async function getAllSeries(): Promise<Series[]> {
  const localList = getLocalSeries();

  try {
    const serverList = await fetchAllSeries();
    if (serverList && serverList.length > 0) {
      // Merge server series with local ones
      const map = new Map<string, Series>();
      serverList.forEach((s) => map.set(s.id, s));
      localList.forEach((s) => {
        if (!map.has(s.id)) map.set(s.id, s);
      });
      const merged = Array.from(map.values());
      setLocalSeries(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Servidor indisponível ao carregar séries, utilizando dados locais:', err);
  }

  if (localList.length > 0) {
    return localList;
  }
  return [DEFAULT_SERIES_INFO];
}

export async function saveSeries(series: Series): Promise<Series> {
  // 1. Immediately persist locally
  const localList = getLocalSeries();
  const idx = localList.findIndex((s) => s.id === series.id);
  if (idx >= 0) {
    localList[idx] = series;
  } else {
    localList.push(series);
  }
  setLocalSeries(localList);

  // 2. Try syncing to server
  try {
    return await saveSeriesToServer(series);
  } catch (err) {
    console.warn('Servidor indisponível ao salvar série, mantida no armazenamento local:', err);
    return series;
  }
}

export async function deleteSeries(seriesId: string): Promise<void> {
  const localList = getLocalSeries().filter((s) => s.id !== seriesId);
  setLocalSeries(localList);

  try {
    await deleteSeriesFromServer(seriesId);
  } catch (err) {
    console.warn('Erro ao remover série do servidor:', err);
  }
}

export async function getAllEpisodes(seriesId?: string): Promise<Episode[]> {
  const localList = getLocalEpisodes();

  try {
    const serverEpisodes = await fetchAllEpisodes(seriesId);
    if (serverEpisodes && Array.isArray(serverEpisodes)) {
      const serverIds = new Set(serverEpisodes.map((ep) => ep.id));
      // Keep any local episodes that haven't been synchronized yet
      const pendingLocal = localList.filter((ep) => (!seriesId || ep.seriesId === seriesId) && !serverIds.has(ep.id));

      const merged = [...serverEpisodes, ...pendingLocal].sort((a, b) => {
        if (a.season !== b.season) return a.season - b.season;
        return a.episodeNumber - b.episodeNumber;
      });
      setLocalEpisodes(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Servidor indisponível ao carregar episódios, usando armazenamento local:', err);
  }

  let filtered = localList;
  if (seriesId) {
    filtered = filtered.filter((e) => e.seriesId === seriesId);
  }
  return filtered.sort((a, b) => {
    if (a.season !== b.season) return a.season - b.season;
    return a.episodeNumber - b.episodeNumber;
  });
}

export async function saveEpisode(episode: Episode): Promise<void> {
  // 1. If there's a local videoBlob, persist to IndexedDB immediately for instant playback
  if (episode.videoBlob) {
    try {
      await saveVideoBlob(episode.id, episode.videoBlob);
    } catch (idbErr) {
      console.warn('Erro ao salvar vídeo no IndexedDB:', idbErr);
    }
  }

  // 2. Persist metadata to localStorage
  const localList = getLocalEpisodes();
  const idx = localList.findIndex((e) => e.id === episode.id);
  if (idx >= 0) {
    localList[idx] = episode;
  } else {
    localList.push(episode);
  }
  setLocalEpisodes(localList);

  // 3. Persist metadata to shared server so mobile, PC, and all devices see it
  try {
    await saveEpisodeToServer(episode);
  } catch (err: any) {
    console.error('Erro ao sincronizar episódio com o servidor:', err);
    throw new Error(err?.message || 'Erro ao sincronizar com o servidor compartilhado');
  }
}

export async function deleteEpisode(id: string): Promise<void> {
  const localList = getLocalEpisodes().filter((e) => e.id !== id);
  setLocalEpisodes(localList);

  try {
    await deleteVideoBlob(id);
  } catch {}

  try {
    await deleteEpisodeFromServer(id);
  } catch (err) {
    console.warn('Erro ao remover episódio do servidor:', err);
  }
}

export async function getSeriesInfo(): Promise<SeriesInfo> {
  const seriesList = await getAllSeries();
  return seriesList[0] || DEFAULT_SERIES_INFO;
}

export async function saveSeriesInfo(info: SeriesInfo): Promise<void> {
  await saveSeries(info);
}

export async function clearAllEpisodes(): Promise<void> {
  setLocalEpisodes([]);
  try {
    await resetServerData();
  } catch {}
}
