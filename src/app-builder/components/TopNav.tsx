import React from 'react';
import {
  Play,
  Cloud,
  Palette,
  Code,
  BarChart2,
  Plus,
  Maximize2,
  RotateCw,
  Github,
  Share2,
  Rocket,
  ArrowLeft,
  ShieldCheck,
  Loader2
} from 'lucide-react';

interface TopNavProps {
  onBackToLanding?: () => void;
  onPublish?: () => void;
  onUpgrade?: () => void;
  onRunSecurity?: () => void;
  onNewProject?: () => void;
  onToggleCodeView?: () => void;
  isCodeView?: boolean;
  isGenerating?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  onBackToLanding,
  onPublish,
  onUpgrade,
  onRunSecurity,
  onNewProject,
  onToggleCodeView,
  isCodeView,
  isGenerating
}) => {
  return (
    <div className="h-[52px] border-b border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-between px-4 z-10 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onBackToLanding}
          className="p-2 text-neutral-500 hover:text-white transition-colors"
          title="Back to Landing"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-[#1d4ed8] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10 active:scale-95"
        >
          {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="white" />}
          Preview
        </button>
        <div className="h-4 w-[1px] bg-neutral-800 mx-1"></div>
        <div className="flex items-center gap-1">
          <IconButton onClick={onPublish} icon={<Cloud size={18} />} title="Cloud Publish" />
          <IconButton onClick={() => alert("Theme Panel coming soon!")} icon={<Palette size={18} />} title="Theme Engine" />
          <IconButton
            onClick={onToggleCodeView}
            icon={<Code size={18} />}
            title="Toggle Code View"
            active={isCodeView}
          />
          <IconButton onClick={onRunSecurity} icon={<BarChart2 size={18} />} title="Security Analysis" />
          <IconButton onClick={onNewProject} icon={<Plus size={18} />} title="New Project" />
        </div>
      </div>

      <div className="flex-1 flex justify-center px-4 max-w-xl">
        <div className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg h-8 flex items-center px-3 gap-2 group cursor-text">
           <span className="text-xs text-neutral-400">/editor</span>
           <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={12} className="text-neutral-500" />
              <RotateCw size={12} className="text-neutral-500" />
           </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRunSecurity}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all group"
          title="Run Security Scan"
        >
          <ShieldCheck size={16} className="group-hover:scale-110 transition-transform" />
          <span className="hidden lg:inline">Security</span>
        </button>

        <div className="flex items-center gap-2 mr-2">
           <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-lg shadow-emerald-500/20">
              P
           </div>
           <button className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors">
             <Share2 size={14} />
             Share
           </button>
           <IconButton onClick={() => window.open('https://github.com', '_blank')} icon={<Github size={18} />} title="Open Github" />
        </div>

        <button
          onClick={onUpgrade}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs font-medium text-white hover:bg-[#262626] transition-colors"
        >
           <Rocket size={14} className="text-neutral-400" />
           Upgrade
        </button>

        <button
          onClick={onPublish}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
        >
           Publish
        </button>
      </div>
    </div>
  );
};

const IconButton = ({ icon, onClick, title, active }: { icon: React.ReactNode, onClick?: () => void, title?: string, active?: boolean }) => (
  <button
    onClick={onClick}
    title={title}
    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
  >
    {icon}
  </button>
);
