

# Pricing Page & Landing Pricing: Alignement Lovable.dev + Stripe Integration

## Objectif

Reproduire le modele de pricing de Lovable.dev avec 4 plans (Free, Pro, Business, Enterprise), des fonctionnalites realistes alignees sur Blink, un toggle annuel/mensuel fonctionnel, et une integration Stripe reelle pour les paiements. Unifier les deux endroits ou le pricing apparait (landing page + page /pricing).

## Ce qui change

### 1. Activer Stripe

Utiliser l'outil Stripe de Lovable pour connecter un compte Stripe au projet. Cela permettra de creer des produits, prix, et sessions de checkout reels.

### 2. Creer une edge function `create-checkout`

Une edge function qui :
- Recoit le `planId` et `billingInterval` (monthly/yearly)
- Verifie l'authentification de l'utilisateur
- Cree ou recupere un Stripe Customer lie au user
- Cree une Checkout Session Stripe avec le bon price ID
- Retourne l'URL de checkout pour redirection

### 3. Creer une edge function `stripe-webhook`

Recoit les evenements Stripe (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) et met a jour la table `subscriptions` en consequence.

### 4. Refactorer les plans dans un fichier partage

Creer `src/config/plans.ts` avec les 4 plans et leurs features, utilise a la fois par la landing page et la page /pricing. Les plans seront :

- **Free** : 5 credits quotidiens (max 30/mois), projets publics, 1 domaine blink.app, Cloud
- **Pro** ($25/mois ou $20/mois annuel) : 100 credits/mois, 5 credits quotidiens (max 150/mois), domaines illimites, domaines personnalises, export ZIP, retrait du badge
- **Business** ($50/mois ou $40/mois annuel) : 100 credits/mois, publish interne, SSO, workspace equipe, templates de design, controle d'acces par roles, centre de securite
- **Enterprise** (sur devis) : support dedie, onboarding, systemes de design, SCIM, controles de publication

### 5. Refactorer `src/pages/Pricing.tsx`

- Layout en grille 4 colonnes comme Lovable.dev (fond clair/neutre, pas dark)
- Chaque plan : nom, description, prix barre + prix promo si annuel, toggle annuel par plan, bouton CTA
- Pro et Business : selecteur de credits (dropdown) avec prix ajustes
- Enterprise : bouton "Book a demo" qui redirige vers un formulaire de contact
- Free : bouton "Get Started" qui redirige vers /auth
- Pro/Business : bouton "Get Started" qui appelle `create-checkout` et redirige vers Stripe
- Section FAQ en bas (accordeon)
- Section "Student discount" avec lien

### 6. Mettre a jour la landing page (`LandingPage.tsx`)

Remplacer les 3 plans inline par les 4 plans du fichier partage `plans.ts`. Garder le design compact (cartes) mais avec les bons prix et features. Les boutons "Choose X" redirigent vers `/pricing` pour les plans payants.

### 7. Coherence dans le SaaS

- Le header de la page /pricing utilise le meme branding Blink
- Les boutons d'upgrade dans l'app (sidebar, modales) pointent vers `/pricing`
- La table `subscriptions` est deja prete avec les champs `stripe_customer_id`, `stripe_subscription_id`, `plan`, `status`, `current_period_end`

## Details techniques

**Fichiers a creer :**
- `src/config/plans.ts` — configuration centralisee des plans
- `supabase/functions/create-checkout/index.ts` — creation de session Stripe
- `supabase/functions/stripe-webhook/index.ts` — webhook Stripe

**Fichiers a modifier :**
- `src/pages/Pricing.tsx` — refonte complete alignee sur Lovable.dev
- `src/app-builder/components/LandingPage.tsx` — mise a jour des plans inline (lignes 153-157)
- `src/App.tsx` — aucun changement necessaire (route /pricing existe deja)

**Architecture du checkout :**

```text
User clique "Get Started" (Pro/Business)
       |
       v
Frontend appelle create-checkout edge function
       |
       v
Edge function cree Stripe Checkout Session
       |
       v
User redirige vers Stripe hosted checkout
       |
       v
Stripe webhook -> met a jour subscriptions table
       |
       v
User revient sur /app avec plan actif
```

**Prerequis :**
- Activation de Stripe via l'outil Lovable (cle secrete)
- Creation des produits/prix dans Stripe via l'edge function ou manuellement

