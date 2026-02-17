import React, { useMemo, useState } from "react";
import { Monitor, Tablet, Smartphone, Maximize2, Minimize2, Zap, RefreshCw } from "lucide-react";
import { CONSOLE_CAPTURE_SCRIPT } from "../hooks/useConsoleCapture";
import { GeneratingOverlay } from "./GeneratingOverlay";
import { extractAllImports, generateDynamicLoaderScript } from "../utils/npmResolver";

interface CodePreviewProps {
  code: string;
  files?: Record<string, string>;
  isGenerating: boolean;
  isBuilding?: boolean;
  pipelineProgress?: number;
  generationStatus?: string;
  supabaseUrl?: string | null;
  supabaseAnonKey?: string | null;
  firecrawlEnabled?: boolean;
  // Vite dev server
  devServerUrl?: string | null;
  isDevServerStarting?: boolean;
  onStartDevServer?: () => void;
}

type DeviceMode = "desktop" | "tablet" | "mobile";

const BABEL_CDN = "https://unpkg.com/@babel/standalone@7.26.10/babel.min.js";
const REACT_CDN = "https://unpkg.com/react@18.3.1/umd/react.production.min.js";
const REACT_DOM_CDN = "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js";
const TAILWIND_CDN = "https://cdn.tailwindcss.com";
const RECHARTS_CDN = "https://unpkg.com/recharts@2.15.4/umd/Recharts.js";
const LUCIDE_CDN = "https://unpkg.com/lucide-react@0.462.0/dist/umd/lucide-react.js";
const SUPABASE_CDN = "https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js";
const FRAMER_MOTION_CDN = "https://unpkg.com/framer-motion@11.18.0/dist/framer-motion.js";
const REACT_ROUTER_CDN = "https://unpkg.com/react-router-dom@6.30.1/dist/umd/react-router-dom.production.min.js";
const DATE_FNS_CDN = "https://unpkg.com/date-fns@3.6.0/cdn.min.js";

function buildMultiScriptTags(files?: Record<string, string>, fallbackCode?: string): string {
  if (!files || Object.keys(files).length <= 1) {
    const code = files?.['App.tsx'] || fallbackCode || '';
    return `<script type="text/babel" data-type="module">
    ${code}
  </script>`;
  }
  const entries = Object.entries(files);
  const appEntry = entries.find(([n]) => n === 'App.tsx');
  const others = entries.filter(([n]) => n !== 'App.tsx').sort(([a], [b]) => a.localeCompare(b));
  const ordered = [...others, ...(appEntry ? [appEntry] : [])];
  return ordered.map(([name, code]) =>
    `<!-- ${name} -->
  <script type="text/babel" data-type="module">
    ${code}
  </script>`
  ).join('\n  ');
}

function buildIframeHtml(tsxCode: string, supabaseUrl?: string | null, supabaseAnonKey?: string | null, firecrawlEnabled?: boolean, files?: Record<string, string>, npmPackages?: string[]): string {
  const hasSupabase = !!supabaseUrl && !!supabaseAnonKey;
  const supabaseScript = hasSupabase
    ? `<script src="${SUPABASE_CDN}"></script>
  <script>
    window.__SUPABASE_CLIENT__ = supabase.createClient("${supabaseUrl}", "${supabaseAnonKey}");
  </script>`
    : '';

  const firecrawlScript = firecrawlEnabled
    ? `<script>
    window.__FIRECRAWL__ = {
      async scrape(url, options) {
        const resp = await fetch("${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/firecrawl-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": "${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}" },
          body: JSON.stringify({ action: "scrape", url, options })
        });
        return resp.json();
      },
      async search(query, options) {
        const resp = await fetch("${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/firecrawl-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": "${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}" },
          body: JSON.stringify({ action: "search", query, options })
        });
        return resp.json();
      },
      async map(url, options) {
        const resp = await fetch("${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/firecrawl-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": "${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}" },
          body: JSON.stringify({ action: "map", url, options })
        });
        return resp.json();
      },
      async crawl(url, options) {
        const resp = await fetch("${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/firecrawl-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": "${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}" },
          body: JSON.stringify({ action: "crawl", url, options })
        });
        return resp.json();
      }
    };
  </script>`
    : '';

  const npmLoaderScript = generateDynamicLoaderScript(npmPackages || []);

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="${TAILWIND_CDN}"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            border: '#1a1a1a',
            background: '#050505',
            foreground: '#f5f5f5',
            primary: { DEFAULT: '#2563eb', foreground: '#ffffff' },
            muted: { DEFAULT: '#171717', foreground: '#a3a3a3' },
            card: { DEFAULT: '#111111', foreground: '#f5f5f5' },
            accent: { DEFAULT: '#1d4ed8', foreground: '#ffffff' },
          }
        }
      }
    };
  </script>
  <script src="${REACT_CDN}"></script>
  <script src="${REACT_DOM_CDN}"></script>
  <script src="${RECHARTS_CDN}"></script>
  <script src="${LUCIDE_CDN}"></script>
  <script>
    if (window.LucideReact) window.lucide = window.LucideReact;
  </script>
  <script src="${FRAMER_MOTION_CDN}"></script>
  <script src="${DATE_FNS_CDN}"></script>
  <script src="${REACT_ROUTER_CDN}"></script>
  <script>
    if (window.Motion) window.motion = window.Motion;
    if (window.ReactRouterDOM) window.ReactRouter = window.ReactRouterDOM;
  </script>
  ${supabaseScript}
  ${firecrawlScript}
  ${npmLoaderScript}
  <script src="${BABEL_CDN}"></script>
  ${CONSOLE_CAPTURE_SCRIPT}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #050505; color: #f5f5f5; font-family: 'Inter', system-ui, -apple-system, sans-serif; min-height: 100vh; }
    #root { min-height: 100vh; }
    .error-container { padding: 2rem; color: #ef4444; font-family: monospace; font-size: 13px; white-space: pre-wrap; background: #1a0000; min-height: 100vh; }
    .loading-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #a3a3a3; font-size: 14px; }
  </style>
</head>
<body>
  <div id="root"><div class="loading-container">Chargement…</div></div>
  ${buildMultiScriptTags(files, tsxCode)}
  <script>
    window.addEventListener('error', function(e) {
      var root = document.getElementById('root');
      var errMsg = (e.message || 'Unknown error') + (e.filename ? '\\nFichier: ' + e.filename + ':' + e.lineno : '');
      if (root) {
        root.innerHTML = '<div class="error-container"><strong>Erreur de rendu:</strong>\\n\\n' + errMsg + '</div>';
      }
      try {
        window.parent.postMessage({ type: 'runtime_error', error: errMsg }, '*');
      } catch(ex) {}
    });
    window.addEventListener('unhandledrejection', function(e) {
      var errMsg = (e.reason && e.reason.message) ? e.reason.message : String(e.reason || 'Unhandled promise rejection');
      try {
        window.parent.postMessage({ type: 'runtime_error', error: errMsg }, '*');
      } catch(ex) {}
    });
  </script>
</body>
</html>`;
}

const DEFAULT_CODE = `function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        <h1 className="text-5xl font-black tracking-tight mb-4">Blink AI</h1>
        <p className="text-neutral-400 text-lg mb-8">
          Décris l'application que tu veux construire dans le chat.
          L'IA va générer du vrai code React pour toi.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 text-sm font-bold rounded-full border border-blue-500/30">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          Prêt à générer
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
`;

export const CodePreview: React.FC<CodePreviewProps> = ({
  code, files, isGenerating, isBuilding, pipelineProgress, generationStatus,
  supabaseUrl, supabaseAnonKey, firecrawlEnabled,
  devServerUrl, isDevServerStarting, onStartDevServer,
}) => {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const effectiveCode = code?.trim() || DEFAULT_CODE;
  const npmPackages = useMemo(() => extractAllImports(files || {}), [files]);

  // Only build srcDoc when NOT using dev server
  const iframeSrcDoc = useMemo(() => {
    if (devServerUrl) return null; // Don't build srcDoc when using Vite
    return buildIframeHtml(effectiveCode, supabaseUrl, supabaseAnonKey, firecrawlEnabled, files, npmPackages);
  }, [effectiveCode, supabaseUrl, supabaseAnonKey, firecrawlEnabled, files, npmPackages, devServerUrl]);

  const isUsingVite = !!devServerUrl;

  const deviceConfig = {
    desktop: { width: "100%", height: "100%" },
    tablet: { width: "768px", height: "90%" },
    mobile: { width: "390px", height: "85%" },
  };

  const currentConfig = deviceConfig[deviceMode];

  return (
    <div
      className={`flex-1 bg-gray-100 dark:bg-[#050505] p-4 flex flex-col items-center overflow-hidden relative transition-all duration-500 ${
        isFullscreen ? "fixed inset-0 z-[1000] p-0" : ""
      }`}
    >
      {!isFullscreen && (
        <div className="flex items-center gap-2 mb-4 bg-white dark:bg-[#111] p-1.5 rounded-2xl border border-gray-200 dark:border-[#1a1a1a] shrink-0 shadow-2xl">
          <DeviceButton active={deviceMode === "desktop"} onClick={() => setDeviceMode("desktop")} icon={<Monitor size={16} />} label="Desktop" />
          <DeviceButton active={deviceMode === "tablet"} onClick={() => setDeviceMode("tablet")} icon={<Tablet size={16} />} label="Tablet" />
          <DeviceButton active={deviceMode === "mobile"} onClick={() => setDeviceMode("mobile")} icon={<Smartphone size={16} />} label="Mobile" />
          <div className="w-[1px] h-4 bg-gray-200 dark:bg-[#1a1a1a] mx-1" />

          {/* Vite dev server toggle */}
          {onStartDevServer && !isUsingVite && (
            <button
              onClick={onStartDevServer}
              disabled={isDevServerStarting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all disabled:opacity-50"
              title="Start Vite dev server with HMR"
            >
              <Zap size={14} />
              {isDevServerStarting ? "Starting…" : "Vite HMR"}
            </button>
          )}

          {isUsingVite && (
            <>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-green-500">VITE HMR</span>
              </div>
              <button
                onClick={() => setIframeKey(k => k + 1)}
                className="p-1.5 text-gray-400 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all"
                title="Refresh preview"
              >
                <RefreshCw size={14} />
              </button>
            </>
          )}

          <button
            onClick={() => setIsFullscreen(true)}
            className="p-2 text-gray-400 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all"
            title="Fullscreen Preview"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      )}

      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-6 right-6 z-[1100] bg-white text-black p-3 rounded-full shadow-2xl hover:opacity-90 transition-all border border-neutral-200"
        >
          <Minimize2 size={24} />
        </button>
      )}

      <div
        className={`bg-white dark:bg-[#050505] relative overflow-hidden flex flex-col border border-gray-200 dark:border-[#1a1a1a] transition-all duration-700 ease-in-out shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.8)] ${
          isFullscreen ? "w-full h-full" : "rounded-2xl"
        }`}
        style={{
          width: isFullscreen ? "100%" : currentConfig.width,
          height: isFullscreen ? "100%" : currentConfig.height,
        }}
      >
        <div className="h-11 bg-gray-50 dark:bg-[#111] border-b border-gray-200 dark:border-[#1a1a1a] flex items-center px-4 gap-3 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-[#333]" />
            <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-[#333]" />
            <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-[#333]" />
          </div>
          <div className="flex-1 mx-6 bg-gray-100 dark:bg-[#0a0a0a]/60 rounded-md h-7 border border-gray-200 dark:border-[#1a1a1a] flex items-center px-3 text-[11px] text-gray-500 dark:text-neutral-500 font-medium overflow-hidden whitespace-nowrap">
            {isUsingVite ? devServerUrl : "blink.cloud/preview"}
          </div>
          <div className="flex items-center gap-2">
            {isGenerating && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-blue-500">GENERATING</span>
              </div>
            )}
            <div className={`text-[10px] font-bold whitespace-nowrap ${isUsingVite ? 'text-green-500' : 'text-blue-500'}`}>
              {isUsingVite ? "⚡ VITE DEV" : "LIVE REACT"}
            </div>
          </div>
        </div>

        <div className="relative flex-1 w-full">
          {isUsingVite ? (
            <iframe
              key={`vite-${iframeKey}`}
              src={devServerUrl!}
              className="w-full h-full border-none bg-white dark:bg-[#050505]"
              title="Vite Dev Preview"
            />
          ) : (
            <iframe
              key={effectiveCode}
              srcDoc={iframeSrcDoc!}
              className="w-full h-full border-none bg-white dark:bg-[#050505]"
              sandbox="allow-scripts allow-same-origin"
              title="Code Preview"
            />
          )}
          <GeneratingOverlay isVisible={!!isBuilding} statusText={generationStatus} progress={pipelineProgress} />
        </div>
      </div>
    </div>
  );
};

const DeviceButton = ({
  active, onClick, icon, label,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
      active
        ? "bg-blue-600 text-white shadow-lg"
        : "text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
    }`}
    title={label}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);
