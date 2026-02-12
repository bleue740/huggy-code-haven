

# Plan d'amelioration — Combler les manques critiques de Blink AI

## Etat actuel vs Objectif

Blink AI dispose deja d'un moteur de generation IA multi-fichiers, d'un systeme de credits, de persistence en base, et d'un deploiement fonctionnel. Voici les manques identifies et ce qui est realisable dans l'architecture actuelle.

---

## Priorite 1 — Stripe (Critique)

**Probleme** : Les boutons Pricing affichent un toast "bientot disponible". Impossible d'acheter des credits ou de s'abonner.

**Solution** :
1. Activer l'integration Stripe sur le projet (outil Lovable natif)
2. Creer une edge function `create-checkout` qui genere une session Stripe Checkout pour Pro ($29/mois) ou Business ($79/mois)
3. Creer une edge function `stripe-webhook` qui ecoute `checkout.session.completed` et `customer.subscription.updated/deleted`, met a jour la table `subscriptions` et ajoute les credits
4. Creer une edge function `create-portal` pour le portail de gestion Stripe
5. Connecter les boutons de `Pricing.tsx` a `create-checkout`
6. Afficher le vrai plan dans `Settings.tsx` via la table `subscriptions`

**Fichiers** : 3 edge functions + `Pricing.tsx` + `Settings.tsx`

---

## Priorite 2 — Templates pre-construits

**Probleme** : L'utilisateur part toujours de zero. Pas de point de depart inspire.

**Solution** :
1. Creer un fichier `src/app-builder/data/templates.ts` contenant 5-6 templates statiques (Landing SaaS, Dashboard Analytics, Portfolio, E-commerce vitrine, Blog, Todo App)
2. Chaque template = un objet `{ id, name, description, icon, files: Record<string, string> }`
3. Ajouter une section "Start from a template" sous le champ de prompt dans `Dashboard.tsx` avec des cartes cliquables
4. Au clic : creer un projet avec les fichiers du template pre-remplis, puis ouvrir l'editeur

**Fichiers** : `templates.ts` (nouveau) + `Dashboard.tsx`

---

## Priorite 3 — Version History (Git simplifie)

**Probleme** : Pas de versioning. L'undo/redo en memoire est perdu au rechargement.

**Solution** :
1. Creer une table `project_snapshots` (id, project_id, user_id, label, files_snapshot jsonb, created_at) avec RLS
2. Sauvegarder automatiquement un snapshot apres chaque generation IA reussie (max 20 par projet)
3. Ajouter un panneau "Version History" accessible depuis le TopNav (icone History), affichant la liste des snapshots avec date et label
4. Permettre de restaurer un snapshot en un clic

**Fichiers** : Migration SQL + `TopNav.tsx` + nouveau composant `VersionHistory.tsx` + modifications dans `App.tsx`

---

## Priorite 4 — Custom domains sur les deploiements

**Probleme** : Les apps deployees n'ont qu'une URL `/p/{id}`.

**Solution** :
1. Ajouter une colonne `custom_domain` a la table `deployments`
2. Ajouter un champ de saisie de domaine dans le flow de publication (`App.tsx`)
3. Afficher le domaine personnalise dans les details du deploiement
4. Note : le DNS reel necessite une infra externe (Cloudflare Workers ou proxy), mais on peut preparer l'interface et la persistance

**Fichiers** : Migration SQL + `App.tsx` (section publish)

---

## Ce qui n'est PAS faisable dans l'architecture actuelle

| Manque | Raison |
|--------|--------|
| Vrai build system (Vite/Webpack) | Necessite un serveur de build backend. L'approche Babel CDN est la seule option dans un iframe client-side. |
| npm packages arbitraires | Meme raison — on ne peut ajouter que des CDN. On peut elargir la liste des CDN supportes. |
| Collaboration temps reel | Necessite un serveur CRDT/OT (comme Yjs). Possible avec Supabase Realtime pour le chat, mais pas pour l'edition collaborative du code. |

Ces 3 points sont des limitations architecturales fondamentales qui necessiteraient un pivot technique majeur (backend de build, WebContainers, etc.).

---

## Ordre d'implementation recommande

1. **Stripe** — Debloquer la monetisation (prerequis business)
2. **Templates** — Ameliorer l'onboarding (rapide a implementer)
3. **Version History** — Rassurer les utilisateurs (securite des donnees)
4. **Custom domains** — Interface preparee pour le futur

## Resume des fichiers

| Fichier | Action |
|---------|--------|
| Edge function `create-checkout` | Creer |
| Edge function `stripe-webhook` | Creer |
| Edge function `create-portal` | Creer |
| `src/pages/Pricing.tsx` | Modifier (connecter Stripe) |
| `src/pages/Settings.tsx` | Modifier (plan reel + portail) |
| `src/app-builder/data/templates.ts` | Creer |
| `src/app-builder/components/Dashboard.tsx` | Modifier (templates) |
| Migration SQL `project_snapshots` | Creer |
| `src/app-builder/components/VersionHistory.tsx` | Creer |
| `src/app-builder/components/TopNav.tsx` | Modifier (bouton history) |
| `src/app-builder/App.tsx` | Modifier (snapshots + history) |
| Migration SQL `deployments.custom_domain` | Creer |

