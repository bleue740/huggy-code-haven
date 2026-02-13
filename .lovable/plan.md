

# Plan: Orchestrateur Agent Renforcé + Architecture Backend

## Contexte

Le projet a deja un orchestrateur (`ai-orchestrator` edge function) avec 4 agents (Planner, Generator, Validator, Fixer). Le plan vise a renforcer les prompts contractuels, ameliorer le flux pipeline, et clarifier l'option backend Node.js.

## Partie 1 : Backend Node.js Separe — Realite

Un vrai serveur Node.js (avec Vite, Docker, Git) ne peut pas etre cree depuis Lovable. Cependant, voici ce qui est faisable :

- Documenter l'architecture cible dans un fichier `ARCHITECTURE.md` pour qu'un developpeur puisse implementer le backend separement
- Preparer le frontend pour accepter une URL backend configurable (variable d'environnement `VITE_BACKEND_URL`)
- Structurer l'orchestrateur edge function pour qu'il soit facilement portable vers un serveur Node.js Express

## Partie 2 : Renforcement de l'Orchestrateur (Edge Function)

### 2.1 — Prompts Contractuels Plus Stricts

Chaque agent recevra un prompt reecrit avec :
- Des contraintes NON-NEGOCIABLES en majuscules
- Des exemples de sortie JSON valides et invalides
- Des regles de rejet explicites (quand l'agent doit refuser d'agir)
- Un schema JSON strict documente dans chaque prompt

### 2.2 — Planner Agent Ameliore

- Ajout de detection d'intent plus precise (CRUD, UI, refactor, fix, question)
- Ajout de `dependencies_needed` dans la sortie pour anticiper les imports
- Meilleure gestion des requetes ambigues avec `clarification_needed: true`

### 2.3 — Generator Agent Ameliore

- Injection du contexte projet complet (features, decisions, constraints)
- Ajout d'une regle de coherence : le generator doit verifier que les composants references existent dans le filesystem
- Limite de taille par fichier pour eviter les reponses tronquees

### 2.4 — Validator Agent Ameliore

- Ajout de verifications : composants references mais non definis, fonctions globales manquantes
- Score de confiance (0-100) dans la sortie
- Categories d'erreurs plus granulaires

### 2.5 — Fixer Agent avec Retry

- Maximum 2 passes de fix (actuellement 1 seule)
- Si les erreurs persistent apres 2 passes, renvoyer les erreurs au client avec un message explicatif
- Le fixer recoit aussi le plan original pour comprendre l'intention

### 2.6 — Model Routing Ameliore

- Utiliser `openai/gpt-5` pour le Generator sur les taches complexes
- Utiliser `google/gemini-3-flash-preview` pour Planner/Validator/Fixer (rapide et suffisant)
- Ajouter detection de complexite basee sur le nombre de fichiers impactes dans le plan

## Partie 3 : Frontend — URL Backend Configurable

- Ajouter `VITE_BACKEND_URL` comme variable optionnelle
- Si definie, le `useOrchestrator` pointe vers cette URL au lieu de l'edge function
- Permet de basculer vers un vrai backend Node.js plus tard sans modifier le frontend

## Partie 4 : Documentation Architecture

- Creer `ARCHITECTURE.md` avec le schema complet du backend Node.js cible (Docker, Vite sandbox, Git, deploiement)
- Inclure les endpoints API attendus pour que le backend soit compatible avec le frontend existant

---

## Fichiers a Modifier/Creer

| Fichier | Action | Description |
|---|---|---|
| `supabase/functions/ai-orchestrator/index.ts` | Modifier | Prompts renforces, retry fixer, model routing, project context injection |
| `src/app-builder/hooks/useOrchestrator.ts` | Modifier | Support URL backend configurable |
| `ARCHITECTURE.md` | Creer | Documentation architecture backend Node.js cible |

## Details Techniques

### Nouveau flux pipeline (orchestrateur)

```text
Request
  |
  v
[Auth + Credits Check]
  |
  v
[PLANNER] -- gemini-3-flash
  |         intent, steps, risk_level, dependencies_needed
  |         Si conversational -> reponse directe
  |         Si clarification_needed -> demander precision
  v
[GENERATOR] -- gpt-5 (complexe) ou gemini-3-flash (simple)
  |           files[] avec contenu complet
  |           Recoit: plan + filesystem + project context
  v
[VALIDATOR] -- gemini-3-flash
  |           errors[], warnings[], confidence_score
  |           Si confidence >= 80 et 0 erreurs -> skip fixer
  v
[FIXER] -- meme modele que generator (max 2 passes)
  |         Revalide apres chaque passe
  v
[RESULT] -> SSE stream au client
```

### Schema de sortie Planner (ameliore)

```text
{
  "intent": "string",
  "risk_level": "low|medium|high",
  "conversational": boolean,
  "clarification_needed": boolean,
  "clarification_question": "string|null",
  "reply": "string|null",
  "dependencies_needed": ["string"],
  "steps": [
    {
      "id": number,
      "action": "create|modify|delete",
      "target": "string",
      "path": "string|null",
      "description": "string",
      "priority": "critical|normal|optional"
    }
  ]
}
```

### Schema de sortie Validator (ameliore)

```text
{
  "valid": boolean,
  "confidence_score": 0-100,
  "errors": [
    {
      "type": "syntax|runtime|security|import|reference",
      "file": "string",
      "message": "string",
      "severity": "critical|major|minor"
    }
  ],
  "warnings": [...]
}
```

