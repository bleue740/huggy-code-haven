
# Plan : Redirection post-login + Landing Page complete

## Ce qui manque actuellement

### 1. Redirection post-login cassee
- La page Auth lit `location.state.from` et redirige vers cette valeur apres login (ligne 18, 30, 48)
- Probleme : `from` vaut `"/app"` mais l'AppBuilder sur `/app` re-verifie l'auth et affiche le Dashboard -- ca fonctionne
- Cependant, quand on clique "Get started" depuis la Landing sans etre connecte, `handleStartFromLanding` redirige vers `/auth` avec `state: { from: "/app" }` -- le prompt saisi est perdu
- **Correction** : stocker le prompt dans `sessionStorage` avant la redirection, puis le recuperer au retour sur `/app` pour le soumettre automatiquement

### 2. Landing Page incomplete
La page se termine abruptement apres les cartes de suggestions. Il manque :
- **Section Features** (`#features`) : actuellement c'est juste un `<div id="features" />` vide
- **Section How it Works** : inexistante
- **Section Pricing integree** : pas de preview des plans sur la landing
- **Section Social Proof / Stats** : pas de compteur "X apps built"
- **Footer** : inexistant

### 3. Animations au scroll
Aucune animation d'apparition progressive sur les sections

---

## Modifications prevues

### Fichier 1 : `src/app-builder/components/LandingPage.tsx`

**Ajouts complets apres les cartes de suggestions :**

#### Section Features (`#features`)
Grille 3x2 avec 6 fonctionnalites :
- **AI Code Generation** (icone Code) : "Describe what you want, get production-ready React code"
- **Real-time Preview** (icone Monitor) : "See your app update live as AI writes code"
- **One-click Deploy** (icone Rocket) : "Publish your app to the web instantly"
- **Multi-file Projects** (icone FolderTree) : "Full project structure with multiple components"
- **Security Scan** (icone Shield) : "Automated security analysis of your codebase"
- **Smart Iterations** (icone RefreshCw) : "Refine and iterate with natural language"

Design : cartes `bg-[#111]` avec bordures `border-white/5`, icones dans des cercles colores, hover avec `border-blue-500/30`

#### Section How it Works
3 etapes numerotees horizontalement (colonne sur mobile) :
1. "Describe your idea" -- icone MessageSquare
2. "AI builds it" -- icone Sparkles
3. "Deploy instantly" -- icone Rocket

Design : numeros dans des cercles bleus (`bg-blue-600`), ligne de connexion entre etapes (bordure pointillee), cartes `bg-[#111]`

#### Section Pricing (apercu)
3 plans en grille (Free / Pro / Team) reprenant les donnees de `/pricing` :
- Free : $0/mo, 1 projet, publish basique, security scan
- Pro : $29/mo, projets illimites, deploy history, domaines personnalises (bordure bleue highlight)
- Team : $79/mo, roles, collaboration, audit avance

CTA "Choose [plan]" redirige vers `/pricing`

#### Section Stats / Social Proof
Barre de stats entre le hero et les features :
- "12,000+" apps built
- "50+" templates
- "99.9%" uptime

Design : 3 colonnes centrees, chiffres en `text-4xl font-black`, labels en `text-neutral-500 text-sm`

#### Footer
- Logo Blink AI (petit)
- Colonnes de liens : Product (Features, Pricing), Company (About, Contact), Legal (Terms, Privacy)
- Copyright "2026 Blink AI. All rights reserved."
- Bordure superieure `border-t border-white/5`

#### Animations au scroll
- Hook inline `useInView` avec `IntersectionObserver` pour ajouter la classe `animate-fade-in` quand une section entre dans le viewport
- Chaque section majeure enveloppee dans un composant `<AnimatedSection>` qui gere l'observation

### Fichier 2 : `src/app-builder/App.tsx`

**Redirection post-login avec prompt preserve :**
- Dans `handleStartFromLanding` (ligne 378) : avant de rediriger vers `/auth`, stocker le prompt dans `sessionStorage.setItem('blink_pending_prompt', prompt)`
- Dans le `useEffect` initial (ligne 117) : apres detection d'un user connecte, verifier `sessionStorage.getItem('blink_pending_prompt')`. Si present, le supprimer et appeler `handleSendMessage` avec ce prompt apres le chargement du projet

### Fichier 3 : `src/index.css`

**Ajout d'une animation float pour les icones de features :**
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

---

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/app-builder/components/LandingPage.tsx` | Modifier -- ajouter Features, How it Works, Pricing, Stats, Footer, animations scroll |
| `src/app-builder/App.tsx` | Modifier -- stocker/recuperer le prompt pending dans sessionStorage |
| `src/index.css` | Modifier -- ajouter keyframe float |

## Flux de la redirection post-login

```text
Landing Page --> "Get started" (non connecte)
  --> sessionStorage.setItem('blink_pending_prompt', prompt)
  --> navigate('/auth', { state: { from: '/app' } })
  --> Login reussi
  --> redirect vers /app
  --> useEffect detecte user + sessionStorage prompt
  --> soumet le prompt automatiquement
  --> utilisateur voit son app se generer
```
