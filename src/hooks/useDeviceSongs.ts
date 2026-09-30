/**
 * useDeviceSongs — Hook to scan and manage local device songs
 * 
 * On native Android, this queries the MediaStore via the OnagakuBackend native plugin.
 * On web, it returns demo songs as a fallback.
 */

import { useState, useCallback, useEffect } from 'react';
import { Song } from '../types';
import { isNativePlatform, OnagakuBackend, OnagakuDeviceSong } from '../native';
import { INITIAL_SONGS } from '../data';

// Color palette to assign to device songs for the claymorphism UI
const SONG_COLORS = [
  '#00f0ff', '#7fe0c4', '#ffd66b', '#a5b4fc', '#00e5ff',
  '#f0abfc', '#fca5a5', '#86efac', '#fde68a', '#93c5fd',
];

/** Convert an OnagakuDeviceSong from native plugin to the app's Song type */
function deviceSongToAppSong(ds: OnagakuDeviceSong, index: number): Song {
  return {
    id: `device_${ds.id}`,
    title: ds.title,
    artist: ds.artist,
    album: ds.album,
    duration: ds.duration,
    durationSeconds: ds.durationSeconds,
    color: SONG_COLORS[index % SONG_COLORS.length],
    filePath: ds.filePath,
    contentUri: ds.contentUri,
    albumArtUri: ds.albumArtUri,
    mimeType: ds.mimeType,
    isLocal: true,
  };
}

export interface UseDeviceSongsReturn {
  /** All discovered songs (device songs on native, demo songs on web) */
  songs: Song[];
  /** Whether the initial scan is in progress */
  isScanning: boolean;
  /** Scan progress details */
  scanProgress: { scanned: number; accepted: number; total: number } | null;
  /** Error message if scan failed */
  scanError: string | null;
  /** Manually trigger a re-scan */
  rescan: () => Promise<void>;
  /** Whether audio permission has been granted */
  hasPermission: boolean;
  /** Request audio permission */
  requestPermission: () => Promise<boolean>;
  /** Whether running on a native platform */
  isNative: boolean;
  /** Total count of discovered songs */
  songCount: number;
}

export function useDeviceSongs(): UseDeviceSongsReturn {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ scanned: number; accepted: number; total: number } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const isNative = isNativePlatform();

  const checkPermission = useCallback(async () => {
    if (!isNative) {
      setHasPermission(true);
      return true;
    }
    try {
      const result = await OnagakuBackend.checkPermission();
      const granted = result.status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch {
      return false;
    }
  }, [isNative]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) {
      setHasPermission(true);
      return true;
    }
    try {
      const result = await OnagakuBackend.requestPermission();
      const granted = result.status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch {
      return false;
    }
  }, [isNative]);

  const rescan = useCallback(async () => {
    if (!isNative) {
      // On web, use demo songs
      setSongs(INITIAL_SONGS);
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setScanProgress(null);

    try {
      await OnagakuBackend.scanLibrary();
      const { songs: deviceSongs } = await OnagakuBackend.getSongs();
      
      const appSongs = deviceSongs.map((ds, i) => deviceSongToAppSong(ds, i));
      setSongs(appSongs);
      setHasPermission(true);

      // Cache to localStorage for faster subsequent loads
      try {
        localStorage.setItem('pop_device_songs', JSON.stringify(appSongs));
        localStorage.setItem('pop_device_songs_count', String(appSongs.length));
      } catch { /* localStorage might be full */ }

    } catch (err: any) {
      console.error('[useDeviceSongs] Scan failed:', err);
      setScanError(err?.message || 'Failed to scan device songs');

      // Try loading cached songs
      try {
        const cached = localStorage.getItem('pop_device_songs');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSongs(parsed);
            return;
          }
        }
      } catch { /* ignore */ }
      
      // Last resort: use demo songs
      setSongs(INITIAL_SONGS);
    } finally {
      setIsScanning(false);
    }
  }, [isNative]);

  // Set up event listeners for background scan progress
  useEffect(() => {
    if (!isNative) return;

    let progressSub: any;
    let completedSub: any;

    const setupListeners = async () => {
      try {
        progressSub = await OnagakuBackend.addListener('scanProgress', (data) => {
          setScanProgress(data);
        });
        completedSub = await OnagakuBackend.addListener('scanCompleted', async () => {
          setScanProgress(null);
          // Refresh song list after scan completes
          try {
            const { songs: deviceSongs } = await OnagakuBackend.getSongs();
            const appSongs = deviceSongs.map((ds, i) => deviceSongToAppSong(ds, i));
            setSongs(appSongs);
          } catch { /* ignore */ }
        });
      } catch { /* ignore if listeners fail */ }
    };

    setupListeners();

    return () => {
      if (progressSub && typeof progressSub.remove === 'function') progressSub.remove();
      if (completedSub && typeof completedSub.remove === 'function') completedSub.remove();
    };
  }, [isNative]);

  // Auto-scan on mount
  useEffect(() => {
    const init = async () => {
      if (!isNative) {
        setSongs(INITIAL_SONGS);
        setHasPermission(true);
        return;
      }

      // Try cached songs first for instant UI responsiveness
      try {
        const cached = localStorage.getItem('pop_device_songs');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSongs(parsed);
          }
        }
      } catch { /* ignore */ }

      const permitted = await checkPermission();
      if (permitted) {
        await rescan();
      }
    };

    init();
  }, [isNative, checkPermission, rescan]);

  return {
    songs,
    isScanning,
    scanProgress,
    scanError,
    rescan,
    hasPermission,
    requestPermission,
    isNative,
    songCount: songs.length,
  };
}
