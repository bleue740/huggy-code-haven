

# Améliorations pour un vrai AI App Builder

## Diagnostic actuel

Le flux de chat fonctionne mais reste basique comparé a un vrai AI app builder. Les principales lacunes :

- Le code est toujours ecrase en bloc dans `App.tsx` au lieu d'etre modifie chirurgicalement
- L'IA perd le contexte apres 10 messages
- Le mode Plan ne propose pas d'action "Approuver et implementer"
- Les erreurs de preview ne remontent pas a l'IA
- Les conversations ne sont pas persistees
- Les suggestions sont statiques

## Plan d'amelioration (par priorite)

### Phase 1 — Feedback loop (critique)

**Objectif** : L'IA doit savoir si son code a fonctionne ou plante.

Fichiers concernes :
- `src/app-builder/components/CodePreview.tsx` : capturer les erreurs de l'iframe via `window.onerror` et `postMessage`
- `src/app-builder/App.tsx` : recevoir les erreurs et les renvoyer automatiquement a l'IA pour auto-correction

Comportement :
1. L'iframe envoie un `postMessage({ type: 'runtime_error', error: '...' })` quand le code plante
2. App.tsx capture ce message et ajoute automatiquement un message systeme dans le chat
3. L'IA recoit l'erreur comme contexte et genere un correctif
4. Boucle jusqu'a ce que ca fonctionne (max 3 tentatives)

### Phase 2 — Mode Plan actionnable

**Objectif** : Quand le mode Plan genere un plan structure, l'utilisateur peut l'approuver pour lancer l'implementation.

Fichiers concernes :
- `src/app-builder/components/ChatMessage.tsx` : detecter les blocs `[PLAN_START]...[PLAN_END]` dans les reponses plan
- Nouveau : `src/app-builder/components/PlanMessage.tsx` : composant dedie avec bouton "Approuver le plan"
- `src/app-builder/App.tsx` : handler `handleApprovePlan` qui switch en mode Agent et envoie le plan comme contexte
- `supabase/functions/ai-chat/index.ts` : le PLAN_SYSTEM_PROMPT doit instruire l'IA d'utiliser les marqueurs `[PLAN_START]...[PLAN_END]`

Comportement :
1. En mode Plan, l'IA genere un plan structure avec les marqueurs
2. Le composant PlanMessage le rend en carte avec bordure violette
3. Bouton "Approuver et implementer" en bas
4. Au clic : switch en Agent, le plan est envoye comme premier message systeme
5. L'IA en Agent implemente exactement le plan

### Phase 3 — Persistance des conversations

**Objectif** : Ne pas perdre l'historique au rechargement.

Approche :
- Table `chat_messages` dans la base (via migration)

```text
chat_messages
├── id (uuid, PK)
├── project_id (uuid, FK -> projects)
├── user_id (uuid)
├── role (text: 'user' | 'assistant')
├── content (text)
├── code_applied (boolean)
├── code_line_count (integer)
├── chat_mode (text: 'plan' | 'agent')
├── created_at (timestamptz)
```

- RLS : users ne voient que leurs propres messages
- `src/app-builder/App.tsx` : charger les messages au demarrage, sauvegarder a chaque nouveau message

### Phase 4 — Contexte etendu

**Objectif** : L'IA garde le contexte du projet complet.

Fichiers concernes :
- `src/app-builder/App.tsx` : au lieu de `slice(-10)`, envoyer tous les messages (avec un max token budget)
- `supabase/functions/ai-chat/index.ts` : augmenter `max_tokens` et ajouter un mecanisme de resume des anciens messages quand le contexte depasse la limite

Approche :
1. Envoyer les 20 derniers messages complets
2. Pour les messages plus anciens, envoyer un resume genere automatiquement
3. Toujours inclure le code complet actuel comme contexte

### Phase 5 — Suggestions dynamiques

**Objectif** : Les suggestions sont generees par l'IA en fonction du code actuel.

Fichiers concernes :
- `supabase/functions/generate-suggestions/index.ts` : existe deja, a connecter avec le vrai code projet
- `src/app-builder/App.tsx` : appeler cette function apres chaque generation avec le code actuel

## Resume des fichiers

| Fichier | Phase | Action |
|---------|-------|--------|
| `src/app-builder/components/CodePreview.tsx` | 1 | Modifier — capturer erreurs iframe |
| `src/app-builder/App.tsx` | 1-5 | Modifier — feedback loop, plan approval, persistance, contexte |
| `src/app-builder/components/PlanMessage.tsx` | 2 | Creer — composant plan avec approve |
| `src/app-builder/components/ChatMessage.tsx` | 2 | Modifier — detecter plan markers |
| `supabase/functions/ai-chat/index.ts` | 2,4 | Modifier — plan markers, contexte etendu |
| Migration SQL | 3 | Creer — table chat_messages + RLS |
| `src/app-builder/components/Sidebar.tsx` | 2 | Modifier — utiliser PlanMessage |
| `supabase/functions/generate-suggestions/index.ts` | 5 | Modifier — suggestions basees sur le code |

## Ordre d'implementation

1. Phase 1 (feedback loop) — impact immediat sur la qualite du code genere
2. Phase 2 (plan actionnable) — complete le flux Plan/Agent
3. Phase 3 (persistance) — experience utilisateur durable
4. Phase 4 (contexte etendu) — meilleure comprehension de l'IA
5. Phase 5 (suggestions) — polish final

