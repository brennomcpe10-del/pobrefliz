import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Film,
  Plus,
  Tv,
  CheckCircle2,
  AlertCircle,
  Download,
  Search,
  Sparkles,
  Info,
  Lock,
  Unlock,
  LogOut,
  Home,
  Eye,
  Shield,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { Episode, Series } from './types';
import {
  getAllSeries,
  saveSeries,
  deleteSeries,
  getAllEpisodes,
  saveEpisode,
  deleteEpisode,
  clearAllEpisodes,
  DEFAULT_SERIES_INFO,
} from './utils/db';
import {
  syncLocalEpisodeToServer,
} from './utils/api';
import { saveVideoBlob, getVideoBlob, deleteVideoBlob } from './utils/idb';
import { Header } from './components/Header';
import { EpisodeCard } from './components/EpisodeCard';
import { EpisodeUploadModal } from './components/EpisodeUploadModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { SeriesEditModal } from './components/SeriesEditModal';
import { SeriesSelectorBar } from './components/SeriesSelectorBar';
import { SeriesDrawerModal } from './components/SeriesDrawerModal';
import { MobileNav } from './components/MobileNav';
import { SeasonFilter } from './components/SeasonFilter';
import { EmptyState } from './components/EmptyState';
import { HomeView } from './components/HomeView';
import { AdminAuthModal } from './components/AdminAuthModal';
import { NewSeriesView } from './components/NewSeriesView';
import { SyncDevicesModal } from './components/SyncDevicesModal';

export default function App() {
  const [seriesList, setSeriesList] = useState<Series[]>([DEFAULT_SERIES_INFO]);
  const [activeSeries, setActiveSeries] = useState<Series>(DEFAULT_SERIES_INFO);
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Active view tab: 'home' (Início) or 'episodes' (Catálogo de episódios) or 'new-series' (Layout de nova série)
  const [currentTab, setCurrentTab] = useState<'home' | 'episodes' | 'new-series'>('home');

  // Role: Viewer by default, unlocked with admin password
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<boolean>(false);

  // Filters & Sorting for active series
  const [selectedSeason, setSelectedSeason] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'number' | 'date' | 'title'>('number');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditSeriesOpen, setIsEditSeriesOpen] = useState(false);
  const [isNewSeriesModalOpen, setIsNewSeriesModalOpen] = useState(false);
  const [isSeriesDrawerOpen, setIsSeriesDrawerOpen] = useState(false);
  const [isSyncDevicesModalOpen, setIsSyncDevicesModalOpen] = useState(false);
  const [seriesToEdit, setSeriesToEdit] = useState<Series | null>(null);
  const [episodeToEdit, setEpisodeToEdit] = useState<Episode | null>(null);
  const [activePlayEpisode, setActivePlayEpisode] = useState<Episode | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Synchronize data from the shared server for all devices
  const refreshData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const [loadedSeries, loadedEpisodes] = await Promise.all([
        getAllSeries(),
        getAllEpisodes(),
      ]);

      if (loadedSeries.length > 0) {
        setSeriesList(loadedSeries);
        setActiveSeries((prev) => {
          const found = loadedSeries.find((s) => s.id === prev.id);
          return found || loadedSeries[0];
        });
      }

      // Enrich episodes with local IndexedDB video blobs if available
      const enrichedEpisodes = await Promise.all(
        loadedEpisodes.map(async (ep) => {
          if (!ep.videoBlob) {
            const localBlob = await getVideoBlob(ep.id);
            if (localBlob) {
              return { ...ep, videoBlob: localBlob };
            }
          }
          return ep;
        })
      );

      setAllEpisodes(enrichedEpisodes);

      // Background auto-sync: If any local episode has a videoBlob but hasn't uploaded to the shared server yet
      for (const ep of enrichedEpisodes) {
        if (ep.videoBlob && (!ep.videoUrl || !ep.videoUrl.startsWith('/uploads/'))) {
          syncLocalEpisodeToServer(ep)
            .then(async (synced) => {
              await saveEpisode(synced);
            })
            .catch((syncErr) => {
              console.warn('Auto-sincronização do episódio em segundo plano aguardando:', syncErr);
            });
        }
      }
    } catch (err) {
      console.warn('Erro ao sincronizar dados com o servidor:', err);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await refreshData(true);
      setIsLoading(false);
    }
    init();

    // Periodic poll every 8 seconds to synchronize across all devices in real-time
    const interval = setInterval(() => {
      refreshData(true);
    }, 8000);

    // Refresh when user returns to tab
    const handleFocus = () => refreshData(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshData]);

  // Episodes of the currently selected series
  const activeSeriesEpisodes = useMemo(() => {
    return allEpisodes.filter((ep) => ep.seriesId === activeSeries.id);
  }, [allEpisodes, activeSeries.id]);

  // Distinct seasons list for active series
  const seasons = useMemo(() => {
    const set = new Set<number>(activeSeriesEpisodes.map((e) => e.season));
    return Array.from(set).sort((a: number, b: number) => a - b);
  }, [activeSeriesEpisodes]);

  // Filter & Sort active series episodes
  const filteredEpisodes = useMemo(() => {
    return activeSeriesEpisodes
      .filter((ep) => {
        if (selectedSeason !== 'all' && ep.season !== selectedSeason) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = ep.title.toLowerCase().includes(q);
          const matchDesc = (ep.description || '').toLowerCase().includes(q);
          const matchNumber = `ep ${ep.episodeNumber}`.includes(q) || `e${ep.episodeNumber}`.includes(q);
          return matchTitle || matchDesc || matchNumber;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'number') {
          if (a.season !== b.season) return a.season - b.season;
          return a.episodeNumber - b.episodeNumber;
        }
        if (sortBy === 'date') {
          return b.createdAt - a.createdAt;
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [activeSeriesEpisodes, selectedSeason, searchQuery, sortBy]);

  // Admin login handler
  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    showToast('Modo Administrador ativado! Você pode gerenciar séries e episódios.', 'success');
  };

  // Admin logout handler
  const handleAdminLogout = () => {
    setIsAdmin(false);
    showToast('Sessão encerrada. Você voltou ao Modo Visualizador.', 'info');
  };

  // Series actions
  const handleSaveSeries = async (series: Series) => {
    const saved = await saveSeries(series);
    setSeriesList((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setActiveSeries(saved);
    showToast(`Série "${saved.title}" salva e sincronizada!`, 'success');
  };

  const handleDeleteSeries = async (seriesId: string) => {
    await deleteSeries(seriesId);
    const updatedList = seriesList.filter((s) => s.id !== seriesId);
    setSeriesList(updatedList);
    setAllEpisodes((prev) => prev.filter((e) => e.seriesId !== seriesId));
    if (activeSeries.id === seriesId && updatedList.length > 0) {
      setActiveSeries(updatedList[0]);
    }
    showToast('Série e episódios excluídos com sucesso.', 'info');
  };

  // Episode actions
  const handleSaveEpisode = async (episode: Episode) => {
    // 1. Optimistically update local React state so UI updates instantly
    setAllEpisodes((prev) => {
      const index = prev.findIndex((e) => e.id === episode.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = episode;
        return next;
      }
      return [...prev, episode];
    });

    // 2. If there's a local videoBlob, save in IndexedDB for immediate & persistent local playback
    if (episode.videoBlob) {
      try {
        await saveVideoBlob(episode.id, episode.videoBlob);
      } catch (e) {
        console.warn('Falha ao salvar no IndexedDB:', e);
      }
    }

    // 3. Save episode metadata (localStorage + Server sync for all devices)
    try {
      await saveEpisode(episode);
    } catch (e: any) {
      console.error('Erro ao sincronizar com servidor:', e);
      showToast(`Salvo localmente, mas erro ao sincronizar com o servidor: ${e?.message || 'Falha de rede'}`, 'error');
      throw e;
    }

    // 4. Ensure season filter shows the new episode
    setSelectedSeason('all');

    // 5. If episode belongs to a different series, activate that series so it is immediately visible
    if (episode.seriesId && episode.seriesId !== activeSeries.id) {
      const match = seriesList.find((s) => s.id === episode.seriesId);
      if (match) {
        setActiveSeries(match);
      }
    }

    // 6. Navigate to episodes tab to display the newly published episode
    setCurrentTab('episodes');

    // 7. Refresh background sync
    await refreshData(true);
    showToast(`Episódio "${episode.title}" salvo com sucesso!`, 'success');
  };

  const handleDeleteEpisode = async (id: string) => {
    await deleteEpisode(id);
    await deleteVideoBlob(id);
    setAllEpisodes((prev) => prev.filter((e) => e.id !== id));
    if (activePlayEpisode?.id === id) {
      setActivePlayEpisode(null);
    }
    showToast('Episódio removido com sucesso.', 'info');
  };

  const handleToggleWatched = async (episode: Episode) => {
    const updated = { ...episode, watched: !episode.watched };
    await saveEpisode(updated);
    setAllEpisodes((prev) => prev.map((e) => (e.id === episode.id ? updated : e)));
    if (activePlayEpisode?.id === episode.id) {
      setActivePlayEpisode(updated);
    }
  };

  // Reset sample episodes on the server
  const handleResetSamples = async () => {
    await clearAllEpisodes();
    await refreshData();
    showToast('Dados de exemplo restaurados no servidor!', 'info');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-blue-600 selection:text-white pb-20 sm:pb-0">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 w-full bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Logo & Main Tabs */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div 
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-900/30 group-hover:scale-105 transition-transform">
                <Film className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xs sm:text-base tracking-tight text-white flex items-center gap-1.5">
                  Portal de Séries
                </span>
                <span className="hidden sm:inline text-[10px] text-neutral-400 font-medium">
                  Streaming & Downloads
                </span>
              </div>
            </div>

            {/* Início / Episódios Switcher */}
            <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl">
              <button
                id="nav-tab-home"
                onClick={() => setCurrentTab('home')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'home'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Início</span>
              </button>

              <button
                id="nav-tab-episodes"
                onClick={() => setCurrentTab('episodes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'episodes'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Episódios</span>
                {activeSeriesEpisodes.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      currentTab === 'episodes'
                        ? 'bg-blue-800 text-white'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {activeSeriesEpisodes.length}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-new-series"
                onClick={() => setCurrentTab('new-series')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'new-series'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Série</span>
              </button>
            </div>
          </div>

          {/* Sync indicator and Admin Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live sync pill */}
            <div 
              onClick={() => refreshData()}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 hover:text-neutral-200 cursor-pointer transition-colors"
              title="Clique para sincronizar agora"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sincronizado</span>
              {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />}
            </div>

            {isAdmin ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-bold text-emerald-400 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Modo Admin</span>
                </div>

                <button
                  id="nav-add-btn"
                  onClick={() => {
                    setEpisodeToEdit(null);
                    setIsUploadModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-900/30 transition-all cursor-pointer hover:scale-102 active:scale-98"
                  title="Fazer upload de novo episódio"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Adicionar Episódio</span>
                  <span className="sm:hidden">Novo Ep</span>
                </button>

                <button
                  id="nav-logout-btn"
                  onClick={handleAdminLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl bg-neutral-900 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-neutral-800 hover:border-rose-900/40 text-xs font-semibold transition-all cursor-pointer"
                  title="Sair do modo administrador"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Sair</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-top-admin"
                onClick={() => setIsAdminAuthOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/80 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm hover:border-blue-500/50 hover:scale-102 active:scale-98"
                title="Entrar com a senha de administrador para gerenciar"
              >
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Horizontal Series Selector Bar */}
        <SeriesSelectorBar
          seriesList={seriesList}
          activeSeries={activeSeries}
          episodes={allEpisodes}
          isAdmin={isAdmin}
          onSelectSeries={(series) => setActiveSeries(series)}
          onAddNewSeries={() => {
            setCurrentTab('new-series');
          }}
          onEditActiveSeries={() => {
            setSeriesToEdit(activeSeries);
            setIsEditSeriesOpen(true);
          }}
          onRequestAdmin={() => setIsAdminAuthOpen(true)}
        />

        {currentTab === 'new-series' ? (
          /* "Nova Série" - Layout dedicado e completo para cadastrar novas séries */
          <NewSeriesView
            isAdmin={isAdmin}
            onSaveSeries={async (newSeries) => {
              await handleSaveSeries(newSeries);
              showToast(`Série "${newSeries.title}" criada com sucesso!`, 'success');
              setCurrentTab('home');
            }}
            onSaveAndAddEpisode={async (newSeries) => {
              await handleSaveSeries(newSeries);
              showToast(`Série "${newSeries.title}" criada! Agora adicione o primeiro episódio.`, 'success');
              setCurrentTab('episodes');
              setEpisodeToEdit(null);
              setIsUploadModalOpen(true);
            }}
            onCancel={() => setCurrentTab('home')}
            onRequestAdmin={() => setIsAdminAuthOpen(true)}
            onAdminUnlock={() => {
              setIsAdmin(true);
              showToast('Modo Administrador liberado!', 'success');
            }}
            existingSeries={seriesList}
          />
        ) : currentTab === 'home' ? (
          /* "Início" / Vitrine da Série Ativa + Catálogo Geral */
          <HomeView
            seriesInfo={activeSeries}
            allSeries={seriesList}
            episodes={activeSeriesEpisodes}
            allEpisodes={allEpisodes}
            isAdmin={isAdmin}
            onPlayEpisode={(ep) => setActivePlayEpisode(ep)}
            onGoToEpisodes={(season) => {
              if (season !== undefined) {
                setSelectedSeason(season);
              }
              setCurrentTab('episodes');
            }}
            onOpenUpload={() => {
              if (isAdmin) {
                setEpisodeToEdit(null);
                setIsUploadModalOpen(true);
              } else {
                setIsAdminAuthOpen(true);
              }
            }}
            onOpenEditSeries={() => {
              if (isAdmin) {
                setSeriesToEdit(activeSeries);
                setIsEditSeriesOpen(true);
              } else {
                setIsAdminAuthOpen(true);
              }
            }}
            onRequestAdmin={() => setIsAdminAuthOpen(true)}
            onEditEpisode={(ep) => {
              if (isAdmin) {
                setEpisodeToEdit(ep);
                setIsUploadModalOpen(true);
              } else {
                setIsAdminAuthOpen(true);
              }
            }}
            onDeleteEpisode={handleDeleteEpisode}
            onToggleWatched={handleToggleWatched}
            onSelectSeries={(series) => setActiveSeries(series)}
            onAddNewSeries={() => {
              setCurrentTab('new-series');
            }}
            onOpenSyncDevices={() => setIsSyncDevicesModalOpen(true)}
          />
        ) : (
          /* "Episódios" / Catálogo Completo da Série Ativa */
          <div className="space-y-4 sm:space-y-6">
            <Header
              seriesInfo={activeSeries}
              allSeries={seriesList}
              episodes={activeSeriesEpisodes}
              isAdmin={isAdmin}
              onRequestAdmin={() => setIsAdminAuthOpen(true)}
              onLogoutAdmin={handleAdminLogout}
              onOpenUpload={() => {
                if (isAdmin) {
                  setEpisodeToEdit(null);
                  setIsUploadModalOpen(true);
                } else {
                  setIsAdminAuthOpen(true);
                }
              }}
              onOpenEditSeries={() => {
                if (isAdmin) {
                  setSeriesToEdit(activeSeries);
                  setIsEditSeriesOpen(true);
                } else {
                  setIsAdminAuthOpen(true);
                }
              }}
              onOpenSeriesList={() => setIsSeriesDrawerOpen(true)}
              onOpenNewSeries={() => setCurrentTab('new-series')}
              onOpenSyncDevices={() => setIsSyncDevicesModalOpen(true)}
            />

            {/* Season Filter & Search Toolbar */}
            <SeasonFilter
              seasons={seasons}
              selectedSeason={selectedSeason}
              onSelectSeason={setSelectedSeason}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              filteredCount={filteredEpisodes.length}
            />

            {/* Loading Indicator */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-2xl sm:rounded-3xl bg-neutral-900 border border-neutral-800" />
                ))}
              </div>
            ) : filteredEpisodes.length === 0 ? (
              <EmptyState
                isSearch={Boolean(searchQuery.trim())}
                isAdmin={isAdmin}
                onRequestAdmin={() => setIsAdminAuthOpen(true)}
                onOpenUpload={() => {
                  if (isAdmin) {
                    setEpisodeToEdit(null);
                    setIsUploadModalOpen(true);
                  } else {
                    setIsAdminAuthOpen(true);
                  }
                }}
                onResetSamples={handleResetSamples}
                onClearSearch={() => setSearchQuery('')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredEpisodes.map((ep) => (
                  <EpisodeCard
                    key={ep.id}
                    episode={ep}
                    isAdmin={isAdmin}
                    onRequestAdmin={() => setIsAdminAuthOpen(true)}
                    onPlay={(selected) => setActivePlayEpisode(selected)}
                    onEdit={(selected) => {
                      if (isAdmin) {
                        setEpisodeToEdit(selected);
                        setIsUploadModalOpen(true);
                      } else {
                        setIsAdminAuthOpen(true);
                      }
                    }}
                    onDelete={handleDeleteEpisode}
                    onToggleWatched={handleToggleWatched}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-900 bg-neutral-950 py-6 mt-8 text-neutral-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Portal de Séries Multi-Dispositivo • Modo {isAdmin ? 'Administrador' : 'Visualizador'} • Sincronização em Nuvem
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-neutral-400">
            <button
              onClick={() => setCurrentTab(currentTab === 'home' ? 'episodes' : 'home')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Alternar para {currentTab === 'home' ? 'Episódios' : 'Início'}
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSeriesDrawerOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Ver Todas as Séries ({seriesList.length})
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('new-series')}
              className="hover:text-white transition-colors cursor-pointer text-blue-400 hover:text-blue-300 font-medium"
            >
              + Nova Série
            </button>
            <span>•</span>
            {isAdmin ? (
              <button
                onClick={() => {
                  setSeriesToEdit(activeSeries);
                  setIsEditSeriesOpen(true);
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Configurar Série Ativa
              </button>
            ) : (
              <button
                onClick={() => setIsAdminAuthOpen(true)}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <Lock className="w-3 h-3 text-neutral-400" />
                <span>Admin</span>
              </button>
            )}
            <span>•</span>
            <button
              onClick={handleResetSamples}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Restaurar Exemplos
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        isAdmin={isAdmin}
        onOpenSeriesList={() => setIsSeriesDrawerOpen(true)}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        onOpenAddEpisode={() => {
          setEpisodeToEdit(null);
          setIsUploadModalOpen(true);
        }}
        episodesCount={activeSeriesEpisodes.length}
        seriesCount={seriesList.length}
      />

      {/* Mobile Series Drawer */}
      <SeriesDrawerModal
        isOpen={isSeriesDrawerOpen}
        onClose={() => setIsSeriesDrawerOpen(false)}
        seriesList={seriesList}
        activeSeries={activeSeries}
        episodes={allEpisodes}
        isAdmin={isAdmin}
        onSelectSeries={(s) => setActiveSeries(s)}
        onAddNewSeries={() => {
          setIsSeriesDrawerOpen(false);
          setCurrentTab('new-series');
        }}
        onEditSeries={(s) => {
          setSeriesToEdit(s);
          setIsEditSeriesOpen(true);
        }}
      />

      {/* Video Player Modal */}
      {activePlayEpisode && (
        <VideoPlayerModal
          episode={activePlayEpisode}
          seriesInfo={activeSeries}
          allEpisodes={filteredEpisodes.length > 0 ? filteredEpisodes : activeSeriesEpisodes}
          onClose={() => setActivePlayEpisode(null)}
          onSelectEpisode={(ep) => setActivePlayEpisode(ep)}
          onToggleWatched={handleToggleWatched}
        />
      )}

      {/* Episode Upload & Edit Modal (Only accessible in Admin) */}
      <EpisodeUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setEpisodeToEdit(null);
        }}
        onSaveEpisode={handleSaveEpisode}
        existingEpisodes={activeSeriesEpisodes}
        episodeToEdit={episodeToEdit}
        seriesList={seriesList}
        activeSeriesId={activeSeries.id}
      />

      {/* Edit Current Series Modal */}
      <SeriesEditModal
        isOpen={isEditSeriesOpen}
        onClose={() => {
          setIsEditSeriesOpen(false);
          setSeriesToEdit(null);
        }}
        series={seriesToEdit || activeSeries}
        isNew={false}
        canDelete={seriesList.length > 1}
        onSaveSeries={handleSaveSeries}
        onDeleteSeries={handleDeleteSeries}
      />

      {/* Add New Series Modal */}
      <SeriesEditModal
        isOpen={isNewSeriesModalOpen}
        onClose={() => setIsNewSeriesModalOpen(false)}
        series={null}
        isNew={true}
        onSaveSeries={handleSaveSeries}
      />

      {/* Admin Password Authentication Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Sync / Connect Devices Modal */}
      <SyncDevicesModal
        isOpen={isSyncDevicesModalOpen}
        onClose={() => setIsSyncDevicesModalOpen(false)}
        onRefreshData={() => refreshData(false)}
        isSyncing={isSyncing}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-16 sm:bottom-5 right-3 sm:right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl text-white text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
