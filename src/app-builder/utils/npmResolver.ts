/**
 * Dynamic npm package resolver using esm.sh
 * Detects import statements in user code and generates an importmap
 * that maps package names to esm.sh CDN URLs.
 */

// Packages already loaded via UMD CDN scripts - don't resolve these
const BUILTIN_PACKAGES = new Set([
  'react',
  'react-dom',
  'recharts',
  'lucide-react',
  'framer-motion',
  'date-fns',
  'react-router-dom',
  '@supabase/supabase-js',
]);

// Common package aliases for esm.sh
const PACKAGE_ALIASES: Record<string, string> = {
  'motion': 'framer-motion',
};

/**
 * Extracts npm package names from import statements in code.
 * Handles: import X from 'pkg', import { X } from 'pkg', import 'pkg'
 * Ignores relative imports (./ ../) and builtin packages.
 */
export function extractImports(code: string): string[] {
  const importRegex = /(?:import\s+(?:[\w{},*\s]+\s+from\s+)?['"])([@\w][^'"]*)['"]/g;
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  const packages = new Set<string>();

  for (const regex of [importRegex, requireRegex]) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(code)) !== null) {
      const pkg = match[1];
      // Skip relative imports
      if (pkg.startsWith('.') || pkg.startsWith('/')) continue;
      // Get the package name (handle scoped packages like @org/pkg)
      const pkgName = pkg.startsWith('@')
        ? pkg.split('/').slice(0, 2).join('/')
        : pkg.split('/')[0];
      // Skip builtin packages
      if (BUILTIN_PACKAGES.has(pkgName)) continue;
      // Apply aliases
      const resolved = PACKAGE_ALIASES[pkgName] || pkgName;
      if (!BUILTIN_PACKAGES.has(resolved)) {
        packages.add(resolved);
      }
    }
  }

  return Array.from(packages);
}

/**
 * Extracts all imports from all files in a project.
 */
export function extractAllImports(files: Record<string, string>): string[] {
  const allPkgs = new Set<string>();
  for (const code of Object.values(files)) {
    for (const pkg of extractImports(code)) {
      allPkgs.add(pkg);
    }
  }
  return Array.from(allPkgs);
}

/**
 * Generates an HTML <script type="importmap"> tag for the detected packages.
 * Uses esm.sh which can serve any npm package as an ES module.
 */
export function generateImportMapScript(packages: string[]): string {
  if (packages.length === 0) return '';

  const imports: Record<string, string> = {};
  for (const pkg of packages) {
    imports[pkg] = `https://esm.sh/${pkg}?bundle&deps=react@18.3.1,react-dom@18.3.1`;
    // Also add subpath wildcard
    imports[`${pkg}/`] = `https://esm.sh/${pkg}/?bundle&deps=react@18.3.1,react-dom@18.3.1`;
  }

  return `<script type="importmap">
${JSON.stringify({ imports }, null, 2)}
</script>`;
}

/**
 * Transforms import statements in code to work with the UMD globals
 * available in the iframe. For packages NOT in the importmap,
 * this strips import statements and replaces them with global references.
 * 
 * For packages resolved via esm.sh (in the importmap), imports are left as-is
 * since they'll be resolved by the browser's native module system.
 */
export function transformImportsForBabel(code: string): string {
  // Remove import statements for builtin packages (handled by UMD globals)
  let transformed = code;

  // Remove React/ReactDOM imports (already global)
  transformed = transformed.replace(
    /import\s+(?:React|{[^}]*})\s+from\s+['"]react['"];?\s*\n?/g,
    ''
  );
  transformed = transformed.replace(
    /import\s+(?:ReactDOM|{[^}]*})\s+from\s+['"]react-dom(?:\/client)?['"];?\s*\n?/g,
    ''
  );

  // Remove lucide-react imports and destructure from global
  transformed = transformed.replace(
    /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"];?\s*\n?/g,
    (_, imports) => {
      const names = imports.split(',').map((n: string) => n.trim()).filter(Boolean);
      return `const { ${names.join(', ')} } = window.LucideReact || window.lucide || {};\n`;
    }
  );

  // Remove recharts imports and destructure from global
  transformed = transformed.replace(
    /import\s+{([^}]+)}\s+from\s+['"]recharts['"];?\s*\n?/g,
    (_, imports) => {
      const names = imports.split(',').map((n: string) => n.trim()).filter(Boolean);
      return `const { ${names.join(', ')} } = window.Recharts || {};\n`;
    }
  );

  // Remove framer-motion imports and destructure from global
  transformed = transformed.replace(
    /import\s+{([^}]+)}\s+from\s+['"]framer-motion['"];?\s*\n?/g,
    (_, imports) => {
      const names = imports.split(',').map((n: string) => n.trim()).filter(Boolean);
      return `const { ${names.join(', ')} } = window.Motion || window.motion || {};\n`;
    }
  );

  // Remove date-fns imports  
  transformed = transformed.replace(
    /import\s+{([^}]+)}\s+from\s+['"]date-fns['"];?\s*\n?/g,
    (_, imports) => {
      const names = imports.split(',').map((n: string) => n.trim()).filter(Boolean);
      return `const { ${names.join(', ')} } = window.dateFns || {};\n`;
    }
  );

  // Remove react-router-dom imports
  transformed = transformed.replace(
    /import\s+{([^}]+)}\s+from\s+['"]react-router-dom['"];?\s*\n?/g,
    (_, imports) => {
      const names = imports.split(',').map((n: string) => n.trim()).filter(Boolean);
      return `const { ${names.join(', ')} } = window.ReactRouterDOM || window.ReactRouter || {};\n`;
    }
  );

  return transformed;
}

/**
 * Generates a <script> block that dynamically loads npm packages from esm.sh
 * and makes them available as globals before Babel scripts execute.
 */
export function generateDynamicLoaderScript(packages: string[]): string {
  if (packages.length === 0) return '';

  const loaders = packages.map(pkg => {
    const globalName = pkg
      .replace(/^@/, '')
      .replace(/[/-]/g, '_')
      .replace(/\./g, '_');
    return `    { pkg: "${pkg}", global: "${globalName}" }`;
  });

  return `<script>
  // Dynamic npm package loader via esm.sh
  window.__NPM_PACKAGES__ = {};
  (async function loadNpmPackages() {
    const packages = [
${loaders.join(',\n')}
    ];
    await Promise.allSettled(packages.map(async ({ pkg, global }) => {
      try {
        const mod = await import("https://esm.sh/" + pkg + "?bundle&deps=react@18.3.1,react-dom@18.3.1");
        window.__NPM_PACKAGES__[pkg] = mod;
        window[global] = mod;
        console.log("[npm] ✓ Loaded: " + pkg);
      } catch (e) {
        console.warn("[npm] ✗ Failed to load: " + pkg, e);
      }
    }));
    // Dispatch event when all packages are loaded
    window.dispatchEvent(new Event('npm-packages-loaded'));
  })();
</script>`;
}
