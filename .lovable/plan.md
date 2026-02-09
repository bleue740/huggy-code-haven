

# Plan : Menu dropdown pour le header "Blink AI" (comme Lovable)

## Probleme actuel

Le header "Blink AI" avec l'icone ChevronDown (lignes 195-199 de `Sidebar.tsx`) est **purement statique** : cliquer dessus ne fait rien. Dans Lovable, cliquer sur le nom du projet ouvre un menu dropdown avec des actions de gestion de projet.

## Ce qui sera implemente

Un menu dropdown qui s'ouvre au clic sur "Blink AI" avec les options suivantes :

1. **Nom du projet** (editable inline) -- affiche le nom du projet actuel avec possibilite de le renommer
2. **New Chat** -- reinitialise la conversation sans perdre le code
3. **New Project** -- cree un nouveau projet vierge
4. **Rename Project** -- permet de renommer le projet
5. **Project Settings** -- placeholder pour les parametres futurs
6. **Back to Home** -- retour a la landing page

Le menu se fermera automatiquement en cliquant a l'exterieur, avec une animation d'ouverture fluide.

---

## Details techniques

### Fichier modifie : `src/app-builder/components/Sidebar.tsx`

**Changements :**
- Ajouter un state `showProjectMenu` pour controler le dropdown
- Transformer le `div` statique (lignes 195-199) en un `button` cliquable qui toggle le menu
- Ajouter un popup dropdown positionne sous le header avec les options listees
- Ajouter un `useRef` + `useEffect` pour fermer le menu au clic exterieur (meme pattern que le `attachMenuRef` existant)
- Le menu utilisera le meme style visuel que le menu d'attachements existant (fond `#1a1a1a`, bordure `#333`, rounded-2xl)

### Fichier modifie : `src/app-builder/types.ts`

**Changements :**
- Ajouter `projectName?: string` dans `AppState` pour stocker le nom du projet

### Fichier modifie : `src/app-builder/App.tsx`

**Changements :**
- Initialiser `projectName` dans le state (valeur par defaut : "New Project", ou charge depuis la base de donnees)
- Passer les callbacks necessaires a la Sidebar : `onNewChat`, `onRenameProject`, `onBackToLanding`
- Ajouter `handleNewChat` : reinitialise l'historique de conversation tout en gardant le code actuel
- Ajouter `handleRenameProject` : met a jour le nom dans le state + sauvegarde en base
- Mettre a jour l'interface `SidebarProps` pour inclure les nouveaux callbacks

### Interaction attendue

1. L'utilisateur clique sur "Blink AI" + ChevronDown
2. Un dropdown apparait avec animation (slide-in-from-top + fade-in)
3. Le nom du projet s'affiche en haut du menu (ex: "New Project")
4. Les options sont listees avec icones
5. Cliquer sur une option execute l'action et ferme le menu
6. Cliquer a l'exterieur ferme le menu

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/app-builder/components/Sidebar.tsx` | Modifier -- ajouter le dropdown menu |
| `src/app-builder/types.ts` | Modifier -- ajouter `projectName` au state |
| `src/app-builder/App.tsx` | Modifier -- ajouter les callbacks et initialiser le nom du projet |

