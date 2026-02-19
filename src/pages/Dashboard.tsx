import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Folder, Trash2, Pencil, ExternalLink, Search,
  Zap, Loader2, MoreVertical, Copy, Globe, Clock, Code2,
  Rocket, X, Check, LayoutGrid, List, ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
  code: string | null;
  user_id: string;
}

interface Deployment {
  project_id: string | null;
  url: string | null;
  build_url: string | null;
}

const DEFAULT_CODE = `const { useState } = React;\nfunction App() {\n  return <div className="p-8 text-white">Hello</div>;\n}`;

function getProjectPreviewColor(id: string): string {
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-cyan-500 to-blue-600",
    "from-violet-500 to-purple-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
  ];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
}

function getFileCount(code: string | null): number {
  if (!code) return 1;
  try {
    const parsed = JSON.parse(code);
    if (parsed?.__multifile && typeof parsed.files === "object") {
      return Object.keys(parsed.files).length;
    }
  } catch {}
  return 1;
}

/** Extract the main App.tsx source code (first 40 lines) for syntax preview */
function getCodePreview(code: string | null): string {
  if (!code) return "// Nouveau projet";
  try {
    const parsed = JSON.parse(code);
    if (parsed?.__multifile && typeof parsed.files === "object") {
      const appCode: string = parsed.files["App.tsx"] || Object.values(parsed.files)[0] || "";
      return appCode.split("\n").slice(0, 30).join("\n");
    }
  } catch {}
  return code.split("\n").slice(0, 30).join("\n");
}

/** Minimal token-based syntax highlighter (no external deps) */
function SyntaxHighlight({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <div className="font-mono text-[9px] leading-[14px] text-left overflow-hidden">
      {lines.map((line, i) => {
        let html = line
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        html = html
          .replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|class|extends|new|typeof|interface|type|async|await|default)\b/g,
            '<span style="color:#a78bfa">$1</span>')
          .replace(/(\/\/[^\n]*)/g, '<span style="color:#6b7280;font-style:italic">$1</span>')
          .replace(/(&quot;[^&]*&quot;|&#39;[^&]*&#39;|`[^`]*`)/g, '<span style="color:#34d399">$1</span>');
        return (
          <div key={i} className="flex gap-2">
            <span className="text-gray-600 dark:text-neutral-700 select-none w-5 text-right shrink-0">{i + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: html || " " }} className="text-gray-300 dark:text-neutral-400 truncate" />
          </div>
        );
      })}
    </div>
  );
}

/** Hover preview: iframe if deployed, else syntax-highlighted code */
const ProjectPreviewHover: React.FC<{ deployedUrl?: string | null; code: string | null; gradient: string }> = ({ deployedUrl, code, gradient }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const codeSnippet = getCodePreview(code);

  return deployedUrl ? (
    <div className="absolute inset-0 bg-[#0a0a0a] rounded-t-2xl overflow-hidden">
      {!iframeLoaded && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={16} className="text-white/70 animate-spin" />
            <span className="text-[10px] text-white/60">Chargement…</span>
          </div>
        </div>
      )}
      <iframe
        src={deployedUrl}
        className="w-full h-full border-0"
        style={{ transform: "scale(0.5)", transformOrigin: "top left", width: "200%", height: "200%", pointerEvents: "none" }}
        onLoad={() => setIframeLoaded(true)}
        sandbox="allow-scripts allow-same-origin"
        title="App preview"
      />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  ) : (
    <div className="absolute inset-0 bg-[#0d0d14] rounded-t-2xl overflow-hidden p-2">
      <SyntaxHighlight code={codeSnippet} />
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0d0d14] to-transparent" />
    </div>
  );
};

const ProjectCard: React.FC<{
  project: Project;
  deployment?: Deployment;
  view: "grid" | "list";
  onOpen: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
}> = ({ project, deployment, view, onOpen, onDelete, onRename, onDuplicate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);
  const [isHovered, setIsHovered] = useState(false);
  const gradient = getProjectPreviewColor(project.id);
  const fileCount = getFileCount(project.code);
  const deployedUrl = deployment?.build_url || deployment?.url;
  const ago = formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: fr });

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue.trim() !== project.name) {
      onRename(project.id, renameValue.trim());
    }
    setIsRenaming(false);
    setShowMenu(false);
  };

  if (view === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl hover:border-blue-500/40 hover:bg-gray-50 dark:hover:bg-[#161616] transition-all group cursor-pointer"
        onClick={() => onOpen(project.id)}
      >
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
          <Code2 size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") { setIsRenaming(false); setRenameValue(project.name); }
                e.stopPropagation();
              }}
              className="w-full bg-gray-100 dark:bg-[#222] border border-blue-500 rounded-md px-2 py-0.5 text-sm text-gray-900 dark:text-white outline-none"
            />
          ) : (
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{project.name}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-neutral-500">{fileCount} fichier{fileCount > 1 ? "s" : ""} · {ago}</p>
        </div>
        {deployedUrl && (
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[11px] font-bold rounded-full shrink-0">
            <Globe size={10} /> Live
          </div>
        )}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {deployedUrl && (
            <button onClick={() => window.open(deployedUrl, "_blank")} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" title="Ouvrir le déploiement">
              <ExternalLink size={14} />
            </button>
          )}
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <MoreVertical size={14} />
            </button>
            {showMenu && <ProjectMenu onRename={() => { setIsRenaming(true); setShowMenu(false); }} onDuplicate={() => { onDuplicate(project.id); setShowMenu(false); }} onDelete={() => { onDelete(project.id, project.name); setShowMenu(false); }} onClose={() => setShowMenu(false)} />}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="group relative bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-2xl overflow-hidden hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10 transition-all cursor-pointer"
      onClick={() => onOpen(project.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview area */}
      <div className={`h-36 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        {/* Default gradient bg (always rendered as background) */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="absolute bottom-3 left-3 right-3 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/40" /><div className="w-2 h-2 rounded-full bg-white/40" /><div className="w-2 h-2 rounded-full bg-white/40" />
          </div>
        </div>
        {/* Hover preview overlay: iframe or syntax code */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              <ProjectPreviewHover deployedUrl={deployedUrl} code={project.code} gradient={gradient} />
            </motion.div>
          )}
        </AnimatePresence>
        {deployedUrl && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-lg z-10">
            <Globe size={9} /> Live
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") { setIsRenaming(false); setRenameValue(project.name); }
                  e.stopPropagation();
                }}
                className="w-full bg-gray-100 dark:bg-[#222] border border-blue-500 rounded-md px-2 py-0.5 text-sm text-gray-900 dark:text-white outline-none"
              />
            ) : (
              <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{project.name}</h3>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Clock size={10} className="text-gray-400 dark:text-neutral-500" />
              <span className="text-[11px] text-gray-400 dark:text-neutral-500">{ago}</span>
              <span className="text-[11px] text-gray-300 dark:text-neutral-600">·</span>
              <Code2 size={10} className="text-gray-400 dark:text-neutral-500" />
              <span className="text-[11px] text-gray-400 dark:text-neutral-500">{fileCount} fichier{fileCount > 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-300 dark:text-neutral-600 hover:text-gray-700 dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical size={14} />
            </button>
            {showMenu && <ProjectMenu onRename={() => { setIsRenaming(true); setShowMenu(false); }} onDuplicate={() => { onDuplicate(project.id); setShowMenu(false); }} onDelete={() => { onDelete(project.id, project.name); setShowMenu(false); }} onClose={() => setShowMenu(false)} />}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-[#1a1a1a]">
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(project.id); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ouvrir <ChevronRight size={12} />
          </button>
          {deployedUrl && (
            <button
              onClick={(e) => { e.stopPropagation(); window.open(deployedUrl, "_blank"); }}
              className="p-1.5 border border-gray-200 dark:border-[#333] rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ProjectMenu: React.FC<{
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}> = ({ onRename, onDuplicate, onDelete, onClose }) => (
  <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl shadow-2xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
    <button onClick={onRename} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-white/5">
      <Pencil size={13} className="text-gray-400" /> Renommer
    </button>
    <button onClick={onDuplicate} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-white/5">
      <Copy size={13} className="text-gray-400" /> Dupliquer
    </button>
    <div className="h-px bg-gray-100 dark:bg-[#333] mx-2 my-1" />
    <button onClick={onDelete} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
      <Trash2 size={13} /> Supprimer
    </button>
  </div>
);

const DeleteConfirmModal: React.FC<{
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ projectName, onConfirm, onCancel, isLoading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
          <Trash2 size={18} className="text-red-500" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Supprimer le projet</h3>
          <p className="text-xs text-gray-400 dark:text-neutral-500">Cette action est irréversible</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-neutral-300 mb-6">
        Êtes-vous sûr de vouloir supprimer <span className="font-bold text-gray-900 dark:text-white">"{projectName}"</span> ? Tout le code et l'historique seront perdus.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          Annuler
        </button>
        <button onClick={onConfirm} disabled={isLoading} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Supprimer
        </button>
      </div>
    </motion.div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const loadData = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) { navigate("/auth"); return; }
    setUserEmail(userData.user?.email ?? undefined);

    const [{ data: projs }, { data: deps }] = await Promise.all([
      supabase.from("projects").select("id, name, updated_at, created_at, code, user_id").eq("user_id", userId).order("updated_at", { ascending: false }),
      supabase.from("deployments").select("project_id, url, build_url").eq("user_id", userId),
    ]);

    setProjects((projs as Project[]) || []);
    setDeployments((deps as Deployment[]) || []);
    setIsLoading(false);
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateProject = async () => {
    setIsCreating(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const { data: inserted } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: "Nouveau Projet", schema: { version: "3.0.0", components: [] }, code: DEFAULT_CODE } as any)
      .select("id")
      .single();

    setIsCreating(false);
    if (inserted) {
      navigate(`/?project=${(inserted as any).id}`);
    }
  };

  const handleOpenProject = (id: string) => {
    navigate(`/?project=${id}`);
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    await Promise.all([
      supabase.from("chat_messages").delete().eq("project_id", deleteTarget.id),
      supabase.from("project_snapshots").delete().eq("project_id", deleteTarget.id),
    ]);
    await supabase.from("projects").delete().eq("id", deleteTarget.id).eq("user_id", userId);

    setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    toast.success(`Projet "${deleteTarget.name}" supprimé`);
    setDeleteTarget(null);
    setIsDeleting(false);
  };

  const handleRenameProject = async (id: string, name: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    await supabase.from("projects").update({ name } as any).eq("id", id).eq("user_id", userId);
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name } : p));
    toast.success("Projet renommé !");
  };

  const handleDuplicateProject = async (id: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const source = projects.find((p) => p.id === id);
    if (!source) return;

    const { data: inserted } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: `${source.name} (copie)`, schema: { version: "3.0.0", components: [] }, code: source.code } as any)
      .select("id, name, updated_at, created_at, code, user_id")
      .single();

    if (inserted) {
      setProjects((prev) => [inserted as Project, ...prev]);
      toast.success("Projet dupliqué !");
    }
  };

  const getDeployment = (id: string) => deployments.find((d) => d.project_id === id);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deployedCount = projects.filter((p) => !!getDeployment(p.id)?.build_url || !!getDeployment(p.id)?.url).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2.5 text-xl font-black tracking-tight text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Zap size={16} fill="currentColor" />
              </div>
              Blink
            </button>
            <span className="text-gray-300 dark:text-neutral-700">/</span>
            <span className="text-sm font-semibold text-gray-500 dark:text-neutral-400">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 dark:text-neutral-500 hidden sm:block">{userEmail}</span>
            <ThemeToggle />
            <button
              onClick={handleCreateProject}
              disabled={isCreating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-60"
            >
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Nouveau projet
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Projets", value: projects.length, icon: <Folder size={18} className="text-blue-500" />, color: "bg-blue-500/10" },
            { label: "Déployés", value: deployedCount, icon: <Rocket size={18} className="text-emerald-500" />, color: "bg-emerald-500/10" },
            { label: "En cours", value: projects.length - deployedCount, icon: <Code2 size={18} className="text-purple-500" />, color: "bg-purple-500/10" },
            { label: "Total fichiers", value: projects.reduce((sum, p) => sum + getFileCount(p.code), 0), icon: <Globe size={18} className="text-orange-500" />, color: "bg-orange-500/10" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-2xl p-4"
            >
              <div className={`w-9 h-9 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-gray-400 dark:text-neutral-500 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Rechercher un projet…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-600 outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-1 gap-1">
            <button onClick={() => setView("grid")} className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-blue-600 text-white" : "text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-white"}`}>
              <LayoutGrid size={14} />
            </button>
            <button onClick={() => setView("list")} className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-blue-600 text-white" : "text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-white"}`}>
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            {searchQuery ? (
              <>
                <Search size={40} className="text-gray-300 dark:text-neutral-700 mb-4" />
                <p className="text-gray-500 dark:text-neutral-400 font-medium">Aucun projet trouvé pour "{searchQuery}"</p>
                <button onClick={() => setSearchQuery("")} className="mt-3 text-sm text-blue-500 hover:underline">Effacer la recherche</button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-4">
                  <Folder size={28} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Aucun projet</h3>
                <p className="text-gray-400 dark:text-neutral-500 text-sm mb-6 max-w-xs">Créez votre premier projet et laissez l'IA générer votre application en secondes.</p>
                <button
                  onClick={handleCreateProject}
                  disabled={isCreating}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-xl shadow-blue-500/20"
                >
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Créer un projet
                </button>
              </>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className={view === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "flex flex-col gap-2"
              }
            >
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  deployment={getDeployment(project.id)}
                  view={view}
                  onOpen={handleOpenProject}
                  onDelete={(id, name) => setDeleteTarget({ id, name })}
                  onRename={handleRenameProject}
                  onDuplicate={handleDuplicateProject}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            projectName={deleteTarget.name}
            onConfirm={handleDeleteProject}
            onCancel={() => setDeleteTarget(null)}
            isLoading={isDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
