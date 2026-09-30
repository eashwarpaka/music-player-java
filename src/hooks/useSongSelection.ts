import { useState, useCallback } from 'react';
import { Song } from '../types';

export interface UseSongSelectionReturn {
  isSelectionMode: boolean;
  setIsSelectionMode: React.Dispatch<React.SetStateAction<boolean>>;
  selectedSongIds: string[];
  setSelectedSongIds: React.Dispatch<React.SetStateAction<string[]>>;
  handleToggleSelectSong: (id: string) => void;
  handleSelectAll: (filteredSongs: Song[]) => void;
  handleDeselectAll: () => void;
  handleToggleSelectionMode: () => void;
  clearSelection: () => void;
}

export function useSongSelection(): UseSongSelectionReturn {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);

  const handleToggleSelectSong = useCallback((id: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(id) ? prev.filter((songId) => songId !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback((filteredSongs: Song[]) => {
    setSelectedSongIds(filteredSongs.map((s) => s.id));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setSelectedSongIds([]);
  }, []);

  const handleToggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      if (prev) {
        setSelectedSongIds([]);
      }
      return !prev;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSongIds([]);
    setIsSelectionMode(false);
  }, []);

  return {
    isSelectionMode,
    setIsSelectionMode,
    selectedSongIds,
    setSelectedSongIds,
    handleToggleSelectSong,
    handleSelectAll,
    handleDeselectAll,
    handleToggleSelectionMode,
    clearSelection,
  };
}
