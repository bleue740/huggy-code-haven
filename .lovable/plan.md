
# Plan : Etape 2 — Ajouter la route /preview

## Objectif

Ajouter une route POST `/preview` au serveur qui cree un mini projet HTML et le sert, plus un dossier `projects/` pour stocker les projets generes.

## Fichiers a modifier

### 1. `server/index.js`
- Ajouter les imports: `exec` (child_process), `path`, `fs`
- Ajouter `express.json()` middleware (necessaire pour lire le body des requetes POST)
- Ajouter la route `POST /preview` qui:
  - Cree un dossier `projects/demo/` s'il n'existe pas
  - Ecrit un fichier `index.html` basique dedans
  - Lance `npx serve` sur ce dossier (port 4000)
  - Retourne l'URL en JSON

### 2. `server/package.json`
- Ajouter `"serve": "^14.2.0"` dans les dependances

### 3. `server/projects/.gitkeep`
- Creer un fichier vide pour que le dossier `projects/` soit versionne par Git

## Detail technique

La route `/preview` est un premier test mecanique. L'URL retournee (`localhost:4000`) ne sera pas accessible publiquement depuis Railway a ce stade — c'est normal. Le but est de valider que le serveur peut:
1. Creer des fichiers sur le filesystem
2. Lancer un process enfant (serve)
3. Retourner une reponse

## Apres implementation
1. Push sur GitHub
2. Railway rebuild automatiquement
3. Tester avec `POST https://TON_URL/preview`
4. Verifier la reponse `{ "url": "..." }`
