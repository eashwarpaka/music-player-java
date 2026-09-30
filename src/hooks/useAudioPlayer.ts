import { useState, useEffect, useCallback } from 'react';
import { Song } from '../types';
import { audioEngine } from '../audio';
import { isNativePlatform, OnagakuBackend } from '../native';

export interface UseAudioPlayerReturn {
  currentIndex: number;
  currentSong: Song | null;
  isPlaying: boolean;
  progressPercent: number;
  currentTimeSeconds: number;
  isShuffle: boolean;
  isRepeat: boolean;
  setIsShuffle: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRepeat: React.Dispatch<React.SetStateAction<boolean>>;
  playSongByIndex: (index: number) => void;
  playSongObject: (song: Song) => void;
  handleTogglePlay: () => void;
  handleNextSong: () => void;
  handlePrevSong: () => void;
  handleSeek: (percent: number) => void;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
}

export function useAudioPlayer(
  songs: Song[],
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>
): UseAudioPlayerReturn {
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [isShuffle, setIsShuffleState] = useState(false);
  const [isRepeat, setIsRepeatState] = useState(false);

  const isNative = isNativePlatform();
  const currentSong = currentIndex >= 0 && currentIndex < songs.length ? songs[currentIndex] : null;

  // ── Wrapped Shuffle Setter ──
  const setIsShuffle = useCallback((action: React.SetStateAction<boolean>) => {
    setIsShuffleState((prev) => {
      const nextVal = typeof action === 'function' ? action(prev) : action;
      if (isNative) {
        OnagakuBackend.setShuffle({ enabled: nextVal }).catch(() => {});
      }
      return nextVal;
    });
  }, [isNative]);

  // ── Wrapped Repeat Setter ──
  const setIsRepeat = useCallback((action: React.SetStateAction<boolean>) => {
    setIsRepeatState((prev) => {
      const nextVal = typeof action === 'function' ? action(prev) : action;
      if (isNative) {
        OnagakuBackend.setRepeatMode({ mode: nextVal ? 'one' : 'none' }).catch(() => {});
      }
      return nextVal;
    });
  }, [isNative]);

  // ── Next song helper ──
  const handleNextSong = useCallback(() => {
    if (songs.length === 0) return;
    if (isNative) {
      OnagakuBackend.next().catch(() => {});
      return;
    }
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      playSongByIndexInternal(randomIndex);
    } else {
      const nextIdx = (currentIndex + 1) % songs.length;
      playSongByIndexInternal(nextIdx);
    }
  }, [songs.length, isNative, isShuffle, currentIndex]);

  // ── Internal play function ──
  const playSongByIndexInternal = useCallback((index: number) => {
    if (index < 0 || index >= songs.length) return;
    setCurrentIndex(index);
    const targetSong = songs[index];
    setIsPlaying(true);
    setProgressPercent(0);
    setCurrentTimeSeconds(0);

    if (isNative && targetSong.isLocal) {
      // Send queue & target index to native ExoPlayer engine
      OnagakuBackend.setQueue({
        songs: songs.map((s) => ({
          id: s.id.replace(/^device_/, ''),
          title: s.title,
          artist: s.artist,
          album: s.album || 'Unknown Album',
          albumId: '0',
          duration: s.duration,
          durationSeconds: s.durationSeconds,
          durationMs: (s.durationSeconds || 0) * 1000,
          filePath: s.filePath || '',
          contentUri: s.contentUri || '',
          albumArtUri: s.albumArtUri || '',
          mimeType: s.mimeType || 'audio/mpeg',
          size: 0,
          dateAdded: 0,
          track: 0,
          year: 0,
          folderName: '',
          isLocal: true,
        })),
        startIndex: index,
      }).catch((err) => console.error('[useAudioPlayer] Native setQueue failed:', err));
    } else {
      // Use synth engine for web/demo songs
      audioEngine.playSong(targetSong.id, targetSong.color);
    }
  }, [songs, isNative]);

  // ── Public play functions ──
  const playSongByIndex = useCallback((index: number) => {
    playSongByIndexInternal(index);
  }, [playSongByIndexInternal]);

  const playSongObject = useCallback((song: Song) => {
    const index = songs.findIndex((s) => s.id === song.id);
    if (index !== -1) {
      playSongByIndexInternal(index);
    } else {
      const tempSongs = [...songs, song];
      setSongs(tempSongs);
      setCurrentIndex(tempSongs.length - 1);
      setIsPlaying(true);
      setProgressPercent(0);
      setCurrentTimeSeconds(0);

      if (isNative && song.isLocal) {
        OnagakuBackend.setQueue({
          songs: tempSongs.map((s) => ({
            id: s.id.replace(/^device_/, ''),
            title: s.title,
            artist: s.artist,
            album: s.album || 'Unknown Album',
            albumId: '0',
            duration: s.duration,
            durationSeconds: s.durationSeconds,
            durationMs: (s.durationSeconds || 0) * 1000,
            filePath: s.filePath || '',
            contentUri: s.contentUri || '',
            albumArtUri: s.albumArtUri || '',
            mimeType: s.mimeType || 'audio/mpeg',
            size: 0,
            dateAdded: 0,
            track: 0,
            year: 0,
            folderName: '',
            isLocal: true,
          })),
          startIndex: tempSongs.length - 1,
        }).catch((err) => console.error('[useAudioPlayer] Native playSongObject failed:', err));
      } else {
        audioEngine.playSong(song.id, song.color);
      }
    }
  }, [songs, setSongs, isNative, playSongByIndexInternal]);

  const handleTogglePlay = useCallback(() => {
    if (currentIndex === -1) {
      if (songs.length > 0) {
        playSongByIndexInternal(0);
      }
      return;
    }

    if (isPlaying) {
      if (isNative && currentSong?.isLocal) {
        OnagakuBackend.pause().catch((err) => console.error('[useAudioPlayer] Pause error:', err));
      } else {
        audioEngine.pause();
      }
      setIsPlaying(false);
    } else {
      if (isNative && currentSong?.isLocal) {
        OnagakuBackend.resume().catch((err) => console.error('[useAudioPlayer] Resume error:', err));
      } else if (currentSong) {
        audioEngine.resume(currentSong.color);
      }
      setIsPlaying(true);
    }
  }, [currentIndex, songs.length, isPlaying, currentSong, isNative, playSongByIndexInternal]);

  const handlePrevSong = useCallback(() => {
    if (songs.length === 0) return;
    if (isNative && currentSong?.isLocal) {
      OnagakuBackend.previous().catch((err) => console.error('[useAudioPlayer] Previous error:', err));
      return;
    }
    if (currentTimeSeconds > 3) {
      setCurrentTimeSeconds(0);
      setProgressPercent(0);
      return;
    }
    const prevIdx = (currentIndex - 1 + songs.length) % songs.length;
    playSongByIndexInternal(prevIdx);
  }, [songs.length, isNative, currentSong, currentTimeSeconds, currentIndex, playSongByIndexInternal]);

  const handleSeek = useCallback((percent: number) => {
    if (!currentSong) return;

    if (isNative && currentSong.isLocal) {
      const totalMs = (currentSong.durationSeconds || 180) * 1000;
      const targetMs = (percent / 100) * totalMs;
      OnagakuBackend.seekTo({ positionMs: targetMs }).catch((err) => console.error('[useAudioPlayer] Seek error:', err));
    } else {
      const totalSecs = currentSong.durationSeconds || 180;
      const newSecs = (percent / 100) * totalSecs;
      setCurrentTimeSeconds(newSecs);
      setProgressPercent(percent);
    }
  }, [currentSong, isNative]);

  // ── OnagakuBackend Native Events Listener (Java -> React) ──
  useEffect(() => {
    if (!isNative) return;

    let stateSub: any;
    let posSub: any;
    let songSub: any;

    const setupListeners = async () => {
      try {
        stateSub = await OnagakuBackend.addListener('playerStateChanged', (state) => {
          setIsPlaying(state.isPlaying);
          setIsShuffleState(state.shuffle);
          setIsRepeatState(state.repeatMode === 'one');
        });

        posSub = await OnagakuBackend.addListener('positionChanged', (data) => {
          const currentSecs = Math.floor(data.positionMs / 1000);
          setCurrentTimeSeconds(currentSecs);
          if (data.durationMs > 0) {
            setProgressPercent((data.positionMs / data.durationMs) * 100);
          }
        });

        songSub = await OnagakuBackend.addListener('songChanged', (data) => {
          if (data.songId) {
            const cleanTargetId = data.songId.replace(/^device_/, '');
            const idx = songs.findIndex(
              (s) => s.id === data.songId || s.id.replace(/^device_/, '') === cleanTargetId
            );
            if (idx !== -1) {
              setCurrentIndex(idx);
            }
          }
        });
      } catch (err) {
        console.warn('[useAudioPlayer] OnagakuBackend event setup error:', err);
      }
    };

    setupListeners();

    return () => {
      if (stateSub && typeof stateSub.remove === 'function') stateSub.remove();
      if (posSub && typeof posSub.remove === 'function') posSub.remove();
      if (songSub && typeof songSub.remove === 'function') songSub.remove();
    };
  }, [isNative, songs]);

  // ── Synth engine progress timer (web/demo songs only) ──
  useEffect(() => {
    if (isNative && currentSong?.isLocal) return;

    let timer: any = null;
    if (isPlaying && currentSong) {
      timer = setInterval(() => {
        setCurrentTimeSeconds((prev) => {
          const totalSecs = currentSong.durationSeconds || 180;
          const nextSecs = prev + 0.5;
          if (nextSecs >= totalSecs) {
            if (isRepeat) {
              setProgressPercent(0);
              return 0;
            } else {
              handleNextSong();
              return 0;
            }
          }
          setProgressPercent((nextSecs / totalSecs) * 100);
          return nextSecs;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentSong, isRepeat, isNative, handleNextSong]);

  return {
    currentIndex,
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
  };
}
