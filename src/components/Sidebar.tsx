import React from 'react';
import {
  Folder as FolderIcon,
  Plus,
  Tag,
  Star,
  Files,
  Shield,
  DollarSign,
  Scale,
  Heart,
  Receipt,
  User,
  X,
  Layers
} from 'lucide-react';
import { Folder } from '../types/document';

interface SidebarProps {
  folders: Folder[];
  selectedFolderId: string;
  onSelectFolder: (folderId: string) => void;
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  allTags: { name: string; count: number }[];
  isStarredFilter: boolean;
  onToggleStarredFilter: () => void;
  totalDocumentsCount: number;
  starredCount: number;
  onOpenNewFolderModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  selectedTag,
  onSelectTag,
  allTags,
  isStarredFilter,
  onToggleStarredFilter,
  totalDocumentsCount,
  starredCount,
  onOpenNewFolderModal,
}) => {
  // Helper to map folder icon
  const getFolderIcon = (iconName: string) => {
    switch (iconName) {
      case 'dollar-sign':
        return <DollarSign className="w-4 h-4" />;
      case 'scale':
        return <Scale className="w-4 h-4" />;
      case 'heart':
        return <Heart className="w-4 h-4" />;
      case 'receipt':
        return <Receipt className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      default:
        return <FolderIcon className="w-4 h-4" />;
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 text-slate-300 select-none">
      <div className="space-y-6 overflow-y-auto pr-1">
        
        {/* Core Navigation Section */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2 font-mono">
            Navigation
          </div>
          <div className="space-y-1">
            {/* All Documents */}
            <button
              onClick={() => {
                onSelectFolder('all');
                if (isStarredFilter) onToggleStarredFilter();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition cursor-pointer ${
                selectedFolderId === 'all' && !isStarredFilter
                  ? 'bg-emerald-600/20 text-emerald-300 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Files className="w-4 h-4 text-emerald-400" />
                <span>All Documents</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">
                {totalDocumentsCount}
              </span>
            </button>

            {/* Starred */}
            <button
              onClick={onToggleStarredFilter}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition cursor-pointer ${
                isStarredFilter
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className={`w-4 h-4 ${isStarredFilter ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
                <span>Priority & Starred</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">
                {starredCount}
              </span>
            </button>
          </div>
        </div>

        {/* Folders Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Folders
            </span>
            <button
              onClick={onOpenNewFolderModal}
              className="text-slate-400 hover:text-emerald-400 p-1 rounded hover:bg-slate-800 transition"
              title="Create New Folder"
              aria-label="Create New Folder"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {folders.map((folder) => {
              const isSelected = selectedFolderId === folder.id && !isStarredFilter;
              return (
                <button
                  key={folder.id}
                  onClick={() => {
                    onSelectFolder(folder.id);
                    if (isStarredFilter) onToggleStarredFilter();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition cursor-pointer group ${
                    isSelected
                      ? 'bg-emerald-600/20 text-emerald-300 font-semibold border-l-2 border-emerald-500'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={`${isSelected ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                      {getFolderIcon(folder.icon)}
                    </span>
                    <span className="truncate">{folder.name}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] ml-2">
                    {folder.documentCount ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags Taxonomy Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Tag Taxonomy
            </span>
            {selectedTag && (
              <button
                onClick={() => onSelectTag('')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Clear</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {allTags.length === 0 ? (
            <p className="px-2 text-xs text-slate-500 italic">No tags indexed yet</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 px-1">
              {allTags.map(({ name, count }) => {
                const isSelected = selectedTag.toLowerCase() === name.toLowerCase();
                return (
                  <button
                    key={name}
                    onClick={() => onSelectTag(isSelected ? '' : name)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-medium shadow-sm'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:text-white'
                    }`}
                  >
                    <Tag className="w-3 h-3 opacity-70" />
                    <span>{name}</span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Cloud Security Indicator */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 px-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-medium mb-1">
          <Shield className="w-3.5 h-3.5" />
          <span>Encrypted Cloud Storage</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          OCR indexed with SHA-256 verification and automatic multi-region cloud backup.
        </p>
      </div>
    </aside>
  );
};
