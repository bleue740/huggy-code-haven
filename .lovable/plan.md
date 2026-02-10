

# Audit complet de Blink AI + Integration Anthropic API

## Etat actuel du SaaS

### Ce qui fonctionne
- Auth (login/signup) avec redirection post-login
- Dashboard multi-projets (CRUD, rename, duplicate, delete)
- Chat IA avec streaming SSE (Gemini Flash/Pro + GPT-5)
- Preview live React dans iframe (Babel + Tailwind CDN)
- Editeur de code multi-fichiers avec CodeMirror
- Systeme de credits (100 gratuits, deduction par requete)
- Landing page avec sections Features, How it Works, Pricing, Community
- Suggestions dynamiques via edge function
- Console capture des logs iframe
- Voice input (speech-to-text)
- Settings (profil, subscription, delete account)
- Pricing page (3 plans)

### Tables en base
- `projects` (id, user_id, name, schema, code)
- `users_credits` (user_id, credits, lifetime_used)
- `deployments` (user_id, project_id, slug, schema_snapshot, url)
- `community_showcases` (project_id, title, deploy_url, score, expires_at)

### Edge functions
- `ai-chat` : streaming avec routing de modele (simple/complex/fix)
- `generate-suggestions` : generation de 4 idees via tool calling

---

## Ce qui manque pour un SaaS fonctionnel et puissant

### 1. CRITIQUE - Deploiement reel inexistant
Le bouton "Publish" est **100% simule** (setTimeout de 3s, pas de vrai deploy). La page `PublishedDeployment` affiche juste "Published: slug" sans aucun rendu du code. C'est la fonctionnalite la plus importante manquante.

### 2. CRITIQUE - Paiement inexistant
Le bouton "Passer Pro" ne fait que `credits + 50` localement. Pas de Stripe, pas de paiement reel, pas de gestion d'abonnement. Les plans Pricing sont purement visuels.

### 3. CRITIQUE - Security scan simule
Le scan retourne des resultats en dur apres un timeout de 2.5s. Aucune analyse reelle du code.

### 4. IMPORTANT - Pas de multi-conversation
Un seul historique de chat par projet. Pas de sauvegarde des conversations, pas d'historique persistant.

### 5. IMPORTANT - Pas de templates
Le bouton "Templates" dans le Dashboard ne fait rien. Pas de galerie de templates pre-construits.

### 6. IMPORTANT - Credits manipulables cote client
`useCredits.ts` fait des updates directs de la table `users_credits` depuis le client. Un utilisateur pourrait s'ajouter des credits via la console browser. La deduction devrait etre uniquement cote serveur (deja fait dans `ai-chat`, mais le client peut aussi modifier).

### 7. MODERE - Pas d'export/download du code
Les utilisateurs ne peuvent pas telecharger leur code source en ZIP.

### 8. MODERE - Recharts non charge dans la preview
Le system prompt mentionne Recharts comme global disponible, mais le CDN Recharts n'est pas inclus dans l'iframe HTML. Les charts generes ne fonctionneront pas.

### 9. MODERE - Pas de Lucide dans la preview
Le system prompt mentionne `lucide` comme global, mais aucun CDN Lucide n'est charge dans l'iframe.

### 10. MINEUR - GitHub integration placeholder
Le bouton "Connect GitHub" affiche un toast "coming soon". Pas d'integration reelle.

### 11. MINEUR - Custom Domain placeholder
Meme chose : toast "coming soon".

### 12. MINEUR - Delete account incomplet
`handleDeleteAccount` supprime les projets et deconnecte, mais ne supprime pas reellement le compte auth (impossible depuis le client sans service_role).

---

## A propos de l'Anthropic API

L'Anthropic API (Claude) n'est **pas disponible via le Lovable AI Gateway**. Les modeles supportes sont uniquement Google Gemini et OpenAI GPT.

Pour integrer Anthropic, il faudrait :
1. Que tu obtiennes une **cle API Anthropic** depuis console.anthropic.com
2. Creer une edge function qui appelle directement `https://api.anthropic.com/v1/messages`
3. Stocker la cle en secret dans le backend

### Plan d'implementation Anthropic

| Etape | Detail |
|-------|--------|
| 1. Secret API | Stocker `ANTHROPIC_API_KEY` comme secret backend |
| 2. Edge function `ai-chat` | Ajouter un 4eme modele `anthropic/claude-sonnet` dans le routing |
| 3. Adapter le format | L'API Anthropic utilise un format different (pas compatible OpenAI) : headers `x-api-key` + `anthropic-version`, body avec `max_tokens` obligatoire, streaming via SSE `content_block_delta` |
| 4. Routing | Ajouter un cas `"precision"` ou `"advanced"` qui route vers Claude pour les taches complexes |
| 5. Format SSE | Parser les events Anthropic (`content_block_delta` au lieu de `choices[0].delta.content`) et les re-emettre au format attendu par le client |

### Fichiers a modifier

| Fichier | Action |
|---------|--------|
| `supabase/functions/ai-chat/index.ts` | Ajouter le routing Anthropic + adapter le streaming |
| Secret `ANTHROPIC_API_KEY` | A configurer via le backend |

### Architecture du streaming Anthropic

Le client n'a pas besoin de changer. L'edge function recevra le stream Anthropic et le re-formatera en SSE compatible OpenAI avant de le renvoyer au client :

```text
Client <--SSE OpenAI format-- Edge Function <--SSE Anthropic format-- Anthropic API
```

L'edge function agira comme un proxy de traduction :
- Anthropic envoie : `event: content_block_delta` + `{"delta":{"text":"..."}}`
- On re-emet : `data: {"choices":[{"delta":{"content":"..."}}]}`
- Le client existant (`useAIChat.ts`) fonctionne sans modification

### Routing de modele mis a jour

| Complexite | Modele actuel | Avec Anthropic |
|------------|---------------|----------------|
| simple | Gemini 3 Flash | Gemini 3 Flash (inchange) |
| complex | Gemini 3 Pro | Claude Sonnet (meilleur pour le code) |
| fix | GPT-5 | GPT-5 (inchange, ou Claude selon preference) |

---

## Resume des priorites

### A faire en premier (pour un SaaS reel)
1. Integration Anthropic API (ce plan)
2. Deploiement reel (preview publique)
3. Integration Stripe pour les paiements
4. Securiser les credits (supprimer les updates client)

### A faire ensuite
5. Charger Recharts + Lucide dans l'iframe preview
6. Export ZIP du code
7. Templates gallery
8. Multi-conversations persistantes

### Nice to have
9. Security scan reel (analyse AST du code)
10. GitHub sync
11. Custom domains
12. Delete account complet via edge function

