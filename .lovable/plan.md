
# Architecture Lovable Complète : Typing Indicator, Intent Detection & Dashboard Persistence

## Résumé des 3 problèmes à résoudre

### Problème 1 — Aucun indicateur "typing..." avant le 1er token
Quand l'utilisateur envoie un message, il y a un blanc de 2-4 secondes pendant que l'orchestrateur charge (auth check + appel Planner). Pendant ce temps, aucun feedback visuel n'est donné dans le chat. Solution : ajouter un message `typing_indicator` dans `App.tsx` dès que `setState({ isGenerating: true })` est appelé, et le supprimer quand le premier vrai event SSE arrive (`conv_start` ou `phase`).

### Problème 2 — Détection d'intention par mots-clés vs sémantique
L'orchestrateur utilise actuellement une `detectComplexity()` basée sur des mots-clés bruts (`"dashboard"`, `"auth"`, etc.). C'est fragile. La vraie solution est de laisser le **Planner Agent** (déjà en place) décider via son flag `conversational: boolean` — ce qu'il fait déjà. Le problème réel est que le **log du intent decision n'est pas tracé** pour le debug. Solution : améliorer le Planner prompt pour être encore plus précis sur la détection conversationnelle, ajouter un event SSE `intent_classified` avec la décision et sa raison, et tracer cela dans la console.

### Problème 3 — Dashboard sans persistance correcte & liste projets récents
Le Dashboard existe (`src/pages/Dashboard.tsx`) mais charge déjà les projets depuis la DB. L'auto-save dans `useProject.ts` existe (debounce 900ms). Le **vrai problème** est que :
1. Le dashboard n'affiche pas de section "Récents" (les projets les plus récemment modifiés en premier, déjà supportés par le tri `updated_at`)
2. Le dashboard ne navigue pas vers l'app-builder avec le bon `projectId` chargé — il manque une intégration `handleOpenProject` dans le flux de navigation `Dashboard → AppBuilder`
3. Il n'y a pas de lien **Dashboard → AppBuilder avec un projet spécifique ouvert**, le dashboard navigue vers `/` sans passer l'ID

### Problème 4 (Bonus) — Nettoyage des doublons architecturaux
- `GenerationPhaseDisplay` et `Shimmer` sont bien utilisés
- `BuildProgress` est dupliqué avec `GenerationPhaseDisplay` pour les logs → consolider
- Le `Sidebar.tsx` a 2 blocs de rendering pendant la génération (Shimmer + GenerationPhaseDisplay + BuildProgress) → simplifier en un seul `<GenerationFeedback>` clair

---

## Architecture Lovable Complète Cible

```text
USER SENDS MESSAGE
      │
      ▼
[App.tsx: handleSendMessage]
      │ setState → isGenerating: true
      │ + ajoute {id: 'typing_...', role: 'assistant', isTyping: true} dans history
      ▼
[SSE Stream démarre → useOrchestrator]
      │
      ├── event "phase" (planning) → retire typing_indicator → montre Reasoning
      │
      ├── event "intent_classified" → console.log intent decision
      │
      ├── event "conv_start" → ajoute conv_stream_ message (streaming)
      │     └── event "conv_delta" → tokens progressifs avec cursor
      │
      ├── event "plan" → montre ChainOfThought steps
      │
      ├── event "file_generated" → update build logs
      │
      └── event "result"
            ├── conversational=true → finalise conv_stream_ → persistMessage
            └── conversational=false → apply files → Checkpoint → toast
```

---

## Plan d'implémentation en 5 parties

### Partie 1 — Typing Indicator (WhatsApp/Slack style)

**Fichier : `src/app-builder/types.ts`**
Ajouter `isTyping?: boolean` à l'interface `Message`.

**Fichier : `src/app-builder/components/ChatMessage.tsx`**
Créer un composant `TypingIndicator` avec 3 points animés (bulles pulsantes) identique à WhatsApp :
```tsx
const TypingIndicator = () => (
  <div className="flex gap-1 items-center py-1">
    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{animationDelay: '0ms'}} />
    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{animationDelay: '150ms'}} />
    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{animationDelay: '300ms'}} />
  </div>
);
```
Intégrer dans `ChatMessage` : si `message.isTyping === true`, afficher uniquement le `TypingIndicator`.

**Fichier : `src/app-builder/App.tsx`**
Dans `handleSendMessage`, juste après `setState({ ...prev, isGenerating: true, history: [...prev.history, userMessage] })`, ajouter immédiatement un message typing dans le même setState :
```tsx
history: [
  ...prev.history, 
  userMessage, 
  { id: `typing_${now}`, role: 'assistant', content: '', timestamp: now, isTyping: true }
]
```

Dans `onPhase` callback (premier event SSE reçu), supprimer le message typing :
```tsx
// Dans onPhase:
history: prev.history.filter(m => !m.id.startsWith('typing_'))
```

Dans `onConversationalDelta` (conv_start signal, delta === ""), supprimer aussi le typing indicator avant d'ajouter conv_stream_.

Dans `onFilesGenerated` et `onConversationalReply`, s'assurer que le typing est bien retiré.

---

### Partie 2 — Intent Detection améliorée + Logs debug

**Fichier : `supabase/functions/ai-orchestrator/index.ts`**

**Amélioration du PLANNER_PROMPT** : renforcer la classification conversationnelle avec des exemples plus précis (salutations, questions de clarification, questions sur le code, discussions générales, questions sur l'architecture) et s'assurer qu'il ne génère pas de code pour les messages non-techniques.

**Nouvel event SSE `intent_classified`** émis juste après la réception du résultat du planner :
```typescript
await stream.sendEvent({
  type: "intent_classified",
  intent: plan.intent,
  conversational: plan.conversational,
  risk_level: plan.risk_level,
  steps_count: plan.steps?.length ?? 0,
  reasoning: plan.conversational 
    ? "Classified as conversational — no code changes needed"
    : `Code generation required: ${plan.steps?.length} step(s)`,
});
```

**Améliorer `detectComplexity()`** : En plus des mots-clés, tenir compte du nombre de steps du plan (déjà partiellement fait) et de la longueur de la réponse conversationnelle.

**Fichier : `src/app-builder/hooks/useOrchestrator.ts`**

Gérer le nouvel event `intent_classified` dans le switch SSE :
```typescript
case "intent_classified":
  console.group("🧠 Intent Classification");
  console.log("Intent:", event.intent);
  console.log("Conversational:", event.conversational);
  console.log("Risk:", event.risk_level);
  console.log("Steps:", event.steps_count);
  console.log("Reasoning:", event.reasoning);
  console.groupEnd();
  callbacks.onPhase?.("intent_classified", event.reasoning || "");
  break;
```

---

### Partie 3 — Dashboard : Projets récents + Navigation correcte

**Fichier : `src/pages/Dashboard.tsx`**

**Correction du tri "Récents"** : les projets sont déjà triés par `updated_at` DESC. Ajouter une section "Récents" visuellement distincte pour les 3 projets les plus récemment modifiés (dans les 7 derniers jours), avec un badge `"Recent"`.

**Correction de la navigation `handleOpenProject`** : 
Actuellement le dashboard fait `navigate('/')` sans passer l'ID. Il faut utiliser `sessionStorage` pour passer le `projectId` cible, que `useProject.ts` lira au démarrage pour charger le bon projet.

Dans `Dashboard.tsx` :
```typescript
const handleOpenProject = (projectId: string) => {
  sessionStorage.setItem('blink_open_project_id', projectId);
  navigate('/');
};
```

Dans `useProject.ts`, après l'auth check, lire `blink_open_project_id` en priorité sur le projet le plus récent :
```typescript
const targetProjectId = sessionStorage.getItem('blink_open_project_id');
sessionStorage.removeItem('blink_open_project_id');

// Si targetProjectId existe, charger ce projet spécifique
// Sinon, charger le projet le plus récent (comportement actuel)
```

**Ajouter section "Projets récents"** dans le header du dashboard avec les 3 projets les plus récents affichés comme chips cliquables.

---

### Partie 4 — Nettoyage des doublons Sidebar (Génération UI)

**Fichier : `src/app-builder/components/Sidebar.tsx`**

Le bloc de génération actuel contient 3 composants empilés :
1. `Shimmer` (shimmer lines)
2. `BuildProgress` (SSE Railway logs)
3. `GenerationPhaseDisplay` (chain-of-thought + plan items)

Ces 3 composants se chevauchent visuellement et certains ont du contenu redondant. Le plan est :

- **Garder `GenerationPhaseDisplay`** comme composant principal (il contient Reasoning + ChainOfThought + StackTrace)
- **Garder `BuildProgress`** conditionnel uniquement si `buildLogs.length > 0` (Railway SSE actif)
- **Remplacer le bloc Shimmer manuel** par un affichage propre :
  - Si `isTypingIndicator` → afficher le `TypingIndicator` du `ChatMessage`
  - Si `hasConvStream` → afficher le `ChatMessage` avec `isStreaming=true`
  - Si `isCodeGenerating` → afficher `GenerationPhaseDisplay` + `BuildProgress`

Logique condensée dans Sidebar (pseudo-code) :
```tsx
{state.isGenerating && (() => {
  const hasConvStream = state.history.some(m => m.id.startsWith('conv_stream_'));
  const hasTyping = state.history.some(m => m.id.startsWith('typing_'));
  
  // Si typing ou conv en cours → messages gèrent l'affichage, pas de bloc séparé
  if (hasConvStream || hasTyping) return null;
  
  // Code generation en cours → bloc de feedback
  return (
    <Message from="assistant">
      <GenerationPhaseDisplay ... />
      {buildLogs.length > 0 && <BuildProgress ... />}
    </Message>
  );
})()}
```

---

### Partie 5 — Consolidation des types TypeScript

**Fichier : `src/app-builder/types.ts`**
- Ajouter `isTyping?: boolean` à `Message`
- S'assurer que `"fixing"` est dans `GenerationPhase` (déjà fait dans un message précédent)
- Ajouter `intentClassified?: { intent: string; conversational: boolean }` à `AppState` pour debug

---

## Fichiers à modifier

```text
src/app-builder/types.ts
  → Ajouter isTyping?: boolean à Message
  → Ajouter intentClassified? à AppState (debug)

src/app-builder/App.tsx
  → handleSendMessage: ajouter typing_indicator dans history
  → onPhase: retirer typing_indicator au premier event SSE
  → onConversationalDelta (conv_start): retirer typing_indicator
  → onFilesGenerated: assurer cleanup du typing

src/app-builder/components/ChatMessage.tsx
  → Ajouter TypingIndicator (3 dots bounce)
  → Si message.isTyping → render uniquement TypingIndicator

src/app-builder/hooks/useOrchestrator.ts
  → Gérer event "intent_classified" → console.group debug

supabase/functions/ai-orchestrator/index.ts
  → Émettre event "intent_classified" après le Planner
  → Améliorer PLANNER_PROMPT pour détection conversationnelle plus précise
  → Ajouter exemples de phrases conversationnelles

src/app-builder/components/Sidebar.tsx
  → Simplifier le bloc génération (supprimer Shimmer manuel redondant)
  → Ne pas afficher le bloc génération si typing_indicator ou conv_stream_ est déjà dans history

src/pages/Dashboard.tsx
  → handleOpenProject: sessionStorage.setItem('blink_open_project_id', id) + navigate('/')
  → Section "Récents" : afficher badge sur les 3 projets modifiés récemment

src/app-builder/hooks/useProject.ts
  → Au démarrage auth check: lire 'blink_open_project_id' depuis sessionStorage
  → Si présent: charger ce projet spécifique au lieu du plus récent
```

---

## Détails Techniques Critiques

### Typing Indicator — Timing précis
```
T=0ms   : utilisateur clique Envoyer
T=0ms   : setState({ isGenerating: true, history: [..., userMsg, typingMsg] })
T=0ms   : fetch SSE vers orchestrateur démarre
T=~50ms : TypingIndicator visible dans le chat
T=~2000ms: Premier event SSE "phase" → retire typingMsg, affiche GenerationPhaseDisplay
T=~2500ms: Si conversationnel: "conv_start" → ajoute conv_stream_ msg avec StreamingCursor
T=~2500ms+: conv_delta tokens → texte progressif avec StreamingCursor à la fin
```

### Intent Classification — Event SSE
```typescript
// Ordre des events SSE:
1. "phase" { phase: "planning", message: "Analyzing..." }
2. "intent_classified" { intent, conversational, risk_level, steps_count, reasoning }
3. "plan" { plan: { intent, steps, ... } }
4. (si conversational) "conv_start" → "conv_delta"*N → "result"
4. (si code) "phase" generating → "file_generated"*N → "validation" → "result"
```

### Dashboard Navigation — sessionStorage flow
```
Dashboard        →  sessionStorage.set('blink_open_project_id', id)  →  navigate('/')
useProject init  →  sessionStorage.get('blink_open_project_id')       →  charger projet spécifique
                 →  sessionStorage.remove('blink_open_project_id')    →  (cleanup)
```

Ce mécanisme est identique à `blink_pending_prompt` déjà en place — cohérent avec l'architecture existante.
