import React, { useState } from 'react';
import { FileCode2, FilePlus, Trash2 } from 'lucide-react';

interface FileTreeProps {
  files: Record<string, string>;
  activeFile: string;
  onSelectFile: (name: string) => void;
  onCreateFile: (name: string) => void;
  onDeleteFile: (name: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files, activeFile, onSelectFile, onCreateFile, onDeleteFile,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const sorted = Object.keys(files).sort((a, b) => {
    if (a === 'App.tsx') return -1;
    if (b === 'App.tsx') return 1;
    return a.localeCompare(b);
  });

  const handleCreate = () => {
    let name = newName.trim();
    if (!name) return;
    if (!/\.\w+$/.test(name)) name += '.tsx';
    if (files[name]) return;
    onCreateFile(name);
    setNewName('');
    setIsCreating(false);
  };

  return (
    <div className="border-b border-[#1a1a1a] shrink-0">
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Fichiers</span>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="p-1 hover:bg-white/5 rounded text-neutral-500 hover:text-white transition-colors"
          title="Nouveau fichier"
        >
          <FilePlus size={14} />
        </button>
      </div>

      {isCreating && (
        <div className="px-3 pb-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setIsCreating(false); setNewName(''); }
            }}
            placeholder="Component.tsx"
            className="w-full bg-black border border-neutral-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
          />
        </div>
      )}

      <div className="px-1 pb-2 space-y-0.5 max-h-36 overflow-y-auto scrollbar-thin">
        {sorted.map((name) => (
          <div
            key={name}
            onClick={() => onSelectFile(name)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group text-xs transition-colors ${
              activeFile === name
                ? 'bg-blue-600/15 text-blue-400 font-medium'
                : 'text-neutral-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileCode2 size={13} className="shrink-0" />
            <span className="flex-1 truncate">{name}</span>
            {name !== 'App.tsx' && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteFile(name); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all"
                title="Supprimer"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
