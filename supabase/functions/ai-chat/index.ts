import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Model routing ──────────────────────────────────────────────────
const MODELS = {
  fast: "google/gemini-3-flash-preview",
  quality: "google/gemini-3-pro-preview",
  precision: "openai/gpt-5",
} as const;

type Complexity = "simple" | "complex" | "fix";

function detectComplexity(prompt: string): Complexity {
  const lower = prompt.toLowerCase();
  const complexKeywords = [
    "dashboard", "app complète", "application complète", "multi-page",
    "e-commerce", "saas", "admin panel", "crm", "projet complet",
    "full app", "landing page complète", "plateforme",
  ];
  const fixKeywords = [
    "bug", "fix", "erreur", "corrig", "refactor", "améliore", "optimise",
    "debug", "problème", "ne fonctionne pas", "broken", "issue",
  ];
  if (fixKeywords.some((k) => lower.includes(k))) return "fix";
  if (complexKeywords.some((k) => lower.includes(k))) return "complex";
  if (lower.length > 500) return "complex";
  return "simple";
}

function pickModel(complexity: Complexity): string {
  switch (complexity) {
    case "simple":
      return MODELS.fast;
    case "complex":
      return MODELS.quality;
    case "fix":
      return MODELS.precision;
  }
}

// ── System prompt ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Blink AI — an elite full-stack React code generator.

## OUTPUT RULES — READ CAREFULLY
1. You MUST return a **single, complete, self-contained JSX code block** wrapped in \`\`\`tsx ... \`\`\`.
2. The code is rendered in a browser with React 18, ReactDOM, Tailwind CSS, and Lucide React already loaded as globals (\`React\`, \`ReactDOM\`, \`lucide\`).
3. DO NOT use import/export statements. Use destructuring from globals:
   \`const { useState, useEffect, useCallback, useRef, useMemo } = React;\`
4. At the end, ALWAYS mount the app:
   \`const root = ReactDOM.createRoot(document.getElementById('root'));\`
   \`root.render(React.createElement(App));\`
5. For icons, use: \`const { IconName } = lucide;\` (e.g., \`const { Search, Menu, X, ChevronDown } = lucide;\`)

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
- NEVER use external URLs or APIs that might fail
- Generate realistic mock data when needed

## SECURITY
- Sanitize all user inputs in forms
- Use controlled components for all inputs
- Never use dangerouslySetInnerHTML
- No inline event handlers with string code

## LIBRARIES AVAILABLE (via CDN globals)
- React 18 (React, ReactDOM)
- Tailwind CSS (all utility classes)
- Lucide React icons (as \`lucide\` global)
- Recharts (as \`Recharts\` global) for charts: LineChart, BarChart, PieChart, AreaChart, etc.

## RESPONSE FORMAT
Before the code block, write a brief explanation (2-3 sentences max) of what you built and key features.
Then output a single \`\`\`tsx code block with the complete app.
Do NOT split across multiple code blocks.
Do NOT add any code after the tsx block.`;

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
      { global: { headers: { Authorization: authHeader } } }
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
    if (currentCredits < 1) {
      return new Response(
        JSON.stringify({ error: "no_credits", message: "Vous n'avez plus de crédits. Passez à Blink Pro pour continuer." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const { messages, projectContext } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route model
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    const complexity = detectComplexity(lastUserMsg?.content ?? "");
    const model = pickModel(complexity);
    console.log(`[ai-chat] complexity=${complexity} model=${model} user=${userId}`);

    // Build messages with context
    const systemMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
    if (projectContext) {
      systemMessages.push({
        role: "system",
        content: `Current project code:\n\`\`\`tsx\n${projectContext.slice(0, 8000)}\n\`\`\`\nThe user wants to modify or extend this code. Preserve existing functionality unless asked to replace it.`,
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call AI Gateway with streaming
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
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "payment_required", message: "Crédits IA épuisés. Rechargez votre compte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct credit
    const newCredits = currentCredits - 1;
    const newLifetime = (creditRow?.lifetime_used ?? 0) + 1;
    await supabase
      .from("users_credits")
      .update({ credits: newCredits, lifetime_used: newLifetime })
      .eq("user_id", userId);

    console.log(`[ai-chat] Credit deducted: ${currentCredits} -> ${newCredits}`);

    // Stream SSE response back
    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
