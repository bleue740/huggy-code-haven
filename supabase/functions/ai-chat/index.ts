import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Backend needs detection ────────────────────────────────────────
type BackendNeed = "database" | "auth" | "storage" | "scraping";

function detectBackendNeeds(prompt: string): BackendNeed[] {
  const lower = prompt.toLowerCase();
  const needs: BackendNeed[] = [];

  const dbKeywords = [
    "base de données", "base de donnees", "sauvegarder", "persister", "crud",
    "stocker", "table", "utilisateurs", "database", "save", "persist",
    "backend", "données", "donnees", "enregistrer", "historique",
    "todo list", "todo app", "notes app", "blog", "e-commerce",
  ];
  const authKeywords = [
    "login", "inscription", "authentification", "mot de passe",
    "connexion utilisateur", "signup", "sign in", "sign up", "auth",
    "register", "password", "account", "compte",
  ];
  const storageKeywords = [
    "upload", "fichier", "image", "photo", "stockage", "file",
    "télécharger", "telecharger", "avatar", "media",
  ];
  const scrapingKeywords = [
    "scraper", "scraping", "extraire", "crawler", "crawl",
    "site web", "firecrawl", "web search", "recherche web",
    "extract", "parse url", "parse site",
  ];

  if (dbKeywords.some(k => lower.includes(k))) needs.push("database");
  if (authKeywords.some(k => lower.includes(k))) needs.push("auth");
  if (storageKeywords.some(k => lower.includes(k))) needs.push("storage");
  if (scrapingKeywords.some(k => lower.includes(k))) needs.push("scraping");

  return needs;
}

// ── Model routing ──────────────────────────────────────────────────
type Complexity = "simple" | "complex" | "fix" | "data";
type Provider = "lovable" | "anthropic";

interface ModelChoice {
  provider: Provider;
  model: string;
}

function detectComplexity(prompt: string, backendNeeds: BackendNeed[]): Complexity {
  const lower = prompt.toLowerCase();

  const fixKeywords = [
    "bug", "fix", "erreur", "corrig", "refactor", "améliore", "optimise",
    "debug", "problème", "ne fonctionne pas", "broken", "issue",
  ];
  const complexKeywords = [
    "dashboard", "app complète", "application complète", "multi-page",
    "e-commerce", "saas", "admin panel", "crm", "projet complet",
    "full app", "landing page complète", "plateforme",
  ];

  if (fixKeywords.some(k => lower.includes(k))) return "fix";
  if (backendNeeds.includes("scraping")) return "data";
  if (backendNeeds.length > 0) return "complex";
  if (complexKeywords.some(k => lower.includes(k))) return "complex";
  if (lower.length > 500) return "complex";
  return "simple";
}

function creditCostForComplexity(c: Complexity): number {
  switch (c) {
    case "simple": return 0.50;
    case "fix":    return 0.90;
    case "complex": return 1.20;
    case "data":   return 2.00;
    default: return 1.0;
  }
}

function pickModel(complexity: Complexity): ModelChoice {
  switch (complexity) {
    case "simple":
      return { provider: "lovable", model: "google/gemini-3-flash-preview" };
    case "complex":
      return { provider: "anthropic", model: "claude-sonnet-4-20250514" };
    case "fix":
      return { provider: "lovable", model: "openai/gpt-5" };
    case "data":
      return { provider: "lovable", model: "google/gemini-2.5-pro" };
  }
}

// ── System prompt ──────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `You are Blink AI — an elite full-stack React code generator and conversational assistant.

## RESPONSE DECISION
Before responding, decide:
- If the user asks to BUILD, CREATE, MODIFY, ADD, FIX, CODE something → generate code with [FILE:...] markers (see below)
- If the user asks a QUESTION, wants an EXPLANATION, says "hello", discusses architecture, etc. → respond in natural language WITHOUT any [FILE:...] markers

You can have a conversation in Agent mode. Not every message needs code.

## MULTI-FILE OUTPUT FORMAT
When generating code, wrap EACH file in markers. Do NOT use fenced code blocks (\`\`\`tsx).
Instead use this format:

[FILE:App.tsx]
// complete code for App.tsx
[/FILE:App.tsx]

[FILE:Header.tsx]
// complete code for Header.tsx
[/FILE:Header.tsx]

To delete a file:
[FILE_DELETE:OldComponent.tsx]

Rules:
- You can create new files, modify existing ones, or delete files.
- Always include App.tsx as the main entry point when generating code.
- Each file must be complete and self-contained within its markers.
- Before the file markers, write a brief explanation (2-3 sentences) of what you built/changed.

## MULTI-FILE ARCHITECTURE (CRITICAL)
Each file is loaded in a SEPARATE <script type="text/babel"> tag. Files are loaded in alphabetical order, with App.tsx loaded LAST.
This means:
- Component files (e.g. Header.tsx, Sidebar.tsx) are executed BEFORE App.tsx
- Each component must declare itself as a GLOBAL function (no export/import):
  \`function Header() { return <div>...</div>; }\`
- App.tsx can reference any component defined in other files since they're already in scope
- DO NOT use import/export statements between files
- DO NOT re-declare the same component in multiple files

Example multi-file project:
[FILE:Button.tsx]
function Button({ children, onClick, variant = "primary" }) {
  const styles = variant === "primary" ? "bg-blue-600 text-white" : "bg-white/5 text-white border border-white/10";
  return <button onClick={onClick} className={\`px-4 py-2 rounded-xl font-bold \${styles}\`}>{children}</button>;
}
[/FILE:Button.tsx]

[FILE:App.tsx]
const { useState } = React;
function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
      <Button onClick={() => setCount(c => c + 1)}>Clicked {count} times</Button>
    </div>
  );
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
[/FILE:App.tsx]

## CODE RULES
1. The code is rendered in a browser with React 18, ReactDOM, Tailwind CSS, and Lucide React already loaded as globals (\`React\`, \`ReactDOM\`, \`lucide\`).
2. DO NOT use import/export statements. Use destructuring from globals:
   \`const { useState, useEffect, useCallback, useRef, useMemo } = React;\`
3. In App.tsx, ALWAYS mount the app at the end:
   \`const root = ReactDOM.createRoot(document.getElementById('root'));\`
   \`root.render(React.createElement(App));\`
4. For icons, use: \`const { IconName } = lucide;\` (e.g., \`const { Search, Menu, X, ChevronDown } = lucide;\`)
5. Other files (components) should just define global functions. App.tsx will reference them since they're loaded first.

## DESIGN SYSTEM
- Dark mode by default: bg-[#050505], text-white/text-neutral-200
- Use modern Tailwind: rounded-2xl, shadow-2xl, backdrop-blur, gradients
- Glassmorphism: bg-white/5 border border-white/10 backdrop-blur-xl
- Smooth animations: transition-all duration-300, hover:scale-105
- Typography: font-black for headings, tracking-tight
- Blue accent: bg-blue-600, text-blue-400, border-blue-500/30
- Cards: bg-[#111] border border-[#1a1a1a] rounded-2xl p-6
- Inputs: bg-[#1a1a1a] border border-[#333] rounded-xl
- Buttons: rounded-xl font-bold shadow-lg active:scale-95

## CODE QUALITY
- Write clean, senior-level code with proper state management
- Use functional components with hooks
- Add proper error handling and loading states
- Make all UIs fully responsive (mobile-first)
- Include micro-interactions and smooth transitions
- Use semantic HTML for accessibility
- NEVER use external URLs or APIs that might fail (unless Supabase or Firecrawl are connected)
- Generate realistic mock data when needed

## SECURITY
- Sanitize all user inputs in forms
- Use controlled components for all inputs
- Never use dangerouslySetInnerHTML
- No inline event handlers with string code

## LIBRARIES AVAILABLE (via CDN globals)
- React 18 (React, ReactDOM)
- Tailwind CSS (all utility classes)
- Lucide React icons (as \`lucide\` global — e.g. \`const { Search, Menu } = lucide;\`)
- Recharts (as \`Recharts\` global) for charts: LineChart, BarChart, PieChart, AreaChart, etc.
  Usage: \`const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts;\`
- Framer Motion (as \`motion\` global) for animations:
  Usage: \`const { motion: m, AnimatePresence } = motion;\` then \`<m.div animate={{opacity:1}} />\`
- React Router DOM (as \`ReactRouter\` global) for multi-page navigation:
  Usage: \`const { BrowserRouter, Routes, Route, Link, useNavigate } = ReactRouter;\`
- date-fns (as \`dateFns\` global) for date manipulation:
  Usage: \`const formatted = dateFns.format(new Date(), 'PPP');\`

## RESPONSE FORMAT
Before the [FILE:...] markers, write a brief explanation (2-3 sentences max) of what you built and key features.
Do NOT use fenced code blocks. Only use [FILE:...][/FILE:...] markers for code.`;

const SUPABASE_PROMPT_ADDON = `

## SUPABASE INTEGRATION (CONNECTED)
The user has connected a Supabase project. Generate code that uses the Supabase JS client.
- The Supabase client is pre-initialized and available as a global: \`const supabaseClient = window.__SUPABASE_CLIENT__;\`
- Use \`supabaseClient.from('table').select('*')\` for queries
- Use \`supabaseClient.from('table').insert([{...}])\` for inserts
- Use \`supabaseClient.from('table').update({...}).eq('id', id)\` for updates
- Use \`supabaseClient.from('table').delete().eq('id', id)\` for deletes
- Use \`supabaseClient.auth.signInWithPassword({ email, password })\` for login
- Use \`supabaseClient.auth.signUp({ email, password })\` for registration
- Use \`supabaseClient.auth.signOut()\` for logout
- Use \`supabaseClient.auth.getUser()\` to get current user
- Use \`supabaseClient.storage.from('bucket').upload(path, file)\` for file uploads
- Always handle loading states and errors gracefully
- The Supabase JS library is loaded via CDN - use the global \`supabase\` object`;

const SUPABASE_MOCK_PROMPT_ADDON = `

## BACKEND NEEDED (NOT CONNECTED YET)
The user's request needs a backend (database/auth/storage) but Supabase is not connected yet.
- Generate the UI with mock data stored in React state (useState)
- Structure the code so it's easy to replace mocks with real Supabase calls later
- Add comments like \`// TODO: Replace with supabaseClient.from('table').select('*')\` where real DB calls would go
- Make the mock data realistic and comprehensive
- Include a banner or note in the UI saying "Mode démo - Connectez Supabase pour persister les données"`;

const FIRECRAWL_PROMPT_ADDON = `

## FIRECRAWL (WEB SCRAPING - CONNECTED)
A Firecrawl proxy is available for web scraping and search. Use the global helpers:
- \`window.__FIRECRAWL__.scrape(url, options)\` - Extract content from a URL. Returns { success, data }
- \`window.__FIRECRAWL__.search(query, options)\` - Search the web. Returns { success, data }
- \`window.__FIRECRAWL__.map(url, options)\` - Discover all URLs on a site. Returns { success, links }
- \`window.__FIRECRAWL__.crawl(url, options)\` - Crawl an entire website. Returns { success, data }
- These are async functions that call the backend proxy
- Always show loading states while fetching
- Handle errors gracefully with try/catch`;

const PLAN_SYSTEM_PROMPT = `You are Blink AI in Planning Mode — an expert architect and product strategist.

## RULES
- You are helping the user think, plan, and make decisions BEFORE any code is written.
- NEVER output code blocks (no \`\`\`tsx, no \`\`\`jsx, no \`\`\`javascript, no \`\`\`html).
- Focus on: architecture decisions, component structure, data models, user flows, UX considerations, tradeoffs.
- Ask clarifying questions when the request is ambiguous or complex.
- Always respond in the same language as the user's message.

## STRUCTURED PLAN FORMAT
When you have enough information to propose an implementation plan, wrap it in markers:

[PLAN_START]
## Plan Title
1. Step one description
2. Step two description
...
[PLAN_END]

The user will see a button to "Approve and implement" which will send the plan to Agent mode.
You can include text before and after the plan markers for context.

## WHAT YOU CAN DO
- Analyze requirements and break them down into steps
- Compare different implementation approaches with pros/cons
- Design database schemas, API structures, component hierarchies
- Identify potential issues or edge cases before implementation
- Review and critique existing code architecture
- Help debug problems by reasoning through the logic

## RESPONSE STYLE
- Start with a brief summary of your understanding
- Ask 1-3 targeted questions if needed
- When proposing a plan, structure it clearly with numbered steps inside [PLAN_START]...[PLAN_END]
- Highlight key decisions the user needs to make
- Be opinionated — recommend the best approach, don't just list options`;

const FIRECRAWL_MOCK_PROMPT_ADDON = `

## WEB SCRAPING NEEDED (NOT CONNECTED YET)
The user wants web scraping/search but Firecrawl is not activated.
- Generate mock scraped data that looks realistic
- Add comments like \`// TODO: Replace with window.__FIRECRAWL__.scrape(url)\`
- Include a note saying "Mode démo - Activez Firecrawl pour le scraping réel"`;

// ── Anthropic streaming proxy ──────────────────────────────────────
async function streamAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
): Promise<Response> {
  const anthropicMessages = messages.filter((m) => m.role !== "system");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 16000,
      temperature: 0.7,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`Anthropic error ${resp.status}:`, errText);
    throw new Error(`Anthropic API error: ${resp.status}`);
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);

          if (!line || line.startsWith(":")) continue;

          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr);

              if (event.type === "content_block_delta" && event.delta?.text) {
                const openAIChunk = {
                  choices: [{ delta: { content: event.delta.text } }],
                };
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`),
                );
              } else if (event.type === "message_stop") {
                await writer.write(encoder.encode("data: [DONE]\n\n"));
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      }

      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch (e) {
      console.error("Anthropic stream processing error:", e);
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ── Main handler ───────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Check credits
    const { data: creditRow, error: creditError } = await supabase
      .from("users_credits")
      .select("credits, lifetime_used")
      .eq("user_id", userId)
      .maybeSingle();

    if (creditError) {
      console.error("Credit fetch error:", creditError);
      return new Response(JSON.stringify({ error: "Failed to check credits" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentCredits = creditRow?.credits ?? 0;

    // Parse body
    const { messages, projectContext, supabaseUrl, supabaseAnonKey, firecrawlEnabled, mode } = await req.json();
    const chatMode = mode === 'plan' ? 'plan' : 'agent';
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect backend needs from the latest user message
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
    const backendNeeds = chatMode === 'plan' ? [] : detectBackendNeeds(lastUserMsg?.content ?? "");
    const complexity = chatMode === 'plan' ? 'simple' as Complexity : detectComplexity(lastUserMsg?.content ?? "", backendNeeds);
    const planModel: ModelChoice = { provider: "lovable", model: "openai/gpt-5" };
    const { provider, model } = chatMode === 'plan' ? planModel : pickModel(complexity);
    console.log(`[ai-chat] mode=${chatMode} complexity=${complexity} provider=${provider} model=${model} user=${userId} backendNeeds=${backendNeeds.join(",")}`);

    // Build conditional system prompt
    let fullSystem = chatMode === 'plan' ? PLAN_SYSTEM_PROMPT : BASE_SYSTEM_PROMPT;

    // Supabase integration
    const hasSupabase = !!supabaseUrl && !!supabaseAnonKey;
    if (hasSupabase) {
      fullSystem += SUPABASE_PROMPT_ADDON;
    } else if (backendNeeds.some(n => ["database", "auth", "storage"].includes(n))) {
      fullSystem += SUPABASE_MOCK_PROMPT_ADDON;
    }

    // Firecrawl integration
    if (firecrawlEnabled) {
      fullSystem += FIRECRAWL_PROMPT_ADDON;
    } else if (backendNeeds.includes("scraping")) {
      fullSystem += FIRECRAWL_MOCK_PROMPT_ADDON;
    }

    // Project context
    if (projectContext) {
      fullSystem += `\n\nCurrent project code:\n\`\`\`tsx\n${projectContext.slice(0, 24000)}\n\`\`\`\nThe user wants to modify or extend this code. Preserve existing functionality unless asked to replace it.`;
    }

    // Variable credit cost based on complexity
    const creditCost = creditCostForComplexity(complexity);

    if (currentCredits < creditCost) {
      return new Response(
        JSON.stringify({ error: "no_credits", message: `Crédits insuffisants (${currentCredits.toFixed(2)} restants, ${creditCost} requis). Passez à Blink Pro pour continuer.` }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Deduct credit before streaming — use service role client to bypass RLS
    const newCredits = currentCredits - creditCost;
    const newLifetime = (creditRow?.lifetime_used ?? 0) + creditCost;
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error: deductError } = await adminClient
      .from("users_credits")
      .update({ credits: newCredits, lifetime_used: newLifetime })
      .eq("user_id", userId);
    if (deductError) {
      console.error("[ai-chat] Credit deduction FAILED:", deductError);
    } else {
      console.log(`[ai-chat] Credit deducted: ${currentCredits} -> ${newCredits}`);
    }

    // Prepare the response with backend hints header
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };

    // ── Route to Anthropic ──
    if (provider === "anthropic") {
      const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!anthropicKey) {
        return new Response(JSON.stringify({ error: "Anthropic API not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Wrap the Anthropic stream to prepend credit_cost and backend hints
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        // Send credit cost event first
        const costEvent = { type: "credit_cost", cost: creditCost, remaining: newCredits };
        await writer.write(encoder.encode(`data: ${JSON.stringify(costEvent)}\n\n`));

        // Send backend hint if needed
        if (backendNeeds.length > 0) {
          const hint = { type: "backend_hint", needs: backendNeeds };
          await writer.write(encoder.encode(`data: ${JSON.stringify(hint)}\n\n`));
        }

        // Then pipe the rest
        const reader = anthropicResponse.body!.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
        await writer.close();
      })();

      return new Response(readable, { headers: responseHeaders });
    }

    // ── Route to Lovable AI Gateway (Gemini / GPT) ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemMessages = [{ role: "system", content: fullSystem }];
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [...systemMessages, ...messages],
        stream: true,
        temperature: 0.7,
        max_tokens: 16000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI gateway error: ${aiResponse.status}`, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limit", message: "Trop de requêtes. Réessayez dans quelques secondes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "payment_required", message: "Crédits IA épuisés. Rechargez votre compte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Wrap stream to prepend credit_cost and backend hints
    {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        // Send credit cost event first
        const costEvent = { type: "credit_cost", cost: creditCost, remaining: newCredits };
        await writer.write(encoder.encode(`data: ${JSON.stringify(costEvent)}\n\n`));

        // Send backend hint if needed
        if (backendNeeds.length > 0) {
          const hint = { type: "backend_hint", needs: backendNeeds };
          await writer.write(encoder.encode(`data: ${JSON.stringify(hint)}\n\n`));
        }

        const reader = aiResponse.body!.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
        await writer.close();
      })();

      return new Response(readable, { headers: responseHeaders });
    }
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
