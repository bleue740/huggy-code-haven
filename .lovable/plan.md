
# Restructuration complete du systeme AI Chat

## Objectif
Connecter les Checkpoints aux snapshots persistants, ajouter la Confirmation pour les actions destructives, et integrer les nouveaux composants AI (Reasoning, Shimmer, Plan, Queue, StackTrace, MessageActions) de maniere coherente en eliminant les doublons.

## Analyse des doublons identifies

| Composant existant | Doublon/Remplacement |
|---|---|
| `GenerationPhaseDisplay` (thinking rotatif, ProgressBar, TypingDots) | Remplace par `Reasoning` + `Shimmer` pour le texte animé |
| `PlanMessage` (markdown renderer custom) | Remplace par nouveau composant `Plan` (Card-based, streaming-aware) |
| `Sidebar > ShimmerLine` (ligne 78) | Remplace par `Shimmer` |
| `Sidebar > TypingDots` (ligne 70) | Deja duplique dans GenerationPhaseDisplay, supprime |
| `ChatMessage > renderMarkdown` | Conserve (inline rendering specifique au chat) |
| `conversation.tsx` (scroll custom) | Conserve tel quel (pas de dependance `use-stick-to-bottom`) |

## Plan d'implementation

### 1. Nouveaux composants AI Elements

Creer les fichiers suivants dans `src/components/ai-elements/` :

- **`shimmer.tsx`** - Animation de texte shimmer (utilise `framer-motion` deja installe). Remplace `ShimmerLine` dans Sidebar.
- **`reasoning.tsx`** - Affichage du raisonnement avec timer auto, collapsible, auto-close. Utilise `Collapsible` + `Shimmer`.
- **`plan.tsx`** - Composant Plan structure (Card + streaming). Remplace `PlanMessage`.
- **`stack-trace.tsx`** - Affichage des erreurs runtime parsees. Integre dans le flux d'erreur.

Les composants `Context`, `ModelSelector`, `Queue` fournis par l'utilisateur ne seront **pas** integres car :
- `Context` (token usage) depend de `tokenlens` et `ai` SDK non installe
- `ModelSelector` est un composant de selection de modele non utilise dans le flux actuel
- `Queue` est un pattern de file d'attente de messages non requis

### 2. Checkpoints connectes aux snapshots persistants

**Actuellement** : le Checkpoint dans Sidebar.tsx restaure simplement `state.files` (fichiers actuels, pas le snapshot du moment).

**Correction** :
- Modifier `App.tsx` : lors de chaque `codeApplied`, sauvegarder automatiquement un snapshot dans `project_snapshots` et stocker le `snapshot_id` dans le message.
- Ajouter `snapshotId?: string` au type `Message` dans `types.ts`.
- Modifier le Checkpoint dans `Sidebar.tsx` : au clic, charger le snapshot depuis la base de donnees via son ID et restaurer les fichiers.
- Ajouter la persistence du snapshot ID dans `chat_messages` (nouvelle colonne `snapshot_id`).

**Migration SQL** :
```sql
ALTER TABLE chat_messages ADD COLUMN snapshot_id uuid REFERENCES project_snapshots(id);
```

### 3. Confirmation pour actions destructives

Integrer le composant `Confirmation` dans le flux de suppression de fichiers :

- Modifier `Sidebar.tsx > handleDeleteFile` : au lieu de supprimer directement, afficher une Confirmation inline.
- Ajouter un state `pendingDeleteFile` pour tracker le fichier en attente de confirmation.
- Afficher la Confirmation dans la zone du FileTree avec les boutons Approuver/Rejeter.

### 4. Refactorisation de GenerationPhaseDisplay

- Remplacer le bloc "Thinking" rotatif par le composant `Reasoning` (avec timer auto et auto-close).
- Remplacer `ShimmerLine` / `TypingDots` par `Shimmer`.
- Conserver `ChainOfThought` pour les etapes detaillees (Planning/Building).

### 5. Remplacement de PlanMessage par Plan

- Remplacer `PlanMessage.tsx` par une integration du nouveau composant `Plan`.
- Le nouveau Plan utilise `Card` + `Collapsible` pour un rendu plus propre.
- Conserver le bouton "Approuver et implementer" dans le `PlanFooter`.

### 6. Integration StackTrace dans les erreurs

- Ajouter `StackTrace` dans `GenerationPhaseDisplay` pour la phase `error`.
- Parser automatiquement les messages d'erreur qui contiennent des stack traces.

## Details techniques

### Fichiers crees
- `src/components/ai-elements/shimmer.tsx`
- `src/components/ai-elements/reasoning.tsx`
- `src/components/ai-elements/plan.tsx`
- `src/components/ai-elements/stack-trace.tsx`

### Fichiers modifies
- `src/app-builder/types.ts` - Ajout `snapshotId` au type Message
- `src/app-builder/App.tsx` - Sauvegarde snapshot auto + chargement depuis DB
- `src/app-builder/components/Sidebar.tsx` - Checkpoint persistant + Confirmation delete + suppression doublons
- `src/app-builder/components/GenerationPhaseDisplay.tsx` - Integration Reasoning + Shimmer + StackTrace
- `src/app-builder/components/PlanMessage.tsx` - Remplacement par composant Plan
- `src/app-builder/components/ChatMessage.tsx` - Adaptation pour nouveau PlanMessage

### Migration SQL
- Ajout colonne `snapshot_id` sur `chat_messages`

### Pas de nouvelle dependance
- `framer-motion` deja installe (pour Shimmer)
- `@radix-ui/react-use-controllable-state` deja installe (pour Reasoning)
- `@radix-ui/react-collapsible` deja installe
