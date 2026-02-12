

# Correction complete de Blink AI — Bugs, credits, Stripe et coherence

## Problemes identifies

### 1. Boutons Pricing inactifs (CRITIQUE)
Les boutons "Passer Pro", "Choisir Business", "Nous contacter" dans `Pricing.tsx` n'ont aucun `onClick`. L'utilisateur clique et rien ne se passe. Aucune integration Stripe n'existe.

### 2. Page Settings : plan hardcode "Free"
La page Settings affiche toujours "Free" sans verifier le plan reel de l'utilisateur. Il n'y a pas de table `subscriptions` en base.

### 3. PublishedDeployment : pas de multi-script
`PublishedDeployment.tsx` concatene encore tous les fichiers dans un seul `<script>`, contrairement a `CodePreview.tsx` qui utilise deja `buildMultiScriptTags`. Les apps publiees cassent si elles utilisent le multi-fichiers.

### 4. Credits : fonctionnels mais pas de moyen d'en acheter
La deduction fonctionne (service role key), mais quand les credits tombent a 0, l'utilisateur n'a aucun moyen d'en acheter. Le modal upgrade redirige vers `/pricing` qui ne fait rien.

### 5. Landing page : stats fictives
"12,000+ Apps built", "50+ Templates", "99.9% Uptime" sont hardcodes et faux.

### 6. Pas de table subscriptions
Il n'existe aucune table pour tracker les abonnements Stripe. La page Settings ne peut pas afficher le vrai plan.

---

## Plan de correction

### Etape 1 — Creer la table `subscriptions` + Stripe Edge Functions

**Migration SQL** : Creer une table `subscriptions` avec colonnes :
- `id`, `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `plan` (enum: free/pro/business), `status` (active/canceled/past_due), `current_period_end`, `created_at`, `updated_at`
- RLS : utilisateurs ne voient que leur propre abonnement
- Politique SELECT et UPDATE pour authenticated

**Edge Function `create-checkout`** :
- Recoit `planId` (pro/business) et `userId`
- Cree un customer Stripe si inexistant
- Cree une session Stripe Checkout avec les prix correspondants
- Retourne l'URL de redirection

**Edge Function `stripe-webhook`** :
- Ecoute `checkout.session.completed` et `customer.subscription.updated/deleted`
- Met a jour la table `subscriptions`
- Ajoute les credits correspondants dans `users_credits` (2000 pour Pro, 10000 pour Business)

### Etape 2 — Connecter Pricing.tsx a Stripe

Modifier `Pricing.tsx` :
- Ajouter un `onClick` sur chaque bouton de plan payant
- Appeler `create-checkout` avec le plan selectionne
- Rediriger vers Stripe Checkout
- Bouton "Enterprise" ouvre un mailto ou formulaire de contact

### Etape 3 — Corriger Settings.tsx

Modifier `Settings.tsx` :
- Fetch la subscription reelle depuis la table `subscriptions`
- Afficher le vrai plan (Free/Pro/Business) avec sa date de renouvellement
- Ajouter un bouton "Manage Subscription" qui redirige vers le portail Stripe (via une edge function `create-portal`)

### Etape 4 — Corriger PublishedDeployment.tsx

Modifier `PublishedDeployment.tsx` :
- Utiliser `buildMultiScriptTags` (comme dans `CodePreview.tsx`) au lieu de concatener dans un seul `<script>`
- S'assurer que les apps deployees en multi-fichiers fonctionnent correctement

### Etape 5 — Corriger les stats de la landing page

Modifier `LandingPage.tsx` :
- Remplacer les stats hardcodees par des compteurs reels via des requetes Supabase (nombre de projets, nombre de deployments)
- Ou les retirer si les chiffres sont trop bas

### Etape 6 — Corriger le modal Upgrade dans App.tsx

Le modal upgrade redirige deja vers `/pricing`, mais il faut s'assurer que quand l'utilisateur revient apres paiement, ses credits et son plan sont actualises automatiquement (via `refetchCredits` et un nouveau hook `useSubscription`).

---

## Fichiers a modifier/creer

| Fichier | Action |
|---------|--------|
| Migration SQL (subscriptions) | Creer |
| `supabase/functions/create-checkout/index.ts` | Creer |
| `supabase/functions/stripe-webhook/index.ts` | Creer |
| `supabase/functions/create-portal/index.ts` | Creer |
| `src/pages/Pricing.tsx` | Modifier |
| `src/pages/Settings.tsx` | Modifier |
| `src/pages/PublishedDeployment.tsx` | Modifier |
| `src/app-builder/components/LandingPage.tsx` | Modifier |
| `src/app-builder/App.tsx` | Modifier (modal upgrade) |

## Pre-requis

L'integration Stripe doit etre activee sur le projet (cle secrete Stripe necessaire).

## Ordre d'implementation

1. Activer Stripe sur le projet
2. Migration SQL (table subscriptions)
3. Edge Functions Stripe (create-checkout, stripe-webhook, create-portal)
4. Pricing.tsx + Settings.tsx (UI connectee)
5. PublishedDeployment.tsx (fix multi-fichiers)
6. LandingPage.tsx (stats reelles)
7. App.tsx (modal upgrade)

