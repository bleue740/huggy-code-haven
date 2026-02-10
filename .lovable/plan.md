
# Plan : Blink AI Full-Stack Builder + Firecrawl Integration

## Vue d'ensemble

Transformer Blink AI d'un generateur frontend-only en un builder full-stack intelligent qui :
1. Detecte quand l'utilisateur a besoin d'une base de donnees/backend
2. Propose de connecter Supabase directement dans le chat (en un clic)
3. Genere du code avec intregration Supabase (auth, CRUD, storage)
4. Integre Firecrawl pour le scraping/recherche web dans les apps generees

---

## 1. Intelligence contextuelle dans le System Prompt

### Probleme actuel
Le system prompt (lignes 49-98 de `ai-chat/index.ts`) ne genere que du code React sandbox avec des globals CDN. Aucune notion de backend, base de donnees, ou API.

### Solution
Enrichir le system prompt avec des instructions full-stack conditionnelles. Quand l'utilisateur demande une fonctionnalite qui necessite un backend (auth, base de donnees, API, stockage), l'IA doit :
- Detecter le besoin backend dans le message
- Retourner un bloc special `[NEEDS_BACKEND:supabase]` ou `[NEEDS_BACKEND:firecrawl]` dans sa reponse avant le code
- Generer du code qui utilise un client Supabase simule (mock) dans le sandbox, avec les bonnes structures de donnees

### Detection backend intelligente
Ajouter une fonction `detectBackendNeeds(prompt)` dans l'edge function qui analyse le message pour detecter :
- **Database** : "base de donnees", "sauvegarder", "persister", "CRUD", "stocker", "table", "utilisateurs"
- **Auth** : "login", "inscription", "authentification", "mot de passe", "connexion utilisateur"
- **Storage** : "upload", "fichier", "image", "photo", "stockage"
- **API/Scraping** : "scraper", "extraire", "crawler", "site web", "URL", "firecrawl"

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/ai-chat/index.ts` | Ajouter `detectBackendNeeds()`, enrichir system prompt conditionnel, ajouter un flag `backendHints` dans la reponse SSE |

---

## 2. Interface "Connect Supabase" dans le chat

### Fonctionnement
Quand l'IA detecte un besoin backend, elle retourne une reponse contenant un marqueur special. Le frontend le detecte et affiche un widget interactif inline dans le chat :

```text
[USER] : Cree une app de todo avec sauvegarde

[BLINK AI] : Pour persister les todos, vous aurez besoin d'une base de donnees.

  ┌──────────────────────────────────────────┐
  │  🗄️  Connecter une base de donnees       │
  │                                          │
  │  Blink peut generer du code avec         │
  │  Supabase integre (auth, CRUD, storage)  │
  │                                          │
  │  [🔗 Connecter Supabase]  [⏭️ Ignorer]   │
  └──────────────────────────────────────────┘
```

### Implementation

**Etape 1 : Marqueurs dans la reponse AI**

L'edge function insere un hint dans le flux SSE quand un besoin backend est detecte :
- Avant le stream principal, envoyer un event SSE custom : `data: {"type":"backend_hint","needs":["database","auth"]}`
- Le frontend le parse et affiche le widget

**Etape 2 : Widget Sidebar inline**

Creer un composant `BackendConnectCard` qui s'affiche dans le chat et offre :
- Bouton "Connecter Supabase" qui ouvre un modal avec :
  - Champ URL du projet Supabase
  - Champ Anon Key
  - Bouton de test de connexion
  - Auto-detection des tables existantes
- Bouton "Ignorer" qui continue avec des mocks

**Etape 3 : Stockage de la config Supabase par projet**

Ajouter deux colonnes a la table `projects` :
- `supabase_url` (text, nullable)
- `supabase_anon_key` (text, nullable)

Quand ces champs sont remplis, le system prompt inclut les instructions pour generer du vrai code Supabase.

### Fichiers a creer/modifier

| Fichier | Action |
|---------|--------|
| `src/app-builder/components/BackendConnectCard.tsx` | Creer - widget inline pour connecter Supabase |
| `src/app-builder/components/SupabaseConnectModal.tsx` | Creer - modal de configuration Supabase |
| `src/app-builder/components/Sidebar.tsx` | Modifier - parser les hints backend, afficher le widget dans le chat |
| `src/app-builder/App.tsx` | Modifier - gerer la config Supabase dans le state, passer au backend |
| `src/app-builder/types.ts` | Modifier - ajouter `supabaseUrl`, `supabaseAnonKey` a `AppState` |
| `supabase/functions/ai-chat/index.ts` | Modifier - ajouter detection backend, system prompt conditionnel |
| Migration SQL | Ajouter `supabase_url` et `supabase_anon_key` a `projects` |

---

## 3. System Prompt Full-Stack conditionnel

Quand un projet a une connexion Supabase configuree, le system prompt ajoute :

```
## SUPABASE INTEGRATION
The user has connected a Supabase project. Generate code that uses the Supabase JS client.
- Include this at the top: const supabaseClient = window.__SUPABASE_CLIENT__;
- Use supabaseClient.from('table').select/insert/update/delete for CRUD
- Use supabaseClient.auth.signInWithPassword / signUp for auth
- Use supabaseClient.storage.from('bucket').upload for files
- The Supabase client is pre-initialized and available as a global
```

Le `CodePreview.tsx` sera modifie pour injecter le client Supabase dans l'iframe :

```html
<script>
  window.__SUPABASE_CLIENT__ = supabase.createClient(URL, ANON_KEY);
</script>
```

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/app-builder/components/CodePreview.tsx` | Injecter le client Supabase dans l'iframe quand configure |
| `supabase/functions/ai-chat/index.ts` | System prompt conditionnel avec instructions Supabase |

---

## 4. Integration Firecrawl

### Architecture
Ajouter Firecrawl comme capacite de scraping/recherche web accessible depuis les apps generees.

**Etape 1 : Connecter Firecrawl**

Utiliser le connecteur Firecrawl disponible pour obtenir la cle API.

**Etape 2 : Edge function proxy**

Creer une edge function `firecrawl-proxy` qui expose les 4 operations Firecrawl (scrape, search, map, crawl) aux apps generees par les utilisateurs.

**Etape 3 : Detection dans le chat**

Quand l'utilisateur demande du scraping/crawling, l'IA :
- Detecte le besoin via les keywords (scraper, extraire, crawler, URL)
- Affiche un widget "Activer Firecrawl" similaire au widget Supabase
- Genere du code qui appelle l'edge function proxy

**Etape 4 : Code genere avec Firecrawl**

Le system prompt ajoute des instructions pour utiliser Firecrawl quand actif :
```
## FIRECRAWL (Web Scraping)
A Firecrawl proxy is available. Use window.__FIRECRAWL__ to scrape/search:
- window.__FIRECRAWL__.scrape(url) - Extract content from a URL
- window.__FIRECRAWL__.search(query) - Search the web
These functions call the backend proxy and return JSON.
```

### Fichiers a creer/modifier

| Fichier | Action |
|---------|--------|
| `supabase/functions/firecrawl-proxy/index.ts` | Creer - proxy pour les 4 operations Firecrawl |
| `src/app-builder/components/FirecrawlConnectCard.tsx` | Creer - widget inline pour activer Firecrawl |
| `src/app-builder/components/CodePreview.tsx` | Modifier - injecter le helper Firecrawl dans l'iframe |
| `supabase/functions/ai-chat/index.ts` | Modifier - ajouter les instructions Firecrawl au system prompt |

---

## 5. Rendre l'IA plus intelligente

### Ameliorations du routage de modeles

Modifier `detectComplexity()` pour etre plus precis :

| Scenario | Modele |
|----------|--------|
| Simple UI (bouton, card) | Gemini 3 Flash |
| Full-stack avec Supabase | Claude Sonnet (complex) |
| Fix/debug | GPT-5 |
| Scraping/data processing | Gemini 2.5 Pro |

### Ameliorations du contexte

- Augmenter la fenetre de contexte de 8000 a 12000 caracteres pour les projets multi-fichiers
- Envoyer la config Supabase (tables existantes) comme contexte additionnel
- Ajouter un "memory" : resume des 20 derniers messages au lieu d'envoyer les 10 derniers bruts

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/ai-chat/index.ts` | Ameliorer `detectComplexity()`, augmenter le contexte, ajouter les types "data" et "scraping" |

---

## 6. Migration de base de donnees

```sql
ALTER TABLE public.projects 
ADD COLUMN supabase_url text,
ADD COLUMN supabase_anon_key text,
ADD COLUMN firecrawl_enabled boolean DEFAULT false;
```

---

## Resume des fichiers

### A creer (5 fichiers)
1. `src/app-builder/components/BackendConnectCard.tsx` - Widget chat pour connecter un backend
2. `src/app-builder/components/SupabaseConnectModal.tsx` - Modal de config Supabase
3. `src/app-builder/components/FirecrawlConnectCard.tsx` - Widget chat pour activer Firecrawl
4. `supabase/functions/firecrawl-proxy/index.ts` - Proxy edge function pour Firecrawl
5. Migration SQL pour les nouvelles colonnes

### A modifier (6 fichiers)
1. `supabase/functions/ai-chat/index.ts` - Detection backend + system prompt conditionnel + routage ameliore
2. `src/app-builder/components/CodePreview.tsx` - Injection Supabase + Firecrawl dans l'iframe
3. `src/app-builder/components/Sidebar.tsx` - Parsing des hints backend + affichage des widgets
4. `src/app-builder/App.tsx` - State Supabase/Firecrawl + handlers
5. `src/app-builder/types.ts` - Nouveaux champs AppState
6. `supabase/config.toml` - Declarer la nouvelle edge function firecrawl-proxy

### Ordre d'implementation
1. Migration SQL (colonnes projects)
2. Types + AppState
3. Edge function ai-chat (detection + system prompt)
4. Composants UI (BackendConnectCard, SupabaseConnectModal, FirecrawlConnectCard)
5. Sidebar (parsing hints)
6. CodePreview (injection clients)
7. Edge function firecrawl-proxy
8. App.tsx (wiring final)
