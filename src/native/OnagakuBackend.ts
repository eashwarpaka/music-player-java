/**
 * OnagakuBackend Capacitor Plugin — TypeScript interface & bridge
 *
 * Centralized bridge between React frontend and native Java OnagakuBackendPlugin.java.
 * Handles MediaStore library scanning, audio filtering, ExoPlayer control,
 * SQLite storage, and background playback events.
 */

import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

// ── Data Interfaces ──────────────────────────────────────────────────

export interface OnagakuDeviceSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumId: string;
  duration: string;         // formatted "m:ss"
  durationSeconds: number;
  durationMs: number;
  filePath: string;         // absolute file path on device
  contentUri: string;       // content:// URI
  albumArtUri: string;      // album art content:// URI
  mimeType: string;
  size: number;             // bytes
  dateAdded: number;        // epoch timestamp
  track: number;
  year: number;
  folderName: string;
  isLocal: boolean;
}

export interface OnagakuPlayerState {
  isPlaying: boolean;
  currentSongId: string | null;
  positionMs: number;
  durationMs: number;
  shuffle: boolean;
  repeatMode: 'none' | 'one' | 'all';
}

export interface BackendPingResult {
  ok: boolean;
  platform: string;
  pluginVersion: string;
  timestamp: number;
}

export interface BackendPermissionStatus {
  status: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';
}

export interface ScanProgressData {
  scanned: number;
  accepted: number;
  total: number;
}

export interface ScanCompletedData {
  songCount: number;
}

export interface PositionChangedData {
  positionMs: number;
  durationMs: number;
}

// ── Plugin Interface ─────────────────────────────────────────────────

export interface OnagakuBackendPlugin {
  /** Test connection to native Java plugin */
  ping(): Promise<BackendPingResult>;

  /** Check current audio/storage permission state */
  checkPermission(): Promise<BackendPermissionStatus>;

  /** Request audio/storage read permission */
  requestPermission(): Promise<BackendPermissionStatus>;

  /** Asynchronously scan MediaStore for audio files */
  scanLibrary(): Promise<{ songCount: number }>;

  /** Get songs from in-memory / database cache (paginated) */
  getSongs(options?: { offset?: number; limit?: number }): Promise<{ songs: OnagakuDeviceSong[]; total: number }>;

  /** Search songs by title, artist, or album */
  search(options: { query: string }): Promise<{ songs: OnagakuDeviceSong[] }>;

  // ── Playback Controls ──
  playSong(options: { songId: string; song?: any }): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  seekTo(options: { positionMs: number }): Promise<void>;
  setQueue(options: { songs: any[]; startIndex?: number }): Promise<void>;
  getQueue(): Promise<{ songIds: string[]; currentIndex: number }>;
  setShuffle(options: { enabled: boolean }): Promise<void>;
  setRepeatMode(options: { mode: 'none' | 'one' | 'all' }): Promise<void>;
  getPlayerState(): Promise<OnagakuPlayerState>;

  // ── Favorites & Playlists ──
  addFavorite(options: { songId: string }): Promise<void>;
  removeFavorite(options: { songId: string }): Promise<void>;
  getFavorites(): Promise<{ songs: OnagakuDeviceSong[] }>;
  createPlaylist(options: { name: string }): Promise<{ id: number }>;
  deletePlaylist(options: { id: number }): Promise<void>;
  getPlaylists(): Promise<{ playlists: any[] }>;
  addToPlaylist(options: { playlistId: number; songId: string }): Promise<void>;
  removeFromPlaylist(options: { playlistId: number; songId: string }): Promise<void>;
  getPlaylistSongs(options: { playlistId: number }): Promise<{ songs: OnagakuDeviceSong[] }>;
  getAlbums(): Promise<{ albums: any[] }>;
  getArtists(): Promise<{ artists: any[] }>;
  getFolders(): Promise<{ folders: any[] }>;
  getRecentlyPlayed(): Promise<{ songs: OnagakuDeviceSong[] }>;

  // ── Event Listeners (Java -> React) ──
  addListener(
    eventName: 'scanStarted',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'scanProgress',
    listenerFunc: (data: ScanProgressData) => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'scanCompleted',
    listenerFunc: (data: ScanCompletedData) => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'playerStateChanged',
    listenerFunc: (state: OnagakuPlayerState) => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'positionChanged',
    listenerFunc: (data: PositionChangedData) => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'songChanged',
    listenerFunc: (data: { songId: string }) => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'playerError',
    listenerFunc: (data: { message: string }) => void,
  ): Promise<PluginListenerHandle>;

  removeAllListeners(): Promise<void>;
}

// ── Register Plugin ──────────────────────────────────────────────────

const OnagakuBackend = registerPlugin<OnagakuBackendPlugin>('OnagakuBackend');

export default OnagakuBackend;
