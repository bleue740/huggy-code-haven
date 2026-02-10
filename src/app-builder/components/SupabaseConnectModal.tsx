import React, { useState } from 'react';
import { X, Database, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (url: string, anonKey: string) => void;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [tables, setTables] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setTables([]);

    try {
      // Test connection by fetching from the Supabase REST API
      const cleanUrl = url.trim().replace(/\/$/, '');
      const resp = await fetch(`${cleanUrl}/rest/v1/`, {
        headers: {
          apikey: anonKey.trim(),
          Authorization: `Bearer ${anonKey.trim()}`,
        },
      });

      if (resp.ok) {
        setTestResult('success');
        // Try to get table names from the OpenAPI spec
        try {
          const specResp = await fetch(`${cleanUrl}/rest/v1/`, {
            headers: {
              apikey: anonKey.trim(),
              Authorization: `Bearer ${anonKey.trim()}`,
              Accept: 'application/openapi+json',
            },
          });
          if (specResp.ok) {
            const spec = await specResp.json();
            const paths = Object.keys(spec.paths || {}).map(p => p.replace('/', '')).filter(Boolean);
            setTables(paths.slice(0, 20));
          }
        } catch { /* ignore table detection failure */ }
      } else {
        setTestResult('error');
      }
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = () => {
    onConnect(url.trim().replace(/\/$/, ''), anonKey.trim());
    onClose();
  };

  const isValid = url.trim().length > 10 && anonKey.trim().length > 20;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#111] border border-[#1a1a1a] w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Connecter Supabase</h3>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Base de données & Auth</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-widest">URL du projet</label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://abcdefgh.supabase.co"
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-widest">Anon Key (public)</label>
              <input
                type="password"
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
                placeholder="eyJhbGci..."
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-blue-500 transition-colors font-mono"
              />
              <p className="text-[10px] text-neutral-600 mt-1.5">Trouvable dans Settings → API de votre projet Supabase</p>
            </div>

            {testResult === 'success' && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-2">
                  <CheckCircle2 size={16} />
                  Connexion réussie !
                </div>
                {tables.length > 0 && (
                  <div className="mt-2">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Tables détectées :</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {tables.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-[10px] font-mono text-neutral-300">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {testResult === 'error' && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm font-bold animate-in fade-in duration-300">
                <AlertTriangle size={16} />
                Connexion échouée. Vérifiez l'URL et la clé.
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={handleTest}
              disabled={!isValid || testing}
              className="flex-1 py-3 bg-[#1a1a1a] border border-[#333] text-white rounded-xl font-bold text-sm hover:bg-[#222] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {testing ? <Loader2 size={16} className="animate-spin" /> : null}
              {testing ? 'Test en cours…' : 'Tester la connexion'}
            </button>
            <button
              onClick={handleConnect}
              disabled={!isValid || testResult !== 'success'}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
