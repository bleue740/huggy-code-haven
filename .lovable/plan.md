

# Export ZIP du code + SEO

## 1. Export ZIP du code source

### Objectif
Permettre aux utilisateurs de telecharger tout leur code genere en un fichier ZIP, avec une structure de projet propre et fonctionnelle.

### Implementation

**Librairie** : Utiliser `JSZip` (CDN import dynamique) pour generer le ZIP cote client sans dependance supplementaire.

**Fichier a creer** : `src/app-builder/utils/exportZip.ts`
- Fonction `exportProjectAsZip(files: Record<string, string>, projectName: string)`
- Genere un ZIP contenant :
  - `src/App.tsx` (et tous les fichiers du projet)
  - `public/index.html` (template HTML avec React/Tailwind CDN)
  - `package.json` minimal (react, react-dom, tailwindcss)
  - `README.md` avec instructions de lancement
- Telecharge automatiquement le fichier via `URL.createObjectURL`

**Fichiers a modifier** :
| Fichier | Modification |
|---------|-------------|
| `src/app-builder/utils/exportZip.ts` | Creer - logique de generation ZIP |
| `src/app-builder/components/TopNav.tsx` | Ajouter un bouton "Download ZIP" dans le menu Publish dropdown |
| `src/app-builder/App.tsx` | Passer `state.files` et `state.projectName` au handler d'export |

### Bouton dans le menu Publish
Ajouter un `DropdownItem` avec icone `Download` entre "Run Security Scan" et le separateur GitHub :

```text
Deploy to Cloud
Run Security Scan
Download ZIP        <-- nouveau
───────────────────
Connect GitHub
Custom Domain
```

---

## 2. SEO - Metadonnees du site

### Probleme actuel
Le `index.html` contient des metadonnees generiques de Lovable :
- Title : "Lovable App"
- Description : "Lovable Generated Project"
- OG Image : lien vers lovable.dev

### Corrections

**Fichier a modifier** : `index.html`

| Meta | Valeur actuelle | Nouvelle valeur |
|------|----------------|-----------------|
| `<title>` | Lovable App | Blink AI - Generateur d'applications React par IA |
| `meta description` | Lovable Generated Project | Creez des applications web React en quelques secondes avec l'IA. Blink genere du vrai code, pas du no-code. |
| `og:title` | Lovable App | Blink AI - Creez des apps React avec l'IA |
| `og:description` | (manquant) | Generez des interfaces React modernes instantanement. Preview live, deploy, export. |
| `twitter:card` | summary_large_image | summary_large_image (inchange) |
| `twitter:site` | @Lovable | @BlinkAI (ou supprimer) |
| `lang` | en | fr |
| Keywords | (manquant) | Ajouter `meta keywords` : AI, React, code generator, web app builder |
| Canonical | (manquant) | Ajouter `link rel="canonical"` |
| Theme color | (manquant) | Ajouter `meta theme-color` : #050505 |
| Favicon | placeholder Lovable | Garder tel quel (ou fournir un favicon Blink plus tard) |

---

## 3. Etat actuel du SaaS - Audit mis a jour

### Ce qui fonctionne maintenant
- Auth (login/signup) avec redirection
- Dashboard multi-projets (CRUD)
- Chat IA avec streaming (Gemini Flash + Claude Sonnet + GPT-5)
- Preview live React dans iframe avec Recharts + Lucide
- Editeur de code multi-fichiers
- Credits securises (deduction serveur uniquement)
- Security scan reel (analyse statique du code)
- Deploiement reel (upsert en base + page de rendu)
- Page Pricing avec 4 plans et toggle annuel/mensuel
- Landing page avec sections completes
- Settings (profil, subscription)

### Ce qui manque encore

| Priorite | Fonctionnalite | Detail |
|----------|---------------|--------|
| CRITIQUE | Paiement Stripe | Les boutons Pricing ne font rien. Le bouton "Passer Pro" dans l'Upgrade Modal ajoute encore 50 credits cote client (ligne 597 de App.tsx) au lieu de creer un checkout Stripe |
| IMPORTANT | Templates gallery | Le bouton "Templates" du Dashboard ne fait rien |
| IMPORTANT | Multi-conversations | Les conversations ne sont pas persistees en base |
| IMPORTANT | Generation full-stack | Le SaaS ne genere que du frontend React sandboxe. Pas de backend, pas d'API, pas d'auth generee |
| MODERE | GitHub sync | Placeholder "coming soon" |
| MODERE | Custom domains | Placeholder "coming soon" |
| MODERE | Delete account complet | Ne supprime pas le compte auth (impossible sans service_role cote client) |
| MINEUR | Favicon Blink | Le favicon est celui par defaut de Lovable |

### Resume technique des modifications

1. **Creer** `src/app-builder/utils/exportZip.ts` : import dynamique de JSZip, generation d'un ZIP avec structure projet complete
2. **Modifier** `src/app-builder/components/TopNav.tsx` : ajouter le bouton Download ZIP dans le dropdown Publish
3. **Modifier** `src/app-builder/App.tsx` : ajouter le handler `handleExportZip` et le passer a TopNav
4. **Modifier** `index.html` : mettre a jour toutes les balises meta pour Blink AI (title, description, OG, Twitter, theme-color, canonical, lang)

