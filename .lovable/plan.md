
# Build serveur containerise pour des vraies apps deployables

## Probleme actuel

Aujourd'hui, les applications generees par Blink AI ne sont pas de "vraies" apps web :
- Le code est transpile cote client via Babel dans une iframe
- Les librairies sont chargees via CDN (React UMD, Tailwind CDN, etc.)
- Le "deploiement" consiste a sauvegarder le code brut en base et le re-servir dans une iframe avec Babel
- Pas de vrai bundling (Vite/esbuild), pas de fichiers statiques optimises
- Les apps deployees ne fonctionnent pas comme des apps React classiques

## Solution : Edge Function `build-project`

Creer une **edge function** qui prend les fichiers du projet, genere un vrai projet Vite complet, le build, et stocke le resultat (HTML/JS/CSS optimises) dans le storage pour servir des apps statiques reelles.

Le build se fait **sans Docker** (pas disponible dans les edge functions) en utilisant **esbuild** (disponible en Deno) pour transpiler et bundler le code.

## Architecture

```text
Frontend (Publish button)
    |
    v
Edge Function: build-project
    |
    ├── 1. Recevoir les fichiers du projet (Record<string, string>)
    ├── 2. Generer le squelette Vite (index.html, main.tsx, vite.config, package.json, tailwind.config)
    ├── 3. Transpiler chaque fichier TSX via esbuild (transform, pas bundle)
    ├── 4. Injecter les imports React necessaires
    ├── 5. Creer le bundle final (index.html autonome avec inline JS/CSS)
    ├── 6. Uploader dans Supabase Storage bucket "deployments"
    └── 7. Retourner l'URL publique du build
        |
        v
Supabase Storage (bucket: deployments)
    /builds/{projectId}/index.html   <-- App statique complete
    /builds/{projectId}/assets/...   <-- JS/CSS bundles
        |
        v
URL publique: https://{supabase-url}/storage/v1/object/public/deployments/builds/{projectId}/index.html
```

## Details techniques

### 1. Creer le bucket Storage `deployments`
- Bucket public pour servir les fichiers statiques
- Politique RLS : insertion par utilisateur authentifie, lecture publique

### 2. Edge Function `build-project`

La fonction recoit les fichiers du projet et produit une app statique autonome :

**Approche : Single-file HTML bundle**
- Transpile chaque fichier `.tsx` en JavaScript via l'API `esbuild` de Deno
- Concatene tout le JS transpile dans l'ordre correct (composants d'abord, App.tsx en dernier)
- Genere un fichier `index.html` autonome avec :
  - React 18 et ReactDOM via CDN (versions production minifiees)
  - Tailwind CSS via CDN
  - Le JS transpile inline dans une balise `<script>`
  - Lucide, Recharts, Framer Motion en CDN production
- Upload ce fichier dans Storage

**Avantage par rapport a l'existant** : le code est **pre-transpile** (plus de Babel runtime), plus rapide, plus fiable, et servi depuis une vraie URL statique.

**Phase 2 (evolutive)** : pour un vrai bundling Vite, il faudrait un serveur Node.js externe. Cette premiere phase pose les bases avec un build leger mais fonctionnel.

### 3. Modifier `usePublish.ts`

- Appeler la nouvelle edge function `build-project` au lieu de simplement sauvegarder le snapshot
- Stocker l'URL du build dans la table `deployments` (colonne `url` existante)
- Afficher la vraie URL publique du build

### 4. Modifier `PublishedDeployment.tsx`

- Detecter si le deploiement a une URL de build statique
- Si oui, rediriger vers l'URL Storage au lieu de re-construire l'iframe avec Babel
- Fallback sur l'ancien mode iframe pour les anciens deploiements

### 5. Ajouter colonne `build_url` a `deployments`

Pour distinguer les anciens deploiements (iframe/Babel) des nouveaux (build statique).

### 6. Mettre a jour `TopNav.tsx` et le flux de publish

- Ajouter un indicateur de progression du build ("Building...", "Uploading...", "Live!")
- Afficher la vraie URL de production apres le build

## Fichiers crees
- `supabase/functions/build-project/index.ts` -- Edge function de build
- Migration SQL pour le bucket storage + colonne `build_url`

## Fichiers modifies
- `src/app-builder/hooks/usePublish.ts` -- Appel a la nouvelle edge function
- `src/pages/PublishedDeployment.tsx` -- Support du redirect vers build statique
- `src/app-builder/components/TopNav.tsx` -- UX de build amelioree

## Limites et evolution future
- Phase 1 : build single-file HTML (transpilation esbuild, CDN pour libs). Fonctionnel et deployable immediatement.
- Phase 2 : build multi-fichiers avec assets separes (JS chunks, CSS, images).
- Phase 3 : vrai bundler Vite sur serveur Node.js externe pour support complet (HMR, code splitting, tree shaking).
