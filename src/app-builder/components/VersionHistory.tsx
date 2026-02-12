import React, { useEffect, useState, useCallback } from 'react';
import { History, X, RotateCcw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface Snapshot {
  id: string;
  label: string;
  files_snapshot: Record<string, string>;
  created_at: string;
}

interface VersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  onRestore: (files: Record<string, string>) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ isOpen, onClose, projectId, onRestore }) => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSnapshots = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('project_snapshots' as any)
        .select('id, label, files_snapshot, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setSnapshots(data as any);
    } catch { /* ignore */ }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (isOpen) fetchSnapshots();
  }, [isOpen, fetchSnapshots]);

  const handleRestore = (snapshot: Snapshot) => {
    onRestore(snapshot.files_snapshot);
    toast.success(`Version "${snapshot.label}" restaurée`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#111] border border-[#1a1a1a] w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                <History size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Version History</h3>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Snapshots du projet</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-neutral-500">Chargement…</p>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="py-16 text-center">
              <History className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">Aucune version sauvegardée.</p>
              <p className="text-xs text-neutral-600 mt-1">Les snapshots sont créés automatiquement après chaque génération IA.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {snapshots.map((snap) => (
                <div key={snap.id} className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-[#333] hover:border-blue-500/30 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{snap.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {formatDistanceToNow(new Date(snap.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(snap)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <RotateCcw size={12} />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <button onClick={onClose} className="w-full py-3 bg-[#1a1a1a] hover:bg-[#222] text-white rounded-xl font-bold text-sm transition-colors border border-[#333]">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
