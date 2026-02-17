import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as esbuild from "https://deno.land/x/esbuild@v0.20.1/wasm.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REACT_CDN = "https://unpkg.com/react@18.3.1/umd/react.production.min.js";
const REACT_DOM_CDN = "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js";
const TAILWIND_CDN = "https://cdn.tailwindcss.com";
const RECHARTS_CDN = "https://unpkg.com/recharts@2.15.4/umd/Recharts.js";
const LUCIDE_CDN = "https://unpkg.com/lucide-react@0.462.0/dist/umd/lucide-react.js";
const FRAMER_MOTION_CDN = "https://unpkg.com/framer-motion@11.18.0/dist/framer-motion.js";
const REACT_ROUTER_CDN = "https://unpkg.com/react-router-dom@6.30.1/dist/umd/react-router-dom.production.min.js";
const DATE_FNS_CDN = "https://unpkg.com/date-fns@3.6.0/cdn.min.js";

/** Sort files: components first, App.tsx last */
function sortFiles(files: Record<string, string>): [string, string][] {
  const entries = Object.entries(files);
  const app = entries.find(([n]) => n === "App.tsx");
  const others = entries.filter(([n]) => n !== "App.tsx").sort(([a], [b]) => a.localeCompare(b));
  return [...others, ...(app ? [app] : [])];
}

/** Strip import/export statements and inject React globals */
function preprocessCode(code: string): string {
  // Remove import statements
  let processed = code.replace(/^import\s+.*?['"]\s*;?\s*$/gm, "");
  // Convert export default to window assignment or remove export keywords
  processed = processed.replace(/export\s+default\s+function\s+(\w+)/g, "function $1");
  processed = processed.replace(/export\s+default\s+/g, "");
  processed = processed.replace(/export\s+(?:const|let|var|function|class)\s+/g, "");
  processed = processed.replace(/export\s*\{[^}]*\}\s*;?/g, "");
  return processed;
}

async function transpileFile(code: string, filename: string): Promise<string> {
  const preprocessed = preprocessCode(code);
  const result = await esbuild.transform(preprocessed, {
    loader: filename.endsWith(".tsx") ? "tsx" : filename.endsWith(".ts") ? "ts" : "jsx",
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    target: "es2020",
    minify: true,
  });
  return result.code;
}

function buildHtml(transpiledChunks: string[], projectName: string): string {
  const allJs = transpiledChunks.join("\n\n");
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName}</title>
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
  <script>if(window.LucideReact)window.lucide=window.LucideReact;<\/script>
  <script src="${FRAMER_MOTION_CDN}"><\/script>
  <script src="${DATE_FNS_CDN}"><\/script>
  <script src="${REACT_ROUTER_CDN}"><\/script>
  <script>
    if(window.Motion)window.motion=window.Motion;
    if(window.ReactRouterDOM)window.ReactRouter=window.ReactRouterDOM;
  <\/script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#050505;color:#f5f5f5;font-family:'Inter',system-ui,-apple-system,sans-serif;min-height:100vh}
    #root{min-height:100vh}
    .error-container{padding:2rem;color:#ef4444;font-family:monospace;font-size:13px;white-space:pre-wrap;background:#1a0000;min-height:100vh}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    try {
      ${allJs}

      // Find the App component (last defined function or class)
      var App = window.App || (typeof App !== 'undefined' ? App : null);
      if (App) {
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
      } else {
        document.getElementById('root').innerHTML = '<div class="error-container">No App component found.</div>';
      }
    } catch(e) {
      document.getElementById('root').innerHTML = '<div class="error-container"><strong>Build Error:</strong>\\n\\n' + e.message + '</div>';
      console.error(e);
    }
  <\/script>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate user
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: authError } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const { files, projectId, projectName } = await req.json();
    if (!files || !projectId) {
      return new Response(JSON.stringify({ error: "Missing files or projectId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize esbuild
    await esbuild.initialize({ wasmURL: "https://unpkg.com/esbuild-wasm@0.20.1/esbuild.wasm" });

    // Sort and transpile all files
    const sorted = sortFiles(files);
    const transpiledChunks: string[] = [];

    for (const [filename, code] of sorted) {
      try {
        const transpiled = await transpileFile(code as string, filename);
        transpiledChunks.push(`// --- ${filename} ---\n${transpiled}`);
      } catch (e: any) {
        console.error(`Transpile error for ${filename}:`, e.message);
        transpiledChunks.push(`// --- ${filename} (ERROR) ---\nconsole.error("Build error in ${filename}: ${e.message}");`);
      }
    }

    // Stop esbuild
    esbuild.stop();

    // Generate HTML
    const html = buildHtml(transpiledChunks, projectName || "Blink App");
    const htmlBytes = new TextEncoder().encode(html);
    const storagePath = `builds/${projectId}/index.html`;

    // Upload to storage (upsert)
    const { error: uploadError } = await supabase.storage
      .from("deployments")
      .upload(storagePath, htmlBytes, {
        contentType: "text/html",
        upsert: true,
        cacheControl: "public, max-age=60",
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("deployments")
      .getPublicUrl(storagePath);

    const buildUrl = urlData.publicUrl;

    // Update deployment record
    const { error: dbError } = await supabase
      .from("deployments")
      .upsert(
        {
          user_id: userId,
          project_id: projectId,
          slug: `blink-${projectId.slice(0, 8)}`,
          build_url: buildUrl,
          url: buildUrl,
          schema_snapshot: { code: "", files },
        },
        { onConflict: "project_id" },
      )
      .select("id")
      .single();

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({ success: true, buildUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("Build error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Build failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
