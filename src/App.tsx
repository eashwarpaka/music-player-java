import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Song, GenericBlock } from './types';
import { INITIAL_SONGS, INITIAL_BLOCKS } from './data';
import { useAudioPlayer, useSongSelection, useDeviceSongs } from './hooks';
import { 
  Header, 
  SongRow, 
  SelectionToolbar, 
  MiniPlayer, 
  AddToBlockModal, 
  SecondaryScreen 
} from './components';
import { RotateCcw, Music, RefreshCw, ShieldAlert, Loader2 } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';


export default function App() {
  // 1. Theme state (persisted)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pop_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 2. Device songs scanning (native Android) or demo songs (web)
  const {
    songs: deviceSongs,
    isScanning,
    scanError,
    rescan,
    hasPermission,
    requestPermission,
    isNative,
    songCount,
  } = useDeviceSongs();

  // Songs state — initialized from device scan, user can still modify
  const [songs, setSongs] = useState<Song[]>([]);

  // Sync device songs into state when scan completes
  useEffect(() => {
    if (deviceSongs.length > 0) {
      setSongs(deviceSongs);
    }
  }, [deviceSongs]);

  // 3. Generic playlist blocks state (persisted)
  const [blocks, setBlocks] = useState<GenericBlock[]>(() => {
    const saved = localStorage.getItem('pop_blocks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If user only had the legacy initial placeholder pair (Block 1 and Block 2), migrate cleanly to Favorites
          if (
            parsed.length === 2 &&
            parsed[0]?.name === "Block 1" &&
            parsed[1]?.name === "Block 2" &&
            (!parsed[0]?.songIds || parsed[0]?.songIds.length === 0) &&
            (!parsed[1]?.songIds || parsed[1]?.songIds.length === 0)
          ) {
            return INITIAL_BLOCKS;
          }
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing saved blocks", e);
      }
    }
    return INITIAL_BLOCKS;
  });

  // Persistence side-effects (only persist non-device songs on web)
  useEffect(() => {
    if (!isNative) {
      localStorage.setItem('pop_songs', JSON.stringify(songs));
    }
  }, [songs, isNative]);

  useEffect(() => {
    localStorage.setItem('pop_blocks', JSON.stringify(blocks));
  }, [blocks]);

  // Sync dark theme to HTML root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('pop_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('pop_theme', 'light');
    }
  }, [isDarkMode]);

  // 4. Audio Playback engine hook
  const {
    currentSong,
    isPlaying,
    progressPercent,
    currentTimeSeconds,
    isShuffle,
    isRepeat,
    setIsShuffle,
    setIsRepeat,
    playSongByIndex,
    playSongObject,
    handleTogglePlay,
    handleNextSong,
    handlePrevSong,
    handleSeek,
    setCurrentIndex,
  } = useAudioPlayer(songs, setSongs);

  // 5. Song selection & batch actions hook
  const {
    isSelectionMode,
    setIsSelectionMode,
    selectedSongIds,
    handleToggleSelectSong,
    handleSelectAll,
    handleDeselectAll,
    handleToggleSelectionMode,
    clearSelection,
  } = useSongSelection();

  // 6. Search filtering state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddToBlockOpen, setIsAddToBlockOpen] = useState(false);
  const [isSecondaryScreenOpen, setIsSecondaryScreenOpen] = useState(false);

  // Android hardware back button handler
  useEffect(() => {
    if (!isNative) return;

    const backSub = CapApp.addListener('backButton', () => {
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
      } else if (isAddToBlockOpen) {
        setIsAddToBlockOpen(false);
      } else if (isSecondaryScreenOpen) {
        setIsSecondaryScreenOpen(false);
      } else if (isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery('');
      } else if (isSelectionMode) {
        setIsSelectionMode(false);
        clearSelection();
      } else {
        CapApp.minimizeApp();
      }
    });

    return () => {
      backSub.then((h) => h.remove());
    };
  }, [isNative, isSettingsOpen, isAddToBlockOpen, isSecondaryScreenOpen, isSearchOpen, isSelectionMode, clearSelection, setIsSelectionMode]);


  // Filtered song list based on active search
  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q)
    );
  }, [songs, searchQuery]);

  // Add into Generic Block logic
  const handleAddToBlock = (blockId: number) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id === blockId) {
          const uniqueIds = Array.from(new Set([...block.songIds, ...selectedSongIds]));
          return { ...block, songIds: uniqueIds };
        }
        return block;
      })
    );
    clearSelection();
  };

  const handleCreateAndAddToBlock = (name: string) => {
    const newId = blocks.length ? Math.max(...blocks.map((b) => b.id)) + 1 : 1;
    const newBlock: GenericBlock = {
      id: newId,
      name,
      songIds: [...selectedSongIds],
    };
    setBlocks((prev) => [...prev, newBlock]);
    clearSelection();
  };

  // Delete selected songs logic
  const handleDeleteSelected = () => {
    if (selectedSongIds.length === 0) return;
    const count = selectedSongIds.length;
    if (
      window.confirm(
        `Are you sure you want to delete ${count} song${count > 1 ? 's' : ''} from My Songs?`
      )
    ) {
      const remainingSongs = songs.filter((s) => !selectedSongIds.includes(s.id));
      setSongs(remainingSongs);

      if (currentSong && selectedSongIds.includes(currentSong.id)) {
        if (remainingSongs.length > 0) {
          playSongByIndex(0);
        } else {
          setCurrentIndex(-1);
        }
      }

      clearSelection();
    }
  };

  // Restore default initial song catalog / rescan device
  const handleRestoreDefaultSongs = () => {
    if (isNative) {
      rescan();
    } else {
      setSongs(INITIAL_SONGS);
    }
  };

  // Block management for Secondary Screen
  const handleAddBlock = (customName?: string) => {
    const newId = blocks.length ? Math.max(...blocks.map((b) => b.id)) + 1 : 1;
    const defaultName = `Block ${newId}`;
    const nameToUse = customName !== undefined ? customName.trim() : prompt("Enter new block name:", defaultName);
    if (nameToUse && nameToUse.trim()) {
      setBlocks((prev) => [...prev, { id: newId, name: nameToUse.trim(), songIds: [] }]);
    }
  };

  const handleEditBlock = (id: number, newName?: string, newColor?: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        return {
          ...b,
          name: newName !== undefined && newName.trim() ? newName.trim() : b.name,
          color: newColor !== undefined ? newColor : b.color,
        };
      })
    );
  };

  const isFavoriteBlock = (b?: GenericBlock) => {
    if (!b) return false;
    return b.id === 1 || b.name.toLowerCase() === 'favorite' || b.name.toLowerCase() === 'favorites';
  };

  const handleDeleteBlock = (id: number) => {
    const block = blocks.find((b) => b.id === id);
    if (!block || isFavoriteBlock(block)) return;
    if (window.confirm(`Delete block "${block.name}"?`)) {
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleDeleteMultipleBlocks = (ids: number[]) => {
    const validIds = ids.filter((id) => {
      const b = blocks.find((item) => item.id === id);
      return b && !isFavoriteBlock(b);
    });
    if (validIds.length === 0) return;
    const count = validIds.length;
    if (window.confirm(`Delete ${count} selected block${count > 1 ? 's' : ''}?`)) {
      setBlocks((prev) => prev.filter((b) => !validIds.includes(b.id)));
    }
  };

  const handleRemoveSongFromBlock = (blockId: number, songId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id === blockId) {
          return {
            ...block,
            songIds: block.songIds.filter((id) => id !== songId),
          };
        }
        return block;
      })
    );
  };

  const handleRemoveMultipleSongsFromBlock = (blockId: number, songIds: string[]) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id === blockId) {
          return {
            ...block,
            songIds: block.songIds.filter((id) => !songIds.includes(id)),
          };
        }
        return block;
      })
    );
  };

  // Touch & mouse swipe navigation between screens
  const appContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isTracking = false;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isTracking = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isTracking || !e.changedTouches || !e.changedTouches.length) return;
      isTracking = false;
      const deltaX = e.changedTouches[0].clientX - startX;
      const deltaY = e.changedTouches[0].clientY - startY;

      // Ensure horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
        if (deltaX < 0) {
          setIsSecondaryScreenOpen(true);
        } else if (deltaX > 0) {
          setIsSecondaryScreenOpen(false);
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, input, .mp-progress-track, .search-wrap, .search-input, .settings-menu, .sine-wave-container')) {
        return;
      }
      startX = e.clientX;
      startY = e.clientY;
      isTracking = true;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isTracking) return;
      isTracking = false;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX < 0) {
          setIsSecondaryScreenOpen(true);
        } else if (deltaX > 0) {
          setIsSecondaryScreenOpen(false);
        }
      }
    };

    const targetElem = document;
    targetElem.addEventListener("touchstart", onTouchStart, { passive: true });
    targetElem.addEventListener("touchend", onTouchEnd, { passive: true });
    targetElem.addEventListener("mousedown", onMouseDown);
    targetElem.addEventListener("mouseup", onMouseUp);

    return () => {
      targetElem.removeEventListener("touchstart", onTouchStart);
      targetElem.removeEventListener("touchend", onTouchEnd);
      targetElem.removeEventListener("mousedown", onMouseDown);
      targetElem.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const selectedSongsList = songs.filter((s) => selectedSongIds.includes(s.id));

  // ── Permission request overlay for native Android ──
  if (isNative && !hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="clay-box rounded-3xl p-8 max-w-sm w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'var(--accent)', color: '#fff' }}>
            <Music size={32} />
          </div>
          <h2 className="text-xl font-extrabold" style={{ fontFamily: "'Baloo 2', cursive", color: 'var(--text)' }}>
            Access Your Music
          </h2>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>
            POP needs permission to read audio files on your device so you can play your local music library.
          </p>
          {scanError && (
            <div className="text-xs font-bold text-red-400 bg-red-500/10 rounded-2xl px-4 py-2">
              <ShieldAlert size={14} className="inline mr-1" />
              {scanError}
            </div>
          )}
          <button
            onClick={async () => {
              const granted = await requestPermission();
              if (granted) rescan();
            }}
            className="clay-accent-btn px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 mx-auto"
          >
            <ShieldAlert size={16} />
            Grant Audio Permission
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={appContainerRef} className="min-h-screen relative overflow-x-hidden select-none">
      {/* Floating Selection Toolbar when songs are selected */}
      {isSelectionMode && (
        <SelectionToolbar
          selectedCount={selectedSongIds.length}
          totalCount={filteredSongs.length}
          onSelectAll={() => handleSelectAll(filteredSongs)}
          onDeselectAll={handleDeselectAll}
          onOpenAddToGeneric={() => {
            if (selectedSongIds.length > 0) {
              setIsAddToBlockOpen(true);
            }
          }}
          onDeleteSelected={handleDeleteSelected}
          onCancel={handleToggleSelectionMode}
        />
      )}

      <div className="app">
        {/* Main Navigation Header */}
        <Header
          onLogoClick={() => {
            if (songs.length > 0 && !isPlaying) {
              playSongByIndex(0);
            }
          }}
          isSearchOpen={isSearchOpen}
          searchQuery={searchQuery}
          onToggleSearch={setIsSearchOpen}
          onSearchChange={setSearchQuery}
          isSettingsOpen={isSettingsOpen}
          onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          onCloseSettings={() => setIsSettingsOpen(false)}
          isSelectionMode={isSelectionMode}
          selectedSongIds={selectedSongIds}
          filteredSongsCount={filteredSongs.length}
          onToggleSelectionMode={handleToggleSelectionMode}
          onSelectAll={() => handleSelectAll(filteredSongs)}
          onDeselectAll={handleDeselectAll}
          onOpenAddToGeneric={() => {
            if (selectedSongIds.length > 0) {
              setIsAddToBlockOpen(true);
            } else {
              setIsSelectionMode(true);
            }
          }}
          onDeleteSelected={handleDeleteSelected}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onOpenGenericScreen={() => setIsSecondaryScreenOpen(true)}
        />

        {/* Main Song Catalog List */}
        <main className="content">
          <div className="mx-1 my-2.5 flex items-center justify-between">
            <div className="section-label !m-0">{isNative ? 'My Library' : 'Sunday Playlist'}</div>
            {isNative && (
              <div className="flex items-center gap-2">
                {isScanning && (
                  <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                    <Loader2 size={12} className="animate-spin" /> Scanning...
                  </span>
                )}
                <button
                  onClick={rescan}
                  className="icon-btn w-7 h-7 rounded-full flex items-center justify-center"
                  title="Rescan device songs"
                  disabled={isScanning}
                >
                  <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
                </button>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--border-subtle)', color: 'var(--text-dim)' }}>
                  {songCount} songs
                </span>
              </div>
            )}
          </div>

          {filteredSongs.length === 0 ? (
            <div className="clay-box rounded-3xl p-8 text-center space-y-3 mt-4">
              <p className="text-sm font-bold text-[var(--text)]">No tunes found</p>
              <p className="text-xs text-[var(--text-dim)] font-semibold">
                {searchQuery ? `No results for "${searchQuery}"` : "All songs were removed from the playlist."}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleRestoreDefaultSongs}
                  className="clay-accent-btn px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 mx-auto mt-2"
                >
                  {isNative ? <RefreshCw size={14} /> : <RotateCcw size={14} />}
                  <span>{isNative ? 'Rescan Device' : 'Restore Sunday Playlist'}</span>
                </button>
              )}
            </div>
          ) : (
            <ul className="song-list" id="songList">
              {filteredSongs.map((song) => {
                const isActive = currentSong?.id === song.id;
                const isSelected = selectedSongIds.includes(song.id);

                return (
                  <SongRow
                    key={song.id}
                    song={song}
                    isActive={isActive}
                    isPlaying={isPlaying}
                    isSelected={isSelected}
                    isSelectionMode={isSelectionMode}
                    onSelect={handleToggleSelectSong}
                    onPlay={playSongObject}
                  />
                );
              })}
            </ul>
          )}
        </main>
      </div>

      {/* Secondary Screen (Generic Blocks & Block Playable Songs) */}
      <SecondaryScreen
        isOpen={isSecondaryScreenOpen}
        onClose={() => setIsSecondaryScreenOpen(false)}
        blocks={blocks}
        songs={songs}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlaySong={playSongObject}
        onAddBlock={handleAddBlock}
        onEditBlock={handleEditBlock}
        onDeleteBlock={handleDeleteBlock}
        onDeleteMultipleBlocks={handleDeleteMultipleBlocks}
        onRemoveSongFromBlock={handleRemoveSongFromBlock}
        onRemoveMultipleSongsFromBlock={handleRemoveMultipleSongsFromBlock}
        onOpenMainScreenWithSelection={() => {
          setIsSecondaryScreenOpen(false);
          setIsSelectionMode(true);
        }}
      />

      {/* Mini Player Pill - Visible across all screens */}
      <MiniPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        progressPercent={progressPercent}
        currentTimeSeconds={currentTimeSeconds}
        durationSeconds={currentSong?.durationSeconds || 180}
        onTogglePlay={handleTogglePlay}
        onPrev={handlePrevSong}
        onNext={handleNextSong}
        onSeek={handleSeek}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        isRepeat={isRepeat}
        onToggleRepeat={() => setIsRepeat(!isRepeat)}
      />

      {/* Add Selected Songs into Generic Block Modal */}
      <AddToBlockModal
        isOpen={isAddToBlockOpen}
        onClose={() => setIsAddToBlockOpen(false)}
        selectedSongs={selectedSongsList}
        blocks={blocks}
        onAddToBlock={handleAddToBlock}
        onCreateAndAddToBlock={handleCreateAndAddToBlock}
        onNavigateToGeneric={() => {
          setIsAddToBlockOpen(false);
          setIsSecondaryScreenOpen(true);
        }}
      />
    </div>
  );
}
