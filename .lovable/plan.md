
# Page "About" / Documentation - Clone Lovable.dev pour Blink

## Objectif

Creer une page `/about` qui presente Blink exactement comme Lovable.dev presente sa plateforme : description complete, cas d'usage, public cible, types d'applications, securite, et integration dans les workflows existants. Tout adapte au branding Blink.

## Nouvelle page : `src/pages/About.tsx`

Une page documentaire dark theme (`bg-[#0a0a0a]`) avec le meme style que les pages Pricing et Credits, contenant les sections suivantes :

### Section 1 - Introduction
- Titre : "Blink"
- Sous-titre descriptif : "Blink is a complete AI development platform for building, iterating, and deploying web applications using natural language, with real code, enhanced security, and enterprise governance."
- Paragraphe expliquant que Blink permet aux individus et equipes de creer des apps web de qualite professionnelle en langage naturel (frontend, backend, database, auth, integrations)

### Section 2 - Why use Blink?
4 cartes avec icones :
- **Faster iteration** : go from idea to working software using natural language
- **Collaborate when needed** : shared workspaces for varied roles
- **Code ownership & flexibility** : full ownership, integrate with existing workflows
- **Built for enterprise** : security, privacy, and governance built in

### Section 3 - Who is Blink for?
4 categories avec descriptions :
- **Individual builders** : founders, students, indie creators
- **Product, design & marketing teams** : PMs, designers, marketers
- **Technical teams & agencies** : developers, engineering teams, agencies
- **Enterprises** : internal tools, compliance, governance

### Section 4 - What can you build?
Liste de types d'applications avec icones :
- SaaS & business apps
- Consumer web apps
- Platforms & e-commerce
- Internal tools
- Marketing sites & landing pages
- Educational tools
- Games & interactive content

### Section 5 - How Blink fits your workflow
4 etapes numerotees :
1. Describe what you want to build
2. Review and improve the generated app
3. Sync code with GitHub
4. Deploy, operate, and manage

### Section 6 - Security, privacy & compliance
Badges ISO 27001, GDPR, SOC 2 (meme style que la page Pricing)
Texte sur la securite enterprise

### Header et Footer
- Header : branding Blink + lien Sign in (meme style que Pricing)
- Footer : copyright Blink

## Modifications additionnelles

### `src/App.tsx`
- Importer `AboutPage` et ajouter la route `<Route path="/about" element={<AboutPage />} />`

### `src/app-builder/components/LandingPage.tsx`
- Ajouter un lien "About" dans la navigation desktop (ligne 207-209) et mobile (ligne 234-238)
- Ajouter un lien "About" dans le footer sous "Company" (ligne 463)

### `src/pages/Pricing.tsx`
- Ajouter un lien "About Blink" dans le header a cote de "Sign in"

## Fichiers

- `src/pages/About.tsx` — creation (nouvelle page)
- `src/App.tsx` — ajout route `/about`
- `src/app-builder/components/LandingPage.tsx` — ajout liens navigation + footer
- `src/pages/Pricing.tsx` — ajout lien header

## Details techniques

La page utilise le meme design system que Pricing et Credits :
- Background `bg-[#0a0a0a]`, texte `text-white`
- Cartes avec `border border-white/10 bg-white/[0.03]`
- Icones Lucide React
- Composants existants : aucun nouveau composant UI necessaire
- Responsive : grille 1 colonne mobile, 2-4 colonnes desktop
- Pas de donnees dynamiques, page 100% statique
