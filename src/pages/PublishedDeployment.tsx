import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const REACT_CDN = "https://unpkg.com/react@18.3.1/umd/react.production.min.js";
const REACT_DOM_CDN = "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js";
const TAILWIND_CDN = "https://cdn.tailwindcss.com";
const BABEL_CDN = "https://unpkg.com/@babel/standalone@7.26.10/babel.min.js";
const RECHARTS_CDN = "https://unpkg.com/recharts@2.15.4/umd/Recharts.js";
const LUCIDE_CDN = "https://unpkg.com/lucide-react@0.462.0/dist/umd/lucide-react.js";

function buildPublishedHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blink App</title>
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
  <script type="text/babel" data-type="module">
    ${code}
  <\/script>
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

function extractCode(snapshot: any): string | null {
  if (!snapshot) return null;
  // New format: { code, files }
  if (typeof snapshot === 'object' && snapshot.files) {
    const files = snapshot.files as Record<string, string>;
    const entries = Object.entries(files);
    const app = entries.find(([n]) => n === 'App.tsx');
    const others = entries.filter(([n]) => n !== 'App.tsx').sort(([a], [b]) => a.localeCompare(b));
    return [...others.map(([, c]) => c), app?.[1] ?? ''].join('\n\n');
  }
  // Old format: raw code string
  if (typeof snapshot === 'object' && typeof snapshot.code === 'string') {
    try {
      const parsed = JSON.parse(snapshot.code);
      if (parsed?.__multifile && typeof parsed.files === 'object') {
        const entries = Object.entries(parsed.files as Record<string, string>);
        const app = entries.find(([n]) => n === 'App.tsx');
        const others = entries.filter(([n]) => n !== 'App.tsx').sort(([a], [b]) => a.localeCompare(b));
        return [...others.map(([, c]) => c), app?.[1] ?? ''].join('\n\n');
      }
      return snapshot.code;
    } catch {
      return snapshot.code;
    }
  }
  return null;
}

export default function PublishedDeploymentPage() {
  const { deploymentId } = useParams();
  const [code, setCode] = useState<string | null>(null);
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
          .select("id, slug, schema_snapshot")
          .eq("id", deploymentId)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Deployment not found");
        
        const extractedCode = extractCode((data as any).schema_snapshot);
        if (!extractedCode) throw new Error("No code found in deployment");
        if (mounted) setCode(extractedCode);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Not found");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [deploymentId]);

  const iframeSrcDoc = useMemo(() => {
    if (!code) return null;
    return buildPublishedHtml(code);
  }, [code]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-neutral-500">Loading deployment…</span>
        </div>
      </main>
    );
  }

  if (error || !iframeSrcDoc) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-black">Deployment introuvable</h1>
          <p className="text-sm text-neutral-500 mt-2">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <iframe
      srcDoc={iframeSrcDoc}
      className="w-full h-screen border-none"
      sandbox="allow-scripts allow-same-origin"
      title="Published App"
    />
  );
}
