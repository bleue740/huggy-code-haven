import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const REACT_CDN = "https://unpkg.com/react@18.3.1/umd/react.production.min.js";
const REACT_DOM_CDN = "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js";
const TAILWIND_CDN = "https://cdn.tailwindcss.com";
const BABEL_CDN = "https://unpkg.com/@babel/standalone@7.26.10/babel.min.js";
const RECHARTS_CDN = "https://unpkg.com/recharts@2.15.4/umd/Recharts.js";
const LUCIDE_CDN = "https://unpkg.com/lucide-react@0.462.0/dist/umd/lucide-react.js";
const FRAMER_MOTION_CDN = "https://unpkg.com/framer-motion@11.18.0/dist/framer-motion.js";
const REACT_ROUTER_CDN = "https://unpkg.com/react-router-dom@6.30.1/dist/umd/react-router-dom.production.min.js";
const DATE_FNS_CDN = "https://unpkg.com/date-fns@3.6.0/cdn.min.js";

function buildMultiScriptTags(files?: Record<string, string>, fallbackCode?: string): string {
  if (!files || Object.keys(files).length <= 1) {
    const code = files?.['App.tsx'] || fallbackCode || '';
    return `<script type="text/babel" data-type="module">\n    ${code}\n  </script>`;
  }
  const entries = Object.entries(files);
  const appEntry = entries.find(([n]) => n === 'App.tsx');
  const others = entries.filter(([n]) => n !== 'App.tsx').sort(([a], [b]) => a.localeCompare(b));
  const ordered = [...others, ...(appEntry ? [appEntry] : [])];
  return ordered.map(([name, code]) =>
    `<!-- ${name} -->\n  <script type="text/babel" data-type="module">\n    ${code}\n  </script>`
  ).join('\n  ');
}

function buildPublishedHtml(files: Record<string, string> | null, fallbackCode: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="App built with Blink AI" />
  <script src="${TAILWIND_CDN}"><\/script>
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
  <\/script>
  <script src="${REACT_CDN}"><\/script>
  <script src="${REACT_DOM_CDN}"><\/script>
  <script src="${RECHARTS_CDN}"><\/script>
  <script src="${LUCIDE_CDN}"><\/script>
  <script>if (window.LucideReact) window.lucide = window.LucideReact;<\/script>
  <script src="${FRAMER_MOTION_CDN}"><\/script>
  <script src="${DATE_FNS_CDN}"><\/script>
  <script src="${REACT_ROUTER_CDN}"><\/script>
  <script>
    if (window.Motion) window.motion = window.Motion;
    if (window.ReactRouterDOM) window.ReactRouter = window.ReactRouterDOM;
  <\/script>
  <script src="${BABEL_CDN}"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #050505; color: #f5f5f5; font-family: 'Inter', system-ui, -apple-system, sans-serif; min-height: 100vh; }
    #root { min-height: 100vh; }
    .error-container { padding: 2rem; color: #ef4444; font-family: monospace; font-size: 13px; white-space: pre-wrap; background: #1a0000; min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  ${buildMultiScriptTags(files, fallbackCode)}
  <script>
    window.addEventListener('error', function(e) {
      var root = document.getElementById('root');
      if (root) {
        root.innerHTML = '<div class="error-container"><strong>Error:</strong>\\n\\n' + (e.message || 'Unknown error') + '</div>';
      }
    });
  <\/script>
</body>
</html>`;
}

function extractFilesAndCode(snapshot: any): { files: Record<string, string> | null; code: string } {
  if (!snapshot) return { files: null, code: '' };
  if (typeof snapshot === 'object' && snapshot.files && typeof snapshot.files === 'object') {
    return { files: snapshot.files as Record<string, string>, code: '' };
  }
  if (typeof snapshot === 'object' && typeof snapshot.code === 'string') {
    try {
      const parsed = JSON.parse(snapshot.code);
      if (parsed?.__multifile && typeof parsed.files === 'object') {
        return { files: parsed.files as Record<string, string>, code: '' };
      }
    } catch { /* not JSON */ }
    return { files: null, code: snapshot.code };
  }
  return { files: null, code: '' };
}

export default function PublishedDeploymentPage() {
  const { deploymentId } = useParams();
  const [filesData, setFilesData] = useState<{ files: Record<string, string> | null; code: string } | null>(null);
  const [projectName, setProjectName] = useState("Blink App");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!deploymentId) throw new Error("Missing deployment id");
        const { data, error } = await supabase
          .from("deployments")
          .select("id, slug, schema_snapshot, project_id")
          .eq("id", deploymentId)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Deployment not found");

        // Try to get project name
        if ((data as any).project_id) {
          const { data: proj } = await supabase
            .from("projects")
            .select("name")
            .eq("id", (data as any).project_id)
            .maybeSingle();
          if (proj && mounted) setProjectName((proj as any).name || "Blink App");
        }

        const extracted = extractFilesAndCode((data as any).schema_snapshot);
        if (!extracted.files && !extracted.code) throw new Error("No code found in deployment");
        if (mounted) setFilesData(extracted);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Not found");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [deploymentId]);

  const iframeSrcDoc = useMemo(() => {
    if (!filesData) return null;
    return buildPublishedHtml(filesData.files, filesData.code, projectName);
  }, [filesData, projectName]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-neutral-500">Loading preview…</span>
        </div>
      </main>
    );
  }

  if (error || !iframeSrcDoc) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🔗</span>
          </div>
          <h1 className="text-2xl font-black mb-2">Preview introuvable</h1>
          <p className="text-sm text-neutral-500 mb-6">{error || "Ce lien de preview n'existe pas ou a expiré."}</p>
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
            Retour à l'accueil
          </a>
        </div>
      </main>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#050505]">
      {/* Minimal top bar */}
      <div className="h-10 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <span className="text-xs font-bold text-neutral-400">{projectName}</span>
          <span className="text-[10px] text-neutral-600 px-2 py-0.5 bg-neutral-800 rounded-full font-medium">Preview</span>
        </div>
        <a
          href="/"
          className="text-[10px] font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-widest"
        >
          Built with Blink AI
        </a>
      </div>
      <iframe
        srcDoc={iframeSrcDoc}
        className="flex-1 w-full border-none"
        sandbox="allow-scripts allow-same-origin"
        title={projectName}
      />
    </div>
  );
}
