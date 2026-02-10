

# Plan : Refonte de la TopNav - Epurer et rendre fonctionnel

## Analyse de l'existant

La TopNav actuelle a plusieurs problemes :
- **Doublons** : Le bouton Security apparait 2 fois (icone dans la barre d'outils ET bouton texte a droite)
- **Bouton Cloud** duplique avec le bouton Publish (meme action `onPublish`)
- **Bouton Back (fleche)** inutile car le Dashboard est deja accessible via le dropdown Sidebar
- **Barre URL "/editor"** purement decorative, pas fonctionnelle
- **Bouton GitHub** et **Share** ne font rien d'utile (ouvre juste github.com)
- **Avatar "P"** statique sans fonction
- **Bouton Theme** affiche juste un alert

## Ce qui sera fait

### Structure finale de la TopNav (de gauche a droite) :

```text
[Preview] | [Code] [Theme]  ----  [URL bar with project name]  ----  [Share v] [Upgrade] [Publish v]
```

**Zone gauche :**
- **Preview** : bouton bleu existant (reload la preview) - conserve
- Separateur
- **Code** : toggle vue code - conserve
- **Theme** : conserve (placeholder fonctionnel)

**Zone centre :**
- Barre URL affichant le nom du projet (lecture seule, informatif)

**Zone droite :**
- **Share** : bouton avec dropdown contenant "Copy Link" et "Open in new tab"
- **Upgrade** : bouton vers pricing - conserve
- **Publish** : bouton dropdown qui contient maintenant :
  - "Deploy to Cloud" (action publish)
  - "Run Security Scan" (action security)
  - "Connect GitHub" (placeholder)
  - "Custom Domain" (placeholder)

### Elements supprimes :
- Fleche retour (ArrowLeft) - le Dashboard est dans le dropdown Sidebar
- Bouton Cloud duplique
- Bouton Security standalone (deplace dans Publish dropdown)
- Bouton New Project (deja dans le dropdown Sidebar)
- Bouton GitHub standalone (deplace dans Publish dropdown)
- Bouton BarChart2 Security (doublon)
- Avatar "P" statique

## Details techniques

### Fichier modifie : `src/app-builder/components/TopNav.tsx`

- Supprimer les imports inutiles (ArrowLeft, Plus, Github, BarChart2, ShieldCheck, Cloud)
- Ajouter imports : `ChevronDown`, `Globe`, `Link`, `ExternalLink`, `Copy`
- Ajouter un state `showPublishMenu` pour le dropdown Publish
- Ajouter un state `showShareMenu` pour le dropdown Share
- Ajouter `useRef` + click-outside pour fermer les dropdowns
- Ajouter `projectName` aux props pour l'afficher dans la barre URL
- Restructurer le JSX selon le nouveau layout
- Le dropdown Publish aura 4 options avec icones et descriptions
- Le dropdown Share aura 2 options (Copy Link, Open in new tab)

### Fichier modifie : `src/app-builder/App.tsx`

- Passer `projectName` a TopNav via les props
- Supprimer les props devenues inutiles (`onNewProject`, `onBackToLanding` du TopNav)
- Garder `onRunSecurity` car il est utilise dans le dropdown Publish

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/app-builder/components/TopNav.tsx` | Modifier -- refonte complete du layout et ajout dropdowns |
| `src/app-builder/App.tsx` | Modifier -- adapter les props passees a TopNav |

