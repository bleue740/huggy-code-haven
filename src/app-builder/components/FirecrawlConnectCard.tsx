import React, { useState } from 'react';
import { Globe, Loader2, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface FirecrawlConnectCardProps {
  isOpen: boolean;
  onClose: () => void;
  onEnable: () => void;
}

export const FirecrawlConnectCard: React.FC<FirecrawlConnectCardProps> = ({ isOpen, onClose, onEnable }) => {
  const [enabling, setEnabling] = useState(false);

  if (!isOpen) return null;

  const handleEnable = async () => {
    setEnabling(true);
    // Simulate a brief activation delay
    await new Promise(r => setTimeout(r, 1000));
    onEnable();
    setEnabling(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#111] border border-[#1a1a1a] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Firecrawl</h3>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Web Scraping & Search</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            Activez Firecrawl pour permettre à vos applications générées de scraper des sites web et d'effectuer des recherches sur Internet.
          </p>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <CheckCircle2 size={14} className="text-orange-400 shrink-0" />
              <span className="text-xs text-neutral-300">Extraction de contenu (Markdown, HTML, JSON)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <CheckCircle2 size={14} className="text-orange-400 shrink-0" />
              <span className="text-xs text-neutral-300">Recherche web avec résultats scrapés</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <CheckCircle2 size={14} className="text-orange-400 shrink-0" />
              <span className="text-xs text-neutral-300">Crawl complet de sites & sitemap</span>
            </div>
          </div>

          <button
            onClick={handleEnable}
            disabled={enabling}
            className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {enabling ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
            {enabling ? 'Activation…' : 'Activer Firecrawl'}
          </button>
        </div>
      </div>
    </div>
  );
};
