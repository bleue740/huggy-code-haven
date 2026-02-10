
# Plan : Navigation fluide et complete du SaaS

## Problemes identifies

1. **Landing Page** : le menu hamburger mobile ne fait rien (pas de panneau), pas de liens "Features"/"Pricing"/"Sign in"
2. **Landing Page -> Auth** : le bouton "Get started" appelle `onStart("")` qui lance une generation AI au lieu de rediriger vers le builder/auth
3. **Settings -> retour** : le bouton "Back" redirige vers `/` qui affiche la Landing Page au lieu du Dashboard
4. **Dashboard -> Landing** : aucun lien pour retourner a la Landing Page
5. **Pricing -> retour** : le lien "Retour au builder" pointe vers `/` (Landing Page), pas vers le Dashboard
6. **Sidebar "Dashboard"** : appelle `onBackToLanding` qui affiche le Dashboard en memoire (etat React), mais si on est sur `/settings` ou `/pricing` il n'y a pas de retour au Dashboard
7. **Navigation par etat React vs routes** : le Dashboard et la Landing Page sont geres par des etats booleens (`showLanding`, `showDashboard`) dans `App.tsx` builder au lieu d'etre des routes propres. Cela cree des incoherences (refresh = retour a la landing)
8. **TopNav "Preview" button** : fait un `window.location.reload()` au lieu de rafraichir la preview

## Solution : unifier la navigation

### Approche
Plutot que de tout migrer vers des routes separees (ce qui casserait le flux builder actuel), on va :
- Corriger tous les liens de retour pour qu'ils pointent vers `/app` (le builder avec Dashboard)
- Rendre la Landing Page accessible uniquement sur `/` pour les visiteurs non connectes
- Ajouter une detection d'auth : si connecte, `/` redirige vers `/app` (Dashboard)
- Corriger le menu mobile de la Landing Page
- Ajouter les liens de navigation manquants

### Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `src/App.tsx` | Ajouter redirection `/` vers `/app` si connecte |
| `src/app-builder/components/LandingPage.tsx` | Menu mobile fonctionnel, liens nav (Features, Pricing, Sign in), scroll vers sections |
| `src/pages/Settings.tsx` | Bouton retour pointe vers `/app` |
| `src/pages/Pricing.tsx` | Header avec logo + bouton retour vers `/app`, lien Sign in |
| `src/app-builder/App.tsx` | Ajuster logique : si user connecte, afficher Dashboard par defaut au lieu de Landing |
| `src/components/ProtectedRoute.tsx` | Aucun changement |

---

## Details par fichier

### 1. `src/App.tsx`
- Creer un composant `HomeRedirect` qui verifie la session :
  - Si connecte -> affiche `Index` (qui montrera le Dashboard)
  - Si non connecte -> affiche `Index` (qui montrera la Landing)
- Pas de changement structurel majeur, la logique existe deja dans le builder

### 2. `src/app-builder/App.tsx`
- Modifier la logique initiale : verifier si l'utilisateur est connecte au montage
- Si connecte et a des projets -> afficher le Dashboard (`showDashboard = true, showLanding = false`)
- Si connecte et pas de projets -> afficher le Dashboard (avec l'etat vide)
- Si non connecte -> afficher la Landing Page
- Corriger le bouton "Get started" de la Landing : si non connecte, rediriger vers `/auth` au lieu de lancer une generation

### 3. `src/app-builder/components/LandingPage.tsx`
- **Navbar desktop** : ajouter liens "Features" (scroll `#features`), "Pricing" (`/pricing`), "Sign in" (`/auth`)
- **Menu mobile** : overlay plein ecran avec les memes liens, animation slide-in
- **Bouton "Get started"** : redirige vers `/auth` si non connecte (passer un prop `isAuthenticated`)
- Ajouter une nouvelle prop `isAuthenticated?: boolean` pour adapter le CTA

### 4. `src/pages/Settings.tsx`
- Ligne 71 : changer `navigate('/')` en `navigate('/app')` pour le bouton retour
- Le retour ramene au Dashboard au lieu de la Landing

### 5. `src/pages/Pricing.tsx`
- Refaire le header avec le meme style que Settings : logo Blink AI + bouton retour
- Lien retour pointe vers `/app`
- Ajouter un bouton "Sign in" si non connecte

### 6. `src/app-builder/components/TopNav.tsx`
- Aucun changement de navigation necessaire

---

## Flux de navigation final

```text
Visiteur non connecte :
  / (Landing Page) --> "Get started" --> /auth --> connexion --> /app (Dashboard)
  / (Landing Page) --> "Pricing" --> /pricing --> "Back" --> /
  / (Landing Page) --> "Sign in" --> /auth

Utilisateur connecte :
  / --> redirige vers /app (Dashboard)
  /app (Dashboard) --> clic projet --> Builder
  /app (Dashboard) --> avatar --> Settings --> /settings
  /app (Dashboard) --> avatar --> Sign out --> /auth
  /settings --> Back --> /app (Dashboard)
  /settings --> Upgrade --> /pricing
  /pricing --> Back --> /app
  Builder (Sidebar) --> Dashboard --> /app (Dashboard)
  Builder (Sidebar) --> Project Settings --> /settings
```

## Resume des corrections

- Landing Page : menu mobile fonctionnel + liens nav desktop (Features, Pricing, Sign in)
- Settings : bouton retour corrige vers `/app`
- Pricing : header avec logo + retour vers `/app`
- Builder App : detection auth au montage pour afficher Dashboard ou Landing automatiquement
- Landing "Get started" : redirige vers `/auth` au lieu de lancer une generation vide
