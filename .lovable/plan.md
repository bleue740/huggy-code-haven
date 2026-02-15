

# Refonte du systeme de tarification et credits

## Objectif
Mettre en place le modele de tarification complet avec les grilles de prix exactes (Free, Pro, Business, Enterprise), la comparaison des fonctionnalites, et le systeme de credits tel que decrit dans la documentation Lovable.

## Changements prevus

### 1. Mise a jour de la configuration des plans (`src/config/plans.ts`)

**Grille de credits Pro** (11 paliers) :
- 100 credits : 25$/mois ou 250$/an (21$/mois)
- 200 credits : 50$/mois ou 500$/an (42$/mois)
- 400 credits : 100$/mois ou 1000$/an (84$/mois)
- 800 credits : 200$/mois ou 2000$/an (167$/mois)
- 1200 credits : 294$/mois ou 2940$/an (245$/mois)
- 2000 credits : 480$/mois ou 4800$/an (400$/mois)
- 3000 credits : 705$/mois ou 7050$/an (588$/mois)
- 4000 credits : 920$/mois ou 9200$/an (767$/mois)
- 5000 credits : 1125$/mois ou 11250$/an (938$/mois)
- 7500 credits : 1688$/mois ou 16880$/an (1407$/mois)
- 10000 credits : 2250$/mois ou 22500$/an (1875$/mois)

**Grille de credits Business** (11 paliers) :
- Meme structure avec des prix doubles (100 credits a 50$/mois, etc.)

**Ajout du plan Free** dans la liste des plans avec :
- 5 credits journaliers (max 30/mois)
- Projets prives
- Workspace collaboratif illimite

**Mise a jour des features** de chaque plan pour correspondre exactement a la documentation fournie.

### 2. Refonte de la page Pricing (`src/pages/Pricing.tsx`)

- Ajouter une carte Free (gratuit, CTA "Get Started" vers /auth)
- Le selecteur de credits devient un dropdown avec les 11 paliers au lieu de 3
- Le prix s'adapte dynamiquement selon le palier selectionne (plus de prix "base + supplement", le prix est directement celui du palier)
- Toggle annuel : affiche le prix annuel par mois au lieu du "50% off first month"
- Section de comparaison des fonctionnalites sous forme de tableau (Free vs Pro vs Business)
- Ajout d'une note expliquant le comportement de l'upgrade : "Lorsque vous passez a un forfait superieur, votre solde est mis a jour au nouveau total, pas ajoute en plus"

### 3. Mise a jour de la page Credits (`src/pages/Credits.tsx`)

- Ajouter une section expliquant les differences Free/Pro/Business en termes de credits
- Ajouter la note sur le comportement d'upgrade des credits
- Mettre a jour les plafonds (Free: 30/mois, Pro: 150/mois)

### 4. Mise a jour du FAQ

- Mettre a jour les reponses avec les vrais prix et paliers
- Ajouter une question sur le comportement d'upgrade

## Details techniques

### Structure de donnees revisee

```text
CREDIT_TIERS_PRO: array de 11 objets { credits, monthlyPrice, annualPrice, annualMonthly }
CREDIT_TIERS_BUSINESS: array de 11 objets (meme structure, prix doubles)
PLANS: Free + Pro + Business + Enterprise (4 plans au lieu de 3)
```

### Fichiers modifies
- `src/config/plans.ts` : Nouvelle structure de donnees avec les 2 grilles de credits separees et 4 plans
- `src/pages/Pricing.tsx` : Carte Free ajoutee, selecteur 11 paliers, prix dynamiques, section comparaison, note upgrade
- `src/pages/Credits.tsx` : Sections supplementaires sur la comparaison des plans et le comportement d'upgrade
- `src/config/plans.ts` (FAQ) : Reponses mises a jour avec les vrais montants

### Logique de prix dynamique

Le composant PlanCard recevra la grille de credits specifique au plan (Pro ou Business). Le prix affiche sera directement celui du palier selectionne, sans calcul "base + supplement". En mode annuel, le prix affiche sera le `annualMonthly` (prix annuel divise par 12).

