import React, { useState, useRef, useCallback } from 'react';
import { Song } from '../../types';
import { SineWaveProgressBar } from './SineWaveProgressBar';
import { 
  Shuffle, 
  Repeat, 
  ChevronDown
} from 'lucide-react';

interface MiniPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  progressPercent: number;
  currentTimeSeconds: number;
  durationSeconds: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (percent: number) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  isRepeat: boolean;
  onToggleRepeat: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentSong,
  isPlaying,
  progressPercent,
  currentTimeSeconds,
  durationSeconds,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  isShuffle,
  onToggleShuffle,
  isRepeat,
  onToggleRepeat,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPercent, setDragPercent] = useState(0);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const [showRemaining, setShowRemaining] = useState(false);
  const progressTrackRef = useRef<HTMLDivElement>(null);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activePercent = isDragging ? dragPercent : progressPercent;
  const activeSeconds = (activePercent / 100) * (durationSeconds || 180);

  const calculatePercentFromX = useCallback((clientX: number) => {
    if (!progressTrackRef.current) return 0;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    return Math.round((clampedX / rect.width) * 1000) / 10;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!currentSong) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    const pct = calculatePercentFromX(e.clientX);
    setDragPercent(pct);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      const pct = calculatePercentFromX(e.clientX);
      setDragPercent(pct);
    } else {
      const pct = calculatePercentFromX(e.clientX);
      setHoverPercent(pct);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      const pct = calculatePercentFromX(e.clientX);
      onSeek(pct);
      setIsDragging(false);
    }
  };

  const handlePointerLeave = () => {
    setHoverPercent(null);
  };

  const title = currentSong ? currentSong.title : "Pick a song!";
  const artist = currentSong ? currentSong.artist : "tap the list above";
  const artColor = currentSong ? currentSong.color : "var(--mint)";

  return (
    <>
      {/* Expanded player modal for mobile/desktop full-view if toggled */}
      {isExpanded && currentSong && (
        <div 
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[var(--overlay-bg)] backdrop-blur-md animate-pop"
          onClick={() => setIsExpanded(false)}
        >
          <div 
            className="w-full max-w-sm rounded-[36px] p-6 clay-box-lg flex flex-col items-center text-center space-y-5"
            style={{ background: 'var(--clay-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">
                Now Playing
              </span>
              <button 
                onClick={() => setIsExpanded(false)}
                className="w-8 h-8 rounded-full clay-button flex items-center justify-center text-[var(--text-dim)]"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Big Art */}
            <div 
              className="w-48 h-48 rounded-3xl shadow-xl flex items-center justify-center relative overflow-hidden transition-transform duration-500"
              style={{ background: artColor, transform: isPlaying ? 'scale(1.02)' : 'scale(0.98)' }}
            >
              <div className="text-white text-4xl font-extrabold font-['Baloo_2'] drop-shadow-md">
                {currentSong.title.slice(0, 1)}
              </div>
            </div>

            {/* Title & Artist */}
            <div className="w-full">
              <h2 className="text-xl font-bold font-['Baloo_2'] truncate text-[var(--text)]">
                {currentSong.title}
              </h2>
              <p className="text-sm font-semibold text-[var(--text-dim)] truncate mt-0.5">
                {currentSong.artist}
              </p>
            </div>

            {/* High-Precision Progress Bar Scrubber */}
            <div className="w-full space-y-2 py-1">
              <div 
                ref={progressTrackRef}
                className={`mp-progress-track relative w-full h-2.5 rounded-full cursor-pointer transition-all ${
                  isDragging ? 'is-dragging ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--clay-bg)]' : ''
                }`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
                role="slider"
                aria-label="Song progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(activePercent)}
                title="Click or drag to seek any part of the song"
              >
                {/* Progress Fill with Glowing Gradient */}
                <div 
                  className="mp-progress-fill h-full rounded-full" 
                  style={{ width: `${Math.max(0, Math.min(100, activePercent))}%` }} 
                />

                {/* Scrubber Star Knob / Handle */}
                <div 
                  className="mp-progress-thumb-star"
                  style={{ left: `${Math.max(0, Math.min(100, activePercent))}%` }}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className={`w-5 h-5 fill-white stroke-[var(--accent)] stroke-[1.5] drop-shadow-md transition-transform ${isPlaying ? 'animate-pulse' : ''}`}
                  >
                    {/* 4-Point Star Sparkle */}
                    <path d="M12 2 Q 13.5 10.5 22 12 Q 13.5 13.5 12 22 Q 10.5 13.5 2 12 Q 10.5 10.5 12 2 Z" />
                  </svg>
                </div>

                {/* Floating Scrub / Hover Time Tooltip */}
                {(isDragging || hoverPercent !== null) && (
                  <div 
                    className="absolute -top-8 px-2 py-0.5 rounded-md bg-zinc-900 text-white text-[10px] font-bold shadow-lg pointer-events-none transform -translate-x-1/2 transition-opacity z-10 border border-zinc-700"
                    style={{ left: `${Math.max(0, Math.min(100, isDragging ? dragPercent : (hoverPercent ?? 0)))}%` }}
                  >
                    {formatTime(((isDragging ? dragPercent : (hoverPercent ?? 0)) / 100) * (durationSeconds || 180))}
                  </div>
                )}
              </div>

              {/* Time displays */}
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-dim)] px-1 select-none">
                <span className="tabular-nums font-mono text-[11px] text-[var(--text)]">
                  {formatTime(activeSeconds)}
                </span>

                <button 
                  onClick={() => setShowRemaining(!showRemaining)}
                  className="tabular-nums font-mono text-[11px] hover:text-[var(--text)] transition-colors"
                  title="Click to toggle remaining time"
                >
                  {showRemaining 
                    ? `-${formatTime(Math.max(0, (durationSeconds || 180) - activeSeconds))}` 
                    : formatTime(durationSeconds || 180)}
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="w-full flex items-center justify-between px-2 pt-1">
              <button
                onClick={onToggleShuffle}
                className={`p-2.5 rounded-full clay-button transition-colors ${isShuffle ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-dim)]'}`}
                title="Shuffle"
              >
                <Shuffle size={16} />
              </button>

              <button
                onClick={onPrev}
                className="w-12 h-12 rounded-full clay-button flex items-center justify-center text-[var(--text)]"
                title="Previous track"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 6h2v12H6zM20 6v12l-9-6z"/></svg>
              </button>

              <button
                onClick={onTogglePlay}
                className="w-16 h-16 rounded-full clay-accent-btn flex items-center justify-center text-white"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 ml-1"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>

              <button
                onClick={onNext}
                className="w-12 h-12 rounded-full clay-button flex items-center justify-center text-[var(--text)]"
                title="Next track"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M16 6h2v12h-2zM4 6v12l9-6z"/></svg>
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-2.5 rounded-full clay-button transition-colors ${isRepeat ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-dim)]'}`}
                title="Repeat track"
              >
                <Repeat size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Floating Mini Player Pill Bar */}
      <div className="mini-player overflow-hidden relative" id="miniPlayer">
        <div className="mp-body">
          {/* 50% Space: Music Details (Art + Title & Artist) */}
          <div 
            className="mp-music-details" 
            onClick={() => currentSong && setIsExpanded(true)}
            title="Click to expand player"
          >
            <div 
              className="mp-art flex items-center justify-center" 
              id="mpArt" 
              style={{ background: artColor }}
            >
              {currentSong ? currentSong.title.slice(0, 1) : "♪"}
            </div>

            <div className="mp-info">
              <div className="mp-title" id="mpTitle">{title}</div>
              <div className="mp-artist" id="mpArtist">{artist}</div>
            </div>
          </div>

          {/* 50% Space: Static Sine Wave Progress Bar (Display-Only) */}
          <div className="mp-waveform-area">
            <SineWaveProgressBar
              progressPercent={progressPercent}
              durationSeconds={durationSeconds}
              currentTimeSeconds={currentTimeSeconds}
              isPlaying={isPlaying}
            />
          </div>

          {/* Right Controls: 3 buttons unchanged */}
          <div className="mp-controls">
            {/* Prev Track */}
            <button 
              className="mp-btn" 
              id="mpPrev" 
              aria-label="Previous"
              title="Previous song"
              onClick={onPrev}
            >
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM20 6v12l-9-6z"/></svg>
            </button>

            {/* Centered Modern Play/Pause Accent Button */}
            <button 
              className="mp-play-btn" 
              id="mpPlay" 
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause" : "Play"}
              onClick={onTogglePlay}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                {isPlaying ? (
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z"/>
                ) : (
                  <path d="M8 5v14l11-7z"/>
                )}
              </svg>
            </button>

            {/* Next Track */}
            <button 
              className="mp-btn" 
              id="mpNext" 
              aria-label="Next"
              title="Next song"
              onClick={onNext}
            >
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM4 6v12l9-6z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

