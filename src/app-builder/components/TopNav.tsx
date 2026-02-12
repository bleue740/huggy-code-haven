import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Palette,
  Code,
  Rocket,
  Loader2,
  ChevronDown,
  Globe,
  Copy,
  ExternalLink,
  Cloud,
  ShieldCheck,
  Github,
  Link2,
  Download,
  History,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface TopNavProps {
  onPublish?: () => void;
  onUpgrade?: () => void;
  onRunSecurity?: () => void;
  onExportZip?: () => void;
  onToggleCodeView?: () => void;
  onShowVersionHistory?: () => void;
  onShowCollaboration?: () => void;
  isCodeView?: boolean;
  isGenerating?: boolean;
  projectName?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  onPublish,
  onUpgrade,
  onRunSecurity,
  onExportZip,
  onToggleCodeView,
  onShowVersionHistory,
  onShowCollaboration,
  isCodeView,
  isGenerating,
  projectName = 'New Project',
}) => {
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const publishRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (publishRef.current && !publishRef.current.contains(e.target as Node)) setShowPublishMenu(false);
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShowShareMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Lien copié !');
    setShowShareMenu(false);
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
    setShowShareMenu(false);
  };

  return (
    <div className="h-[52px] border-b border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-between px-4 z-10 shrink-0">
      {/* Zone gauche */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-[#1d4ed8] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10 active:scale-95"
        >
          {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="white" />}
          Preview
        </button>
        <div className="h-4 w-[1px] bg-neutral-800 mx-1" />
        <IconButton
          onClick={onToggleCodeView}
          icon={<Code size={18} />}
          title="Toggle Code View"
          active={isCodeView}
        />
        <IconButton
          onClick={() => toast.info('Theme Panel coming soon!')}
          icon={<Palette size={18} />}
          title="Theme Engine"
        />
        <IconButton
          onClick={onShowVersionHistory}
          icon={<History size={18} />}
          title="Version History"
        />
        <IconButton
          onClick={onShowCollaboration}
          icon={<Users size={18} />}
          title="Collaboration"
        />
      </div>

      {/* Zone centre - barre URL avec nom du projet */}
      <div className="flex-1 flex justify-center px-4 max-w-xl">
        <div className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg h-8 flex items-center px-3 gap-2">
          <Globe size={12} className="text-neutral-500 shrink-0" />
          <span className="text-xs text-neutral-400 truncate">{projectName}</span>
        </div>
      </div>

      {/* Zone droite */}
      <div className="flex items-center gap-2">
        {/* Share dropdown */}
        <div ref={shareRef} className="relative">
          <button
            onClick={() => { setShowShareMenu(!showShareMenu); setShowPublishMenu(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <Link2 size={14} />
            Share
            <ChevronDown size={12} />
          </button>
          {showShareMenu && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
              <DropdownItem icon={<Copy size={14} />} label="Copy Link" onClick={handleCopyLink} />
              <DropdownItem icon={<ExternalLink size={14} />} label="Open in new tab" onClick={handleOpenNewTab} />
            </div>
          )}
        </div>

        {/* Upgrade */}
        <button
          onClick={onUpgrade}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs font-medium text-white hover:bg-[#262626] transition-colors"
        >
          <Rocket size={14} className="text-neutral-400" />
          Upgrade
        </button>

        {/* Publish dropdown */}
        <div ref={publishRef} className="relative">
          <button
            onClick={() => { setShowPublishMenu(!showPublishMenu); setShowShareMenu(false); }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Publish
            <ChevronDown size={14} />
          </button>
          {showPublishMenu && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
              <DropdownItem
                icon={<Cloud size={14} />}
                label="Deploy to Cloud"
                description="Publish your app live"
                onClick={() => { onPublish?.(); setShowPublishMenu(false); }}
              />
              <DropdownItem
                icon={<ShieldCheck size={14} />}
                label="Run Security Scan"
                description="Check for vulnerabilities"
                onClick={() => { onRunSecurity?.(); setShowPublishMenu(false); }}
              />
              <DropdownItem
                icon={<Download size={14} />}
                label="Download ZIP"
                description="Export your code as ZIP"
                onClick={() => { onExportZip?.(); setShowPublishMenu(false); }}
              />
              <div className="h-px bg-[#333] mx-2 my-1" />
              <DropdownItem
                icon={<Github size={14} />}
                label="Connect GitHub"
                description="Sync with a repository"
                onClick={() => { toast.info('GitHub integration coming soon!'); setShowPublishMenu(false); }}
              />
              <DropdownItem
                icon={<Globe size={14} />}
                label="Custom Domain"
                description="Add your own domain"
                onClick={() => { toast.info('Custom domains coming soon!'); setShowPublishMenu(false); }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const IconButton = ({ icon, onClick, title, active }: { icon: React.ReactNode; onClick?: () => void; title?: string; active?: boolean }) => (
  <button
    onClick={onClick}
    title={title}
    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
  >
    {icon}
  </button>
);

const DropdownItem = ({ icon, label, description, onClick }: { icon: React.ReactNode; label: string; description?: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
  >
    <span className="text-neutral-400 mt-0.5 shrink-0">{icon}</span>
    <div>
      <div className="text-sm text-white font-medium">{label}</div>
      {description && <div className="text-xs text-neutral-500">{description}</div>}
    </div>
  </button>
);
