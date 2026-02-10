

# Plan : Security Scan reel + Page Pricing style Lovable

## 1. Security Scan reel (analyse du code genere)

### Probleme actuel
Le `handleRunSecurity` dans `App.tsx` (lignes 386-399) retourne des resultats en dur apres un `setTimeout` de 2.5s. Aucune analyse reelle du code utilisateur.

### Solution
Creer une fonction d'analyse statique cote client qui parcourt tous les fichiers du projet et detecte les patterns dangereux :

**Regles de detection :**

| Regle | Severite | Pattern detecte |
|-------|----------|-----------------|
| XSS via dangerouslySetInnerHTML | error | `dangerouslySetInnerHTML` |
| eval() usage | error | `eval(` |
| innerHTML direct | warning | `.innerHTML` |
| document.write | warning | `document.write` |
| Imports HTTP non-securises | warning | `http://` dans les imports/fetch |
| Console.log en production | info | `console.log` |
| Secrets/tokens en dur | error | Patterns comme `apiKey`, `secret`, `password` avec valeurs en dur |
| onclick inline handlers | info | `onclick=` dans du HTML brut |
| Script injection via template literals | warning | Injection dans des template strings HTML |

**Architecture :**
- Nouvelle fonction utilitaire `analyzeCodeSecurity(files: Record<string, string>)` dans un fichier dedie `src/app-builder/utils/securityAnalyzer.ts`
- Retourne un tableau de `SecurityResult` avec un score calcule (100 - penalites)
- Remplace le `setTimeout` mock dans `handleRunSecurity`

### Fichiers a modifier/creer

| Fichier | Action |
|---------|--------|
| `src/app-builder/utils/securityAnalyzer.ts` | Creer - moteur d'analyse statique |
| `src/app-builder/App.tsx` | Modifier `handleRunSecurity` (lignes 386-399) pour utiliser l'analyseur reel |
| `src/app-builder/types.ts` | Enrichir `SecurityResult` avec un champ `severity` et `line` optionnels |

---

## 2. Page Pricing style Lovable.dev

### Design actuel
La page `src/pages/Pricing.tsx` est minimaliste : 3 cartes simples avec peu d'infos, pas de toggle annuel/mensuel, pas de descriptions de plans, pas de liste de features detaillee.

### Nouveau design inspire de Lovable
En s'inspirant de la capture de lovable.dev/pricing :

- **4 plans** : Free, Pro, Business, Enterprise
- **Header** avec titre centre + sous-titre
- **Toggle annuel/mensuel** sur les plans payants (avec reduction affichee)
- **Description de chaque plan** (pas juste le nom)
- **Liste de features** avec icones check, organisee en "All features in X, plus:"
- **Selecteur de credits** sur Pro et Business
- **CTA differencies** : "Get Started" vs "Book a demo"
- **Design** : fond clair/blanc pour les cartes, bordures subtiles, plan Pro mis en avant

### Fichier a modifier

| Fichier | Action |
|---------|--------|
| `src/pages/Pricing.tsx` | Reecrire completement avec le nouveau design |

---

## 3. Ce qui manque encore au SaaS (mise a jour de l'audit)

Apres les corrections precedentes (CDN, credits securises, deploy reel, Anthropic), voici les points restants :

### Toujours critique
- **Paiement reel** : Les boutons de pricing ne font rien. Stripe n'est pas integre.
- **Upgrade modal** (ligne 602) : Le bouton "Passer Pro" ajoute encore `credits + 50` cote client au lieu de rediriger vers un checkout.

### Important
- **Templates gallery** : Le bouton "Templates" dans le Dashboard ne fait rien.
- **Multi-conversations** : Pas de persistance des conversations en base.
- **Export ZIP** : Pas de moyen de telecharger le code.

### Modere
- **GitHub sync** : Placeholder "coming soon".
- **Custom domains** : Placeholder "coming soon".
- **Delete account** : Incomplet (ne supprime pas le compte auth).

---

## Resume technique des modifications

1. **Creer** `src/app-builder/utils/securityAnalyzer.ts` : ~80 lignes, analyse regex du code avec scoring
2. **Modifier** `src/app-builder/types.ts` : Ajouter `severity` et `line` a `SecurityResult`
3. **Modifier** `src/app-builder/App.tsx` : Remplacer le mock `handleRunSecurity` par l'appel a `analyzeCodeSecurity`
4. **Reecrire** `src/pages/Pricing.tsx` : Nouveau design 4 plans avec toggle, features detaillees, style Lovable

