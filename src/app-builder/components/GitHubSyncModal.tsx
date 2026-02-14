import React, { useState } from 'react';
import { X, Github, Upload, Download, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: Record<string, string>;
  onFilesImported: (files: Record<string, string>) => void;
  projectName?: string;
}

type SyncStatus = 'idle' | 'pushing' | 'pulling' | 'success' | 'error';

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  files,
  onFilesImported,
  projectName,
}) => {
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [message, setMessage] = useState('');
  const [lastResult, setLastResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePush = async () => {
    if (!repo || !token) {
      toast.error('Remplis le repo et le token.');
      return;
    }
    setStatus('pushing');
    setLastResult(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/github/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          token,
          files,
          message: message || `Update from ${projectName || 'Blink AI'}`,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Push failed');
      setStatus('success');
      setLastResult(`✅ Push réussi — commit ${data.commitSha?.slice(0, 7)} sur ${data.branch}`);
      toast.success('Code envoyé sur GitHub !');
    } catch (e: any) {
      setStatus('error');
      setLastResult(`❌ ${e.message}`);
      toast.error(e.message);
    }
  };

  const handlePull = async () => {
    if (!repo || !token) {
      toast.error('Remplis le repo et le token.');
      return;
    }
    setStatus('pulling');
    setLastResult(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/github/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, token }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Pull failed');

      // Merge pulled files - keep only relevant ones
      const pulled: Record<string, string> = {};
      for (const [path, content] of Object.entries(data.files as Record<string, string>)) {
        // Map to flat file names for the editor
        const fileName = path.split('/').pop() || path;
        if (fileName.endsWith('.tsx') || fileName.endsWith('.ts') || fileName.endsWith('.css')) {
          pulled[fileName] = content;
        }
      }

      if (Object.keys(pulled).length === 0) {
        setStatus('error');
        setLastResult('❌ Aucun fichier TSX/TS trouvé dans le repo.');
        return;
      }

      onFilesImported(pulled);
      setStatus('success');
      setLastResult(`✅ ${data.fileCount} fichier(s) récupéré(s) depuis ${data.branch}`);
      toast.success(`${Object.keys(pulled).length} fichier(s) importé(s) !`);
    } catch (e: any) {
      setStatus('error');
      setLastResult(`❌ ${e.message}`);
      toast.error(e.message);
    }
  };

  const isLoading = status === 'pushing' || status === 'pulling';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center">
              <Github size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">GitHub Sync</h3>
              <p className="text-neutral-500 text-xs">Push & Pull bidirectionnel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-neutral-500">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-neutral-400 mb-1.5 block">Repository (owner/repo)</label>
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="username/my-app"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-blue-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-400 mb-1.5 block">Personal Access Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-blue-500 transition-colors"
              disabled={isLoading}
            />
            <p className="text-[10px] text-neutral-600 mt-1">
              Créer sur github.com/settings/tokens → repo scope
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-400 mb-1.5 block">Message de commit (optionnel)</label>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Update from Blink AI"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-blue-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          {lastResult && (
            <div className={`flex items-start gap-2 p-3 rounded-xl text-xs ${
              status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {status === 'success' ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <AlertTriangle size={14} className="shrink-0 mt-0.5" />}
              <span>{lastResult}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={handlePush}
            disabled={isLoading || !repo || !token}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors"
          >
            {status === 'pushing' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Push
          </button>
          <button
            onClick={handlePull}
            disabled={isLoading || !repo || !token}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-40 disabled:cursor-not-allowed text-white border border-[#333] rounded-xl text-sm font-bold transition-colors"
          >
            {status === 'pulling' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Pull
          </button>
        </div>
      </div>
    </div>
  );
};
