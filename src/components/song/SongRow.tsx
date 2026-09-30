import React from 'react';
import { Song } from '../../types';
import { Check } from 'lucide-react';
import { PlayingDotsIndicator } from '../common';

interface SongRowProps {
  song: Song;
  isActive: boolean;
  isPlaying: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: (id: string) => void;
  onPlay: (song: Song) => void;
}

export const SongRow: React.FC<SongRowProps> = ({
  song,
  isActive,
  isPlaying,
  isSelected,
  isSelectionMode,
  onSelect,
  onPlay,
}) => {
  const isCurrentPlaying = isActive && isPlaying;

  return (
    <li
      className={`song-row ${isActive ? 'active' : ''} ${isSelected ? 'ring-2 ring-[var(--accent)]' : ''}`}
      onClick={() => {
        if (isSelectionMode) {
          onSelect(song.id);
        } else {
          onPlay(song);
        }
      }}
    >
      {/* Checkbox when in selection mode */}
      {isSelectionMode && (
        <div
          className={`clay-checkbox ${isSelected ? 'checked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(song.id);
          }}
        >
          {isSelected && <Check size={16} strokeWidth={3} />}
        </div>
      )}

      {/* Album / Song Art - always shows clean letter, never replaced by dots */}
      <div 
        className="song-art relative flex items-center justify-center" 
        style={{ background: song.color }}
      >
        <span className="font-extrabold text-white text-base">
          {song.title.slice(0, 1)}
        </span>
      </div>

      <div className="song-meta">
        <div className="song-title">{song.title}</div>
        <div className="song-artist">{song.artist}</div>
      </div>

      {/* Song Duration / Time Side - Shows moving 3-dots indicator here when playing */}
      <div className="song-duration flex items-center justify-end min-w-[42px]">
        {isCurrentPlaying ? (
          <PlayingDotsIndicator size="md" color="var(--accent)" />
        ) : (
          <span>{song.duration}</span>
        )}
      </div>
    </li>
  );
};
