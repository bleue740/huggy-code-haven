import React, { useEffect, useState, useCallback } from 'react';
import { Users, X, UserPlus, Loader2, Trash2, Copy, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Collaborator {
  id: string;
  user_email: string;
  role: string;
  created_at: string;
}

interface CollaborationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ isOpen, onClose, projectId }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const fetchCollaborators = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('project_collaborators' as any)
        .select('id, user_email, role, created_at')
        .eq('project_id', projectId);
      if (data) setCollaborators(data as any);
    } catch { /* ignore */ }
    setLoading(false);
  }, [projectId]);

  // Subscribe to realtime presence
  useEffect(() => {
    if (!isOpen || !projectId) return;

    fetchCollaborators();

    const channel = supabase.channel(`project-presence-${projectId}`, {
      config: { presence: { key: 'user' } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat().map((p: any) => p.email).filter(Boolean);
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            await channel.track({ email: user.email, online_at: new Date().toISOString() });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, projectId, fetchCollaborators]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !projectId) return;
    setInviting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('project_collaborators' as any).insert({
        project_id: projectId,
        user_id: user.id, // placeholder - in production you'd resolve the invited user's ID
        user_email: inviteEmail.trim(),
        role: 'editor',
        invited_by: user.id,
      } as any);

      toast.success(`Invitation envoyée à ${inviteEmail}`);
      setInviteEmail('');
      fetchCollaborators();
    } catch (e: any) {
      toast.error('Erreur lors de l\'invitation');
    }
    setInviting(false);
  };

  const handleRemove = async (id: string) => {
    await supabase.from('project_collaborators' as any).delete().eq('id', id);
    setCollaborators(prev => prev.filter(c => c.id !== id));
    toast.success('Collaborateur retiré');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/app?project=${projectId}&invite=true`);
    toast.success('Lien d\'invitation copié !');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#111] border border-[#1a1a1a] w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Collaboration</h3>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Temps réel</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Online users */}
          {onlineUsers.length > 0 && (
            <div className="mb-5 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Wifi size={12} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">En ligne maintenant</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {onlineUsers.map((email, i) => (
                  <span key={i} className="text-xs text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-full font-medium">
                    {email}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Invite */}
          <div className="flex gap-2 mb-5">
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              placeholder="email@example.com"
              className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-blue-500/50"
            />
            <button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || inviting}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Inviter
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] text-neutral-300 text-xs font-bold rounded-xl transition-colors border border-[#333] mb-5"
          >
            <Copy size={12} />
            Copier le lien d'invitation
          </button>

          {/* Collaborators list */}
          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-neutral-600 animate-spin" />
            </div>
          ) : collaborators.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">Aucun collaborateur invité.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {collaborators.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl border border-[#333] group">
                  <div>
                    <p className="text-sm font-semibold text-white">{c.user_email}</p>
                    <p className="text-[10px] text-neutral-500 uppercase font-bold">{c.role}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(c.id)}
                    className="p-1.5 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
