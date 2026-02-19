import express from "express";
import cors from "cors";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { createProxyMiddleware } from "http-proxy-middleware";

import {
  setupBaseModules,
  startDevServer,
  stopDevServer,
  syncFiles,
  getDevServer,
  buildProject,
  cleanupIdleServers,
  getActiveServers,
} from "./vite-builder.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ─── Env validation ───
const PUBLIC_URL = process.env.PUBLIC_URL || "";
if (!PUBLIC_URL) {
  console.warn("[server] ⚠️  PUBLIC_URL not set — dev preview URLs may be incorrect.");
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("[server] ⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — /build endpoint will fail.");
}

// ─── Health ───
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    activeServers: getActiveServers().length,
    publicUrl: PUBLIC_URL || "not-set",
    supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
});

// ─── Dev Server: Start ───
app.post("/dev/start", async (req, res) => {
  const { projectId, files, projectName } = req.body;
  if (!projectId || !files) {
    return res.status(400).json({ error: "projectId and files are required" });
  }

  try {
    const { port } = await startDevServer(projectId, files, projectName);
    const baseUrl = PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    const devUrl = `${baseUrl}/dev/${projectId}/`;

    res.json({
      success: true,
      devUrl,
      port,
      projectId,
    });
  } catch (err) {
    console.error("Dev server start error:", err);
    res.status(500).json({ error: err.message || "Failed to start dev server" });
  }
});

// ─── Dev Server: Sync files ───
app.post("/dev/sync", (req, res) => {
  const { projectId, files } = req.body;
  if (!projectId || !files) {
    return res.status(400).json({ error: "projectId and files are required" });
  }

  try {
    syncFiles(projectId, files);
    res.json({ success: true });
  } catch (err) {
    console.error("File sync error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Dev Server: Stop ───
app.post("/dev/stop", async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  try {
    await stopDevServer(projectId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Dev Server: Status ───
app.get("/dev/status/:projectId", (req, res) => {
  const server = getDevServer(req.params.projectId);
  if (!server) {
    return res.json({ active: false });
  }
  res.json({ active: true, port: server.port });
});

// ─── Build (Production) ───
app.post("/build", async (req, res) => {
  const { projectId, files, projectName } = req.body;
  if (!projectId || !files) {
    return res.status(400).json({ error: "projectId and files are required" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Missing Supabase configuration on server. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars." });
  }

  try {
    const result = await buildProject(projectId, files, projectName, supabaseUrl, supabaseServiceKey);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Build error:", err);
    res.status(500).json({ error: err.message || "Build failed" });
  }
});

// ─── Dev Server HTTP Proxy (/dev/:projectId/*) ───
// Must come BEFORE the HMR route
app.use("/dev/:projectId", (req, res, next) => {
  const server = getDevServer(req.params.projectId);
  if (!server) {
    return res.status(404).json({ error: "No active dev server for this project" });
  }

  const proxy = createProxyMiddleware({
    target: `http://127.0.0.1:${server.port}`,
    changeOrigin: true,
    ws: false, // WS is handled separately via upgrade event
    pathRewrite: (pathStr) => {
      return pathStr.replace(`/dev/${req.params.projectId}`, "") || "/";
    },
    on: {
      error: (err, req, res) => {
        console.error(`Proxy error for ${req.params?.projectId}:`, err.message);
        if (!res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Dev server unreachable" }));
        }
      },
    },
  });

  return proxy(req, res, next);
});

// ─── HMR WebSocket proxy (/dev-hmr/:projectId) ───
// This is only used to signal the route exists; actual WS upgrade is handled below
app.use("/dev-hmr/:projectId", (req, res, next) => {
  const server = getDevServer(req.params.projectId);
  if (!server) {
    return res.status(404).json({ error: "No dev server" });
  }

  const proxy = createProxyMiddleware({
    target: `http://127.0.0.1:${server.port}`,
    changeOrigin: true,
    ws: false, // WS handled via upgrade event
    pathRewrite: () => "/",
    on: {
      error: (err) => {
        console.error("HMR proxy error:", err.message);
      },
    },
  });

  return proxy(req, res, next);
});

// ─── GitHub Bidirectional Sync ───

app.post("/github/push", async (req, res) => {
  const { repo, token, files, message } = req.body;
  if (!repo || !token || !files) {
    return res.status(400).json({ error: "repo, token, and files are required" });
  }

  try {
    const headers = {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    };

    const repoResp = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (!repoResp.ok) {
      const err = await repoResp.json();
      return res.status(repoResp.status).json({ error: err.message || "Cannot access repo" });
    }
    const repoData = await repoResp.json();
    const branch = repoData.default_branch || "main";

    const refResp = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, { headers });
    if (!refResp.ok) return res.status(400).json({ error: "Cannot get branch ref" });
    const refData = await refResp.json();
    const latestCommitSha = refData.object.sha;

    const commitResp = await fetch(`https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`, { headers });
    const commitData = await commitResp.json();
    const baseTreeSha = commitData.tree.sha;

    const tree = [];
    for (const [filePath, content] of Object.entries(files)) {
      const blobResp = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
        method: "POST", headers,
        body: JSON.stringify({ content, encoding: "utf-8" }),
      });
      const blobData = await blobResp.json();
      tree.push({ path: filePath, mode: "100644", type: "blob", sha: blobData.sha });
    }

    const treeResp = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: "POST", headers,
      body: JSON.stringify({ base_tree: baseTreeSha, tree }),
    });
    const treeData = await treeResp.json();

    const newCommitResp = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
      method: "POST", headers,
      body: JSON.stringify({ message: message || "Update from Blink AI", tree: treeData.sha, parents: [latestCommitSha] }),
    });
    const newCommitData = await newCommitResp.json();

    await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ sha: newCommitData.sha }),
    });

    res.json({ success: true, commitSha: newCommitData.sha, branch });
  } catch (err) {
    console.error("GitHub push error:", err);
    res.status(500).json({ error: "GitHub push failed" });
  }
});

app.post("/github/pull", async (req, res) => {
  const { repo, token, path: subPath } = req.body;
  if (!repo || !token) return res.status(400).json({ error: "repo and token are required" });

  try {
    const headers = { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" };

    const repoResp = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (!repoResp.ok) {
      const err = await repoResp.json();
      return res.status(repoResp.status).json({ error: err.message || "Cannot access repo" });
    }
    const repoData = await repoResp.json();
    const branch = repoData.default_branch || "main";

    const treeResp = await fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`, { headers });
    const treeData = await treeResp.json();

    const codeExtensions = [".tsx", ".ts", ".jsx", ".js", ".css", ".html", ".json", ".md"];
    const relevantFiles = treeData.tree.filter(
      (item) => item.type === "blob" && codeExtensions.some((ext) => item.path.endsWith(ext)) && (!subPath || item.path.startsWith(subPath))
    );

    const files = {};
    for (const file of relevantFiles.slice(0, 50)) {
      const blobResp = await fetch(`https://api.github.com/repos/${repo}/git/blobs/${file.sha}`, { headers });
      const blobData = await blobResp.json();
      files[file.path] = Buffer.from(blobData.content, "base64").toString("utf-8");
    }

    res.json({ success: true, files, branch, fileCount: Object.keys(files).length });
  } catch (err) {
    console.error("GitHub pull error:", err);
    res.status(500).json({ error: "GitHub pull failed" });
  }
});

// ─── Startup ───

const PORT = process.env.PORT || 3000;

async function start() {
  // Pre-warm base node_modules
  try {
    await setupBaseModules();
    console.log("[server] Base modules ready.");
  } catch (err) {
    console.error("[server] Failed to setup base modules:", err.message);
    console.log("[server] Starting without pre-cached modules. First build will be slower.");
  }

  const server = app.listen(PORT, () => {
    console.log(`[server] Running on port ${PORT}`);
    console.log(`[server] Public URL: ${PUBLIC_URL || "(not set — set PUBLIC_URL env var)"}`);
  });

  // ─── WebSocket upgrade handling for Vite HMR ───
  // We delegate all WS upgrades to http-proxy-middleware proxies
  server.on("upgrade", (req, socket, head) => {
    const hmrMatch = req.url.match(/^\/dev-hmr\/([^/?#]+)/);
    const devMatch = req.url.match(/^\/dev\/([^/?#]+)/);
    const projectId = hmrMatch?.[1] || devMatch?.[1];

    if (!projectId) {
      socket.destroy();
      return;
    }

    const devServer = getDevServer(projectId);
    if (!devServer) {
      console.warn(`[ws] No dev server for project ${projectId}`);
      socket.destroy();
      return;
    }

    // Use http-proxy-middleware to proxy the WS upgrade
    const wsProxy = createProxyMiddleware({
      target: `ws://127.0.0.1:${devServer.port}`,
      changeOrigin: true,
      ws: true,
      pathRewrite: hmrMatch ? () => "/" : (pathStr) => pathStr.replace(`/dev/${projectId}`, "") || "/",
      on: {
        error: (err) => {
          console.error(`[ws] Proxy error for ${projectId}:`, err.message);
          try { socket.destroy(); } catch {}
        },
      },
    });

    // Emit a fake HTTP request so the middleware can handle the upgrade
    wsProxy.upgrade(req, socket, head);
  });

  // Cleanup idle servers every 5 minutes
  setInterval(() => cleanupIdleServers(), 5 * 60 * 1000);
}

start();
