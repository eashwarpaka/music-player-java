import React, { useRef } from 'react';
import { Search, Settings } from 'lucide-react';
import { SettingsMenu } from '../modals/SettingsMenu';

interface HeaderProps {
  onLogoClick: () => void;
  isSearchOpen: boolean;
  searchQuery: string;
  onToggleSearch: (isOpen: boolean) => void;
  onSearchChange: (query: string) => void;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  onCloseSettings: () => void;
  isSelectionMode: boolean;
  selectedSongIds: string[];
  filteredSongsCount: number;
  onToggleSelectionMode: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenAddToGeneric: () => void;
  onDeleteSelected: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenGenericScreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLogoClick,
  isSearchOpen,
  searchQuery,
  onToggleSearch,
  onSearchChange,
  isSettingsOpen,
  onToggleSettings,
  onCloseSettings,
  isSelectionMode,
  selectedSongIds,
  filteredSongsCount,
  onToggleSelectionMode,
  onSelectAll,
  onDeselectAll,
  onOpenAddToGeneric,
  onDeleteSelected,
  isDarkMode,
  onToggleDarkMode,
  onOpenGenericScreen,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchToggle = () => {
    if (isSearchOpen) {
      onToggleSearch(false);
      onSearchChange('');
    } else {
      onToggleSearch(true);
      setTimeout(() => searchInputRef.current?.focus(), 200);
    }
  };

  return (
    <header className="app-header">
      {/* 1. Left: Brand Logo */}
      <div 
        className="brand cursor-pointer"
        onClick={onLogoClick}
        title="POP Music Player"
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

      {/* 2. Middle: Title (hides when search expands) */}
      <div className={`header-middle flex-1 text-center px-2 ${isSearchOpen ? 'hidden-for-search' : ''}`}>
        <h1 className="header-page-title" title="My Songs">
          My Songs
        </h1>
      </div>

      {/* 3. Right: Search & Settings */}
      <div className={`header-actions ${isSearchOpen ? 'search-expanded' : ''}`}>
        <div className={`search-wrap ${isSearchOpen ? 'open' : ''}`} id="searchWrap">
          <input
            ref={searchInputRef}
            type="text"
            id="searchInput"
            className="search-input"
            placeholder="Find a tune by title or artist..."
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button
            className="icon-btn search-toggle"
            id="searchToggle"
            aria-label="Toggle search"
            onClick={handleSearchToggle}
          >
            <Search size={19} />
          </button>
        </div>

        {/* Settings Menu Button & Dropdown */}
        <div className="relative">
          <button
            id="settingBtn"
            onClick={onToggleSettings}
            className={`icon-btn setting-btn ${isSettingsOpen || isSelectionMode ? 'selected' : ''}`}
            aria-label="Settings"
            title="Settings & Song Selection"
          >
            <Settings size={20} className={isSelectionMode ? "text-[var(--accent)]" : ""} />
            {selectedSongIds.length > 0 && (
              <span 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-xs"
                style={{ background: 'var(--accent)' }}
              >
                {selectedSongIds.length}
              </span>
            )}
          </button>

          <SettingsMenu
            isOpen={isSettingsOpen}
            onClose={onCloseSettings}
            isSelectionMode={isSelectionMode}
            onToggleSelectionMode={onToggleSelectionMode}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            hasSelectedSongs={selectedSongIds.length > 0}
            selectedCount={selectedSongIds.length}
            totalSongsCount={filteredSongsCount}
            onOpenAddToGeneric={onOpenAddToGeneric}
            onDeleteSelected={onDeleteSelected}
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            onOpenGenericScreen={onOpenGenericScreen}
          />
        </div>
      </div>
    </header>
  );
};
