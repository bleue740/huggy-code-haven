

# Multi-fichiers intelligent + UX d'edition type Lovable + Agent conversationnel

## Diagnostic des 4 problemes identifies

### 1. Mono-fichier : tout ecrase dans App.tsx
Actuellement (ligne 424 de App.tsx), le code extrait va toujours dans `files['App.tsx']`. L'IA ne peut ni creer ni modifier d'autres fichiers. Le file tree existe mais n'est pas connecte au flux IA.

### 2. Pas d'indicateurs "Thinking / Editing / Edited"
Le Sidebar affiche juste un shimmer generique avec "Thinking..." ou un status texte. Aucune visibilite sur les fichiers en cours de modification, les etapes, ou un "Edited X files" final comme Lovable.

### 3. Agent mode = toujours du code, jamais de discussion
En mode Agent, l'IA est forcee de generer un bloc ```tsx. Impossible de poser une question ou discuter sans que l'IA essaye de coder. Il manque la detection intelligente : "est-ce que l'utilisateur veut du code ou une reponse ?"

### 4. Code dans le flux de conversation
Le code brut est genere dans le stream SSE, melange avec l'explication. Il est ensuite strip du chat (bien), mais la reponse textuelle est souvent trop courte car l'IA passe 90% de sa reponse a ecrire du code.

---

## Plan d'implementation

### Phase A — Protocole multi-fichiers dans le prompt IA

**Objectif** : L'IA peut creer/modifier/supprimer plusieurs fichiers en une seule reponse.

**Fichier** : `supabase/functions/ai-chat/index.ts`

Modifier le `BASE_SYSTEM_PROMPT` pour instruire l'IA a utiliser un format structure :

```text
## MULTI-FILE OUTPUT FORMAT
When generating code, wrap EACH file in markers:

[FILE:App.tsx]
// code here
[/FILE:App.tsx]

[FILE:Header.tsx]
// code here  
[/FILE:Header.tsx]

[FILE_DELETE:OldComponent.tsx]

You can create new files, modify existing ones, or delete files.
Always include App.tsx as the main entry point.
```

**Fichier** : `src/app-builder/hooks/useAIChat.ts`

Nouvelle fonction `extractMultiFileFromResponse()` qui :
- Parse les marqueurs `[FILE:name]...[/FILE:name]` 
- Parse les marqueurs `[FILE_DELETE:name]`
- Retourne `{ files: Record<string, string>, deletedFiles: string[], explanation: string }`
- Fallback sur l'ancien extracteur si pas de marqueurs (retrocompatibilite)

**Fichier** : `src/app-builder/App.tsx`

Dans `onDone` (Agent mode) :
- Utiliser `extractMultiFileFromResponse` au lieu de `extractCodeFromResponse`
- Merger les fichiers retournes dans `state.files` (pas ecraser, merger)
- Supprimer les fichiers marques `FILE_DELETE`
- Stocker la liste des fichiers modifies pour les indicateurs UI

### Phase B — Indicateurs "Thinking / Editing file / Edited" 

**Objectif** : Reproduire l'experience Lovable avec des etapes visibles pendant la generation.

**Fichier** : `src/app-builder/types.ts`

Ajouter a `AppState` :
```text
generationSteps: GenerationStep[]
```

Nouveau type :
```text
GenerationStep {
  id: string
  type: 'thinking' | 'editing' | 'edited' | 'error'
  label: string        // ex: "Analyzing request..."
  fileName?: string    // ex: "Header.tsx"
  status: 'active' | 'done' | 'error'
  startedAt: number
  completedAt?: number
}
```

**Fichier** : `src/app-builder/components/GenerationSteps.tsx` (NOUVEAU)

Composant qui affiche les etapes en temps reel :
- Icone spinner animee pour l'etape active
- Check vert pour les etapes terminees
- Nom du fichier en cours d'edition
- Timer ecoulé par etape
- Style : cards compactes avec bordure gauche coloree (bleu = thinking, orange = editing, vert = done)

Exemple visuel :
```text
[spinner] Analyzing your request...              2s
[check]   Editing App.tsx                         1s  
[check]   Creating Header.tsx                     1s
[check]   Creating Footer.tsx                     0s
[spinner] Applying changes to preview...          -
```

**Fichier** : `src/app-builder/App.tsx`

Pendant le streaming :
1. Au debut : ajouter step "Thinking" (type='thinking', status='active')
2. Quand on detecte `[FILE:X.tsx]` dans le stream : step "Editing X.tsx" 
3. Quand on detecte `[/FILE:X.tsx]` : marquer le step comme done
4. A la fin : step "Applied N files" (type='edited')

**Fichier** : `src/app-builder/components/Sidebar.tsx`

Remplacer le bloc shimmer generique (lignes 425-471) par le composant `<GenerationSteps>` pendant `state.isGenerating`.

### Phase C — Agent intelligent : code OU discussion

**Objectif** : En mode Agent, l'IA decide si elle doit coder ou simplement repondre.

**Fichier** : `supabase/functions/ai-chat/index.ts`

Ajouter au `BASE_SYSTEM_PROMPT` :

```text
## RESPONSE DECISION
Before responding, decide:
- If the user asks to BUILD, CREATE, MODIFY, ADD, FIX something → generate code with [FILE:...] markers
- If the user asks a QUESTION, wants EXPLANATION, says "hello", etc. → respond in natural language WITHOUT any [FILE:...] markers

You can have a conversation in Agent mode. Not every message needs code.
```

**Fichier** : `src/app-builder/App.tsx`

Dans `onDone` (Agent mode) :
- Si `extractMultiFileFromResponse` ne trouve aucun fichier → traiter comme une reponse textuelle (pas de code applied, pas d'injection preview)
- Cela permet la discussion libre en mode Agent

### Phase D — Separation code/explication dans le stream

**Objectif** : L'explication est riche et le code est invisible dans le chat.

Avec le nouveau format `[FILE:...]`, le code n'est plus dans des blocs ```tsx mais entre des marqueurs. La fonction de nettoyage strip les marqueurs `[FILE:...]...[/FILE:...]` et `[FILE_DELETE:...]` du texte affiche. 

**Fichier** : `src/app-builder/components/ChatMessage.tsx`

Mettre a jour `stripCodeBlocks` pour aussi supprimer les blocs `[FILE:...]...[/FILE:...]` :
```text
stripCodeBlocks(text):
  1. Remove ```lang...``` blocks (existant)
  2. Remove [FILE:name]...[/FILE:name] blocks (nouveau)
  3. Remove [FILE_DELETE:name] lines (nouveau)
```

Le resultat : le chat ne montre QUE l'explication textuelle + l'indicateur "Code applique — N fichiers modifies".

---

## Resume des fichiers

| Fichier | Action | Phase |
|---------|--------|-------|
| `supabase/functions/ai-chat/index.ts` | Modifier | A, C |
| `src/app-builder/hooks/useAIChat.ts` | Modifier | A |
| `src/app-builder/App.tsx` | Modifier | A, B, C |
| `src/app-builder/types.ts` | Modifier | B |
| `src/app-builder/components/GenerationSteps.tsx` | Creer | B |
| `src/app-builder/components/Sidebar.tsx` | Modifier | B |
| `src/app-builder/components/ChatMessage.tsx` | Modifier | D |

## Ordre d'implementation

1. Phase A (multi-fichiers) — fondation critique
2. Phase D (nettoyage chat) — depend de A
3. Phase B (indicateurs UI) — depend de A
4. Phase C (agent conversationnel) — independant, rapide

