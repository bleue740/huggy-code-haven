

# Plan: Configuration du Backend IA et Ameliorations Majeures de Blink AI

## Analyse de ta demande

Voici une analyse honnete de ce qui est **realisable maintenant** dans ce projet Lovable et ce qui necessite des **etapes futures** ou des **limites techniques**.

---

## 1. Choix des modeles IA -- Recommandation

Blink AI dispose de **Lovable AI Gateway** qui donne acces aux modeles suivants sans cle API supplementaire :

| Modele | Force | Usage recommande |
|--------|-------|-----------------|
| **google/gemini-3-pro-preview** | Raisonnement complexe, generation de code structure | Projets complexes, multi-pages |
| **google/gemini-3-flash-preview** | Rapide, bon equilibre cout/qualite | Modele par defaut, prototypes rapides |
| **google/gemini-2.5-pro** | Multimodal, gros contexte | Analyse d'images, projets lourds |
| **openai/gpt-5** | Raisonnement avance, precision | Correction de bugs, code senior |
| **openai/gpt-5-mini** | Bon rapport qualite/prix | Taches intermediaires |

**Strategie de routage automatique** : L'edge function analysera la complexite de la demande et routera vers le modele optimal :
- Demande simple (bouton, composant) -> `gemini-3-flash-preview` (rapide)
- Demande complexe (dashboard, app complete) -> `gemini-3-pro-preview` (qualite)
- Correction de bug / refactoring -> `gpt-5` (precision)

**Claude** : Non disponible via le Lovable AI Gateway. Pour l'integrer, il faudra ajouter une cle API Anthropic manuellement plus tard.

---

## 2. Pile technologique pour les projets utilisateurs

Le code genere dans l'iframe utilisera :
- **React 18** (via CDN, deja en place)
- **Tailwind CSS** (via CDN, deja en place)
- **TypeScript/JSX** transpile par Babel dans le navigateur
- **Lucide React** icons (injectable via CDN)
- **Recharts** pour les graphiques (injectable via CDN)
- **Design system** : Mode sombre, arrondis genereux, animations fluides, typographie Inter

---

## 3. Ce qui sera implemente (Phase 1)

### 3.1 Edge Function `ai-chat` -- Coeur du systeme
- Streaming SSE token par token pour un affichage en temps reel
- System prompt optimise pour generer du code React/Tailwind propre et fonctionnel
- Routage automatique du modele selon la complexite
- Gestion des erreurs 429 (rate limit) et 402 (credits epuises)
- Detection et auto-correction des erreurs de code

### 3.2 Animation de generation dans la Preview
- Remplacement de la barre de progression par des **cartes animees avec code defilant** en arriere-plan (style Lovable/Google AI Studio)
- Effet shimmer + code qui apparait progressivement
- Indicateur de phase : "Analyse...", "Generation du code...", "Finalisation..."

### 3.3 Systeme de credits (comme Lovable)
- 1 credit par message envoye
- Verification avant envoi, modal si credits epuises
- Affichage du solde en temps reel dans la sidebar
- Deduction cote serveur (securise)

### 3.4 Chat fonctionnel avec streaming
- Le bouton envoyer appellera l'edge function
- Les tokens s'afficheront progressivement dans le chat
- Le code genere sera extrait et injecte dans la preview en temps reel
- Suggestions contextuelles en fin de conversation (taille reduite, dans le flux)

### 3.5 Bouton Publish ameliore
- Interface modale avec :
  - URL de preview generee
  - Option domaine personnalise (reserve aux abonnes Pro)
  - Historique des deployments
  - Lien GitHub (reserve aux abonnes Pro)
  - Bouton "Update" pour mettre a jour

### 3.6 Detection automatique des failles
- L'IA ajoutera des instructions de securite dans le system prompt
- Validation automatique du code genere (XSS, injection, etc.)
- Scan de securite ameliore avec de vrais checks

---

## 4. Ce qui necessite des etapes futures

| Fonctionnalite | Raison | Quand |
|----------------|--------|-------|
| Integration Claude API | Necessite une cle API Anthropic | Phase 2 (tu fournis la cle) |
| Clonage d'apps via URL | Necessite Firecrawl pour scraper | Phase 2 (connecteur a activer) |
| Recherche web en direct | Necessite Perplexity ou Firecrawl | Phase 2 |
| Captures d'ecran automatiques | Necessite html2canvas dans l'iframe | Phase 2 |
| GitHub integration reelle | Necessite OAuth GitHub | Phase 3 |
| Domaines personnalises reels | Necessite infrastructure DNS | Phase 3 |

---

## 5. Plan d'implementation technique (Phase 1)

### Etape 1 : Creer l'edge function `ai-chat`
- Fichier : `supabase/functions/ai-chat/index.ts`
- Streaming SSE via Lovable AI Gateway
- System prompt expert en React/Tailwind/TypeScript
- Routage automatique du modele
- Deduction de credits cote serveur
- Mise a jour de `supabase/config.toml`

### Etape 2 : Connecter le frontend au backend
- Modifier `src/app-builder/App.tsx` :
  - Remplacer le `setTimeout` simule par un appel SSE reel
  - Parser les tokens pour extraire le code React
  - Injecter le code dans les fichiers et la preview en temps reel
  - Deduire les credits apres envoi reussi

### Etape 3 : Animation de generation dans la preview
- Modifier `src/app-builder/components/CodePreview.tsx` :
  - Overlay anime pendant `isGenerating` avec cartes de code defilantes
  - Effet "matrix" avec du code qui apparait en arriere-plan
  - Phases animees : Analyse -> Generation -> Finalisation

### Etape 4 : Ameliorer la sidebar
- Modifier `src/app-builder/components/Sidebar.tsx` :
  - Suggestions contextuelles en fin de conversation (petites, inline)
  - Rendu markdown des reponses IA
  - Streaming visuel token par token

### Etape 5 : Ameliorer le modal Publish
- Modifier `src/app-builder/App.tsx` et `TopNav.tsx` :
  - Interface Publish complete avec onglets (Preview, Domaine, GitHub)
  - Restriction des fonctionnalites Pro (domaine, GitHub) aux abonnes
  - Historique des publications

### Etape 6 : System prompt optimise
Le prompt systeme sera concu pour :
- Generer du code React 18 + Tailwind CSS propre et structure
- Suivre les tendances design modernes (glassmorphism, arrondis, animations)
- Produire du code "senior" : bien structure, composants reutilisables
- Inclure la validation de securite (sanitization, pas de XSS)
- Toujours inclure les imports et le rendu ReactDOM

---

## 6. Fichiers modifies/crees

| Fichier | Action |
|---------|--------|
| `supabase/functions/ai-chat/index.ts` | Creer -- Edge function IA streaming |
| `supabase/config.toml` | Modifier -- Ajouter la fonction ai-chat |
| `src/app-builder/App.tsx` | Modifier -- Connecter au backend reel |
| `src/app-builder/components/CodePreview.tsx` | Modifier -- Animations de generation |
| `src/app-builder/components/Sidebar.tsx` | Modifier -- Streaming + suggestions inline |
| `src/app-builder/components/TopNav.tsx` | Modifier -- Modal Publish ameliore |
| `src/app-builder/components/PublishModal.tsx` | Creer -- Interface de publication |
| `src/app-builder/components/GeneratingOverlay.tsx` | Creer -- Animation de generation |
| `src/app-builder/hooks/useAIChat.ts` | Creer -- Hook de streaming SSE |

---

## Resume

Cette Phase 1 transformera Blink AI d'un prototype avec des reponses simulees en un **vrai SaaS fonctionnel** qui genere du code React en temps reel avec des modeles IA de pointe. Les animations, le streaming, et le systeme de credits seront au niveau de ce que font Lovable et Google AI Studio.

