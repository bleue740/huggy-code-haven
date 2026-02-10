

# Plan : Message d'accueil contextuel sur /auth + Refonte du Dashboard

## 1. Message d'accueil contextuel sur la page Auth

Quand l'utilisateur arrive sur `/auth` depuis une redirection 401, la page affichera un bandeau d'information jaune/ambre au-dessus du formulaire avec le message **"Connectez-vous pour continuer"** au lieu du message par defaut.

### Fichier modifie : `src/pages/Auth.tsx`

- Detecter `location.state?.from` pour savoir si l'utilisateur vient d'une redirection
- Si oui, afficher un bandeau ambre avec une icone info : "Connectez-vous pour continuer"
- Changer le sous-titre en "Vous devez etre connecte pour acceder a cette fonctionnalite."

---

## 2. Refonte du Dashboard style Lovable

Le dashboard actuel est basique (grille de cartes). Le dashboard Lovable a ces caracteristiques :

- **Header** avec logo, navigation (Projects / Templates), avatar utilisateur avec menu deconnexion
- **Barre de recherche** pour filtrer les projets
- **Grille de projets** avec apercu visuel (placeholder colore), nom, date
- **Actions sur chaque projet** : menu contextuel (Renommer, Supprimer, Dupliquer)
- **Tri** par date de modification (plus recent en premier, deja fait)
- **Bouton deconnexion** accessible depuis l'avatar

### Fichier modifie : `src/app-builder/components/Dashboard.tsx`

Refonte complete :

**Header :**
- Logo Blink AI a gauche
- Onglets "Projects" (actif) et "Templates" (placeholder)
- Zone droite : bouton "New Project" + avatar avec initiale email + dropdown (Settings placeholder, Sign out)

**Zone de contenu :**
- Titre "My Projects" avec compteur de projets
- Barre de recherche avec icone Search pour filtrer par nom
- Grille responsive de projets (3 colonnes desktop, 2 tablette, 1 mobile)

**Carte projet amelioree :**
- Apercu visuel : bloc colore avec gradient unique par projet (base sur l'id)
- Nom du projet en gras
- Date "il y a X minutes/heures"
- Menu contextuel (trois points) avec : Renommer, Dupliquer, Supprimer
- Renommer : inline editing du nom avec sauvegarde en base
- Supprimer : confirmation modale avant suppression en base

**Etat vide ameliore :**
- Illustration plus grande et engageante
- Texte d'onboarding clair
- CTA "Create your first project"

**Bouton deconnexion :**
- `supabase.auth.signOut()` puis redirection vers `/auth`

### Props ajoutees au Dashboard :
- `userEmail: string` pour afficher l'initiale dans l'avatar

### Fichier modifie : `src/app-builder/App.tsx`
- Passer `userEmail` au composant Dashboard depuis la session utilisateur

---

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/pages/Auth.tsx` | Modifier -- bandeau contextuel "Connectez-vous pour continuer" |
| `src/app-builder/components/Dashboard.tsx` | Modifier -- refonte complete style Lovable |
| `src/app-builder/App.tsx` | Modifier -- passer userEmail au Dashboard |

