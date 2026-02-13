import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ──────────────────────────────────────────────────────────
interface PlanStep {
  id: number;
  action: "create" | "modify" | "delete";
  target: string;
  path?: string;
  description: string;
}

interface PlanResult {
  intent: string;
  risk_level: "low" | "medium" | "high";
  steps: PlanStep[];
}

interface GeneratedFile {
  path: string;
  content: string;
}

interface GeneratorResult {
  files: GeneratedFile[];
}

interface ValidationError {
  type: "syntax" | "runtime" | "security" | "import";
  file: string;
  message: string;
}

interface ValidatorResult {
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface FixerResult {
  files: GeneratedFile[];
}

type AgentPhase = "planning" | "generating" | "validating" | "fixing" | "complete" | "error";

// ── Agent Prompts ──────────────────────────────────────────────────

const GLOBAL_RULES = `You are a Production AI App Builder Engine.

You are NOT a chatbot. You are NOT a tutor. You are NOT creative unless instructed.

Your responsibility is to build, modify, and maintain real web applications.

GLOBAL CONSTRAINTS:
- Always respect the current project filesystem.
- Never delete files unless explicitly instructed.
- Never hallucinate dependencies.
- Never use CDN scripts in generated code — libraries are pre-loaded as globals.
- Always output strict JSON — no markdown, no explanation outside JSON.
- Never explain code unless asked.
- Failure to respect constraints is a critical error.`;

const PLANNER_PROMPT = `${GLOBAL_RULES}

You are the PLANNER AGENT — a Senior Software Architect.

INPUT: You receive a user request, project context, and file tree snapshot.

TASK:
- Understand user intent
- Decide what files must change
- Produce an ordered execution plan
- If the user is just chatting (greeting, question, discussion), set intent to their question and steps to empty array.

RULES:
- Do NOT generate code
- Do NOT modify files
- Only reason about architecture
- If request is ambiguous, set risk_level to "high" and add a clarification step

OUTPUT ONLY this JSON (no markdown wrapping):
{
  "intent": "short summary of what user wants",
  "risk_level": "low|medium|high",
  "conversational": false,
  "reply": null,
  "steps": [
    {
      "id": 1,
      "action": "create|modify|delete",
      "target": "filename or feature description",
      "path": "optional file path",
      "description": "what and why"
    }
  ]
}

If the user is just chatting (no code needed), set:
- "conversational": true
- "reply": "your conversational response"
- "steps": []`;

const GENERATOR_PROMPT = `${GLOBAL_RULES}

You are the CODE GENERATOR AGENT — a Senior Fullstack Engineer.

INPUT: You receive an execution plan, current filesystem, and tech stack constraints.

RUNTIME ENVIRONMENT:
- Code runs in a browser iframe with React 18, ReactDOM, Tailwind CSS, Lucide React pre-loaded as globals.
- Each file is a SEPARATE <script type="text/babel"> tag loaded alphabetically, App.tsx last.
- Components must be GLOBAL functions (no export/import).
- Destructure from globals: const { useState, useEffect } = React;
- Icons: const { Search, Menu } = lucide;
- Recharts: const { LineChart, Line, XAxis } = Recharts;
- Framer Motion: const { motion: m, AnimatePresence } = motion;
- React Router: const { BrowserRouter, Routes, Route } = ReactRouter;
- date-fns: dateFns.format(new Date(), 'PPP')
- App.tsx MUST end with: const root = ReactDOM.createRoot(document.getElementById('root')); root.render(React.createElement(App));

DESIGN SYSTEM:
- Dark mode: bg-[#050505], text-white
- Modern Tailwind: rounded-2xl, shadow-2xl, backdrop-blur, gradients
- Glassmorphism: bg-white/5 border border-white/10 backdrop-blur-xl
- Blue accent: bg-blue-600, text-blue-400
- Cards: bg-[#111] border border-[#1a1a1a] rounded-2xl p-6

RULES:
- Generate ONLY requested files from the plan
- Output FULL file contents — no placeholders, no "// rest of code"
- TypeScript-style code only
- Follow existing project conventions
- NEVER use import/export between files

OUTPUT ONLY this JSON (no markdown wrapping):
{
  "files": [
    {
      "path": "App.tsx",
      "content": "FULL FILE CONTENT HERE"
    }
  ]
}`;

const VALIDATOR_PROMPT = `${GLOBAL_RULES}

You are the VALIDATOR AGENT — a Build & Security Validator.

INPUT: You receive the complete filesystem snapshot after code generation.

TASK:
- Validate syntax correctness
- Validate that all referenced components/functions exist across files
- Validate that globals are properly destructured (no import/export)
- Detect security risks (eval, dangerouslySetInnerHTML, hardcoded secrets, external scripts)
- Detect runtime errors (undefined references, missing mount call in App.tsx)

RULES:
- NEVER rewrite code
- ONLY report issues
- Be strict but not pedantic — minor style issues are warnings, not errors

OUTPUT ONLY this JSON (no markdown wrapping):
{
  "valid": true|false,
  "errors": [
    {
      "type": "syntax|runtime|security|import",
      "file": "filename",
      "message": "description of the issue"
    }
  ],
  "warnings": [
    {
      "type": "syntax|runtime|security|import",
      "file": "filename",
      "message": "description"
    }
  ]
}`;

const FIXER_PROMPT = `${GLOBAL_RULES}

You are the FIXER AGENT — a Senior Debugging Engineer.

INPUT: You receive validation errors and the current filesystem.

RULES:
- Fix ONLY reported errors — do NOT refactor unrelated code
- Preserve formatting, style, and existing functionality
- Each fixed file must be COMPLETE — no partial content

OUTPUT ONLY this JSON (no markdown wrapping):
{
  "files": [
    {
      "path": "filename",
      "content": "COMPLETE FIXED CONTENT"
    }
  ]
}`;

// ── AI Call Helper ─────────────────────────────────────────────────

async function callAgent<T>(
  systemPrompt: string,
  userMessage: string,
  model: string,
): Promise<T> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("AI gateway not configured");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 16000,
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`Agent call failed (${resp.status}):`, errText);
    throw new Error(`Agent call failed: ${resp.status}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty agent response");

  // Parse JSON — strip markdown code fences if present
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  return JSON.parse(jsonStr) as T;
}

// ── Streaming helper for final response ────────────────────────────

function createSSEStream() {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  return {
    readable,
    async sendEvent(data: Record<string, unknown>) {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    },
    async close() {
      await writer.write(encoder.encode("data: [DONE]\n\n"));
      await writer.close();
    },
  };
}

// ── Complexity detection ───────────────────────────────────────────

function pickModel(prompt: string): string {
  const lower = prompt.toLowerCase();
  const complexKeywords = [
    "dashboard", "app complète", "application complète", "multi-page",
    "e-commerce", "saas", "admin panel", "crm", "plateforme", "full app",
  ];
  if (complexKeywords.some(k => lower.includes(k)) || lower.length > 500) {
    return "openai/gpt-5";
  }
  return "google/gemini-3-flash-preview";
}

// ── Main Handler ───────────────────────────────────────────────────

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
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: creditRow } = await supabase
      .from("users_credits")
      .select("credits, lifetime_used")
      .eq("user_id", userId)
      .maybeSingle();

    const currentCredits = creditRow?.credits ?? 0;
    if (currentCredits < 1) {
      return new Response(
        JSON.stringify({ error: "no_credits", message: "Crédits épuisés." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse request
    const { messages, projectContext, fileTree, mode } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
    const userPrompt = lastUserMsg?.content ?? "";
    const model = pickModel(userPrompt);

    // Create SSE stream
    const stream = createSSEStream();

    // Run orchestration pipeline in background
    (async () => {
      try {
        // ── Phase 1: PLANNER ──
        await stream.sendEvent({
          type: "phase",
          phase: "planning" as AgentPhase,
          message: "Analyse de l'architecture…",
        });

        const conversationHistory = messages
          .slice(-10)
          .map((m: { role: string; content: string }) => `[${m.role}]: ${m.content}`)
          .join("\n");

        const plannerInput = `## User Request
${userPrompt}

## Conversation History
${conversationHistory}

## Current File Tree
${fileTree || "App.tsx"}

## Project Context
${projectContext ? projectContext.slice(0, 12000) : "Empty project"}`;

        const plan = await callAgent<PlanResult & { conversational?: boolean; reply?: string }>(
          PLANNER_PROMPT,
          plannerInput,
          "google/gemini-3-flash-preview",
        );

        await stream.sendEvent({
          type: "plan",
          plan,
        });

        // If conversational, just reply and stop
        if (plan.conversational && plan.reply) {
          await stream.sendEvent({
            type: "phase",
            phase: "complete" as AgentPhase,
            message: "Réponse envoyée",
          });
          await stream.sendEvent({
            type: "result",
            conversational: true,
            reply: plan.reply,
            files: [],
            deletedFiles: [],
          });
          // Deduct credit
          const newCredits = currentCredits - 1;
          const newLifetime = (creditRow?.lifetime_used ?? 0) + 1;
          await adminClient
            .from("users_credits")
            .update({ credits: newCredits, lifetime_used: newLifetime })
            .eq("user_id", userId);
          await stream.close();
          return;
        }

        if (plan.steps.length === 0) {
          await stream.sendEvent({
            type: "result",
            conversational: true,
            reply: plan.intent || "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ?",
            files: [],
            deletedFiles: [],
          });
          await stream.close();
          return;
        }

        // ── Phase 2: GENERATOR ──
        await stream.sendEvent({
          type: "phase",
          phase: "generating" as AgentPhase,
          message: "Génération du code…",
        });

        const generatorInput = `## Execution Plan
${JSON.stringify(plan.steps, null, 2)}

## Plan Intent
${plan.intent}

## Current Filesystem
${projectContext ? projectContext.slice(0, 20000) : "// Empty project - App.tsx only"}

## Files to generate/modify
${plan.steps.map(s => `- ${s.action} ${s.path || s.target}: ${s.description}`).join("\n")}`;

        const generated = await callAgent<GeneratorResult>(
          GENERATOR_PROMPT,
          generatorInput,
          model,
        );

        // Send file updates as they come
        for (const file of generated.files) {
          await stream.sendEvent({
            type: "file_generated",
            path: file.path,
            linesCount: file.content.split("\n").length,
          });
        }

        // ── Phase 3: VALIDATOR ──
        await stream.sendEvent({
          type: "phase",
          phase: "validating" as AgentPhase,
          message: "Validation du code…",
        });

        // Build full filesystem for validation
        const allFiles = generated.files.map(f => `--- ${f.path} ---\n${f.content}`).join("\n\n");
        const validatorInput = `## Complete Filesystem After Generation
${allFiles}`;

        const validation = await callAgent<ValidatorResult & { valid?: boolean }>(
          VALIDATOR_PROMPT,
          validatorInput,
          "google/gemini-3-flash-preview",
        );

        await stream.sendEvent({
          type: "validation",
          errors: validation.errors,
          warnings: validation.warnings,
        });

        let finalFiles = generated.files;

        // ── Phase 4: FIXER (if needed) ──
        if (validation.errors && validation.errors.length > 0) {
          await stream.sendEvent({
            type: "phase",
            phase: "fixing" as AgentPhase,
            message: `Correction de ${validation.errors.length} erreur(s)…`,
          });

          const fixerInput = `## Errors to Fix
${JSON.stringify(validation.errors, null, 2)}

## Current Filesystem
${allFiles}`;

          const fixes = await callAgent<FixerResult>(
            FIXER_PROMPT,
            fixerInput,
            model,
          );

          // Merge fixes into files
          const fileMap = new Map(finalFiles.map(f => [f.path, f]));
          for (const fix of fixes.files) {
            fileMap.set(fix.path, fix);
          }
          finalFiles = [...fileMap.values()];
        }

        // ── Phase 5: COMPLETE ──
        await stream.sendEvent({
          type: "phase",
          phase: "complete" as AgentPhase,
          message: "Code prêt !",
        });

        // Collect deleted files from plan
        const deletedFiles = plan.steps
          .filter(s => s.action === "delete")
          .map(s => s.path || s.target);

        await stream.sendEvent({
          type: "result",
          conversational: false,
          intent: plan.intent,
          files: finalFiles,
          deletedFiles,
          warnings: validation.warnings || [],
        });

        // Deduct credit
        const newCredits = currentCredits - 1;
        const newLifetime = (creditRow?.lifetime_used ?? 0) + 1;
        await adminClient
          .from("users_credits")
          .update({ credits: newCredits, lifetime_used: newLifetime })
          .eq("user_id", userId);

      } catch (e) {
        console.error("Orchestrator pipeline error:", e);
        await stream.sendEvent({
          type: "phase",
          phase: "error" as AgentPhase,
          message: e instanceof Error ? e.message : "Erreur interne",
        });
        await stream.sendEvent({
          type: "result",
          conversational: true,
          reply: `⚠️ Erreur: ${e instanceof Error ? e.message : "Erreur interne"}`,
          files: [],
          deletedFiles: [],
        });
      } finally {
        await stream.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("ai-orchestrator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
