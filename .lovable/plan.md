
# Architecture Streaming Complète — Alignement exact avec Lovable.dev

## Audit final : ce qui fonctionne vs ce qui manque

### Ce qui est déjà correct
- Typing indicator 3-dots (WhatsApp style) dans `ChatMessage` ✅
- `StreamingCursor` clignotant sur `conv_stream_*` ✅
- `renderMarkdown` progressif pendant streaming ✅
- `GeneratingOverlay` avec exit 800ms fluide ✅
- `isBuilding` ne se déclenche pas pendant une conv ✅
- `intent_classified` tracé dans la console ✅
- Pipeline SSE 4 phases (Planner → Generator → Validator → Fixer) ✅

### Les 6 écarts critiques à corriger

**Écart 1 — READING phase absente**
Le vrai Lovable affiche "Reading src/App.tsx..." avec des icônes `FileSearch` avant la phase Building. Dans notre code, il n'y a aucun signal de lecture de fichiers. Quand le Planner planifie de modifier un fichier, on ne le voit pas "lire" ce fichier.

**Écart 2 — THINKING n'a pas de contenu réel streamé**
Le `Reasoning` dans `GenerationPhaseDisplay` affiche `thinkingLines?.[0] || 'Analyzing requirements...'`. Mais `_thinkingLines` est **toujours vide** — l'orchestrateur n'émet aucun `thinking_delta` avant le Planner JSON. L'IA ne "pense" pas vraiment à voix haute.

**Écart 3 — Le flux de phases est incorrect**
Actuellement le mapping dans `App.tsx` est :
```
planning → uiPhase: "thinking"   ← FAUX, thinking devrait être AVANT planning
generating → uiPhase: "building"
```
Le flow correct est : `thinking → reading → planning → building → preview_ready`

**Écart 4 — `GenerationPhaseDisplay` ne gère pas la phase `reading`**
Le type `PhaseType` dans `GenerationPhaseDisplay` ne contient pas `'reading'`. Cette phase n'a donc aucun affichage dédié (liste de fichiers lus, icône FileSearch).

**Écart 5 — Pas de `thinking_delta` streamé depuis l'orchestrateur**
La fonction `callAgentStreaming` existe déjà dans `ai-orchestrator`. Il suffit d'ajouter un appel rapide (~60 tokens, `gemini-2.5-flash-lite`) AVANT le Planner JSON pour streamer le raisonnement de l'IA en temps réel.

**Écart 6 — `file_read` events non implémentés**
Après réception du plan, l'orchestrateur ne signale pas quels fichiers il va lire. Il faut émettre un `file_read` event pour chaque step avec `action: "modify"`, que le frontend reçoit via un nouveau callback `onFileRead`.

---

## Architecture cible : Flux SSE complet

```text
T=0ms     → User envoie message
T=0ms     → setState: isGenerating=true + typing_indicator {isTyping:true}
T=~50ms   → TypingIndicator visible (3 dots)

T=~200ms  → SSE event: "phase" { phase:"planning", message:"Analyzing..." }
            → RETIRE typing_indicator
            → uiPhase = "thinking" (la vraie phase thinking démarre ICI)
            → Reasoning ouvert avec isStreaming=true

T=~300ms  → SSE event: "thinking_delta" { delta:"The user wants to..." }
T=~400ms  → SSE event: "thinking_delta" { delta:" build a dashboard..." }
T=~600ms  → SSE event: "thinking_delta" { delta:" with charts." }
            → _thinkingLines accumulé token par token
            → Reasoning affiche le VRAI raisonnement de l'IA

T=~1200ms → (thinking streaming terminé, Planner JSON reçu)
T=~1200ms → SSE event: "intent_classified" → console.group debug
T=~1200ms → SSE event: "plan" { plan: { steps: [...] } }
            → uiPhase = "planning"
            → _planItems populé depuis plan.steps

T=~1300ms → (pour chaque step action:"modify")
            SSE event: "file_read" { path: "App.tsx" }
            SSE event: "file_read" { path: "Dashboard.tsx" }
            → uiPhase = "reading"
            → Liste de fichiers lus affichée avec FileSearch icons

T=~2400ms → setTimeout 1200ms → uiPhase = "building"
            → _buildLogs créés

T=~4000ms → SSE event: "file_generated" { path: "App.tsx" }
            → BuildLog marqué done, progress avance

T=~5000ms → SSE event: "result" { conversational: false, files: [...] }
            → applique les fichiers
            → uiPhase = "preview_ready"
            → GeneratingOverlay fade-out 800ms
```

---

## Plan d'implémentation en 6 fichiers

### Fichier 1 : `src/app-builder/types.ts`
**1 changement** : Ajouter `"reading"` dans `GenerationPhase` et `type?: "read" | "build"` dans `BuildLog`.

```typescript
// GenerationPhase — ajouter "reading"
export type GenerationPhase =
  | 'thinking'
  | 'reading'     // ← NOUVEAU
  | 'planning'
  | 'building'
  | 'fixing'
  | 'preview_ready'
  | 'error';

// BuildLog — ajouter type optionnel
export interface BuildLog {
  id: string;
  text: string;
  done: boolean;
  type?: 'read' | 'build';  // ← NOUVEAU
}
```

---

### Fichier 2 : `supabase/functions/ai-orchestrator/index.ts`
**3 changements** dans la pipeline principale :

**2a — Thinking streaming AVANT le Planner JSON**
Juste avant `callAgent(PLANNER_PROMPT, ...)`, ajouter un appel `callAgentStreaming` rapide (~60 tokens, `google/gemini-2.5-flash-lite`) pour émettre les tokens de raisonnement :

```typescript
// AVANT callAgent(PLANNER_PROMPT, ...)
const THINKING_SYSTEM = `You are thinking briefly about what the user wants. 
Output 1-2 short sentences about their goal. Be direct, no formatting.`;
const thinkingInput = `User says: "${userPrompt.slice(0, 300)}"`;

try {
  await callAgentStreaming(
    THINKING_SYSTEM,
    thinkingInput,
    "google/gemini-2.5-flash-lite",
    async (chunk) => {
      await stream.sendEvent({ type: "thinking_delta", delta: chunk });
    },
    60 // max 60 tokens — ultra fast
  );
} catch { /* ignore — non-blocking */ }
```

**2b — File read events APRÈS reception du plan**
Après `sendEvent({ type: "plan", plan })`, pour chaque step `action !== "create"` :

```typescript
// Émettre les "file_read" events pour les fichiers à modifier
for (const step of plan.steps) {
  if (step.action !== "create" && step.path) {
    await stream.sendEvent({ type: "file_read", path: step.path });
  }
}
```

**2c — Thinking pour les réponses conversationnelles**
Avant `conv_start`, émettre 1-2 thinking deltas rapides :

```typescript
// AVANT stream.sendEvent({ type: "conv_start" })
try {
  await callAgentStreaming(
    `Think briefly (1 sentence max) about how to help this user.`,
    `User: "${userPrompt.slice(0, 200)}"`,
    "google/gemini-2.5-flash-lite",
    async (chunk) => {
      await stream.sendEvent({ type: "thinking_delta", delta: chunk });
    },
    30
  );
} catch { /* ignore */ }
```

---

### Fichier 3 : `src/app-builder/hooks/useOrchestrator.ts`
**2 changements** dans l'interface `OrchestratorCallbacks` et le switch SSE :

```typescript
interface OrchestratorCallbacks {
  // ... existing ...
  onThinkingDelta?: (delta: string) => void;  // ← NOUVEAU
  onFileRead?: (path: string) => void;         // ← NOUVEAU
}

// Dans le switch SSE :
case "thinking_delta":
  callbacks.onThinkingDelta?.(event.delta);
  break;

case "file_read":
  callbacks.onFileRead?.(event.path);
  break;
```

---

### Fichier 4 : `src/app-builder/App.tsx`
**4 changements** dans les callbacks de `sendOrchestrator` :

**4a — thinkingTextRef pour accumuler les tokens**
```typescript
const thinkingTextRef = useRef("");
```

**4b — Reset dans `handleSendMessage`**
```typescript
thinkingTextRef.current = "";
```

**4c — Correction du mapping de phase** (écart 3)
```typescript
onPhase: (phase, message) => {
  const phaseMap: Record<string, { uiPhase: AppState['_generationPhase']; progress: number }> = {
    planning:   { uiPhase: "thinking", progress: 10 },   // phase planning du backend = thinking pour l'UI
    generating: { uiPhase: "building", progress: 30 },
    validating: { uiPhase: "building", progress: 85 },
    fixing:     { uiPhase: "fixing",   progress: 88 },   // fixing → phase UI distincte
    complete:   { uiPhase: "preview_ready", progress: 100 },
    error:      { uiPhase: "error",    progress: 0 },
  };
  // ...
}
```

**4d — Nouveaux callbacks `onThinkingDelta` et `onFileRead`**
```typescript
onThinkingDelta: (delta) => {
  thinkingTextRef.current += delta;
  const text = thinkingTextRef.current;
  setState(prev => ({ ...prev, _thinkingLines: [text] }));
},

onFileRead: (path) => {
  setState(prev => ({
    ...prev,
    _generationPhase: "reading",
    _buildLogs: [
      ...(prev._buildLogs || []),
      { id: `read_${path}_${Date.now()}`, text: `Reading ${path}…`, done: true, type: "read" as const },
    ],
  }));
},
```

**4e — Modification du `onPlanReady`** pour passer par `reading` AVANT `building`
Conserver le setTimeout de 1200ms mais changer l'ordre :
```typescript
onPlanReady: (intent, steps) => {
  setState(prev => ({
    ...prev,
    _generationPhase: "planning",  // affiche le plan
    _pipelineProgress: 20,
    _planItems: steps.map(s => ({ label: `${s.target}: ${s.description}`, done: false })),
    _totalExpectedFiles: steps.filter(s => s.action !== "delete").length,
    _filesGeneratedCount: 0,
  }));
  // setTimeout restant pour building — mais reading est géré par onFileRead
  setTimeout(() => {
    setState(prev => {
      // Ne passer à building que si on n'est pas déjà en reading
      if (prev._generationPhase === 'reading') return prev; // onFileRead a déjà mis reading
      return {
        ...prev,
        _generationPhase: "building",
        _pipelineProgress: 30,
        _buildLogs: steps.map((s, i) => ({
          id: `build_${i}`,
          text: `${s.action === "create" ? "Creating" : s.action === "modify" ? "Updating" : "Removing"} ${s.target}…`,
          done: false,
          type: "build" as const,
        })),
      };
    });
  }, 1200);
},
```

**4f — Transition reading → building après un délai**
Dans `onFileRead`, après avoir mis `_generationPhase: "reading"`, déclencher un timeout pour passer à `building` avec les build logs si ce n'est pas déjà fait :
```typescript
onFileRead: (path) => {
  setState(prev => ({
    ...prev,
    _generationPhase: "reading",
    _buildLogs: [
      ...(prev._buildLogs || []).filter(l => l.type === "read"),
      { id: `read_${path}`, text: `Reading ${path}…`, done: true, type: "read" as const },
    ],
  }));
},
```

---

### Fichier 5 : `src/app-builder/components/GenerationPhaseDisplay.tsx`
**4 changements** :

**5a — Ajouter `reading` dans `PhaseType`**
```typescript
export type PhaseType = 'thinking' | 'reading' | 'planning' | 'building' | 'preview_ready' | 'error';
```

**5b — Ajouter `type?: 'read' | 'build'` dans `BuildLog`**
```typescript
export interface BuildLog {
  id: string;
  text: string;
  done: boolean;
  type?: 'read' | 'build';
}
```

**5c — Phase badge pour `reading`**
```tsx
{phase === 'reading' && <FileSearch size={14} className="text-blue-400 animate-pulse" />}
// ...
{phase === 'reading' && 'Reading Files'}
```

**5d — Bloc visuel pour la phase `reading`**
Entre le Reasoning et le ChainOfThought, ajouter :
```tsx
{phase === 'reading' && buildLogs && buildLogs.filter(l => l.type === 'read').length > 0 && (
  <div className="space-y-1.5 animate-in fade-in duration-300">
    {buildLogs.filter(l => l.type === 'read').map(log => (
      <div key={log.id} className="flex items-center gap-2 text-[11px]">
        <FileSearch size={11} className="text-blue-400 shrink-0" />
        <span className="font-mono text-blue-400/80">{log.text}</span>
        <Check size={9} className="text-emerald-400 ml-auto shrink-0" />
      </div>
    ))}
  </div>
)}
```

**5e — Spinner sur ChainOfThoughtStep actif** (Écart 5)
Pour les steps avec status `active`, ajouter un loader CSS au lieu du point statique. Passer `icon={Loader2}` (avec `className="animate-spin"`) quand `status === 'active'`.

Comme `ChainOfThoughtStep` prend un `icon` prop, créer un wrapper :
```tsx
// Dans GenerationPhaseDisplay, construire les cotSteps avec un icône "actif" :
cotSteps.push({
  icon: log.done ? CheckCircle2 : Loader2,  // Loader2 pour l'étape en cours
  label: log.text,
  status: log.done ? 'complete' : 'active',
});
```

**5f — Inclure `reading` dans `showChainOfThought`** :
```typescript
const showChainOfThought = cotSteps.length > 0 && 
  (phase === 'planning' || phase === 'building' || phase === 'reading');
```

**5g — Réel contenu dans le Reasoning** :
```tsx
<ReasoningContent>
  {thinkingLines?.join('') || 'Analyzing your request…'}
</ReasoningContent>
```

---

### Fichier 6 : `src/app-builder/components/Sidebar.tsx`
**1 changement** : Ajuster la condition qui affiche le bloc génération pour inclure la phase `reading`.

Actuellement :
```tsx
const isCodeGenerating = state.isGenerating && !hasConvStream && !hasTyping;
```
Cela est correct. Mais il faut s'assurer que le Shimmer ne s'affiche plus quand on est en `reading` ou `planning` — la `GenerationPhaseDisplay` gère déjà ces phases.

```tsx
// Supprimer le Shimmer conditionnel pour thinking/planning (il fait doublon)
// Avant : affiché quand phase !== 'thinking' && phase !== 'planning'
// Après : affiché uniquement quand il n'y a pas encore de _generationPhase définie
{!state._generationPhase && (
  <div className="space-y-2 mb-3 animate-in fade-in duration-500">
    <Shimmer className="text-[13px] font-medium" duration={1.5}>Analyzing your request…</Shimmer>
    <div className="space-y-1.5 mt-2">
      <div className="h-2 rounded-full bg-muted animate-pulse" style={{ width: '85%' }} />
      <div className="h-2 rounded-full bg-muted animate-pulse" style={{ width: '65%', animationDelay: '0.15s' }} />
    </div>
  </div>
)}
```

---

## Tableau récapitulatif des fichiers modifiés

```text
supabase/functions/ai-orchestrator/index.ts  [BACKEND]
  → Thinking streaming (~60 tokens) AVANT Planner JSON
  → Émettre "thinking_delta" events en temps réel
  → Émettre "file_read" events après réception du plan (pour steps modify)
  → Thinking court AVANT conv_start pour les réponses conversationnelles

src/app-builder/hooks/useOrchestrator.ts
  → Ajouter onThinkingDelta et onFileRead dans OrchestratorCallbacks
  → Handler case "thinking_delta" → callbacks.onThinkingDelta?.(event.delta)
  → Handler case "file_read" → callbacks.onFileRead?.(event.path)

src/app-builder/App.tsx
  → Ajouter thinkingTextRef (useRef)
  → Reset thinkingTextRef dans handleSendMessage
  → Implémenter onThinkingDelta → accumule dans _thinkingLines
  → Implémenter onFileRead → _buildLogs (type:"read") + phase "reading"
  → Corriger mapping phase "fixing" → uiPhase "fixing" (distinct de building)

src/app-builder/types.ts
  → Ajouter "reading" dans GenerationPhase
  → Ajouter type?: 'read' | 'build' dans BuildLog

src/app-builder/components/GenerationPhaseDisplay.tsx
  → Ajouter "reading" dans PhaseType
  → Badge + icône FileSearch pour phase reading
  → Bloc visuel fichiers lus (liste avec FileSearch + Check icons)
  → ReasoningContent affiche le vrai contenu streamé (thinkingLines?.join(''))
  → Spinner (Loader2 animate-spin) sur ChainOfThoughtStep actif
  → showChainOfThought inclut "reading"

src/app-builder/components/Sidebar.tsx
  → Shimmer uniquement quand !_generationPhase (supprime le doublon visuel)
```

---

## Détails techniques critiques

### Pourquoi le thinking streaming est non-bloquant
L'appel `callAgentStreaming` pour le thinking est wrappé dans `try/catch` et limité à 60 tokens maximum (~500ms). S'il échoue, le pipeline continue normalement. Le Planner JSON est appelé **en série après** (pas en parallèle) pour garantir que les thinking lines arrivent en premier dans l'UI.

### Pourquoi reading → building est géré par timeout + state
Le passage `reading → building` se fait en deux temps :
1. `onFileRead` met `_generationPhase: "reading"` immédiatement
2. Le timeout de 1200ms dans `onPlanReady` vérifie si on est en `reading` — si oui, il attend que le building démarre naturellement via `onFileGenerated`

Cela évite une race condition où `planning → building` (via timeout) écraserait `reading` (via `onFileRead`).

### Modèle utilisé pour le thinking
`google/gemini-2.5-flash-lite` — le plus rapide et le moins cher. 60 tokens = ~300ms. Imperceptible pour l'utilisateur mais donne l'illusion d'un raisonnement en temps réel.
