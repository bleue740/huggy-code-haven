

# Audit complet de Blink AI — Bugs, incohérences et améliorations

## Problèmes critiques découverts

### 1. Le système de crédits est cassé (BUG CRITIQUE)

La table `users_credits` n'a **aucune politique RLS UPDATE**. Or, dans `ai-chat/index.ts` (ligne 444), le code tente de déduire un crédit via :

```text
supabase.from("users_credits").update({ credits: newCredits }).eq("user_id", userId)
```

Mais le client Supabase est initialisé avec le token utilisateur (pas le service role). Sans politique UPDATE, cette requête **échoue silencieusement** : les crédits ne sont jamais déduits. Les utilisateurs ont des crédits infinis.

**Correction** : Ajouter une politique RLS UPDATE sur `users_credits` OU utiliser le `SUPABASE_SERVICE_ROLE_KEY` pour la déduction côté Edge Function.

### 2. Le bouton "Passer Pro" est factice

Dans `App.tsx` ligne 928, le bouton Upgrade fait juste :
```text
setState(prev => ({ ...prev, credits: prev.credits + 50, showUpgradeModal: false }))
```
Aucune intégration Stripe. L'utilisateur reçoit 50 crédits gratuits en cliquant. Les boutons de la page Pricing (`Pricing.tsx`) ne font **rien du tout** (pas d'onClick).

### 3. L'URL de déploiement est incohérente

- Le code de publication génère : `/published/${deployment.id}`
- Mais la route dans `App.tsx` est : `/p/:deploymentId`
- Résultat : les liens de déploiement mènent à une page 404.

### 4. Ce n'est pas un vrai "full-stack app builder"

Les apps générées tournent dans un **iframe sandbox** avec React/Tailwind chargés par CDN. Cela signifie :
- Pas de `npm install` ni de packages tiers
- Pas de React Router dans les apps générées
- Tous les fichiers sont **concaténés en un seul script** — les imports entre fichiers ne fonctionnent pas réellement
- Le "multi-fichiers" est cosmétique : tout finit dans un seul `<script type="text/babel">`
- Pas de vrai backend dans les apps générées (sauf si Supabase externe est connecté)

C'est plus proche d'un CodePen/JSFiddle amélioré que d'un vrai builder comme Lovable.

### 5. `handleNewProject` ne crée pas de nouveau projet en DB

La fonction (ligne 716) réinitialise juste le state local sans créer un nouveau projet dans la base de données. Le projet précédent est écrasé.

---

## Plan de correction (par priorité)

### Phase 1 — Corriger les bugs critiques

**A. Réparer la déduction des crédits**

Fichier : `supabase/functions/ai-chat/index.ts`

Utiliser le `SUPABASE_SERVICE_ROLE_KEY` pour créer un client admin dédié à la déduction des crédits, séparé du client utilisateur utilisé pour l'auth.

Fichier : Migration SQL

Ajouter une politique RLS UPDATE restreinte sur `users_credits` en backup (au cas où on revient au client user plus tard).

**B. Corriger l'URL de déploiement**

Fichier : `src/app-builder/App.tsx`

Changer `const deployUrl = \`/published/\${(deployment as any).id}\`` en `const deployUrl = \`/p/\${(deployment as any).id}\`` pour correspondre à la route définie dans `App.tsx` principal.

**C. Corriger handleNewProject**

Fichier : `src/app-builder/App.tsx`

`handleNewProject` doit réellement créer un nouveau projet en base (comme `handleCreateNewFromDashboard`), pas juste reset le state.

### Phase 2 — Système de crédits réel avec Stripe

**Objectif** : Les boutons Pricing et Upgrade déclenchent un vrai paiement.

- Activer l'intégration Stripe sur le projet
- Créer une Edge Function `create-checkout` qui génère une session Stripe Checkout
- Créer une Edge Function `stripe-webhook` pour écouter les événements `checkout.session.completed` et créditer le compte
- Modifier `Pricing.tsx` pour que les boutons redirigent vers Stripe Checkout
- Modifier le modal Upgrade pour rediriger vers Stripe au lieu d'ajouter des crédits fake

### Phase 3 — Améliorer la qualité du code généré

**A. Meilleure gestion multi-fichiers dans l'iframe**

Fichier : `src/app-builder/components/CodePreview.tsx`

Au lieu de concaténer tous les fichiers dans un seul `<script>`, injecter chaque fichier dans un `<script>` séparé avec un ordre de dépendance (composants d'abord, App.tsx en dernier). Cela permet aux composants de se référencer correctement.

**B. Ajouter un system prompt plus robuste**

Fichier : `supabase/functions/ai-chat/index.ts`

- Instruire l'IA à déclarer les composants comme des fonctions globales (pas d'imports)
- Préciser l'ordre d'exécution : les fichiers hors App.tsx sont chargés en premier
- Ajouter des exemples concrets de multi-fichiers qui fonctionnent

### Phase 4 — Technologies complémentaires

React est le bon choix pour le runtime des apps générées. Cependant, on peut enrichir les librairies CDN disponibles :

**A. Ajouter des librairies globales supplémentaires**

Fichier : `src/app-builder/components/CodePreview.tsx` et `PublishedDeployment.tsx`

Ajouter via CDN :
- `date-fns` (manipulation de dates)
- `framer-motion` (animations avancées)  
- `@tanstack/react-table` (tableaux avancés)
- `react-hook-form` + `zod` (validation de formulaires)

Et mettre à jour le system prompt pour informer l'IA de ces nouvelles librairies.

**B. Support de React Router dans les apps générées**

Fichier : `CodePreview.tsx`

Ajouter React Router DOM via CDN. L'IA pourra alors générer des apps multi-pages avec navigation, ce qui rapproche Blink d'un vrai app builder.

---

## Résumé des fichiers à modifier

| Fichier | Phase | Action |
|---------|-------|--------|
| `supabase/functions/ai-chat/index.ts` | 1A, 3B | Modifier — service role pour crédits, améliorer prompt |
| Migration SQL | 1A | Créer — politique UPDATE sur users_credits |
| `src/app-builder/App.tsx` | 1B, 1C | Modifier — URL deploy, handleNewProject |
| `src/pages/Pricing.tsx` | 2 | Modifier — intégration Stripe |
| `supabase/functions/create-checkout/index.ts` | 2 | Créer — session Stripe |
| `supabase/functions/stripe-webhook/index.ts` | 2 | Créer — webhook Stripe |
| `src/app-builder/components/CodePreview.tsx` | 3A, 4A, 4B | Modifier — multi-script, CDN libs |
| `src/pages/PublishedDeployment.tsx` | 4A | Modifier — mêmes CDN libs |

## Ordre d'implémentation

1. Phase 1 (bugs critiques) — les crédits ne sont pas déduits, les déploiements 404, newProject casse les données
2. Phase 2 (Stripe) — monétisation réelle
3. Phase 3 (qualité code) — meilleur multi-fichiers
4. Phase 4 (technologies) — enrichir l'écosystème des apps générées

