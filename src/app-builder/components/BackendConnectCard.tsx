import React from 'react';
import { Database, Globe, ArrowRight, X } from 'lucide-react';
import { BackendNeed } from '../types';

interface BackendConnectCardProps {
  needs: BackendNeed[];
  onConnectSupabase: () => void;
  onEnableFirecrawl: () => void;
  onDismiss: () => void;
  supabaseConnected?: boolean;
  firecrawlEnabled?: boolean;
}

export const BackendConnectCard: React.FC<BackendConnectCardProps> = ({
  needs,
  onConnectSupabase,
  onEnableFirecrawl,
  onDismiss,
  supabaseConnected,
  firecrawlEnabled,
}) => {
  const needsDatabase = needs.some(n => ['database', 'auth', 'storage'].includes(n));
  const needsScraping = needs.includes('scraping');

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 my-4">
      <div className="bg-gradient-to-br from-[#111] to-[#0d0d0d] border border-blue-500/20 rounded-2xl p-5 shadow-xl shadow-blue-500/5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <Database size={16} className="text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Backend requis</h4>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Intégrations disponibles</p>
            </div>
          </div>
          <button onClick={onDismiss} className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <X size={14} />
          </button>
        </div>

        <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
          Cette fonctionnalité nécessite un backend. Connectez vos services pour générer du vrai code full-stack.
        </p>

        <div className="space-y-2">
          {needsDatabase && (
            <button
              onClick={onConnectSupabase}
              disabled={supabaseConnected}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group ${
                supabaseConnected
                  ? 'bg-emerald-500/10 border border-emerald-500/20 cursor-default'
                  : 'bg-[#1a1a1a] border border-[#333] hover:border-blue-500/50 hover:bg-[#222]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${supabaseConnected ? 'bg-emerald-500/20' : 'bg-blue-500/10 group-hover:bg-blue-500/20'} transition-colors`}>
                <Database size={14} className={supabaseConnected ? 'text-emerald-400' : 'text-blue-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">{supabaseConnected ? '✓ Supabase connecté' : 'Connecter Supabase'}</div>
                <div className="text-[10px] text-neutral-500">Base de données, auth, storage</div>
              </div>
              {!supabaseConnected && <ArrowRight size={14} className="text-neutral-500 group-hover:text-blue-400 transition-colors" />}
            </button>
          )}

          {needsScraping && (
            <button
              onClick={onEnableFirecrawl}
              disabled={firecrawlEnabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group ${
                firecrawlEnabled
                  ? 'bg-emerald-500/10 border border-emerald-500/20 cursor-default'
                  : 'bg-[#1a1a1a] border border-[#333] hover:border-orange-500/50 hover:bg-[#222]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${firecrawlEnabled ? 'bg-emerald-500/20' : 'bg-orange-500/10 group-hover:bg-orange-500/20'} transition-colors`}>
                <Globe size={14} className={firecrawlEnabled ? 'text-emerald-400' : 'text-orange-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">{firecrawlEnabled ? '✓ Firecrawl activé' : 'Activer Firecrawl'}</div>
                <div className="text-[10px] text-neutral-500">Web scraping & recherche</div>
              </div>
              {!firecrawlEnabled && <ArrowRight size={14} className="text-neutral-500 group-hover:text-orange-400 transition-colors" />}
            </button>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="w-full mt-3 py-2 text-[11px] text-neutral-500 hover:text-neutral-300 font-bold transition-colors"
        >
          Continuer sans backend (données simulées)
        </button>
      </div>
    </div>
  );
};
