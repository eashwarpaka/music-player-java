import React, { useEffect, useRef, useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  FolderPlus, 
  Trash2, 
  Moon, 
  Sun, 
  Layers, 
  X,
  Palette,
  Check
} from 'lucide-react';
import { useUIStyle } from '../../context';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  hasSelectedSongs: boolean;
  selectedCount: number;
  totalSongsCount: number;
  onOpenAddToGeneric: () => void;
  onDeleteSelected: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenGenericScreen: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isOpen,
  onClose,
  isSelectionMode,
  onToggleSelectionMode,
  onSelectAll,
  onDeselectAll,
  hasSelectedSongs,
  selectedCount,
  totalSongsCount,
  onOpenAddToGeneric,
  onDeleteSelected,
  isDarkMode,
  onToggleDarkMode,
  onOpenGenericScreen,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { currentStyle, setStyle, styleDefinition, allStyles } = useUIStyle();
  const [showStyleOptions, setShowStyleOptions] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute top-14 right-0 w-72 rounded-3xl p-4 clay-box-lg z-50 animate-pop"
      style={{
        background: 'var(--clay-bg)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-base tracking-wide" style={{ fontFamily: "'Baloo 2', cursive" }}>
            Settings & Actions
          </span>
        </div>
        <button 
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          aria-label="Close settings"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-1.5 text-sm font-semibold">
        {/* Intelligent Dark Mode / Light Mode toggle - only shown for UI styles that support light mode */}
        {styleDefinition.supportsLightMode && (
          <button
            onClick={onToggleDarkMode}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-400" />}
              <span>Appearance</span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: 'var(--border-subtle)', color: 'var(--text)' }}>
              {isDarkMode ? "Dark Mode" : "Light Mode"}
            </span>
          </button>
        )}

        {/* UI Design Style Switcher */}
        <div className="space-y-1">
          <button
            onClick={() => setShowStyleOptions((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <Palette size={17} className="text-[var(--accent)]" />
              <span>UI Style</span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: 'var(--accent)', color: '#fff' }}>
              <span>{styleDefinition.emoji}</span>
              <span>{styleDefinition.name}</span>
            </span>
          </button>

          {showStyleOptions && (
            <div className="px-1 py-1.5 grid grid-cols-2 gap-1.5 animate-fadeIn">
              {allStyles.map((s) => {
                const isActive = s.id === currentStyle;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setStyle(s.id);
                      setShowStyleOptions(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-[var(--accent)] text-white shadow-xs' 
                        : 'bg-black/5 dark:bg-white/5 text-[var(--text)] hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{s.emoji}</span>
                      <span className="truncate">{s.name}</span>
                    </span>
                    {isActive && <Check size={12} strokeWidth={3} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="my-1.5 border-t border-[var(--border-subtle)]" />

        {/* Selection Mode Toggle */}
        <button
          onClick={() => {
            onToggleSelectionMode();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <CheckSquare size={17} className="text-[var(--accent)]" />
            <span>{isSelectionMode ? "Exit Song Selection" : "Select Songs"}</span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ background: isSelectionMode ? 'var(--accent)' : 'var(--border-subtle)', color: isSelectionMode ? '#fff' : 'var(--text-dim)' }}>
            {isSelectionMode ? "Active" : "Off"}
          </span>
        </button>

        {/* Select All Songs / Deselect All Songs */}
        <button
          onClick={() => {
            if (selectedCount === totalSongsCount && totalSongsCount > 0) {
              onDeselectAll();
            } else {
              onSelectAll();
            }
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <Square size={17} className="text-[var(--mint)]" />
            <span>{selectedCount === totalSongsCount && totalSongsCount > 0 ? "Deselect All Songs" : "Select All Songs"}</span>
          </div>
          <span className="text-xs text-[var(--text-dim)] font-bold">
            {selectedCount}/{totalSongsCount}
          </span>
        </button>

        {/* Add into Generic Block */}
        <button
          onClick={() => {
            onOpenAddToGeneric();
            onClose();
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all text-left ${
            hasSelectedSongs 
              ? 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text)]' 
              : 'opacity-70 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <FolderPlus size={17} className="text-[var(--mint)]" />
            <span>Add into Generic</span>
          </div>
          {hasSelectedSongs && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--mint)] text-slate-900 font-extrabold">
              +{selectedCount}
            </span>
          )}
        </button>

        {/* Delete Selected Songs */}
        <button
          onClick={() => {
            if (hasSelectedSongs) {
              onDeleteSelected();
              onClose();
            } else {
              if (!isSelectionMode) onToggleSelectionMode();
              onClose();
            }
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all text-left ${
            hasSelectedSongs 
              ? 'hover:bg-red-500/10 text-red-500 font-bold' 
              : 'opacity-70 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <Trash2 size={17} className={hasSelectedSongs ? "text-red-500" : "text-[var(--text-dim)]"} />
            <span>{hasSelectedSongs ? `Delete (${selectedCount}) Songs` : "Delete Selected Songs"}</span>
          </div>
        </button>

        <div className="my-1.5 border-t border-[var(--border-subtle)]" />

        {/* Go to Generic Screen */}
        <button
          onClick={() => {
            onOpenGenericScreen();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <Layers size={17} className="text-[var(--accent)]" />
            <span>Open Generic Blocks</span>
          </div>
          <span className="text-xs text-[var(--text-dim)] font-bold">&rarr;</span>
        </button>
      </div>
    </div>
  );
};
