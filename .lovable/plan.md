
# Plan: Rendre le Preview Public

## Objectif
Modifier la route `/preview` pour qu'elle retourne une URL publique (accessible depuis Internet) au lieu de `localhost`.

## Ce qui change

### 1. `server/index.js`
Un seul changement: remplacer `http://localhost:${port}` par une URL basee sur la variable d'environnement `PUBLIC_URL`.

```text
// Avant
res.json({ url: `http://localhost:${port}` });

// Apres  
const publicBaseUrl = process.env.PUBLIC_URL || `http://localhost:${port}`;
res.json({ url: `${publicBaseUrl}:${port}` });
```

Le fallback sur `localhost` permet au serveur de fonctionner meme sans la variable configuree.

## Ce que tu dois faire manuellement sur Railway
Apres le push, ajouter une variable d'environnement dans Railway:
- **Key**: `PUBLIC_URL`
- **Value**: ton URL Railway (ex: `https://huggy-code-haven.up.railway.app`)

## Limitation importante
Railway ne permet pas d'exposer plusieurs ports sur un meme service. Le port dynamique (5000-5999) ne sera pas accessible publiquement via Railway tel quel. Pour un vrai preview public, il faudra a terme:
- soit utiliser un VPS (Hetzner/DigitalOcean) qui supporte Docker + ports multiples
- soit servir le preview directement depuis le serveur Express (sans Docker) sur une sous-route comme `/preview/demo`

Pour l'instant, on met en place la mecanique avec `PUBLIC_URL` pour que la structure soit prete.
