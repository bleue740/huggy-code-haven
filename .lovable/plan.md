

# Plan : Page Settings + Corrections de bugs (implementation)

## 1. Creer `src/pages/Settings.tsx`

Page complete avec les sections suivantes, dans le meme theme dark (`bg-[#050505]`, cartes `bg-[#111]`, bordures `border-[#1a1a1a]`) :

- **Header** : logo Blink AI + bouton retour vers `/`
- **Profile** : email utilisateur (lecture seule)
- **Account** : bouton Sign Out (rouge, avec `supabase.auth.signOut()` puis redirect `/auth`), bouton Delete Account (supprime les projets de l'utilisateur puis deconnecte, avec modale de confirmation)
- **Subscription** : plan actuel (Free), bouton "Upgrade" vers `/pricing`, affichage des credits
- Layout responsive : `max-w-2xl mx-auto`, sections en cartes empilees

## 2. Modifier `src/App.tsx`

- Importer `Settings` depuis `src/pages/Settings.tsx`
- Ajouter route `/app` pointant vers `Index` (pour que la redirection post-login fonctionne)
- Ajouter route `/settings` pointant vers `Settings`

## 3. Modifier `src/app-builder/components/Dashboard.tsx`

- Importer `useNavigate`
- Rendre le `DropdownMenuItem` Settings cliquable : `onClick={() => navigate('/settings')}`
- Retirer les classes `cursor-default` et `focus:bg-transparent` du bouton Settings

## 4. Modifier `src/app-builder/components/Sidebar.tsx`

- Importer `useNavigate` de `react-router-dom`
- Ligne 291 : remplacer `setShowProjectMenu(false)` par `setShowProjectMenu(false); navigate('/settings');`

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/pages/Settings.tsx` | Creer -- page Settings complete |
| `src/App.tsx` | Modifier -- ajouter routes `/app` et `/settings` |
| `src/app-builder/components/Dashboard.tsx` | Modifier -- bouton Settings cliquable |
| `src/app-builder/components/Sidebar.tsx` | Modifier -- bouton Project Settings fonctionnel |

## Flux de navigation

```text
Dashboard avatar dropdown --> Settings --> /settings
Sidebar Project Settings --> /settings
/settings Back --> / (dashboard)
/settings Sign out --> /auth
/settings Upgrade --> /pricing
/settings Delete Account --> supprime projets, deconnecte, /auth
```

