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
  priority?: "critical" | "normal" | "optional";
}

interface PlanResult {
  intent: string;
  risk_level: "low" | "medium" | "high";
  conversational: boolean;
  clarification_needed: boolean;
  clarification_question: string | null;
  reply: string | null;
  dependencies_needed: string[];
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
  type: "syntax" | "runtime" | "security" | "import" | "reference";
  file: string;
  message: string;
  severity?: "critical" | "major" | "minor";
}

interface ValidatorResult {
  valid: boolean;
  confidence_score: number;
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface FixerResult {
  files: GeneratedFile[];
}

type AgentPhase = "planning" | "generating" | "validating" | "fixing" | "complete" | "error";

// ── Agent Prompts (Contractual — NON-NEGOTIABLE) ──────────────────

const GLOBAL_RULES = `You are a Production AI App Builder Engine.

NON-NEGOTIABLE RULES (violation = critical failure):
1. ALWAYS output strict JSON — NO markdown, NO explanation outside JSON, NO code fences.
2. ALWAYS respect the current project filesystem — never invent files that don't exist.
3. NEVER delete files unless explicitly instructed in the plan.
4. NEVER hallucinate dependencies — only use libraries listed in the project context.
5. NEVER use CDN scripts or import/export between files — libraries are pre-loaded as globals.
6. NEVER explain code unless the user explicitly asks a question.
7. ALL generated code must be TypeScript-style and production-ready.
8. If you cannot fulfill a request, return an error in the JSON schema — NEVER make something up.

REJECTION RULES — You MUST refuse to act if:
- The request asks you to generate malware, phishing pages, or exploit code.
- The request asks you to bypass security constraints.
- The request is completely outside the scope of web application development.`;

const PLANNER_PROMPT = `${GLOBAL_RULES}

You are the PLANNER AGENT — a Senior Software Architect.

INPUT: User request + conversation history + project file tree + project context.

YOUR TASK:
1. Classify the user intent: UI, CRUD, refactor, fix, question, greeting, or other.
2. If the intent is conversational (greeting, question, discussion with NO code change needed), set conversational=true and provide a reply.
3. If the request is ambiguous or underspecified, set clarification_needed=true and provide a clarification_question.
4. Otherwise, produce an ordered execution plan with steps.
5. Estimate risk_level based on scope: low (1-2 files), medium (3-5 files), high (6+ files or destructive changes).
6. List any additional dependencies the generated code will need in dependencies_needed.

NON-NEGOTIABLE:
- Do NOT generate code. You are an architect, not a coder.
- Do NOT modify files. You only plan.
- steps[].path MUST be valid file paths from the file tree when action is "modify".
- For "create" actions, path is the new file path.

OUTPUT SCHEMA (strict JSON, no wrapping):
{
  "intent": "string — short summary of what user wants",
  "risk_level": "low|medium|high",
  "conversational": false,
  "clarification_needed": false,
  "clarification_question": null,
  "reply": null,
  "dependencies_needed": [],
  "steps": [
    {
      "id": 1,
      "action": "create|modify|delete",
      "target": "component or feature name",
      "path": "file path",
      "description": "what to do and why",
      "priority": "critical|normal|optional"
    }
  ]
}

VALID EXAMPLE:
{"intent":"Add a navbar","risk_level":"low","conversational":false,"clarification_needed":false,"clarification_question":null,"reply":null,"dependencies_needed":["lucide-react"],"steps":[{"id":1,"action":"create","target":"Navbar","path":"Navbar.tsx","description":"Create responsive navbar with logo and links","priority":"critical"},{"id":2,"action":"modify","target":"App","path":"App.tsx","description":"Add Navbar to the App layout","priority":"critical"}]}

INVALID EXAMPLE (DO NOT DO THIS):
{"intent":"Add navbar","steps":[{"action":"create","description":"Create navbar"}]}
// MISSING: risk_level, conversational, clarification_needed, reply, dependencies_needed, path, id, priority

CONVERSATIONAL EXAMPLE:
{"intent":"User greeting","risk_level":"low","conversational":true,"clarification_needed":false,"clarification_question":null,"reply":"Bonjour ! Comment puis-je vous aider avec votre application ?","dependencies_needed":[],"steps":[]}`;

const GENERATOR_PROMPT = `${GLOBAL_RULES}

You are the CODE GENERATOR AGENT — a Senior Fullstack Engineer.

INPUT: Execution plan + current filesystem + project context (features, decisions, constraints).

RUNTIME ENVIRONMENT (NON-NEGOTIABLE):
- Code runs in a browser iframe with React 18, ReactDOM, Tailwind CSS, Lucide React pre-loaded as globals.
- Each file is a SEPARATE <script type="text/babel"> tag loaded alphabetically, App.tsx last.
- Components MUST be GLOBAL functions (window-scoped). NO export/import.
- Destructure from globals: const { useState, useEffect, useCallback, useMemo, useRef } = React;
- Icons: const { Search, Menu, X, ChevronDown } = lucide;
- Recharts: const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } = Recharts;
- Framer Motion: const { motion: m, AnimatePresence } = motion;
- React Router: const { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } = ReactRouter;
- date-fns: dateFns.format(new Date(), 'PPP')
- App.tsx MUST end with: const root = ReactDOM.createRoot(document.getElementById('root')); root.render(React.createElement(App));

DESIGN SYSTEM:
- Dark mode default: bg-[#050505], text-white
- Glassmorphism cards: bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl
- Blue accent: bg-blue-600, text-blue-400, hover:bg-blue-500
- Consistent spacing: p-6, gap-4, space-y-4
- Typography: text-sm for body, text-lg font-semibold for headings
- Interactive elements: transition-all duration-200, hover states, focus:ring-2

COHERENCE RULES:
- Before referencing a component, verify it exists in the file tree OR is being created in this batch.
- If the plan says "modify", you MUST include the FULL file content (not just changes).
- If a file exceeds 300 lines, consider splitting into sub-components.
- Every file must be syntactically complete and independently valid.

NON-NEGOTIABLE:
- Generate ONLY files listed in the execution plan.
- Output FULL file contents — NO placeholders, NO "// rest of code here", NO truncation.
- NEVER use import/export between files.
- NEVER reference components that don't exist and aren't being created.

OUTPUT SCHEMA (strict JSON, no wrapping):
{
  "files": [
    {
      "path": "ComponentName.tsx",
      "content": "// FULL FILE CONTENT — every single line"
    }
  ]
}

INVALID OUTPUT (DO NOT DO THIS):
{"files":[{"path":"App.tsx","content":"// ... existing code ...\\nfunction NewComponent() { }"}]}
// REASON: Partial content with "... existing code ..." placeholder — REJECTED.`;

const VALIDATOR_PROMPT = `${GLOBAL_RULES}

You are the VALIDATOR AGENT — a Build & Security Auditor.

INPUT: Complete filesystem snapshot after code generation.

YOUR CHECKS (ordered by priority):
1. SYNTAX: Valid JSX/TSX, matched brackets/parens, no unterminated strings.
2. REFERENCES: Every component/function referenced in a file must be defined in SOME file in the filesystem (they're globals).
3. GLOBALS: All React hooks, Lucide icons, Recharts components must be destructured from their global objects — no import statements.
4. MOUNT: App.tsx MUST contain ReactDOM.createRoot(document.getElementById('root')).render(...).
5. SECURITY: Flag eval(), dangerouslySetInnerHTML, hardcoded API keys, external script tags, document.write().
6. IMPORTS: Flag any import/export statements (these will break the runtime).

CONFIDENCE SCORING:
- 90-100: No errors, code is clean.
- 70-89: Minor warnings only (style issues, unused variables).
- 50-69: Some errors that the fixer can likely resolve.
- 0-49: Critical structural issues, may need regeneration.

NON-NEGOTIABLE:
- NEVER rewrite or modify code. You are a validator, not a fixer.
- ONLY report findings in the schema.
- Be strict on errors, lenient on warnings.

OUTPUT SCHEMA (strict JSON, no wrapping):
{
  "valid": true,
  "confidence_score": 95,
  "errors": [
    {
      "type": "syntax|runtime|security|import|reference",
      "file": "filename.tsx",
      "message": "description of the issue",
      "severity": "critical|major|minor"
    }
  ],
  "warnings": []
}

VALID EXAMPLE:
{"valid":false,"confidence_score":45,"errors":[{"type":"reference","file":"App.tsx","message":"Component 'Dashboard' is referenced but not defined in any file","severity":"critical"},{"type":"import","file":"Navbar.tsx","message":"Uses 'import React from react' — must use global destructuring instead","severity":"major"}],"warnings":[{"type":"runtime","file":"Chart.tsx","message":"Unused variable 'tempData'","severity":"minor"}]}`;

const FIXER_PROMPT = `${GLOBAL_RULES}

You are the FIXER AGENT — a Senior Debugging Engineer.

INPUT: Validation errors + current filesystem + original plan intent.

YOUR TASK:
- Fix ONLY the reported errors — do NOT refactor unrelated code.
- Preserve all existing formatting, style, and functionality.
- Each fixed file must be COMPLETE — no partial content, no placeholders.
- If a reference error says component X is missing, you must either:
  a) Define component X in the appropriate file, OR
  b) Remove the reference if the component isn't needed.

NON-NEGOTIABLE:
- Fix ONLY files with errors. Do NOT touch clean files.
- Output COMPLETE file contents for every fixed file.
- Do NOT introduce new bugs while fixing.
- If you cannot fix an error, include it in your output with an explanation.

OUTPUT SCHEMA (strict JSON, no wrapping):
{
  "files": [
    {
      "path": "filename.tsx",
      "content": "COMPLETE FIXED FILE CONTENT"
    }
  ]
}`;

// ── AI Call Helper ─────────────────────────────────────────────────

async function callAgent<T>(
  systemPrompt: string,
  userMessage: string,
  model: string,
  maxTokens = 16000,
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
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`Agent call failed (${resp.status}):`, errText);
    if (resp.status === 429) throw new Error("Rate limit exceeded — please try again shortly.");
    if (resp.status === 402) throw new Error("AI credits exhausted — top up your workspace.");
    throw new Error(`Agent call failed: ${resp.status}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty agent response");

  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (parseErr) {
    console.error("JSON parse error. Raw content:", jsonStr.slice(0, 500));
    throw new Error("Agent returned invalid JSON");
  }
}

// ── Streaming AI Call (token-by-token) ────────────────────────────
// Used for conversational replies so they appear word-by-word in the UI.

async function callAgentStreaming(
  systemPrompt: string,
  userMessage: string,
  model: string,
  onToken: (chunk: string) => Promise<void>,
  maxTokens = 1024,
): Promise<string> {
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
      temperature: 0.7,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    if (resp.status === 429) throw new Error("Rate limit exceeded — please try again shortly.");
    if (resp.status === 402) throw new Error("AI credits exhausted — top up your workspace.");
    throw new Error(`Agent streaming call failed: ${resp.status} — ${errText.slice(0, 200)}`);
  }

  if (!resp.body) throw new Error("No response body for streaming");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);

      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;

      try {
        const parsed = JSON.parse(jsonStr);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          await onToken(delta);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return fullText;
}

// ── SSE Stream ────────────────────────────────────────────────────

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

// ── Complexity Detection & Model Routing ──────────────────────────

function detectComplexity(prompt: string, planSteps?: PlanStep[]): "simple" | "complex" {
  const lower = prompt.toLowerCase();
  const complexKeywords = [
    "dashboard", "app complète", "application complète", "multi-page",
    "e-commerce", "saas", "admin panel", "crm", "plateforme", "full app",
    "authentification", "authentication", "base de données", "database",
  ];

  if (complexKeywords.some(k => lower.includes(k))) return "complex";
  if (lower.length > 500) return "complex";
  if (planSteps && planSteps.length >= 4) return "complex";

  return "simple";
}

function pickGeneratorModel(complexity: "simple" | "complex"): string {
  return complexity === "complex" ? "openai/gpt-5" : "google/gemini-3-flash-preview";
}

const FAST_MODEL = "google/gemini-2.5-flash";

// ── Main Handler ───────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth ──
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

    // ── Credits Check ──
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
        JSON.stringify({ error: "no_credits", message: "Credits exhausted." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Parse Request ──
    const { messages, projectContext, fileTree } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
    const userPrompt = lastUserMsg?.content ?? "";

    // ── Create SSE Stream ──
    const stream = createSSEStream();

    // ── Run Pipeline ──
    (async () => {
      try {
        // ════════════════════════════════════════════════════════════
        // PHASE 0: THINKING STREAM (fast pre-planner reasoning)
        // ════════════════════════════════════════════════════════════
        await stream.sendEvent({
          type: "phase",
          phase: "planning" as AgentPhase,
          message: "Analyzing architecture…",
        });

        // Stream real thinking tokens before the planner JSON is ready
        const THINKING_SYSTEM = `You are a senior software architect briefly thinking aloud about a user's request.
Think about: what they want to build, the best technical approach, key components needed, and any trade-offs.
Output 2-3 short, insightful sentences. Focus on architecture decisions and component strategy. No bullet points, no markdown, no formatting.`;
        try {
          await callAgentStreaming(
            THINKING_SYSTEM,
            `User request: "${userPrompt.slice(0, 400)}"\nProject context (brief): ${projectContext?.slice(0, 300) || "new project"}`,
            "google/gemini-2.5-flash-lite",
            async (chunk) => {
              await stream.sendEvent({ type: "thinking_delta", delta: chunk });
            },
            120, // 120 tokens — ~600ms, enough for meaningful architectural reasoning
          );
        } catch { /* non-blocking — pipeline continues regardless */ }

        // ════════════════════════════════════════════════════════════
        // PHASE 1: PLANNER
        // ════════════════════════════════════════════════════════════
        const conversationHistory = messages
          .slice(-10)
          .map((m: { role: string; content: string }) => `[${m.role}]: ${m.content}`)
          .join("\n");

        const plannerInput = `## User Request
${userPrompt}

## Conversation History (last 10 messages)
${conversationHistory}

## Current File Tree
${fileTree || "App.tsx"}

## Project Context
${projectContext ? projectContext.slice(0, 12000) : "Empty project — only App.tsx exists"}`;

        const plan = await callAgent<PlanResult>(
          PLANNER_PROMPT,
          plannerInput,
          FAST_MODEL,
        );

        // ── Emit intent classification for frontend debug tracing ──
        await stream.sendEvent({
          type: "intent_classified",
          intent: plan.intent,
          conversational: plan.conversational,
          risk_level: plan.risk_level,
          steps_count: plan.steps?.length ?? 0,
          reasoning: plan.conversational
            ? "Classified as conversational — no code changes needed"
            : plan.clarification_needed
            ? `Clarification needed: ${plan.clarification_question}`
            : `Code generation required: ${plan.steps?.length ?? 0} step(s) planned`,
        });

        await stream.sendEvent({ type: "plan", plan });

        // ── Emit file_read events for files being modified (gives UI the "Reading" phase) ──
        for (const step of (plan.steps || [])) {
          if (step.action !== "create" && step.path) {
            await stream.sendEvent({ type: "file_read", path: step.path });
          }
        }

        // ── Handle Conversational (streaming token-by-token) ──
        if (plan.conversational || (plan.clarification_needed && plan.clarification_question)) {
          const baseReply = plan.clarification_needed
            ? `🤔 ${plan.clarification_question}`
            : (plan.reply || plan.intent || "Comment puis-je vous aider ?");

          // Stream tokens as they arrive
          await stream.sendEvent({ type: "conv_start" });

          const CONVERSATIONAL_SYSTEM = `Tu es un assistant expert en développement d'applications web. Réponds de manière concise, utile et professionnelle. Tu peux utiliser du markdown. Réfère-toi au contexte du projet si pertinent.`;
          const convInput = `Contexte du projet:\n${projectContext ? projectContext.slice(0, 2000) : "Nouveau projet"}\n\nMessage utilisateur: ${userPrompt}`;

          let fullReply = "";
          try {
            fullReply = await callAgentStreaming(
              CONVERSATIONAL_SYSTEM,
              convInput,
              FAST_MODEL,
              async (chunk) => {
                await stream.sendEvent({ type: "conv_delta", delta: chunk });
              },
              1024,
            );
          } catch {
            // fallback to pre-computed reply if streaming fails
            fullReply = baseReply;
            for (const word of fullReply.split(" ")) {
              await stream.sendEvent({ type: "conv_delta", delta: word + " " });
            }
          }

          await stream.sendEvent({
            type: "result",
            conversational: true,
            reply: fullReply,
            files: [],
            deletedFiles: [],
          });
          await deductCredit(adminClient, userId, 0, 0);
          await stream.close();
          return;
        }

        // ── Handle Clarification (kept for non-conversational edge case) ──
        if (plan.clarification_needed && plan.clarification_question) {
          await stream.sendEvent({
            type: "result",
            conversational: true,
            reply: `🤔 ${plan.clarification_question}`,
            files: [],
            deletedFiles: [],
          });
          await deductCredit(adminClient, userId, 0, 0);
          await stream.close();
          return;
        }

        // ── No Steps ──
        if (!plan.steps || plan.steps.length === 0) {
          await stream.sendEvent({
            type: "result",
            conversational: true,
            reply: plan.reply || plan.intent || "I'm not sure I understand. Could you rephrase?",
            files: [],
            deletedFiles: [],
          });
          await stream.close();
          return;
        }

        // ════════════════════════════════════════════════════════════
        // PHASE 2: GENERATOR
        // ════════════════════════════════════════════════════════════
        const complexity = detectComplexity(userPrompt, plan.steps);
        const generatorModel = pickGeneratorModel(complexity);

        await stream.sendEvent({
          type: "phase",
          phase: "generating" as AgentPhase,
          message: `Building your application (${complexity === "complex" ? "advanced mode" : "fast mode"})…`,
        });

        const generatorInput = `## Execution Plan
${JSON.stringify(plan.steps, null, 2)}

## Plan Intent
${plan.intent}

## Dependencies Available
${(plan.dependencies_needed || []).join(", ") || "None additional"}

## Current Filesystem (full code)
${projectContext ? projectContext.slice(0, 25000) : "// Empty project — App.tsx only"}

## File Tree
${fileTree || "App.tsx"}

## Files to Generate/Modify
${plan.steps.map(s => `- [${s.priority || "normal"}] ${s.action} ${s.path || s.target}: ${s.description}`).join("\n")}`;

        const generated = await callAgent<GeneratorResult>(
          GENERATOR_PROMPT,
          generatorInput,
          generatorModel,
          complexity === "complex" ? 32000 : 16000,
        );

        for (const file of generated.files) {
          await stream.sendEvent({
            type: "file_generated",
            path: file.path,
            linesCount: file.content.split("\n").length,
          });
        }

        // ════════════════════════════════════════════════════════════
        // PHASE 3: VALIDATOR
        // ════════════════════════════════════════════════════════════
        await stream.sendEvent({
          type: "phase",
          phase: "validating" as AgentPhase,
          message: "Validating generated code…",
        });

        const allFiles = generated.files.map(f => `--- ${f.path} ---\n${f.content}`).join("\n\n");
        const validatorInput = `## Complete Filesystem After Generation
${allFiles}

## Original Plan Intent
${plan.intent}

## Expected Components/Functions
${plan.steps.filter(s => s.action === "create").map(s => s.target).join(", ") || "None new"}`;

        const validation = await callAgent<ValidatorResult>(
          VALIDATOR_PROMPT,
          validatorInput,
          FAST_MODEL,
        );

        await stream.sendEvent({
          type: "validation",
          errors: validation.errors,
          warnings: validation.warnings,
          confidence_score: validation.confidence_score,
        });

        let finalFiles = generated.files;

        // ════════════════════════════════════════════════════════════
        // PHASE 4: FIXER (with retry — max 2 passes)
        // ════════════════════════════════════════════════════════════
        if (validation.errors && validation.errors.length > 0 && validation.confidence_score < 80) {
          const MAX_FIX_PASSES = 2;

          for (let pass = 1; pass <= MAX_FIX_PASSES; pass++) {
            const currentErrors = pass === 1
              ? validation.errors
              : (await revalidate(finalFiles, plan.intent, plan.steps)).errors;

            if (!currentErrors || currentErrors.length === 0) break;

            await stream.sendEvent({
              type: "phase",
              phase: "fixing" as AgentPhase,
              message: `Auto-fixing pass ${pass}/${MAX_FIX_PASSES} — ${currentErrors.length} error(s)…`,
            });

            const currentFilesStr = finalFiles.map(f => `--- ${f.path} ---\n${f.content}`).join("\n\n");

            const fixerInput = `## Errors to Fix
${JSON.stringify(currentErrors, null, 2)}

## Original Plan Intent
${plan.intent}

## Current Filesystem
${currentFilesStr}`;

            const fixes = await callAgent<FixerResult>(
              FIXER_PROMPT,
              fixerInput,
              generatorModel,
            );

            // Merge fixes
            const fileMap = new Map(finalFiles.map(f => [f.path, f]));
            for (const fix of fixes.files) {
              fileMap.set(fix.path, fix);
            }
            finalFiles = [...fileMap.values()];
          }

          // Final revalidation
          const finalValidation = await revalidate(finalFiles, plan.intent, plan.steps);
          if (finalValidation.errors.length > 0) {
            await stream.sendEvent({
              type: "validation",
              errors: finalValidation.errors,
              warnings: finalValidation.warnings,
              confidence_score: finalValidation.confidence_score,
              fixerExhausted: true,
            });
          }
        }

        // ════════════════════════════════════════════════════════════
        // PHASE 5: RESULT
        // ════════════════════════════════════════════════════════════
        await stream.sendEvent({
          type: "phase",
          phase: "complete" as AgentPhase,
          message: "✅ Code prêt !",
        });

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

        await deductCredit(adminClient, userId, 0, 0);

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
          reply: `⚠️ Erreur: ${e instanceof Error ? e.message : "Erreur interne du pipeline"}`,
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

// ── Helper: Deduct Credit via secure RPC ─────────────────────────

async function deductCredit(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  _currentCredits: number,
  _lifetimeUsed: number,
) {
  const { data, error } = await adminClient.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: 1,
    p_description: "Orchestrator pipeline",
  });
  if (error) {
    console.error("Failed to deduct credit:", error.message);
  }
  return data;
}

// ── Helper: Revalidate after fix ──────────────────────────────────

async function revalidate(
  files: GeneratedFile[],
  intent: string,
  steps: PlanStep[],
): Promise<ValidatorResult> {
  const allFiles = files.map(f => `--- ${f.path} ---\n${f.content}`).join("\n\n");
  const validatorInput = `## Complete Filesystem After Fix
${allFiles}

## Original Plan Intent
${intent}

## Expected Components
${steps.filter(s => s.action === "create").map(s => s.target).join(", ") || "None"}`;

  return callAgent<ValidatorResult>(
    VALIDATOR_PROMPT,
    validatorInput,
    FAST_MODEL,
  );
}
