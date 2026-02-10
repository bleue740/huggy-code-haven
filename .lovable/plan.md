

# Plan : Redirection automatique vers la page de login

## Contexte

Actuellement, quand un utilisateur non connecte essaie d'utiliser le chat AI, il recoit un message d'erreur textuel "Connectez-vous pour utiliser Blink AI." mais rien ne se passe. L'utilisateur doit trouver lui-meme comment se connecter.

## Solution

Intercepter l'erreur 401 dans le composant Sidebar (qui gere le chat) et rediriger automatiquement vers `/auth` avec un parametre `state.from` pour revenir apres la connexion.

## Details techniques

### Fichier modifie : `src/app-builder/components/Sidebar.tsx`

- Importer `useNavigate` de `react-router-dom`
- Dans le callback `onError` du chat AI, detecter le code 401
- Quand code === 401 : afficher un toast d'information puis appeler `navigate("/auth", { state: { from: "/app" } })` apres un court delai (1 seconde) pour que l'utilisateur voie le message avant la redirection

### Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/app-builder/components/Sidebar.tsx` | Modifier -- ajouter redirection sur erreur 401 |

