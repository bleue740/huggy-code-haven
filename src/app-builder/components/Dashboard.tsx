import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Plus, FolderOpen, Clock, Loader2, Sparkles, Search, MoreHorizontal, Pencil, Copy, Trash2, LogOut, Settings } from 'lucide-react';
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

export const Dashboard: React.FC<DashboardProps> = ({ onOpenProject, onCreateNewProject, userEmail }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Blink AI</span>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            <button className="px-3 py-1.5 text-sm font-medium text-white bg-[#1a1a1a] rounded-lg">Projects</button>
            <button className="px-3 py-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-300 rounded-lg transition-colors">Templates</button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCreateNewProject}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors active:scale-95"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Project</span>
          </button>

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

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 md:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight">My Projects</h1>
            <p className="text-sm text-neutral-500 mt-0.5">{projects.length} projet{projects.length !== 1 ? 's' : ''}</p>
          </div>
          {projects.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Rechercher…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-sm text-white placeholder:text-neutral-600 outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <span className="text-sm text-neutral-500">Chargement des projets…</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-[#111] rounded-3xl flex items-center justify-center mb-6 border border-[#222]">
              <FolderOpen size={36} className="text-neutral-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Aucun projet</h2>
            <p className="text-sm text-neutral-500 mb-8 max-w-sm">
              Créez votre premier projet et commencez à construire avec l'IA.
            </p>
            <button
              onClick={onCreateNewProject}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors active:scale-95"
            >
              <Plus size={16} />
              Créer votre premier projet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* New Project Card */}
            <button
              onClick={onCreateNewProject}
              className="group border-2 border-dashed border-[#222] hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:bg-blue-500/5 min-h-[200px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                <Plus size={20} className="text-neutral-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <span className="text-sm font-bold text-neutral-500 group-hover:text-blue-400 transition-colors">Nouveau projet</span>
            </button>

            {/* Project Cards */}
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group bg-[#111] border border-[#1a1a1a] hover:border-[#333] rounded-2xl overflow-hidden transition-all hover:bg-[#151515] flex flex-col"
              >
                {/* Gradient Preview */}
                <button
                  onClick={() => onOpenProject(project.id)}
                  className={`h-24 w-full bg-gradient-to-br ${getGradient(project.id)} opacity-60 group-hover:opacity-80 transition-opacity`}
                />

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    {renamingId === project.id ? (
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setRenamingId(null); }}
                        className="flex-1 bg-[#0a0a0a] border border-blue-500/50 rounded-lg px-2 py-1 text-sm font-bold text-white outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => onOpenProject(project.id)}
                        className="font-bold text-white truncate text-left flex-1 hover:text-blue-400 transition-colors"
                      >
                        {project.name}
                      </button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#222] transition-all">
                          <MoreHorizontal size={16} className="text-neutral-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-[#111] border-[#222] text-white">
                        <DropdownMenuItem onClick={() => handleStartRename(project)} className="focus:bg-[#1a1a1a]">
                          <Pencil size={14} className="mr-2" /> Renommer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(project)} className="focus:bg-[#1a1a1a]">
                          <Copy size={14} className="mr-2" /> Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#222]" />
                        <DropdownMenuItem onClick={() => setDeleteTarget(project)} className="text-red-400 focus:text-red-300 focus:bg-red-500/10">
                          <Trash2 size={14} className="mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 mt-3">
                    <Clock size={12} />
                    <span>{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: fr })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-[#111] border-[#222] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleteTarget?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Cette action est irréversible. Tout le code et les données du projet seront perdus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
