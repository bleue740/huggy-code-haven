

# Clonage exact du pricing Lovable.dev pour Blink

## Objectif

Reproduire pixel-perfect le pricing de Lovable.dev : memes prix, memes features, memes interactions (toggle annuel par plan, selecteur de credits, top-up), adapte au branding Blink.

## Changements detailles

### 1. Refonte de `src/config/plans.ts`

Remplacer les plans actuels par les plans exacts de Lovable.dev :

**Free** - $0/mois
- 5 daily credits (up to 30/month)
- Public projects
- Unlimited collaborators
- 5 blink.app domains
- Cloud

**Pro** - $25/mois (toggle annuel par plan, pas global)
- 100 monthly credits (selecteur: 100, 200, 500)
- 5 daily credits (up to 150/month)
- Usage-based Cloud + AI
- Credit rollovers
- On-demand credit top-ups
- Unlimited blink.app domains
- Custom domains
- Remove the Blink badge
- User roles & permissions

**Business** - $50/mois (toggle annuel par plan)
- 100 monthly credits (selecteur: 100, 200, 500)
- Internal publish
- SSO
- Team workspace
- Personal projects
- Design templates
- Role-based access
- Security center

**Enterprise** - Custom
- Dedicated support
- Onboarding services
- Design systems
- SCIM
- Support for custom connectors
- Publishing controls
- Sharing controls
- Audit logs (coming soon!)

Ajouter une configuration de credit tiers :

```text
Credit tiers pour Pro et Business:
- 100 credits/month -> prix de base
- 200 credits/month -> +$15/mois
- 500 credits/month -> +$40/mois
```

Ajouter les FAQ alignees sur Lovable :
- What is Blink and how does it work?
- What does the free plan include?
- What is a credit?
- Who owns the projects and code?
- How much does it cost to use?
- Do you offer a student discount?

### 2. Refonte de `src/pages/Pricing.tsx`

Reproduire le layout exact de Lovable.dev :

- **Header** : branding Blink + Sign in
- **Titre** : "Des plans pour chaque ambition" (ou titre equivalent)
- **Grille 4 colonnes** fond clair, cartes blanches avec bordures subtiles
- **Toggle annuel** : un switch par plan (Pro et Business seulement), pas un toggle global. Quand annuel est actif, afficher le prix barre + "first month, then $X/mo"
- **Selecteur de credits** : dropdown sous le bouton CTA pour Pro et Business (100 / 200 / 500 credits par mois), le prix s'ajuste dynamiquement
- **Boutons CTA** : Free -> "Get Started" (auth), Pro/Business -> "Get Started" (checkout placeholder), Enterprise -> "Book a demo" (mailto)
- **Section Student Discount** avec lien
- **Section FAQ** en accordeon

### 3. Mise a jour de `src/app-builder/components/LandingPage.tsx`

Mettre a jour le tableau `plans` (lignes 153-158) pour correspondre aux vrais plans :

- Free: $0, features exactes
- Pro: $25 (highlight, badge "Popular"), features exactes
- Business: $50, features exactes
- Enterprise: Custom, features exactes

Changer les labels en anglais pour correspondre a Lovable.

## Fichiers modifies

- `src/config/plans.ts` : refonte complete avec plans exacts, credit tiers, FAQ
- `src/pages/Pricing.tsx` : refonte complete avec toggle par plan, selecteur de credits, layout Lovable
- `src/app-builder/components/LandingPage.tsx` : mise a jour du tableau plans (lignes 153-158)

## Details techniques

**Credit tier pricing :**

```text
Tier       | Base   | +100cr | +400cr
Pro        | $25    | $40    | $65
Business   | $50    | $65    | $90
```

**Toggle annuel par plan :**
Chaque plan Pro/Business a son propre switch "Annual". Quand actif :
- Prix barre (mensuel) + prix reduit affiche
- Texte "first month, then $X/mo"

**Selecteur de credits :**
Un composant Select sous le bouton CTA de Pro et Business avec les options :
- 100 credits / month
- 200 credits / month  
- 500 credits / month

Le prix affiche s'ajuste en temps reel.

