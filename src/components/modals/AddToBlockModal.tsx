import React, { useState } from 'react';
import { GenericBlock, Song } from '../../types';
import { X, Plus, FolderCheck, ArrowRight, Music } from 'lucide-react';

interface AddToBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSongs: Song[];
  blocks: GenericBlock[];
  onAddToBlock: (blockId: number) => void;
  onCreateAndAddToBlock: (name: string) => void;
  onNavigateToGeneric: () => void;
}

export const AddToBlockModal: React.FC<AddToBlockModalProps> = ({
  isOpen,
  onClose,
  selectedSongs,
  blocks,
  onAddToBlock,
  onCreateAndAddToBlock,
  onNavigateToGeneric,
}) => {
  const [newBlockName, setNewBlockName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [successBlockName, setSuccessBlockName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectBlock = (block: GenericBlock) => {
    onAddToBlock(block.id);
    setSuccessBlockName(block.name);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockName.trim()) return;
    onCreateAndAddToBlock(newBlockName.trim());
    setSuccessBlockName(newBlockName.trim());
    setNewBlockName('');
    setIsCreatingNew(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[var(--overlay-bg)] backdrop-blur-xs animate-pop"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md rounded-3xl p-6 clay-box-lg"
        style={{ background: 'var(--clay-bg)', border: '1px solid var(--border-subtle)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {successBlockName ? (
          <div className="text-center py-4 space-y-4">
            <div 
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white shadow-lg"
              style={{ background: 'var(--mint)' }}
            >
              <FolderCheck size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold font-['Baloo_2']">Added to Generic!</h3>
              <p className="text-sm text-[var(--text-dim)] mt-1 font-semibold">
                {selectedSongs.length} song{selectedSongs.length !== 1 ? 's' : ''} redirected to <span className="font-bold text-[var(--text)]">"{successBlockName}"</span>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToGeneric();
                }}
                className="flex-1 py-3 px-4 rounded-2xl clay-accent-btn font-bold text-sm flex items-center justify-center gap-2"
              >
                <span>View in Generic</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={onClose}
                className="py-3 px-4 rounded-2xl clay-button font-bold text-sm text-[var(--text)]"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-xl font-bold font-['Baloo_2'] text-[var(--text)]">Add to Generic Block</h3>
                <p className="text-xs text-[var(--text-dim)] font-semibold mt-0.5">
                  Redirect {selectedSongs.length} selected song{selectedSongs.length !== 1 ? 's' : ''} into a block
                </p>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] clay-button"
              >
                <X size={16} />
              </button>
            </div>

            {/* Selected songs preview pill */}
            <div className="my-4 flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              {selectedSongs.slice(0, 4).map((s) => (
                <div 
                  key={s.id} 
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white shrink-0 shadow-xs"
                  style={{ background: s.color }}
                >
                  <Music size={11} />
                  <span className="truncate max-w-[90px]">{s.title}</span>
                </div>
              ))}
              {selectedSongs.length > 4 && (
                <span className="text-xs font-bold text-[var(--text-dim)]">
                  +{selectedSongs.length - 4} more
                </span>
              )}
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              <div className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1">
                Choose destination block
              </div>

              {blocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => handleSelectBlock(block)}
                  className="w-full p-3.5 rounded-2xl clay-button flex items-center justify-between text-left group hover:scale-[1.01] transition-transform"
                >
                  <div>
                    <div className="font-bold text-sm text-[var(--text)]">{block.name}</div>
                    <div className="text-xs text-[var(--text-dim)] font-semibold">
                      Currently {block.songIds.length} song{block.songIds.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-xl font-bold bg-[var(--mint)] text-slate-800">
                    + Add Here
                  </span>
                </button>
              ))}

              {blocks.length === 0 && (
                <p className="text-center py-4 text-xs text-[var(--text-dim)] font-semibold">
                  No blocks yet. Create your first block below!
                </p>
              )}
            </div>

            {/* Create new block accordion */}
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
              {!isCreatingNew ? (
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="w-full py-2.5 px-3 rounded-2xl clay-button font-bold text-xs flex items-center justify-center gap-2 text-[var(--accent)]"
                >
                  <Plus size={15} />
                  <span>Create New Generic Block</span>
                </button>
              ) : (
                <form onSubmit={handleCreateNew} className="space-y-2">
                  <input
                    type="text"
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                    placeholder="Enter block name (e.g., Favorites)"
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-2xl clay-inset text-sm font-semibold outline-none bg-transparent text-[var(--text)] placeholder:text-[var(--text-dim)]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!newBlockName.trim()}
                      className="flex-1 py-2 rounded-xl clay-accent-btn font-bold text-xs disabled:opacity-50"
                    >
                      Save & Add Songs
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="px-3 py-2 rounded-xl clay-button font-bold text-xs text-[var(--text-dim)]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
