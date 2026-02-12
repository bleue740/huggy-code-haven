

# Refonte du Dashboard Blink AI — Style Lovable.dev

## Analyse de l'existant

Le dashboard actuel (`Dashboard.tsx`) affiche :
- Un header avec logo, nav "Projects/Templates", bouton "New Project", avatar
- Une grille de cartes projet avec gradient colore + nom + date
- Un etat vide avec icone dossier + bouton "Creer"

## Differences avec Lovable.dev

Le dashboard de Lovable.dev a une approche radicalement differente :

1. **Prompt-first** : Quand l'utilisateur arrive sur le dashboard, il voit un grand champ de saisie central "Ask Lovable to create a web app that..." — le prompt est l'action principale, pas un bouton "New Project"
2. **Fond blanc/clair** avec un design epure et lumineux (pas fond noir)
3. **Cartes projet** : affichage en liste/grille plus compact avec un apercu du projet
4. **Pas de header complexe** : navigation minimale, focus sur le contenu
5. **Pas de page vide triste** : meme sans projet, le prompt central invite a creer

## Plan de modification

### 1. Refonte complete de `Dashboard.tsx`

Transformer le dashboard en layout inspire de Lovable :

**Header simplifie** :
- Logo Blink AI a gauche
- Avatar + menu utilisateur a droite
- Pas de nav "Projects/Templates" en tabs (simplifier)

**Zone centrale hero (etat sans projets OU au-dessus des projets)** :
- Grand titre "Build something with Blink AI" 
- Sous-titre descriptif
- Grand champ de saisie (textarea) avec placeholder "Describe the app you want to build..."
- Boutons d'action (Plan, Send) dans le champ
- Ce champ cree un nouveau projet ET envoie le prompt directement

**Grille de projets en dessous** :
- Titre "Recent Projects"
- Cartes plus compactes et elegantes
- Garder les actions contextuelles (renommer, dupliquer, supprimer)
- Ajouter un badge avec la date relative

### 2. Nouveau flow de creation

Quand l'utilisateur tape un prompt dans le champ central du dashboard :
- Creer automatiquement un nouveau projet en DB
- Ouvrir l'editeur avec le prompt pre-rempli
- Lancer la generation immediatement

Cela remplace le flow actuel : clic "New Project" → projet vide → taper le prompt dans le chat.

### 3. Ajustements de style

- Fond plus sombre mais moderne (`bg-[#0a0a0a]` au lieu de `#050505`)
- Cartes avec bordures subtiles et hover effects doux
- Typographie plus large pour le hero
- Champ de saisie central avec un style "floating card" (ombre, bordure arrondie, fond legèrement plus clair)

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/app-builder/components/Dashboard.tsx` | Refonte complete — layout hero + prompt + grille projets |
| `src/app-builder/App.tsx` | Ajouter handler `handleStartFromDashboard` qui cree un projet + envoie le prompt |

## Details techniques

**Dashboard.tsx** :
- Ajouter une nouvelle prop `onStartWithPrompt: (prompt: string) => void`
- Le textarea central appelle `onStartWithPrompt` quand l'utilisateur envoie
- La grille de projets reste en dessous avec le meme fonctionnement (open, rename, duplicate, delete)
- Responsif : le champ central prend toute la largeur sur mobile

**App.tsx** :
- Creer `handleStartFromDashboard` qui :
  1. Cree un projet en DB
  2. Set le state avec le nouveau projet
  3. Ferme le dashboard
  4. Envoie le prompt via `handleSendMessage`
- Passer cette fonction comme prop au Dashboard

