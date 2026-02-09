

# Plan : Corriger le dropdown et ajouter un Dashboard

## Bug 1 : Dropdown coupe par overflow-hidden

Le conteneur parent du bouton "Blink AI" (ligne 206 de Sidebar.tsx) a la classe CSS `overflow-hidden`. Comme le dropdown est positionne en `absolute` a l'interieur de ce conteneur, il est invisible car coupe par le parent.

**Correction** : Retirer `overflow-hidden` du conteneur header et ajouter `overflow-visible` pour que le dropdown puisse depasser du conteneur.

---

## Bug 2 : "Back to Home" doit mener au Dashboard

Actuellement, cliquer sur "Back to Home" affiche la landing page marketing (la page d'accueil avec le champ de saisie "Build a modern SaaS..."). Dans Lovable, ce bouton ramene a un **Dashboard** qui liste les projets de l'utilisateur.

**Solution** : Creer un composant `Dashboard` qui affiche la liste des projets et remplacer le comportement de "Back to Home" par la navigation vers ce Dashboard.

---

## Details techniques

### Fichier modifie : `src/app-builder/components/Sidebar.tsx`

- **Ligne 206** : Remplacer `overflow-hidden` par `overflow-visible` dans le conteneur header
- **Ligne 307** : Renommer "Back to Home" en "Dashboard" et changer l'icone `Home` par `Layout` (ou `LayoutDashboard`)

### Fichier cree : `src/app-builder/components/Dashboard.tsx`

Nouveau composant Dashboard qui affiche :
- Header avec le logo Blink AI et un bouton "New Project"
- Grille de projets de l'utilisateur charges depuis la base de donnees (table `projects`)
- Chaque carte de projet montre : nom, date de derniere modification, bouton "Ouvrir"
- Un etat vide si aucun projet n'existe avec un CTA pour en creer un
- Design coherent avec le theme sombre existant

### Fichier modifie : `src/app-builder/App.tsx`

- Ajouter un state `showDashboard` (boolean) a cote de `showLanding`
- Modifier `onBackToLanding` pour activer `showDashboard` au lieu de `showLanding`
- Ajouter un rendu conditionnel : si `showDashboard` est true, afficher le composant `Dashboard`
- Ajouter un callback `handleOpenProject(projectId)` pour charger un projet depuis le dashboard
- Ajouter un callback `handleCreateNewProject` pour creer un nouveau projet et ouvrir l'editeur

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/app-builder/components/Sidebar.tsx` | Modifier -- corriger overflow + renommer bouton |
| `src/app-builder/components/Dashboard.tsx` | Creer -- composant Dashboard avec liste de projets |
| `src/app-builder/App.tsx` | Modifier -- ajouter navigation Dashboard |

