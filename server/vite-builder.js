import { exec, spawn } from "child_process";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const TEMPLATES_DIR = path.join(process.cwd(), "templates");
const PROJECTS_DIR = path.join(process.cwd(), "projects");
const BASE_NODE_MODULES = path.join(process.cwd(), "_base_modules");

// Active dev servers: projectId -> { port, process, lastAccess }
const devServers = new Map();

// Port pool
let nextPort = 5100;
function allocatePort() {
  return nextPort++;
}

// ─── Helpers ───

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function execAsync(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 10 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve({ stdout, stderr });
    });
  });
}

/**
 * Parse imports from user code to detect extra npm packages needed
 */
function detectExtraPackages(files) {
  const knownPackages = new Set([
    "react", "react-dom", "react-router-dom", "lucide-react",
    "recharts", "framer-motion", "date-fns", "clsx", "tailwind-merge",
  ]);
  const detected = new Set();

  for (const code of Object.values(files)) {
    // Match: import ... from "package" or import "package"
    const importRegex = /import\s+(?:[\s\S]*?\s+from\s+)?['"]([\w@][\w\-@/.]*)['"]/g;
    let match;
    while ((match = importRegex.exec(code))) {
      let pkg = match[1];
      // Get root package name (handle @scope/package)
      if (pkg.startsWith("@")) {
        const parts = pkg.split("/");
        pkg = parts.slice(0, 2).join("/");
      } else {
        pkg = pkg.split("/")[0];
      }
      // Skip relative imports and known packages
      if (!pkg.startsWith(".") && !pkg.startsWith("/") && !knownPackages.has(pkg)) {
        detected.add(pkg);
      }
    }
  }
  return [...detected];
}

// ─── Setup base node_modules (called once at startup) ───

export async function setupBaseModules() {
  if (fs.existsSync(path.join(BASE_NODE_MODULES, "node_modules", "react"))) {
    console.log("[vite-builder] Base node_modules already cached.");
    return;
  }

  console.log("[vite-builder] Installing base node_modules (first run)...");
  ensureDir(BASE_NODE_MODULES);

  // Copy template package.json
  fs.copyFileSync(
    path.join(TEMPLATES_DIR, "package.json"),
    path.join(BASE_NODE_MODULES, "package.json")
  );

  await execAsync("npm install --prefer-offline", { cwd: BASE_NODE_MODULES });
  console.log("[vite-builder] Base node_modules ready.");
}

// ─── Scaffold project ───

function scaffoldProject(projectId, files, projectName) {
  const projectDir = path.join(PROJECTS_DIR, projectId);
  const srcDir = path.join(projectDir, "src");

  ensureDir(srcDir);

  // Copy template files (non-src)
  for (const file of ["vite.config.ts", "tsconfig.json"]) {
    fs.copyFileSync(path.join(TEMPLATES_DIR, file), path.join(projectDir, file));
  }

  // Copy template package.json
  fs.copyFileSync(
    path.join(TEMPLATES_DIR, "package.json"),
    path.join(projectDir, "package.json")
  );

  // Write index.html with project name
  let indexHtml = fs.readFileSync(path.join(TEMPLATES_DIR, "index.html"), "utf-8");
  indexHtml = indexHtml.replace("<title>Blink App</title>", `<title>${projectName || "Blink App"}</title>`);
  fs.writeFileSync(path.join(projectDir, "index.html"), indexHtml);

  // Write template src files (main.tsx, index.css)
  fs.copyFileSync(
    path.join(TEMPLATES_DIR, "src", "main.tsx"),
    path.join(srcDir, "main.tsx")
  );
  fs.copyFileSync(
    path.join(TEMPLATES_DIR, "src", "index.css"),
    path.join(srcDir, "index.css")
  );

  // Write user files into src/
  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(srcDir, filename);
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf-8");
  }

  // Symlink or copy node_modules from base
  const nmDest = path.join(projectDir, "node_modules");
  if (!fs.existsSync(nmDest)) {
    const nmSrc = path.join(BASE_NODE_MODULES, "node_modules");
    if (fs.existsSync(nmSrc)) {
      try {
        fs.symlinkSync(nmSrc, nmDest, "junction");
      } catch {
        // Fallback: copy (slower but always works)
        fs.cpSync(nmSrc, nmDest, { recursive: true });
      }
    }
  }

  return projectDir;
}

// ─── Install extra packages ───

async function installExtraPackages(projectDir, extraPackages) {
  if (!extraPackages.length) return;

  console.log(`[vite-builder] Installing extra packages: ${extraPackages.join(", ")}`);

  // If we used a symlink, we need to replace it with a real copy first
  const nmPath = path.join(projectDir, "node_modules");
  const nmStat = fs.lstatSync(nmPath, { throwIfNoEntry: false });
  if (nmStat?.isSymbolicLink()) {
    const target = fs.readlinkSync(nmPath);
    fs.unlinkSync(nmPath);
    fs.cpSync(target, nmPath, { recursive: true });
  }

  await execAsync(`npm install --no-save ${extraPackages.join(" ")}`, { cwd: projectDir });
}

// ─── Sync files to existing project ───

export function syncFiles(projectId, files) {
  const srcDir = path.join(PROJECTS_DIR, projectId, "src");
  if (!fs.existsSync(srcDir)) {
    throw new Error(`Project ${projectId} not found`);
  }

  // Get existing user files (exclude main.tsx and index.css which are templates)
  const templateFiles = new Set(["main.tsx", "index.css"]);

  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(srcDir, filename);
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf-8");
  }

  // Delete files that no longer exist (except templates)
  const existingFiles = getAllFiles(srcDir, srcDir);
  for (const existing of existingFiles) {
    if (!templateFiles.has(existing) && !files[existing]) {
      const fullPath = path.join(srcDir, existing);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
  }
}

function getAllFiles(dir, baseDir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, baseDir));
    } else {
      results.push(path.relative(baseDir, fullPath).replace(/\\/g, "/"));
    }
  }
  return results;
}

// ─── Update vite.config.ts with HMR settings for proxy ───

function patchViteConfig(projectDir, port, publicBase) {
  const configPath = path.join(projectDir, "vite.config.ts");
  const config = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: ${port},
    strictPort: true,
    hmr: {
      clientPort: 443,
      protocol: "wss",
      path: "/dev-hmr/${publicBase}",
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          charts: ["recharts"],
          motion: ["framer-motion"],
          icons: ["lucide-react"],
        },
      },
    },
  },
});`;
  fs.writeFileSync(configPath, config);
}

// ─── Start dev server ───

export async function startDevServer(projectId, files, projectName) {
  // Kill existing server if any
  await stopDevServer(projectId);

  const port = allocatePort();
  const projectDir = scaffoldProject(projectId, files, projectName);

  // Detect and install extra packages
  const extraPackages = detectExtraPackages(files);
  if (extraPackages.length) {
    await installExtraPackages(projectDir, extraPackages);
  }

  // Patch vite config with HMR proxy settings
  patchViteConfig(projectDir, port, projectId);

  return new Promise((resolve, reject) => {
    const viteProcess = spawn("npx", ["vite", "--host", "0.0.0.0", "--port", String(port)], {
      cwd: projectDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    let started = false;
    let output = "";
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error("Vite dev server timeout:\n" + output));
      }
    }, 60000);

    viteProcess.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;
      if (!started && (text.includes("Local:") || text.includes("ready in"))) {
        started = true;
        clearTimeout(timeout);

        devServers.set(projectId, {
          port,
          process: viteProcess,
          lastAccess: Date.now(),
          projectDir,
        });

        console.log(`[vite-builder] Dev server for ${projectId} started on port ${port}`);
        resolve({ port, projectId });
      }
    });

    viteProcess.stderr.on("data", (data) => {
      output += data.toString();
    });

    viteProcess.on("exit", (code) => {
      clearTimeout(timeout);
      devServers.delete(projectId);
      if (!started) {
        reject(new Error(`Vite exited with code ${code}:\n${output}`));
      }
    });
  });
}

// ─── Stop dev server ───

export async function stopDevServer(projectId) {
  const server = devServers.get(projectId);
  if (!server) return;

  try {
    const { default: treeKill } = await import("tree-kill");
    await new Promise((resolve) => {
      treeKill(server.process.pid, "SIGTERM", resolve);
    });
  } catch {
    try { server.process.kill("SIGTERM"); } catch {}
  }
  devServers.delete(projectId);
  console.log(`[vite-builder] Dev server for ${projectId} stopped.`);
}

// ─── Get dev server info ───

export function getDevServer(projectId) {
  const server = devServers.get(projectId);
  if (server) server.lastAccess = Date.now();
  return server || null;
}

// ─── Build project (production) ───

export async function buildProject(projectId, files, projectName, supabaseUrl, supabaseServiceKey) {
  const projectDir = scaffoldProject(projectId, files, projectName);

  // Detect and install extra packages
  const extraPackages = detectExtraPackages(files);
  if (extraPackages.length) {
    await installExtraPackages(projectDir, extraPackages);
  }

  // Run vite build
  console.log(`[vite-builder] Building project ${projectId}...`);
  await execAsync("npx vite build", { cwd: projectDir });

  const distDir = path.join(projectDir, "dist");
  if (!fs.existsSync(distDir)) {
    throw new Error("Build failed: dist directory not found");
  }

  // Upload to Supabase Storage
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const distFiles = getAllFiles(distDir, distDir);
  const uploadedUrls = {};

  for (const file of distFiles) {
    const fullPath = path.join(distDir, file);
    const content = fs.readFileSync(fullPath);
    const storagePath = `builds/${projectId}/${file}`;

    const contentType = getContentType(file);

    const { error } = await supabase.storage
      .from("deployments")
      .upload(storagePath, content, {
        contentType,
        upsert: true,
        cacheControl: file === "index.html" ? "public, max-age=60" : "public, max-age=31536000, immutable",
      });

    if (error) {
      console.error(`Upload error for ${file}:`, error.message);
    }

    const { data: urlData } = supabase.storage
      .from("deployments")
      .getPublicUrl(storagePath);

    uploadedUrls[file] = urlData.publicUrl;
  }

  const buildUrl = uploadedUrls["index.html"];
  console.log(`[vite-builder] Build complete for ${projectId}: ${buildUrl}`);

  return {
    buildUrl,
    files: distFiles,
    urls: uploadedUrls,
  };
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".json": "application/json",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".ico": "image/x-icon",
  };
  return types[ext] || "application/octet-stream";
}

// ─── Cleanup idle dev servers ───

export function cleanupIdleServers(maxIdleMs = 30 * 60 * 1000) {
  const now = Date.now();
  for (const [projectId, server] of devServers) {
    if (now - server.lastAccess > maxIdleMs) {
      console.log(`[vite-builder] Cleaning up idle server for ${projectId}`);
      stopDevServer(projectId);
    }
  }
}

// ─── Get all active servers ───

export function getActiveServers() {
  const result = [];
  for (const [projectId, server] of devServers) {
    result.push({
      projectId,
      port: server.port,
      lastAccess: server.lastAccess,
    });
  }
  return result;
}
