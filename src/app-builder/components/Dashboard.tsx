import React, { useEffect, useState } from 'react';
import { Plus, FolderOpen, Clock, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
}

interface DashboardProps {
  onOpenProject: (projectId: string) => void;
  onCreateNewProject: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenProject, onCreateNewProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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
      if (!error && data) {
        setProjects(data);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Blink AI</span>
        </div>
        <button
          onClick={onCreateNewProject}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors active:scale-95"
        >
          <Plus size={16} />
          New Project
        </button>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-black tracking-tight mb-1">My Projects</h1>
        <p className="text-sm text-neutral-500 mb-8">Sélectionnez un projet ou créez-en un nouveau.</p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <span className="text-sm text-neutral-500">Chargement des projets…</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6 border border-[#333]">
              <FolderOpen size={28} className="text-neutral-600" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Aucun projet</h2>
            <p className="text-sm text-neutral-500 mb-6 max-w-sm">
              Commencez par créer votre premier projet. Décrivez votre idée et l'IA génèrera du code React pour vous.
            </p>
            <button
              onClick={onCreateNewProject}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors active:scale-95"
            >
              <Plus size={16} />
              Créer un projet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* New Project Card */}
            <button
              onClick={onCreateNewProject}
              className="group border-2 border-dashed border-[#333] hover:border-blue-500/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:bg-blue-500/5 min-h-[160px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                <Plus size={20} className="text-neutral-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <span className="text-sm font-bold text-neutral-500 group-hover:text-blue-400 transition-colors">Nouveau projet</span>
            </button>

            {/* Project Cards */}
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onOpenProject(project.id)}
                className="group bg-[#111] border border-[#1a1a1a] hover:border-[#333] rounded-2xl p-6 text-left transition-all hover:bg-[#151515] min-h-[160px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                      <FolderOpen size={14} className="text-blue-400" />
                    </div>
                    <h3 className="font-bold text-white truncate">{project.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-600">
                  <Clock size={12} />
                  <span>
                    {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: fr })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
