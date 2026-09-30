import React from 'react';
import { Check, X, FolderPlus, Trash2, CheckCheck } from 'lucide-react';

interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenAddToGeneric: () => void;
  onDeleteSelected: () => void;
  onCancel: () => void;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onOpenAddToGeneric,
  onDeleteSelected,
  onCancel,
}) => {
  const allSelected = selectedCount > 0 && selectedCount === totalCount;

  return (
    <div 
      className="fixed top-20 left-1/2 -translate-x-1/2 w-[min(94%,480px)] z-40 px-4 py-3 rounded-2xl clay-box-lg flex items-center justify-between gap-3 animate-pop transition-all"
      style={{
        background: 'var(--clay-bg)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      <div className="flex items-center gap-2">
        <span 
          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {selectedCount}
        </span>
        <span className="text-xs font-bold tracking-wide text-[var(--text)]">
          {selectedCount === 1 ? '1 song selected' : `${selectedCount} songs selected`}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold clay-button flex items-center gap-1"
          title={allSelected ? "Deselect All" : "Select All"}
        >
          <CheckCheck size={13} />
          <span className="hidden sm:inline">{allSelected ? "None" : "All"}</span>
        </button>

        <button
          onClick={onOpenAddToGeneric}
          disabled={selectedCount === 0}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            selectedCount > 0 
              ? 'clay-accent-btn' 
              : 'opacity-50 cursor-not-allowed bg-[var(--border-subtle)] text-[var(--text-dim)]'
          }`}
          title="Add selected to Generic Block"
        >
          <FolderPlus size={13} />
          <span>Generic</span>
        </button>

        <button
          onClick={onDeleteSelected}
          disabled={selectedCount === 0}
          className={`p-1.5 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${
            selectedCount > 0 
              ? 'bg-red-500/15 hover:bg-red-500/25 text-red-500 clay-button' 
              : 'opacity-40 cursor-not-allowed text-[var(--text-dim)]'
          }`}
          title="Delete selected songs"
        >
          <Trash2 size={14} />
        </button>

        <button
          onClick={onCancel}
          className="p-1.5 rounded-xl text-xs font-bold clay-button text-[var(--text-dim)] hover:text-[var(--text)]"
          title="Exit selection mode"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
