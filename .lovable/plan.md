
# Plan : Suggestions intelligentes + Communaute Showcase

## 1. Suggestions pre-remplissent le textarea (au lieu de lancer)

Actuellement, cliquer sur une suggestion appelle `onStart(item.text)` ce qui lance directement la generation. On va changer ce comportement :

- Cliquer sur une suggestion remplit le textarea avec un **prompt enrichi** (pas juste le titre court)
- L'utilisateur peut le modifier avant d'envoyer
- Le textarea scroll automatiquement en vue et recoit le focus

Mapping des prompts enrichis :
- "AI Landing Page Builder" --> "Build a modern AI-powered landing page with a hero section, feature grid, pricing cards, testimonials carousel, and a CTA with gradient effects. Use dark theme with blue accents."
- "SaaS Dashboard for Analytics" --> "Create a SaaS analytics dashboard with sidebar navigation, KPI cards, line/bar charts, a data table with filters, and a dark glassmorphism design."
- "Booking System for Doctors" --> "Build a doctor appointment booking system with a calendar view, time slot picker, patient form, booking confirmation, and appointment list. Clean medical UI."
- "Project Management Tool" --> "Create a project management tool with kanban board, task cards with drag indicators, project sidebar, team avatars, and progress tracking. Modern dark UI."

## 2. Bouton "Refresh suggestions" avec IA

Sous la grille de suggestions, ajouter un bouton discret "More ideas" avec une icone RefreshCw.

### Fonctionnement
- Au clic, appelle une **nouvelle edge function** `generate-suggestions` qui demande a l'IA 4 idees d'apps originales
- Pendant le chargement : animation de rotation sur l'icone
- Les nouvelles suggestions remplacent les actuelles avec une animation fade
- Les suggestions sont retournees sous forme structuree (titre court + prompt complet) via tool calling

### Edge function `supabase/functions/generate-suggestions/index.ts`
- Appelle Lovable AI Gateway avec `google/gemini-3-flash-preview`
- Utilise le tool calling pour obtenir un JSON structure : `[{ icon: "Layout|Zap|Calendar|Briefcase", title: "...", prompt: "..." }]`
- **Pas besoin d'auth** : cette fonction est publique (les suggestions sont pour tout le monde)
- Rate limit cote client : max 1 appel toutes les 10 secondes (desactiver le bouton temporairement)

## 3. Section "Community Showcase"

Nouvelle section entre Pricing et le CTA final, montrant les meilleurs projets publies par des utilisateurs gratuits.

### Base de donnees
Nouvelle table `community_showcases` :

```sql
CREATE TABLE public.community_showcases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  deploy_url TEXT NOT NULL,
  featured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '72 hours'),
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- `featured_at` / `expires_at` : rotation automatique toutes les 72h
- `score` : permet de trier les meilleurs en premier
- RLS : lecture publique (tout le monde voit la vitrine), insertion reservee aux admins ou a une logique automatique

### Affichage sur la landing page
- Requete les showcases dont `expires_at > now()`, tries par score descendant, LIMIT 6
- Grille 3x2 (2 colonnes sur mobile)
- Chaque carte affiche :
  - Titre du projet
  - Description courte (2 lignes max)
  - Bouton "Visit" qui ouvre le `deploy_url` dans un nouvel onglet
  - Badge "Built with Blink" en overlay
- Si aucun showcase n'existe : afficher un message "Be the first to showcase your app!" avec CTA

### Pour le moment (pas de donnees)
Comme il n'y a pas encore de projets dans la vitrine, on va :
- Creer la table et les policies
- Afficher la section avec des **donnees mock en dur** en fallback quand la table est vide
- Les mock disparaitront automatiquement quand de vrais projets seront ajoutes

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/app-builder/components/LandingPage.tsx` | Modifier -- suggestions pre-remplissent le textarea, bouton refresh, section Community |
| `supabase/functions/generate-suggestions/index.ts` | Creer -- edge function pour generer des suggestions IA |
| Migration SQL | Creer table `community_showcases` + RLS policies |
| `supabase/config.toml` | Pas de modification (auto-gere) |

## Details techniques

### LandingPage.tsx - Changements
- Nouveau state `suggestions` (initialement les 4 par defaut) pour rendre la liste dynamique
- Nouveau state `isRefreshing` pour l'animation du bouton
- Fonction `handleSuggestionClick(prompt)` : met a jour `inputValue` avec le prompt enrichi + focus le textarea
- Fonction `refreshSuggestions()` : appelle l'edge function, met a jour le state
- Nouveau composant inline `CommunityShowcase` : fetch les showcases depuis la DB, fallback mock
- Ref sur le textarea pour le focus programmatique

### Edge function generate-suggestions
- Pas d'auth requise (publique)
- Tool calling avec schema : tableau de 4 objets `{ icon, title, prompt }`
- Rate limit : reponse rapide grace a gemini-3-flash-preview
- Gestion erreurs 429/402

### Flux utilisateur

```text
Landing Page :
  1. User voit 4 suggestions
  2. Clique sur "SaaS Dashboard" --> textarea se remplit avec le prompt detaille
  3. User modifie ou envoie directement
  4. Clique "More ideas" --> 4 nouvelles suggestions apparaissent
  5. Scrolle vers Community --> voit les meilleurs projets
  6. Clique "Visit" --> ouvre le site dans un nouvel onglet
```
