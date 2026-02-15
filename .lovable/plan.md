

# Credits page + deduction par complexite (clone Lovable.dev)

## Deux changements

### 1. Deduction variable dans l'edge function `ai-chat`

Actuellement, chaque message coute exactement 1 credit (ligne 481). On va remplacer ca par un cout variable base sur la complexite detectee :

| Complexite | Cout en credits | Exemples |
|------------|----------------|----------|
| simple     | 0.50           | Changer une couleur, modifier un texte |
| fix        | 0.90           | Corriger un bug, refactorer |
| complex    | 1.20           | Ajouter authentification, backend |
| data       | 2.00           | Scraping, landing page complete |

La fonction `detectComplexity()` existe deja dans l'edge function. On ajoute une fonction `creditCostForComplexity()` qui mappe chaque niveau a son cout, puis on utilise ce cout au lieu du `- 1` fixe.

Le cout utilise sera aussi envoye au client via un event SSE `credit_cost` en debut de stream pour que le frontend puisse afficher combien de credits ont ete deduits.

### 2. Nouvelle page `/credits`

Une page informative dark theme qui explique le systeme de credits :

**Sections :**
- Introduction : les messages deduisent des credits, le cout depend de la complexite
- Barre de credits visuelle : segment gris (utilises) + segment bleu (restants) avec tooltips
- Tableau d'exemples de couts (identique a Lovable.dev) :
  - "Make the button grey" -> 0.50
  - "Remove the footer" -> 0.90
  - "Add authentication" -> 1.20
  - "Create a landing page with images" -> 2.00
- Sources de credits : forfait mensuel, allocations quotidiennes, recharges top-up
- Lien vers /pricing

### 3. Mise a jour du frontend

- `useCredits.ts` : pas de changement structurel, le hook reste read-only
- `useAIChat.ts` : parser l'event `credit_cost` du stream SSE et afficher via toast le cout du message
- Route `/credits` ajoutee dans `App.tsx`

## Fichiers modifies

- `supabase/functions/ai-chat/index.ts` : remplacer `currentCredits - 1` par `currentCredits - cost` avec cost variable, ajouter event SSE `credit_cost`
- `src/pages/Credits.tsx` : nouvelle page (creation)
- `src/App.tsx` : ajouter route `/credits`
- `src/pages/Pricing.tsx` : ajouter lien "How credits work" vers `/credits`

## Details techniques

**Mapping complexite -> cout (edge function) :**

```text
function creditCostForComplexity(c: Complexity): number {
  switch (c) {
    case "simple": return 0.50;
    case "fix":    return 0.90;
    case "complex": return 1.20;
    case "data":   return 2.00;
  }
}
```

**Event SSE envoye au client :**

```text
data: {"type":"credit_cost","cost":0.5,"remaining":84.5}
```

**Verification pre-deduction :**
Au lieu de `currentCredits < 1`, on verifie `currentCredits < cost` pour bloquer si le solde est insuffisant.

**Colonne credits :**
La colonne `credits` dans `users_credits` devra supporter les decimales. Si elle est de type `integer`, une migration la changera en `numeric(10,2)`.
