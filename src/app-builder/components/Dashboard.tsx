import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Loader2, Sparkles, Search, MoreHorizontal, Pencil, Copy, Trash2, LogOut, Settings, Send, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Project {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
}

interface DashboardProps {
  onOpenProject: (projectId: string) => void;
  onCreateNewProject: () => void;
  onStartWithPrompt?: (prompt: string) => void;
  userEmail?: string;
}

const GRADIENTS = [
  'from-blue-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-lime-500 to-green-600',
];

function getGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenProject, onCreateNewProject, onStartWithPrompt, userEmail }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId || !mounted) return;

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, updated_at, created_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!mounted) return;
      if (!error && data) setProjects(data);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const filteredProjects = useMemo(
    () => projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [projects, searchQuery]
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleStartRename = (project: Project) => {
    setRenamingId(project.id);
    setRenameValue(project.name);
  };

  const handleRenameSubmit = async () => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    await supabase.from('projects').update({ name: renameValue.trim() } as any).eq('id', renamingId).eq('user_id', userId);
    setProjects(prev => prev.map(p => p.id === renamingId ? { ...p, name: renameValue.trim() } : p));
    toast.success('Projet renommé');
    setRenamingId(null);
  };

  const handleDuplicate = async (project: Project) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const { data: original } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project.id)
      .eq('user_id', userId)
      .single();

    if (!original) return;

    const { data: inserted } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: `${project.name} (copie)`,
        code: (original as any).code,
        schema: (original as any).schema,
      } as any)
      .select('id, name, updated_at, created_at')
      .single();

    if (inserted) {
      setProjects(prev => [inserted as Project, ...prev]);
      toast.success('Projet dupliqué');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    await supabase.from('projects').delete().eq('id', deleteTarget.id).eq('user_id', userId);
    setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
    toast.success('Projet supprimé');
    setDeleteTarget(null);
  };

  const handlePromptSubmit = () => {
    if (!promptValue.trim() || isSending) return;
    setIsSending(true);
    onStartWithPrompt?.(promptValue.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="px-6 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Blink AI</span>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white hover:ring-2 hover:ring-blue-500/50 transition-all">
                {initial}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#111] border-[#222] text-white">
              {userEmail && <p className="px-2 py-1.5 text-xs text-neutral-500 truncate">{userEmail}</p>}
              <DropdownMenuSeparator className="bg-[#222]" />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="focus:bg-[#1a1a1a]">
                <Settings size={14} className="mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#222]" />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-300 focus:bg-red-500/10">
                <LogOut size={14} className="mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Hero — Prompt-first */}
      <main className="max-w-3xl mx-auto px-6 md:px-8 pt-16 pb-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            What do you want to build?
          </h1>
          <p className="text-neutral-500 text-base md:text-lg max-w-lg mx-auto">
            Describe your app and Blink AI will generate real React code for you.
          </p>
        </div>

        {/* Prompt Input Card */}
        <div className="relative bg-[#111] border border-[#1f1f1f] rounded-2xl shadow-2xl shadow-blue-500/5 p-1">
          <textarea
            ref={textareaRef}
            value={promptValue}
            onChange={e => setPromptValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the app you want to build…"
            rows={3}
            className="w-full bg-transparent text-white text-[15px] placeholder:text-neutral-600 resize-none outline-none px-4 py-3 rounded-xl"
          />
          <div className="flex items-center justify-end gap-2 px-3 pb-3">
            <button
              onClick={handlePromptSubmit}
              disabled={!promptValue.trim() || isSending}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors active:scale-95"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span>Create</span>
            </button>
          </div>
        </div>
      </main>

      {/* Recent Projects */}
      <section className="max-w-5xl mx-auto px-6 md:px-8 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-neutral-600 animate-spin mb-2" />
            <span className="text-sm text-neutral-600">Loading projects…</span>
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Recent Projects</h2>
              {projects.length > 3 && (
                <div className="relative w-52">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                  <input
                    type="text"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#111] border border-[#1a1a1a] rounded-lg text-xs text-white placeholder:text-neutral-600 outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="group bg-[#111] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-xl overflow-hidden transition-all hover:bg-[#141414] flex flex-col"
                >
                  <button
                    onClick={() => onOpenProject(project.id)}
                    className={`h-20 w-full bg-gradient-to-br ${getGradient(project.id)} opacity-50 group-hover:opacity-70 transition-opacity`}
                  />

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      {renamingId === project.id ? (
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onBlur={handleRenameSubmit}
                          onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setRenamingId(null); }}
                          className="flex-1 bg-[#0a0a0a] border border-blue-500/50 rounded-lg px-2 py-1 text-sm font-semibold text-white outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => onOpenProject(project.id)}
                          className="font-semibold text-sm text-white truncate text-left flex-1 hover:text-blue-400 transition-colors"
                        >
                          {project.name}
                        </button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#222] transition-all">
                            <MoreHorizontal size={14} className="text-neutral-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-[#111] border-[#222] text-white">
                          <DropdownMenuItem onClick={() => handleStartRename(project)} className="focus:bg-[#1a1a1a]">
                            <Pencil size={14} className="mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(project)} className="focus:bg-[#1a1a1a]">
                            <Copy size={14} className="mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#222]" />
                          <DropdownMenuItem onClick={() => setDeleteTarget(project)} className="text-red-400 focus:text-red-300 focus:bg-red-500/10">
                            <Trash2 size={14} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 mt-2">
                      <Clock size={11} />
                      <span>{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: fr })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-[#111] border-[#222] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              This action cannot be undone. All code and project data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
