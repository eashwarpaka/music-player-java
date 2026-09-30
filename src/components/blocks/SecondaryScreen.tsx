import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GenericBlock, Song } from '../../types';
import { PlayingDotsIndicator } from '../common';
import { 
  Settings, 
  Search, 
  Trash2, 
  CheckSquare, 
  Check, 
  Plus, 
  Play, 
  Music, 
  FolderMinus,
  FolderPlus,
  CheckCheck,
  X,
  Palette,
  Edit2,
  Heart,
  Disc3,
  Sparkles,
  ArrowRight,
  Folder
} from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Default Clay', value: '' },
  { name: 'Coral', value: '#ff7a59' },
  { name: 'Mint', value: '#2dd4bf' },
  { name: 'Indigo', value: '#818cf8' },
  { name: 'Sunflower', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Sky', value: '#38bdf8' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Violet', value: '#a855f7' },
  { name: 'Berry', value: '#ec4899' },
];

function getBlockContrast(hexColor?: string) {
  if (!hexColor) {
    return {
      text: 'var(--text)',
      subtext: 'var(--text-dim)',
      badgeBg: 'var(--mint)',
      badgeText: '#ffffff',
      isCustom: false,
    };
  }

  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  const isLight = yiq >= 165;

  return {
    text: isLight ? '#0f172a' : '#ffffff',
    subtext: isLight ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
    badgeBg: isLight ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.25)',
    badgeText: isLight ? '#0f172a' : '#ffffff',
    isCustom: true,
  };
}

interface SecondaryScreenProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: GenericBlock[];
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onAddBlock: (customName?: string) => void;
  onEditBlock: (id: number, newName?: string, newColor?: string) => void;
  onDeleteBlock: (id: number) => void;
  onDeleteMultipleBlocks?: (ids: number[]) => void;
  onRemoveSongFromBlock: (blockId: number, songId: string) => void;
  onRemoveMultipleSongsFromBlock: (blockId: number, songIds: string[]) => void;
  onOpenMainScreenWithSelection: () => void;
}

export const SecondaryScreen: React.FC<SecondaryScreenProps> = ({
  isOpen,
  onClose,
  blocks,
  songs,
  currentSong,
  isPlaying,
  onPlaySong,
  onAddBlock,
  onEditBlock,
  onDeleteBlock,
  onDeleteMultipleBlocks,
  onRemoveSongFromBlock,
  onRemoveMultipleSongsFromBlock,
  onOpenMainScreenWithSelection,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  
  // Search state within block
  const [isBlockSearchOpen, setIsBlockSearchOpen] = useState(false);
  const [blockSearchQuery, setBlockSearchQuery] = useState('');
  const blockSearchInputRef = useRef<HTMLInputElement>(null);

  // Settings menu in block view
  const [isBlockSettingsOpen, setIsBlockSettingsOpen] = useState(false);
  const blockSettingsRef = useRef<HTMLDivElement>(null);

  // Selection mode inside current block (toggled via Settings menu)
  const [isBlockSelectionMode, setIsBlockSelectionMode] = useState(false);
  const [selectedInBlockSongIds, setSelectedInBlockSongIds] = useState<string[]>([]);

  // Generic screen settings menu & block deletion mode
  const [isGenericSettingsOpen, setIsGenericSettingsOpen] = useState(false);
  const genericSettingsRef = useRef<HTMLDivElement>(null);
  const [isDeleteBlocksMode, setIsDeleteBlocksMode] = useState(false);
  const [selectedBlockIdsToDelete, setSelectedBlockIdsToDelete] = useState<number[]>([]);

  // Modals for creating and deleting blocks cleanly
  const [showCreateBlockModal, setShowCreateBlockModal] = useState(false);
  const [newBlockInput, setNewBlockInput] = useState('');
  const [showDeleteBlocksModal, setShowDeleteBlocksModal] = useState(false);

  // Long press block editing modal (Name & Color)
  const [editingBlock, setEditingBlock] = useState<GenericBlock | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<string>('');

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef(false);
  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Helper: check if a block is the permanent Favorite block
  const isFavoriteBlock = (b?: GenericBlock | null) => {
    if (!b) return false;
    return b.id === 1 || b.name.toLowerCase() === 'favorite' || b.name.toLowerCase() === 'favorites';
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  // Resolve songs belonging to the selected block
  const blockSongs: Song[] = useMemo(() => {
    if (!selectedBlock) return [];
    return selectedBlock.songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter((s): s is Song => Boolean(s));
  }, [selectedBlock, songs]);

  // Filter block songs by block search
  const filteredBlockSongs = useMemo(() => {
    const q = blockSearchQuery.trim().toLowerCase();
    if (!q) return blockSongs;
    return blockSongs.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [blockSongs, blockSearchQuery]);

  // Click outside handlers for menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (blockSettingsRef.current && !blockSettingsRef.current.contains(e.target as Node)) {
        setIsBlockSettingsOpen(false);
      }
      if (genericSettingsRef.current && !genericSettingsRef.current.contains(e.target as Node)) {
        setIsGenericSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset block-level selection when switching blocks
  useEffect(() => {
    setIsBlockSelectionMode(false);
    setSelectedInBlockSongIds([]);
    setIsBlockSearchOpen(false);
    setBlockSearchQuery('');
    setIsBlockSettingsOpen(false);
    setIsDeleteBlocksMode(false);
    setSelectedBlockIdsToDelete([]);
  }, [selectedBlockId, isOpen]);

  // Gesture handling inside SecondaryScreen:
  // - When inside a specific block view (selectedBlockId !== null):
  //   Swiping from left to right (deltaX > 0) navigates back to generic blocks overview.
  // - When in generic blocks overview (selectedBlockId === null):
  //   Swiping from left to right (deltaX > 0) navigates back to My Songs main screen.
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

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

      // Check horizontal swipe from left to right
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 45) {
        if (selectedBlockId !== null) {
          // Swipe left to right inside a block -> go back to generic blocks
          setSelectedBlockId(null);
        } else {
          // Swipe left to right in generic screen -> go back to main screen
          onClose();
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, input, .block-btn, .search-wrap, .search-input, .settings-modal')) {
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

      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
        if (selectedBlockId !== null) {
          // Go back to generic blocks
          setSelectedBlockId(null);
        } else {
          // Go back to main screen
          onClose();
        }
      }
    };

    const node = containerRef.current;
    if (node) {
      node.addEventListener('touchstart', onTouchStart, { passive: true });
      node.addEventListener('touchend', onTouchEnd, { passive: true });
      node.addEventListener('mousedown', onMouseDown);
      node.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      if (node) {
        node.removeEventListener('touchstart', onTouchStart);
        node.removeEventListener('touchend', onTouchEnd);
        node.removeEventListener('mousedown', onMouseDown);
        node.removeEventListener('mouseup', onMouseUp);
      }
    };
  }, [isOpen, selectedBlockId, onClose]);

  const handlePlayAllInBlock = () => {
    if (filteredBlockSongs.length > 0) {
      onPlaySong(filteredBlockSongs[0]);
    }
  };

  const handleToggleSelectSongInBlock = (songId: string) => {
    setSelectedInBlockSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  const handleSelectAllInBlock = () => {
    setSelectedInBlockSongIds(filteredBlockSongs.map((s) => s.id));
    if (!isBlockSelectionMode) setIsBlockSelectionMode(true);
  };

  const handleDeselectAllInBlock = () => {
    setSelectedInBlockSongIds([]);
  };

  const handleRemoveSelectedFromBlock = () => {
    if (!selectedBlock || selectedInBlockSongIds.length === 0) return;
    const count = selectedInBlockSongIds.length;
    if (window.confirm(`Remove ${count} song${count > 1 ? 's' : ''} from "${selectedBlock.name}"?`)) {
      onRemoveMultipleSongsFromBlock(selectedBlock.id, selectedInBlockSongIds);
      setSelectedInBlockSongIds([]);
      setIsBlockSelectionMode(false);
    }
  };

  const handleToggleSelectBlockToDelete = (blockId: number) => {
    const target = blocks.find((b) => b.id === blockId);
    if (isFavoriteBlock(target)) return;
    setSelectedBlockIdsToDelete((prev) =>
      prev.includes(blockId) ? prev.filter((id) => id !== blockId) : [...prev, blockId]
    );
  };

  const handleConfirmCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockInput.trim()) return;
    onAddBlock(newBlockInput.trim());
    setNewBlockInput('');
    setShowCreateBlockModal(false);
    setIsGenericSettingsOpen(false);
  };

  const openEditModal = (block: GenericBlock) => {
    setEditingBlock(block);
    setEditName(block.name);
    setEditColor(block.color || '');
  };

  const handlePointerDown = (e: React.PointerEvent, block: GenericBlock) => {
    if (isDeleteBlocksMode) return;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    isLongPressActiveRef.current = false;
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(60);
        } catch (_) {}
      }
      openEditModal(block);
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleBlockClick = (block: GenericBlock) => {
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      return;
    }
    if (isDeleteBlocksMode) {
      handleToggleSelectBlockToDelete(block.id);
    } else {
      setSelectedBlockId(block.id);
    }
  };

  const handleSaveEditBlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingBlock) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    onEditBlock(editingBlock.id, trimmed, editColor || undefined);
    setEditingBlock(null);
  };

  return (
    <div 
      ref={containerRef}
      className={`secondary-screen ${isOpen ? 'active' : ''}`}
      id="secondaryScreen"
    >
      <div className="secondary-container">
        {/* ==================================================================== */}
        {/* SCREEN 2 HEADER: Clean gesture-first header                           */}
        {/* - Left side: Logo on both screens (No back button; gesture handles it)*/}
        {/* - Middle: Generic (or Block Name when inside block)                  */}
        {/* - Right side: Settings button on Generic Screen                       */}
        {/*               Search bar & Settings on Block Screen                  */}
        {/* ==================================================================== */}
        <header className="secondary-header">
          {/* Left Side: Logo */}
          <div className="secondary-header-left">
            <div 
              className="brand cursor-pointer" 
              onClick={() => {
                if (selectedBlockId !== null) {
                  setSelectedBlockId(null);
                } else {
                  onClose();
                }
              }}
              title={selectedBlockId !== null ? "Swipe right to return to Generic Blocks" : "Swipe right to return to My Songs"}
            >
              <span className="brand-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="17" r="3" fill="currentColor"/>
                  <circle cx="18" cy="15" r="3" fill="currentColor"/>
                  <path d="M12 17V5.5L21 4v10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="brand-name hidden sm:inline">POP</span>
            </div>
          </div>

          {/* Middle: Title (Generic or Block Name) - smoothly hidden when search takes over */}
          <div className={`secondary-header-center flex-1 text-center px-2 ${isBlockSearchOpen ? 'hidden-for-search' : ''}`}>
            <h2 className="secondary-title truncate" title={selectedBlock ? selectedBlock.name : "Generic"}>
              {selectedBlock ? selectedBlock.name : "Generic"}
            </h2>
          </div>

          {/* Right Side Actions */}
          <div className={`secondary-header-right flex items-center justify-end gap-2 ${isBlockSearchOpen ? 'search-expanded' : ''}`}>
            {selectedBlockId === null ? (
              /* SCREEN 2 (GENERIC HOME): Replaced Generic block had with Settings icon button */
              <div className="relative" ref={genericSettingsRef}>
                <button
                  onClick={() => setIsGenericSettingsOpen(!isGenericSettingsOpen)}
                  className={`icon-btn relative ${isGenericSettingsOpen || isDeleteBlocksMode ? 'selected' : ''}`}
                  aria-label="Generic Blocks Settings"
                  title="Block Settings (Create / Delete Blocks)"
                >
                  <Settings size={20} className={isDeleteBlocksMode ? "text-red-500" : ""} />
                  {isDeleteBlocksMode && (
                    <span 
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white bg-red-500 shadow-xs"
                    >
                      !
                    </span>
                  )}
                </button>

                {isGenericSettingsOpen && (
                  <div 
                    className="absolute top-14 right-0 w-60 rounded-3xl p-3 clay-box-lg z-50 animate-pop space-y-2"
                    style={{ background: 'var(--clay-bg)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] px-2 pt-1 pb-1 border-b border-[var(--border-subtle)] flex items-center justify-between">
                      <span className="font-['Baloo_2'] text-sm font-extrabold text-[var(--text)]">Generic Options</span>
                      <button 
                        onClick={() => setIsGenericSettingsOpen(false)}
                        className="text-[var(--text-dim)] hover:text-[var(--text)]"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Button 1: Create Block */}
                    <button
                      onClick={() => {
                        setIsGenericSettingsOpen(false);
                        setShowCreateBlockModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left text-xs font-bold text-[var(--accent)]"
                    >
                      <Plus size={16} />
                      <span>Create New Block</span>
                    </button>

                    {/* Button 2: Delete Block(s) Dialog */}
                    <button
                      onClick={() => {
                        setIsGenericSettingsOpen(false);
                        setShowDeleteBlocksModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl hover:bg-red-500/10 transition-all text-left text-xs font-bold text-red-500"
                    >
                      <Trash2 size={16} />
                      <span>Delete Blocks...</span>
                    </button>

                    {/* Button 3: Toggle On-Grid Delete Mode */}
                    <button
                      onClick={() => {
                        setIsGenericSettingsOpen(false);
                        setIsDeleteBlocksMode((prev) => !prev);
                        setSelectedBlockIdsToDelete([]);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left text-[11px] font-bold ${
                        isDeleteBlocksMode ? 'text-red-500 bg-red-500/10' : 'text-[var(--text-dim)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare size={14} />
                        <span>Grid Quick Delete</span>
                      </div>
                      <span 
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ 
                          background: isDeleteBlocksMode ? '#f43f5e' : 'var(--border-subtle)', 
                          color: isDeleteBlocksMode ? '#fff' : 'var(--text-dim)' 
                        }}
                      >
                        {isDeleteBlocksMode ? 'Active' : 'Off'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* SCREEN 2 (INSIDE BLOCK): Search bar takes over title & Block Settings */
              <div className="flex items-center gap-2 w-full justify-end">
                {/* Search Bar in block view: takes over title when open */}
                <div className={`search-wrap ${isBlockSearchOpen ? 'open' : ''}`}>
                  <input
                    ref={blockSearchInputRef}
                    type="text"
                    className="search-input"
                    placeholder={`Search tunes in ${selectedBlock?.name || 'block'}...`}
                    autoComplete="off"
                    value={blockSearchQuery}
                    onChange={(e) => setBlockSearchQuery(e.target.value)}
                  />
                  <button
                    className="icon-btn search-toggle"
                    aria-label="Toggle search in block"
                    onClick={() => {
                      if (isBlockSearchOpen) {
                        setIsBlockSearchOpen(false);
                        setBlockSearchQuery('');
                      } else {
                        setIsBlockSearchOpen(true);
                        setTimeout(() => blockSearchInputRef.current?.focus(), 200);
                      }
                    }}
                  >
                    <Search size={18} />
                  </button>
                </div>

                {/* Settings in block view */}
                <div className="relative" ref={blockSettingsRef}>
                  <button
                    onClick={() => setIsBlockSettingsOpen(!isBlockSettingsOpen)}
                    className={`icon-btn ${isBlockSettingsOpen || isBlockSelectionMode ? 'selected' : ''}`}
                    aria-label="Block Settings"
                    title="Block Settings & Actions"
                  >
                    <Settings size={18} className={isBlockSelectionMode ? "text-[var(--accent)]" : ""} />
                    {selectedInBlockSongIds.length > 0 && (
                      <span 
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-xs"
                        style={{ background: 'var(--accent)' }}
                      >
                        {selectedInBlockSongIds.length}
                      </span>
                    )}
                  </button>

                  {/* Settings dropdown for Block:
                      1. Select songs to delete
                      2. Add songs from the main screen
                      3. Delete the block
                  */}
                  {isBlockSettingsOpen && (
                    <div 
                      className="absolute top-14 right-0 w-72 rounded-3xl p-4 clay-box-lg z-50 animate-pop space-y-2.5"
                      style={{ background: 'var(--clay-bg)', border: '1px solid var(--border-subtle)' }}
                    >
                      <div className="flex items-center justify-between pb-2 mb-1 border-b border-[var(--border-subtle)]">
                        <span className="font-extrabold text-sm tracking-wide font-['Baloo_2'] text-[var(--text)]">
                          {selectedBlock?.name} Settings
                        </span>
                        <button 
                          onClick={() => setIsBlockSettingsOpen(false)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)]"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Option 1: Select songs to delete */}
                      <button
                        onClick={() => {
                          setIsBlockSelectionMode(!isBlockSelectionMode);
                          setIsBlockSettingsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left text-xs font-bold"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckSquare size={16} className="text-[var(--accent)]" />
                          <span>Select songs to delete</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: isBlockSelectionMode ? 'var(--accent)' : 'var(--border-subtle)', color: isBlockSelectionMode ? '#fff' : 'var(--text-dim)' }}>
                          {isBlockSelectionMode ? "Active" : "Off"}
                        </span>
                      </button>

                      {/* If in select mode, quick trigger to delete selected songs */}
                      {selectedInBlockSongIds.length > 0 && (
                        <button
                          onClick={() => {
                            handleRemoveSelectedFromBlock();
                            setIsBlockSettingsOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all text-left text-xs font-bold"
                        >
                          <div className="flex items-center gap-2.5">
                            <FolderMinus size={15} />
                            <span>Delete ({selectedInBlockSongIds.length}) Selected Songs</span>
                          </div>
                        </button>
                      )}

                      {/* Option 2: Add songs from the main screen */}
                      <button
                        onClick={() => {
                          setIsBlockSettingsOpen(false);
                          onOpenMainScreenWithSelection();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left text-xs font-bold text-[var(--text)]"
                      >
                        <div className="flex items-center gap-2.5">
                          <FolderPlus size={16} className="text-[var(--mint)]" />
                          <span>Add songs from main screen</span>
                        </div>
                        <span className="text-[11px] text-[var(--text-dim)] font-bold">&rarr;</span>
                      </button>

                      <div className="my-1 border-t border-[var(--border-subtle)]" />

                      {/* Option 3: Delete the block */}
                      {selectedBlock && (
                        <button
                          onClick={() => {
                            setIsBlockSettingsOpen(false);
                            onDeleteBlock(selectedBlock.id);
                            setSelectedBlockId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl hover:bg-red-500/10 transition-all text-left text-xs font-bold text-red-500"
                        >
                          <Trash2 size={16} />
                          <span>Delete the block</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Modal for creating new block (reliable custom input) */}
        {showCreateBlockModal && (
          <div 
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[var(--overlay-bg)] backdrop-blur-xs animate-pop"
            onClick={() => setShowCreateBlockModal(false)}
          >
            <div 
              className="w-full max-w-sm rounded-3xl p-6 clay-box-lg space-y-4"
              style={{ background: 'var(--clay-bg)', border: '1px solid var(--border-subtle)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <h3 className="text-lg font-bold font-['Baloo_2'] text-[var(--text)]">Create New Block</h3>
                <button 
                  onClick={() => setShowCreateBlockModal(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)]"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleConfirmCreateBlock} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">
                    Block Name
                  </label>
                  <input
                    type="text"
                    value={newBlockInput}
                    onChange={(e) => setNewBlockInput(e.target.value)}
                    placeholder={`e.g., Chill Beats, Workout, Road Trip...`}
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl clay-inset text-sm font-semibold outline-none bg-transparent text-[var(--text)] placeholder:text-[var(--text-dim)]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!newBlockInput.trim()}
                    className="flex-1 py-2.5 rounded-2xl clay-accent-btn font-bold text-xs disabled:opacity-50"
                  >
                    Create Block
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateBlockModal(false)}
                    className="px-4 py-2.5 rounded-2xl clay-button font-bold text-xs text-[var(--text-dim)]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for deleting blocks (interactive & personable) */}
        {showDeleteBlocksModal && (
          <div 
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[var(--overlay-bg)] backdrop-blur-xs animate-pop"
            onClick={() => setShowDeleteBlocksModal(false)}
          >
            <div 
              className="w-full max-w-md rounded-3xl p-6 clay-box-lg space-y-4 max-h-[85vh] flex flex-col"
              style={{ background: 'var(--clay-bg)', border: '1px solid var(--border-subtle)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center">
                    <Trash2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-['Baloo_2'] text-[var(--text)]">Delete Blocks</h3>
                    <p className="text-[11px] text-[var(--text-dim)] font-semibold">Choose blocks you want to remove</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDeleteBlocksModal(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Blocks list */}
              <div className="overflow-y-auto space-y-2 py-1 flex-1 pr-1">
                {blocks.length === 0 ? (
                  <p className="text-center py-6 text-xs text-[var(--text-dim)] font-semibold">
                    No blocks available.
                  </p>
                ) : (
                  blocks.map((b) => {
                    const isFav = isFavoriteBlock(b);
                    const songCount = b.songIds.length;
                    return (
                      <div 
                        key={b.id}
                        className="p-3 rounded-2xl flex items-center justify-between gap-3 clay-box transition-all"
                        style={{ background: 'var(--clay-bg)', border: '1px solid var(--border-subtle)' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                            style={{ 
                              background: b.color || (isFav ? 'linear-gradient(135deg, #f43f5e, #fb7185)' : 'var(--clay-bg)'),
                              color: b.color || isFav ? '#ffffff' : 'var(--text)'
                            }}
                          >
                            {isFav ? <Heart size={16} className="fill-current text-rose-500" /> : <Disc3 size={16} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold block truncate text-[var(--text)] font-['Baloo_2']">
                                {b.name}
                              </span>
                              {isFav && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-500/10 text-rose-500">
                                  Default
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-[var(--text-dim)]">
                              {songCount} {songCount === 1 ? 'track' : 'tracks'}
                            </span>
                          </div>
                        </div>

                        {isFav ? (
                          <span 
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--text-dim)] bg-black/5 dark:bg-white/5 cursor-not-allowed select-none"
                            title="The Favorite block is permanent and cannot be deleted"
                          >
                            Permanent
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              onDeleteBlock(b.id);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-500 transition-all shrink-0 cursor-pointer"
                            title={`Delete ${b.name}`}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 shrink-0">
                <button
                  onClick={() => {
                    setShowDeleteBlocksModal(false);
                    setIsDeleteBlocksMode(true);
                  }}
                  className="px-3 py-2 rounded-2xl clay-button font-bold text-xs text-[var(--text-dim)] flex items-center gap-1.5"
                >
                  <CheckSquare size={14} />
                  <span>Use Grid Delete</span>
                </button>
                <button
                  onClick={() => setShowDeleteBlocksModal(false)}
                  className="px-5 py-2 rounded-2xl clay-accent-btn font-bold text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for editing block (triggered via long press): 1. Change Name, 2. Change Color */}
        {editingBlock && (
          <div 
            className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-[var(--overlay-bg)] backdrop-blur-xs animate-pop"
            onClick={() => setEditingBlock(null)}
          >
            <div 
              className="w-full max-w-sm rounded-3xl p-6 clay-box-lg space-y-4"
              style={{ background: 'var(--clay-bg)', border: '1px solid var(--border-subtle)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold transition-all shadow-xs"
                    style={{ background: editColor || 'var(--accent)' }}
                  >
                    <Palette size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-['Baloo_2'] text-[var(--text)]">Customize Block</h3>
                    <p className="text-[11px] text-[var(--text-dim)] font-semibold">Change name & block color</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingBlock(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)]"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEditBlock} className="space-y-4">
                {/* 1. Change the name */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Edit2 size={13} />
                    <span>Change Name</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter block name..."
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-2xl clay-inset text-sm font-semibold outline-none bg-transparent text-[var(--text)] placeholder:text-[var(--text-dim)]"
                  />
                </div>

                {/* 2. Change the color of the block */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Palette size={13} />
                    <span>Change Color</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_COLORS.map((c) => {
                      const isSelected = editColor === c.value;
                      return (
                        <button
                          type="button"
                          key={c.name}
                          onClick={() => setEditColor(c.value)}
                          className={`h-9 rounded-xl flex items-center justify-center transition-all ${
                            isSelected ? 'ring-2 ring-offset-2 ring-[var(--accent)] scale-105 shadow-md' : 'hover:scale-105'
                          }`}
                          style={{
                            background: c.value || 'var(--clay-bg)',
                            border: c.value ? 'none' : '1px dashed var(--border-subtle)',
                            boxShadow: c.value ? undefined : 'inset 2px 2px 4px var(--clay-shadow-dark)',
                          }}
                          title={c.name}
                        >
                          {isSelected && (
                            <Check size={14} strokeWidth={3} className={c.value ? 'text-white drop-shadow' : 'text-[var(--accent)]'} />
                          )}
                          {!c.value && !isSelected && (
                            <span className="text-[10px] font-bold text-[var(--text-dim)]">Auto</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom color picker */}
                  <div className="mt-2.5 flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-[var(--text-dim)]">Custom Palette Pick:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editColor || '#ff7a59'}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-none bg-transparent"
                        title="Pick custom color"
                      />
                      <span className="text-xs font-mono font-bold text-[var(--text-dim)]">
                        {editColor || 'Default'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                {(() => {
                  const previewContrast = getBlockContrast(editColor);
                  return (
                    <div 
                      className="p-4 rounded-2xl clay-box flex items-center justify-between transition-all"
                      style={{ 
                        background: editColor || 'var(--clay-bg)',
                        color: previewContrast.text,
                        boxShadow: editColor
                          ? '6px 6px 16px var(--clay-shadow-dark), -6px -6px 16px var(--clay-shadow-light), inset 2px 2px 4px rgba(255,255,255,0.3)'
                          : undefined,
                        border: editColor ? 'none' : '1px solid var(--border-subtle)',
                      }}
                    >
                      <div className="min-w-0 pr-2">
                        <span 
                          className="text-sm font-bold block truncate font-['Baloo_2']"
                          style={{ color: previewContrast.text }}
                        >
                          {editName.trim() || 'Block Preview'}
                        </span>
                        <span 
                          className="text-[11px] font-semibold"
                          style={{ color: previewContrast.subtext }}
                        >
                          {editingBlock.songIds.length} {editingBlock.songIds.length === 1 ? 'song' : 'songs'}
                        </span>
                      </div>
                      <span 
                        className="text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-xs shrink-0"
                        style={{ background: previewContrast.badgeBg, color: previewContrast.badgeText }}
                      >
                        Preview
                      </span>
                    </div>
                  );
                })()}

                {/* Form Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={!editName.trim()}
                    className="flex-1 py-2.5 rounded-2xl clay-accent-btn font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBlock(null)}
                    className="px-4 py-2.5 rounded-2xl clay-button font-bold text-xs text-[var(--text-dim)]"
                  >
                    Cancel
                  </button>
                </div>

                {/* Direct Delete from Edit Modal (only for user-created blocks) */}
                {!isFavoriteBlock(editingBlock) && (
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => {
                        const idToDelete = editingBlock.id;
                        setEditingBlock(null);
                        onDeleteBlock(idToDelete);
                      }}
                      className="w-full py-2 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Delete this block</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="secondary-body">
          {selectedBlockId === null ? (
            /* ALL GENERIC BLOCKS GRID */
            <div>
              <div className="flex items-center justify-between mb-4 px-1 max-w-[540px] mx-auto">
                <span className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider">
                  Generic Blocks ({blocks.length})
                </span>
                <span className="text-xs font-semibold text-[var(--text-dim)]">
                  {isDeleteBlocksMode ? "Tap blocks to select" : "Tap to open · Long press to edit"}
                </span>
              </div>

              {/* Delete Mode Action Bar */}
              {isDeleteBlocksMode && (
                <div 
                  className="p-3 mb-4 rounded-2xl clay-box flex items-center justify-between gap-2 animate-pop max-w-[540px] mx-auto"
                  style={{ background: 'var(--clay-bg)', border: '1px solid rgba(244, 63, 94, 0.4)' }}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ background: '#f43f5e', color: '#fff' }}
                    >
                      {selectedBlockIdsToDelete.length}
                    </span>
                    <span className="text-xs font-bold text-[var(--text)]">
                      Selected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const deletableBlocks = blocks.filter((b) => !isFavoriteBlock(b));
                        if (deletableBlocks.length === 0) return;
                        if (selectedBlockIdsToDelete.length === deletableBlocks.length) {
                          setSelectedBlockIdsToDelete([]);
                        } else {
                          setSelectedBlockIdsToDelete(deletableBlocks.map((b) => b.id));
                        }
                      }}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold clay-button"
                    >
                      {(() => {
                        const deletableBlocks = blocks.filter((b) => !isFavoriteBlock(b));
                        return deletableBlocks.length > 0 && selectedBlockIdsToDelete.length === deletableBlocks.length
                          ? 'Deselect All'
                          : 'Select All';
                      })()}
                    </button>

                    <button
                      onClick={() => {
                        if (selectedBlockIdsToDelete.length === 0) return;
                        if (onDeleteMultipleBlocks) {
                          onDeleteMultipleBlocks(selectedBlockIdsToDelete);
                        } else {
                          selectedBlockIdsToDelete.forEach((id) => onDeleteBlock(id));
                        }
                        setSelectedBlockIdsToDelete([]);
                        setIsDeleteBlocksMode(false);
                      }}
                      disabled={selectedBlockIdsToDelete.length === 0}
                      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        selectedBlockIdsToDelete.length > 0
                          ? 'bg-red-500/15 hover:bg-red-500/25 text-red-500 clay-button cursor-pointer'
                          : 'opacity-40 cursor-not-allowed text-[var(--text-dim)]'
                      }`}
                    >
                      <Trash2 size={13} />
                      <span>Delete ({selectedBlockIdsToDelete.length})</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDeleteBlocksMode(false);
                        setSelectedBlockIdsToDelete([]);
                      }}
                      className="p-1 rounded-xl clay-button text-[var(--text-dim)]"
                      title="Exit delete mode"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              )}

              {blocks.length === 0 ? (
                <div className="clay-box rounded-3xl p-8 text-center space-y-3 mt-4 max-w-[540px] mx-auto">
                  <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-[var(--text-dim)] clay-inset">
                    <Music size={28} />
                  </div>
                  <h3 className="font-bold text-base font-['Baloo_2']">No Generic Blocks Yet</h3>
                  <p className="text-xs text-[var(--text-dim)] font-semibold max-w-xs mx-auto">
                    Use the <strong>Settings</strong> button in the header to create a new block!
                  </p>
                  <button 
                    onClick={() => setShowCreateBlockModal(true)} 
                    className="add-block-btn inline-flex items-center gap-1.5 mt-2"
                  >
                    <Plus size={15} />
                    <span>Create Block</span>
                  </button>
                </div>
              ) : (
                <div className="generic-grid" id="genericGrid">
                  {blocks.map((block) => {
                    const songsInThisBlock = block.songIds
                      .map((id) => songs.find((s) => s.id === id))
                      .filter((s): s is Song => Boolean(s));
                    
                    const isAnySongPlaying = songsInThisBlock.some(
                      (s) => s.id === currentSong?.id && isPlaying
                    );
                    const isSelectedToDelete = selectedBlockIdsToDelete.includes(block.id);
                    const isFav = isFavoriteBlock(block);
                    const contrast = getBlockContrast(block.color);

                    return (
                      <div
                        key={block.id}
                        className={`generic-block group transition-all select-none relative overflow-hidden flex flex-col justify-between p-4 rounded-3xl ${
                          isDeleteBlocksMode && !isFav
                            ? isSelectedToDelete
                              ? 'ring-2 ring-red-500 !border-red-500/50 bg-red-500/10 cursor-pointer'
                              : 'hover:border-red-400 cursor-pointer'
                            : isAnySongPlaying
                            ? 'ring-2 ring-[var(--accent)] cursor-pointer'
                            : 'cursor-pointer'
                        }`}
                        style={
                          block.color
                            ? {
                                background: block.color,
                                color: contrast.text,
                                border: 'none',
                                boxShadow: isAnySongPlaying
                                  ? '8px 8px 22px var(--clay-shadow-dark), -8px -8px 22px var(--clay-shadow-light), 0 0 0 3px rgba(255, 255, 255, 0.9), inset 2px 2px 5px rgba(255, 255, 255, 0.35)'
                                  : '6px 6px 16px var(--clay-shadow-dark), -6px -6px 16px var(--clay-shadow-light), inset 2px 2px 5px rgba(255, 255, 255, 0.35), inset -2px -2px 5px rgba(0, 0, 0, 0.15)',
                              }
                            : undefined
                        }
                        onPointerDown={(e) => handlePointerDown(e, block)}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerLeave}
                        onPointerMove={handlePointerMove}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (!isDeleteBlocksMode) openEditModal(block);
                        }}
                        onClick={() => handleBlockClick(block)}
                      >
                        {/* Background Vinyl Grooves Watermark SVG */}
                        <svg 
                          className="absolute -right-5 -bottom-5 w-28 h-28 opacity-[0.06] pointer-events-none stroke-current" 
                          viewBox="0 0 100 100" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="50" cy="50" r="46" strokeWidth="2" strokeDasharray="4 4" />
                          <circle cx="50" cy="50" r="34" strokeWidth="2" />
                          <circle cx="50" cy="50" r="22" strokeWidth="2" strokeDasharray="3 3" />
                          <circle cx="50" cy="50" r="10" strokeWidth="3" />
                        </svg>

                        {/* Top Header Row: Icon Badge on Left + Status/Delete on Right */}
                        <div className="flex items-center justify-between gap-2 z-10">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs transition-transform"
                            style={{ 
                              background: contrast.isCustom 
                                ? contrast.badgeBg 
                                : isFav 
                                ? 'linear-gradient(135deg, rgba(244,63,94,0.18), rgba(251,113,133,0.25))' 
                                : 'rgba(var(--accent-rgb), 0.12)',
                              color: isFav ? '#f43f5e' : (contrast.isCustom ? contrast.badgeText : 'var(--accent)')
                            }}
                          >
                            {isFav ? (
                              <Heart size={15} className="fill-current text-rose-500" />
                            ) : (
                              <Disc3 size={15} />
                            )}
                          </div>

                          {/* Right Header: Delete Mode Button or Playing Badge */}
                          {isDeleteBlocksMode ? (
                            isFav ? (
                              <span 
                                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 shadow-xs select-none"
                                title="Favorite block cannot be deleted"
                              >
                                Protected
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteBlock(block.id);
                                  setSelectedBlockIdsToDelete((prev) => prev.filter((id) => id !== block.id));
                                }}
                                className="text-xs font-bold flex items-center gap-1 py-1 px-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-500 transition-colors shadow-xs cursor-pointer"
                                title={`Delete ${block.name}`}
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            )
                          ) : isAnySongPlaying ? (
                            <div 
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-xs"
                              style={{ 
                                background: contrast.isCustom ? contrast.badgeBg : 'rgba(var(--accent-rgb), 0.15)',
                                color: contrast.text
                              }}
                            >
                              <span 
                                className="w-2 h-2 rounded-full animate-ping"
                                style={{ background: contrast.text }}
                              />
                              <span className="text-[10px] font-extrabold uppercase tracking-wider">Playing</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Middle Content: Block Name */}
                        <div className="my-auto py-2 z-10 min-w-0">
                          <span 
                            className="block-name group-hover:opacity-90 transition-opacity truncate text-lg sm:text-xl font-extrabold font-['Baloo_2'] block"
                            style={{ color: contrast.text }}
                            title={block.name}
                          >
                            {block.name}
                          </span>
                        </div>

                        {/* Bottom Row: Track Count Only */}
                        <div className="flex items-center justify-between z-10 pt-1">
                          <span 
                            className="block-badge text-xs px-3 py-1 font-bold shadow-xs rounded-full"
                            style={{ 
                              background: contrast.badgeBg, 
                              color: contrast.badgeText 
                            }}
                          >
                            {songsInThisBlock.length} {songsInThisBlock.length === 1 ? 'track' : 'tracks'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : selectedBlock ? (
            /* SELECTED BLOCK DETAILS VIEW (Songs inside clicked block) */
            <div className="space-y-4 animate-pop">
              {/* Play All button & track count row */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  {filteredBlockSongs.length > 0 && (
                    <button
                      onClick={handlePlayAllInBlock}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 clay-accent-btn"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Play All</span>
                    </button>
                  )}
                  <span className="text-xs font-semibold text-[var(--text-dim)]">
                    {filteredBlockSongs.length} {filteredBlockSongs.length === 1 ? 'track' : 'tracks'}
                  </span>
                </div>
              </div>

              {/* Selection action bar in block view (shown when selection mode is enabled via Settings) */}
              {isBlockSelectionMode && (
                <div 
                  className="p-3 rounded-2xl clay-box-lg flex items-center justify-between gap-2 animate-pop"
                  style={{ background: 'var(--clay-bg)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      {selectedInBlockSongIds.length}
                    </span>
                    <span className="text-xs font-bold text-[var(--text)]">
                      Selected to delete
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={
                        selectedInBlockSongIds.length === filteredBlockSongs.length
                          ? handleDeselectAllInBlock
                          : handleSelectAllInBlock
                      }
                      className="px-2.5 py-1 rounded-xl text-xs font-bold clay-button flex items-center gap-1"
                    >
                      <CheckCheck size={13} />
                      <span>{selectedInBlockSongIds.length === filteredBlockSongs.length ? "None" : "All"}</span>
                    </button>

                    <button
                      onClick={handleRemoveSelectedFromBlock}
                      disabled={selectedInBlockSongIds.length === 0}
                      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        selectedInBlockSongIds.length > 0
                          ? 'bg-red-500/15 hover:bg-red-500/25 text-red-500 clay-button'
                          : 'opacity-40 cursor-not-allowed text-[var(--text-dim)]'
                      }`}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsBlockSelectionMode(false);
                        setSelectedInBlockSongIds([]);
                      }}
                      className="p-1 rounded-xl clay-button text-[var(--text-dim)]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              {filteredBlockSongs.length === 0 ? (
                <div className="clay-box rounded-3xl p-8 text-center space-y-3 mt-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-[var(--text-dim)] clay-inset">
                    <Music size={26} />
                  </div>
                  <h3 className="font-bold text-base font-['Baloo_2']">
                    {blockSearchQuery ? "No matching songs" : "This block is empty"}
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] font-semibold max-w-sm mx-auto">
                    {blockSearchQuery 
                      ? `No songs matched "${blockSearchQuery}".`
                      : `You can tap the Settings button above and choose "Add songs from main screen" to add tunes into "${selectedBlock.name}".`}
                  </p>
                  {!blockSearchQuery && (
                    <button
                      onClick={onOpenMainScreenWithSelection}
                      className="clay-accent-btn px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 mx-auto mt-2"
                    >
                      <FolderPlus size={14} />
                      <span>Add Songs from Main Screen</span>
                    </button>
                  )}
                </div>
              ) : (
                <ul className="song-list">
                  {filteredBlockSongs.map((song) => {
                    const isActive = currentSong?.id === song.id;
                    const isSongPlaying = isActive && isPlaying;
                    const isSelected = selectedInBlockSongIds.includes(song.id);

                    return (
                      <li
                        key={song.id}
                        className={`song-row ${isActive ? 'active' : ''} ${isSelected ? 'ring-2 ring-[var(--accent)]' : ''}`}
                        onClick={() => {
                          if (isBlockSelectionMode) {
                            handleToggleSelectSongInBlock(song.id);
                          } else {
                            onPlaySong(song);
                          }
                        }}
                      >
                        {/* Checkbox when in selection mode to delete */}
                        {isBlockSelectionMode && (
                          <div
                            className={`clay-checkbox ${isSelected ? 'checked' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelectSongInBlock(song.id);
                            }}
                          >
                            {isSelected && <Check size={16} strokeWidth={3} />}
                          </div>
                        )}

                        <div 
                          className="song-art relative flex items-center justify-center" 
                          style={{ background: song.color }}
                        >
                          <span className="font-extrabold text-white">{song.title.slice(0, 1)}</span>
                        </div>

                        <div className="song-meta">
                          <div className="song-title">{song.title}</div>
                          <div className="song-artist">{song.artist}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="song-duration flex items-center justify-end min-w-[38px]">
                            {isSongPlaying ? (
                              <PlayingDotsIndicator size="md" color="var(--accent)" />
                            ) : (
                              song.duration
                            )}
                          </div>

                          {/* Individual delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveSongFromBlock(selectedBlock.id, song.id);
                            }}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-dim)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete song from this block"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};
