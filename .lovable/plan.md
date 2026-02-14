

# Plan : Ajouter le serveur minimal + Dockerfile pour Railway

## Contexte

Railway essaie de builder le frontend (Vite/Bun) au lieu du serveur Node.js. La solution est de creer un dossier `server/` isole et un `Dockerfile` a la racine pour que Railway ne regarde que le serveur.

## Fichiers a creer

| Fichier | Description |
|---|---|
| `server/index.js` | Serveur Express minimal avec endpoint `/health` |
| `server/package.json` | Dependances du serveur (express uniquement) |
| `Dockerfile` | A la racine — dit a Railway d'utiliser Node 20 et de ne builder que `server/` |

## Contenu des fichiers

### 1. `server/index.js`
Serveur Express basique avec un seul endpoint GET `/health` qui retourne `{ "status": "ok" }`.

### 2. `server/package.json`
Package minimal avec `"type": "module"` pour les imports ES, et express comme seule dependance.

### 3. `Dockerfile` (racine)
- Base: `node:20`
- Copie uniquement le dossier `server/`
- Installe les dependances avec npm (pas bun)
- Expose le port 3000
- Lance `node index.js`

## Ce qui ne change PAS
- Aucun fichier existant n'est modifie
- Le frontend Lovable reste intact
- Le `railway.json` n'existe pas donc rien a supprimer

## Apres implementation
1. Push sur GitHub
2. Railway detecte le Dockerfile
3. Build uniquement le serveur Node.js
4. Tester `https://TON_URL/health` → `{ "status": "ok" }`

