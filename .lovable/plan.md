
# Améliorations AI App Builder — IMPLÉMENTÉ ✅

Toutes les 5 phases ont été implémentées.

## Phase 1 ✅ — Feedback loop erreurs iframe
- `CodePreview.tsx`: postMessage `runtime_error` + `unhandledrejection` vers le parent
- `App.tsx`: écoute les erreurs, auto-renvoie à l'IA pour correction (max 3 tentatives)

## Phase 2 ✅ — Mode Plan actionnable
- `PlanMessage.tsx`: composant dédié avec bordure violette + bouton "Approuver et implémenter"
- `ChatMessage.tsx`: détection des marqueurs `[PLAN_START]...[PLAN_END]`
- `ai-chat/index.ts`: PLAN_SYSTEM_PROMPT mis à jour avec les marqueurs
- `App.tsx`: `handleApprovePlan` switch en Agent et envoie le plan

## Phase 3 ✅ — Persistance des conversations
- Table `chat_messages` créée avec RLS
- `App.tsx`: charge les messages au démarrage, persiste chaque nouveau message

## Phase 4 ✅ — Contexte étendu
- Envoi des 20 derniers messages (au lieu de 10)
- Contexte code augmenté à 24000 chars (au lieu de 12000)

## Phase 5 ✅ — Suggestions dynamiques
- `generate-suggestions/index.ts`: accepte le code en contexte
- `App.tsx`: appelle la fonction avec le code actuel après chaque génération
