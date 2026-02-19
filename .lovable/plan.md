
# Architecture complète : Streaming conversationnel & Preview — Alignement avec Lovable.dev

## Analyse des écarts identifiés

Après exploration exhaustive du code, voici les 5 écarts critiques entre l'architecture actuelle de Blink AI et celle de Lovable.dev :

### Écart 1 — Curseur de frappe absent pendant le streaming
**Actuel** : Les tokens arrivent token-par-token via `conv_delta`, mais s'affichent dans `ChatMessage` → `renderMarkdown()` qui reconstruit tout le DOM à chaque token. Aucun curseur clignotant n'est visible pendant la frappe.
**Lovable** : Un curseur `█` animé apparaît à la fin du texte en cours de streaming, puis disparaît proprement à la fin.

### Écart 2 — Le markdown est rendu sur le texte final seulement
**Actuel** : `ChatMessage` utilise un renderer maison (`renderMarkdown`) qui fonctionne bien sur le texte final, mais pendant le streaming le message `conv_stream_*` est passé brut sans rendu progressif du markdown.
**Lovable** : Le markdown est rendu progressivement — les `**bold**`, `` `code` ``, listes etc. s'appliquent au fur et à mesure.

### Écart 3 — Le `GeneratingOverlay` dans la preview est toujours visible même pour les réponses conversationnelles
**Actuel** : `isBuilding` dans `CodePreview` est calculé via `_generationPhase !== 'preview_ready'`, ce qui fait que l'overlay s'affiche même quand l'agent répond simplement "Bonjour". La preview est masquée inutilement.
**Lovable** : L'overlay ne s'affiche QUE si des fichiers sont réellement en cours de génération (phase `generating` ou `fixing`), pas pour les réponses conversationnelles.

### Écart 4 — Pas de transition fluide preview → app générée
**Actuel** : Quand les fichiers sont prêts, l'iframe se recharge brusquement (le `key` change en `effectiveCode`). Il n'y a pas de transition visuelle.
**Lovable** : Un fade-out de l'overlay puis un fade-in de l'app donnent une impression de fluidité. La preview s'anime vers l'état "ready".

### Écart 5 — La phase de génération dans le chat manque de feedback visuel en temps réel sur ce que l'IA écrit
**Actuel** : Pendant la génération de code, seul le `GenerationPhaseDisplay` (chain-of-thought, build logs) est visible. Le message de l'assistant n'est ajouté qu'après la génération complète.
**Lovable** : Pendant la génération, un indicateur de "thinking" avec des shimmer lines est visible dans le chat, et quand les fichiers arrivent, le message final apparaît avec une animation d'entrée fluide.

---

## Plan d'implémentation

### 1. Curseur de streaming dans `ChatMessage`
Modifier `ChatMessage.tsx` pour détecter si le message est en cours de streaming (via une prop `isStreaming`) et ajouter un curseur clignotant `█` à la fin du texte rendu.

### 2. Rendu markdown progressif pendant le streaming
Remplacer le rendu brut des messages `conv_stream_*` par le même `renderMarkdown()` avec `isStreaming=true`, et ajouter un `StreamingCursor` à la fin.

### 3. Corriger la condition `isBuilding` dans `App.tsx`
`isBuilding` ne doit être `true` QUE si la phase est `building` ou `fixing` — pas `thinking`, `planning`, ou pour une réponse conversationnelle.

**Actuel (erroné)** :
```
isBuilding={!!state._generationPhase && state._generationPhase !== 'preview_ready' && state._generationPhase !== 'error'}
```

**Corrigé** :
```
isBuilding={state._generationPhase === 'building' && !state.history.some(m => m.id.startsWith('conv_stream_'))}
```

### 4. Transition fluide overlay → preview dans `GeneratingOverlay`
Ajouter un état `isCompleting` avec un délai de 800ms entre la fin de génération et le masquage de l'overlay, avec une animation `opacity: 0 + scale(1.02)` en CSS.

### 5. Message de génération avec shimmer dans le chat
Pendant `isGenerating` et quand aucun `conv_stream_*` n'est en cours, afficher un message assistant avec `Shimmer` qui pulse — exactement comme Lovable montre "Generating..." pendant la phase de construction.

### 6. Prop `isStreaming` dans `ChatMessage` + `Sidebar`
Ajouter la prop `isStreaming` à `ChatMessage` pour activer le curseur :
- Dans `Sidebar.tsx`, passer `isStreaming={msg.id.startsWith('conv_stream_') && state.isGenerating}` au `ChatMessage`.

---

## Fichiers à modifier

```text
src/app-builder/components/ChatMessage.tsx
  → Ajouter prop isStreaming
  → Ajouter StreamingCursor composant
  → Activer rendu markdown pendant streaming

src/app-builder/components/Sidebar.tsx
  → Passer isStreaming au ChatMessage
  → Améliorer l'indicateur de génération dans le chat

src/app-builder/App.tsx
  → Corriger la condition isBuilding (ligne ~682)
  → Ajouter suivi isDoing (conversational vs code)

src/app-builder/components/GeneratingOverlay.tsx
  → Ajouter transition de sortie fluide (fade + scale)
  → Délai 800ms avant masquage complet

src/app-builder/components/CodePreview.tsx
  → Utiliser la nouvelle condition isBuilding corrigée
  → Ajouter classe CSS de transition sur le conteneur iframe
```

---

## Détails techniques

### StreamingCursor (nouveau composant inline dans ChatMessage)
```tsx
const StreamingCursor = () => (
  <span
    className="inline-block w-[2px] h-[14px] bg-blue-400 ml-0.5 align-middle animate-pulse"
    style={{ animationDuration: '0.7s' }}
  />
);
```

### Logique isBuilding corrigée
```tsx
// Dans App.tsx → CodePreview props
const isActuallyBuilding = 
  state.isGenerating &&
  (state._generationPhase === 'building' || state._generationPhase === 'fixing') &&
  !state.history.some(m => m.id.startsWith('conv_stream_'));
```

### Transition de sortie de l'overlay (GeneratingOverlay)
```tsx
// Ajouter un état interne isExiting
// Quand isVisible passe à false → déclencher fade-out 600ms avant de vraiment masquer
const [visible, setVisible] = useState(false);
useEffect(() => {
  if (isVisible) { setVisible(true); }
  else {
    // Délai de sortie fluide
    const t = setTimeout(() => setVisible(false), 800);
    return () => clearTimeout(t);
  }
}, [isVisible]);
```

### Signal de streaming dans Sidebar
```tsx
// Identifier si le dernier message est en cours de streaming
const lastMsg = state.history[state.history.length - 1];
const isLastMsgStreaming = lastMsg?.id.startsWith('conv_stream_') && state.isGenerating;

// Dans le rendu du message :
<ChatMessage
  message={msg}
  onApprovePlan={onApprovePlan}
  isStreaming={msg.id.startsWith('conv_stream_') && state.isGenerating}
/>
```
