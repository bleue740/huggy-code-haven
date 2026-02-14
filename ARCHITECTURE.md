# Architecture Backend Node.js — Guide d'Implémentation

Ce document décrit l'architecture cible pour un backend Node.js séparé, compatible avec le frontend Blink AI App Builder.

## Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                 │
│  VITE_BACKEND_URL → pointe vers le backend Node.js      │
│  useOrchestrator.ts → SSE stream depuis /api/orchestrator│
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                 BACKEND NODE.JS (Express)                │
│                                                          │
│  /api/orchestrator  → Pipeline Planner→Generator→        │
│                        Validator→Fixer (SSE)             │
│  /api/preview       → Lancer Vite dev server isolé       │
│  /api/build         → Build production (vite build)      │
│  /api/deploy        → Upload dist/ vers S3/CDN           │
│  /api/git/commit    → Commit + push vers GitHub          │
│  /api/git/pull      → Pull dernières modifications       │
│                                                          │
│  Auth: JWT validation (Supabase ou custom)               │
│  Credits: DB query avant chaque appel AI                 │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              SANDBOX DOCKER (1 par projet)               │
│                                                          │
│  - Node.js 20 + pnpm                                    │
│  - Vite dev server (HMR, port 5173)                     │
│  - Limites: 512MB RAM, 1 CPU, 100 PIDs                  │
│  - Network: isolé (--network=none sauf proxy)            │
│  - Filesystem: read-only sauf /app/project               │
└─────────────────────────────────────────────────────────┘
```

## Structure du Projet Backend

```
backend/
├── src/
│   ├── index.ts                 # Express server entry
│   ├── routes/
│   │   ├── orchestrator.ts      # POST /api/orchestrator (SSE)
│   │   ├── preview.ts           # POST /api/preview
│   │   ├── build.ts             # POST /api/build
│   │   ├── deploy.ts            # POST /api/deploy
│   │   └── git.ts               # POST /api/git/*
│   ├── agents/
│   │   ├── planner.ts           # Planner agent
│   │   ├── generator.ts         # Generator agent
│   │   ├── validator.ts         # Validator agent
│   │   └── fixer.ts             # Fixer agent
│   ├── sandbox/
│   │   ├── manager.ts           # Docker container lifecycle
│   │   ├── vite-preview.ts      # Start Vite dev server in container
│   │   └── vite-build.ts        # Run vite build in container
│   ├── git/
│   │   └── client.ts            # simple-git wrapper
│   ├── deploy/
│   │   ├── s3.ts                # S3 upload
│   │   └── cloudflare.ts        # DNS/SSL management
│   ├── auth/
│   │   └── middleware.ts         # JWT validation middleware
│   └── db/
│       └── client.ts            # Supabase/Postgres client
├── docker/
│   ├── Dockerfile.sandbox       # Image sandbox isolée
│   └── entrypoint.sh
├── package.json
├── tsconfig.json
├── docker-compose.yml
└── .env.example
```

## Endpoints API

### POST /api/orchestrator

**Identique** à l'edge function actuelle. Accepte le même payload, retourne le même SSE stream.

```typescript
// Request
{
  "messages": [{ "role": "user", "content": "Crée un dashboard" }],
  "projectContext": "// code complet concaténé",
  "fileTree": "App.tsx\nNavbar.tsx"
}

// Response: SSE stream
data: {"type":"phase","phase":"planning","message":"🧠 Analyse…"}
data: {"type":"plan","plan":{...}}
data: {"type":"phase","phase":"generating","message":"⚡ Génération…"}
data: {"type":"file_generated","path":"Dashboard.tsx","linesCount":120}
data: {"type":"validation","errors":[],"warnings":[],"confidence_score":95}
data: {"type":"result","conversational":false,"files":[...],"deletedFiles":[]}
data: [DONE]
```

### POST /api/preview

Lance un Vite dev server dans un container Docker isolé.

```typescript
// Request
{ "projectId": "uuid", "files": { "App.tsx": "...", "Navbar.tsx": "..." } }

// Response
{ "previewUrl": "https://preview-{projectId}.yourdomain.com:5173" }
```

### POST /api/build

Exécute `vite build` dans le container.

```typescript
// Request
{ "projectId": "uuid" }

// Response
{ "distPath": "/builds/{projectId}/dist", "size": "245KB" }
```

### POST /api/deploy

Upload le build vers S3 et configure le CDN.

```typescript
// Request
{ "projectId": "uuid", "customDomain": "app.client.com" }

// Response
{ "url": "https://app.client.com", "ssl": true }
```

### POST /api/git/commit

```typescript
// Request
{ "projectId": "uuid", "message": "AI: Added dashboard component" }

// Response
{ "commitHash": "abc123", "pushed": true }
```

### POST /api/git/pull

```typescript
// Request
{ "projectId": "uuid" }

// Response
{ "updated": true, "conflicts": [] }
```

## Configuration Frontend

Pour basculer du mode Edge Function vers le backend Node.js :

```env
# .env (frontend)
VITE_BACKEND_URL=https://api.yourdomain.com
```

Si `VITE_BACKEND_URL` est défini, `useOrchestrator.ts` pointe automatiquement vers `{VITE_BACKEND_URL}/api/orchestrator` au lieu de l'edge function.

## Docker Sandbox

### Dockerfile.sandbox

```dockerfile
FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y git ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY sandbox-template/ .
RUN pnpm install
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
```

### Lancement sécurisé

```bash
docker run -d \
  --name sandbox-${PROJECT_ID} \
  --memory=512m \
  --cpus=1 \
  --pids-limit=100 \
  --read-only \
  --tmpfs /tmp:rw,size=100m \
  --network=sandbox-net \
  -p ${ASSIGNED_PORT}:5173 \
  sandbox-image
```

## Déploiement

### Option A : VPS (Hetzner, OVH, DigitalOcean)

```yaml
# docker-compose.yml
services:
  backend:
    build: .
    ports: ["3000:3000"]
    env_file: .env
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on: [redis, postgres]

  redis:
    image: redis:7-alpine

  postgres:
    image: postgres:16-alpine
    volumes: [pg_data:/var/lib/postgresql/data]
```

### Option B : Kubernetes

Pour le scaling horizontal des sandboxes, Kubernetes avec des pods éphémères est recommandé.

## Migration depuis Edge Functions

1. Copier les prompts et la logique de `ai-orchestrator/index.ts` vers `src/agents/*.ts`
2. Remplacer `Deno.env.get()` par `process.env`
3. Remplacer `serve()` par Express routes
4. Ajouter Docker manager pour les sandboxes
5. Configurer `VITE_BACKEND_URL` dans le frontend
6. Tester que le SSE stream est identique
