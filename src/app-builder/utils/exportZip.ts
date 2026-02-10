/**
 * Export project files as a downloadable ZIP using JSZip (loaded dynamically from CDN).
 */

async function loadJSZip(): Promise<any> {
  // @ts-ignore - dynamic CDN import
  const module = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
  return module.default ?? module;
}

const INDEX_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blink AI App</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.min.js"><\/script>
  <script src="https://unpkg.com/recharts@2/umd/Recharts.js"><\/script>
</head>
<body class="bg-gray-950 text-white">
  <div id="root"></div>
  <script type="text/babel" src="./src/App.tsx"><\/script>
</body>
</html>`;

function generatePackageJson(projectName: string): string {
  return JSON.stringify(
    {
      name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        'lucide-react': '^0.462.0',
        recharts: '^2.15.4',
        tailwindcss: '^3.4.0',
      },
      devDependencies: {
        vite: '^5.0.0',
        '@vitejs/plugin-react': '^4.0.0',
      },
    },
    null,
    2,
  );
}

function generateReadme(projectName: string): string {
  return `# ${projectName}

Projet généré avec **Blink AI** — générateur d'applications React par IA.

## Lancement rapide

### Option 1 — Ouvrir directement
Ouvrez \`public/index.html\` dans votre navigateur.

### Option 2 — Avec Vite
\`\`\`bash
npm install
npm run dev
\`\`\`

## Stack
- React 18
- Tailwind CSS
- Lucide React (icônes)
- Recharts (graphiques)

---
*Créé avec [Blink AI](https://blink-ai.dev)*
`;
}

export async function exportProjectAsZip(
  files: Record<string, string>,
  projectName: string = 'blink-project',
): Promise<void> {
  const JSZip = await loadJSZip();
  const zip = new JSZip();

  // Add source files
  for (const [filename, content] of Object.entries(files)) {
    zip.file(`src/${filename}`, content);
  }

  // Add public/index.html
  zip.file('public/index.html', INDEX_HTML_TEMPLATE);

  // Add package.json
  zip.file('package.json', generatePackageJson(projectName));

  // Add README
  zip.file('README.md', generateReadme(projectName));

  // Generate and download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
