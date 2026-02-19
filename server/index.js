import express from "express";
import cors from "cors";
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
  setLogEmitter,
} from "./vite-builder.js";

const app = express();

// ─── Middleware ───
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));

// ─── Env ───
const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
const PORT = parseInt(process.env.PORT || "3000", 10);

if (!PUBLIC_URL) {
  console.warn("[server] ⚠️  PUBLIC_URL not set — preview URLs will be localhost-based.");
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("[server] ⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — /build will fail.");
}

// ─── Health ───
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    publicUrl: PUBLIC_URL || "not-set",
    activeServers: getActiveServers().length,
    supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    timestamp: new Date().toISOString(),
  });
});

// ─── Dev: Start ───
app.post("/dev/start", async (req, res) => {
  const { projectId, files, projectName } = req.body;
  if (!projectId || !files) {
    return res.status(400).json({ error: "projectId and files are required" });
  }

  try {
    const { port } = await startDevServer(projectId, files, projectName);
    const base = PUBLIC_URL || `http://localhost:${PORT}`;
    const devUrl = `${base}/dev/${projectId}/`;

    console.log(`[server] Dev server started: ${devUrl}`);
    res.json({ success: true, devUrl, port, projectId });
  } catch (err) {
    console.error("[server] Dev start error:", err.message);
    res.status(500).json({ error: err.message || "Failed to start dev server" });
  }
});

// ─── Dev: Sync files ───
app.post("/dev/sync", (req, res) => {
  const { projectId, files } = req.body;
  if (!projectId || !files) {
    return res.status(400).json({ error: "projectId and files are required" });
  }

  try {
    syncFiles(projectId, files);
    res.json({ success: true });
  } catch (err) {
    console.error("[server] Sync error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Dev: Stop ───
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

// ─── Dev: Status ───
app.get("/dev/status/:projectId", (req, res) => {
  const server = getDevServer(req.params.projectId);
  if (!server) return res.json({ active: false });
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
    return res.status(500).json({
      error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on server.",
    });
  }

  try {
    const result = await buildProject(projectId, files, projectName, supabaseUrl, supabaseServiceKey);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[server] Build error:", err.message);
    res.status(500).json({ error: err.message || "Build failed" });
  }
});

// ─── HTTP Proxy for Vite dev servers (/dev/:projectId/*) ───
app.use("/dev/:projectId", (req, res, next) => {
  const { projectId } = req.params;
  const server = getDevServer(projectId);

  if (!server) {
    return res.status(404).json({ error: `No active dev server for project: ${projectId}` });
  }

  const proxy = createProxyMiddleware({
    target: `http://127.0.0.1:${server.port}`,
    changeOrigin: true,
    ws: false, // WebSocket handled separately
    pathRewrite: (pathStr) =>
      pathStr.replace(new RegExp(`^\\/dev\\/${projectId}`), "") || "/",
    on: {
      error: (err, _req, res) => {
        console.error(`[proxy] Error for ${projectId}:`, err.message);
        if (res && !res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Dev server unreachable" }));
        }
      },
    },
  });

  proxy(req, res, next);
});

// ─── HTTP Proxy for HMR WS path (/dev-hmr/:projectId) ───
app.use("/dev-hmr/:projectId", (req, res, next) => {
  const { projectId } = req.params;
  const server = getDevServer(projectId);

  if (!server) {
    return res.status(404).json({ error: `No dev server for project: ${projectId}` });
  }

  const proxy = createProxyMiddleware({
    target: `http://127.0.0.1:${server.port}`,
    changeOrigin: true,
    ws: false,
    pathRewrite: () => "/",
    on: {
      error: (err) => console.error("[hmr-proxy] Error:", err.message),
    },
  });

  proxy(req, res, next);
});

// ─── Build Logs: SSE streaming ───
//
// Clients connect via GET /logs/:projectId and receive real-time build/dev logs
// via Server-Sent Events (text/event-stream).
//
// Log producers (startDevServer, buildProject) call `emitLog(projectId, text, level)`.

const logClients = new Map(); // projectId -> Set<res>
const logBuffers = new Map(); // projectId -> string[] (last 200 lines)

export function emitLog(projectId, text, level = "log") {
  const entry = JSON.stringify({ text, level, ts: Date.now() });

  // Buffer
  if (!logBuffers.has(projectId)) logBuffers.set(projectId, []);
  const buf = logBuffers.get(projectId);
  buf.push(entry);
  if (buf.length > 200) buf.shift();

  // Broadcast to SSE clients
  const clients = logClients.get(projectId);
  if (clients) {
    for (const res of clients) {
      try { res.write(`data: ${entry}\n\n`); } catch {}
    }
  }
}

app.get("/logs/:projectId", (req, res) => {
  const { projectId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  // Send buffered logs first
  const buf = logBuffers.get(projectId) || [];
  for (const entry of buf) {
    res.write(`data: ${entry}\n\n`);
  }

  // Register client
  if (!logClients.has(projectId)) logClients.set(projectId, new Set());
  logClients.get(projectId).add(res);

  // Heartbeat every 20s
  const heartbeat = setInterval(() => {
    try { res.write(": ping\n\n"); } catch {}
  }, 20_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    const clients = logClients.get(projectId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) logClients.delete(projectId);
    }
  });
});

// ─── GitHub: Push ───

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
        method: "POST",
        headers,
        body: JSON.stringify({ content, encoding: "utf-8" }),
      });
      const blobData = await blobResp.json();
      tree.push({ path: filePath, mode: "100644", type: "blob", sha: blobData.sha });
    }

    const treeResp = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({ base_tree: baseTreeSha, tree }),
    });
    const treeData = await treeResp.json();

    const newCommitResp = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: message || "Update from AI Builder",
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    });
    const newCommitData = await newCommitResp.json();

    await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: newCommitData.sha }),
    });

    res.json({ success: true, commitSha: newCommitData.sha, branch });
  } catch (err) {
    console.error("[github] Push error:", err.message);
    res.status(500).json({ error: "GitHub push failed" });
  }
});

// ─── GitHub: Pull ───
app.post("/github/pull", async (req, res) => {
  const { repo, token, path: subPath } = req.body;
  if (!repo || !token) return res.status(400).json({ error: "repo and token are required" });

  try {
    const headers = {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    };

    const repoResp = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (!repoResp.ok) {
      const err = await repoResp.json();
      return res.status(repoResp.status).json({ error: err.message || "Cannot access repo" });
    }
    const repoData = await repoResp.json();
    const branch = repoData.default_branch || "main";

    const treeResp = await fetch(
      `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`,
      { headers }
    );
    const treeData = await treeResp.json();

    const codeExtensions = [".tsx", ".ts", ".jsx", ".js", ".css", ".html", ".json", ".md"];
    const relevantFiles = treeData.tree.filter(
      (item) =>
        item.type === "blob" &&
        codeExtensions.some((ext) => item.path.endsWith(ext)) &&
        (!subPath || item.path.startsWith(subPath))
    );

    const fileMap = {};
    for (const file of relevantFiles.slice(0, 50)) {
      const blobResp = await fetch(
        `https://api.github.com/repos/${repo}/git/blobs/${file.sha}`,
        { headers }
      );
      const blobData = await blobResp.json();
      fileMap[file.path] = Buffer.from(blobData.content, "base64").toString("utf-8");
    }

    res.json({ success: true, files: fileMap, branch, fileCount: Object.keys(fileMap).length });
  } catch (err) {
    console.error("[github] Pull error:", err.message);
    res.status(500).json({ error: "GitHub pull failed" });
  }
});

// ─── Start server ───
async function start() {
  // Inject log emitter into vite-builder so it can stream logs to SSE clients
  setLogEmitter(emitLog);

  // Pre-warm base node_modules
  try {
    await setupBaseModules();
    console.log("[server] ✅ Base modules ready.");
  } catch (err) {
    console.error("[server] ⚠️  Base modules setup failed:", err.message);
    console.log("[server] Continuing — first build will install dependencies on demand.");
  }

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] ✅ Listening on port ${PORT}`);
    console.log(`[server] Public URL: ${PUBLIC_URL || "(not set)"}`);
  });

  // ─── WebSocket upgrade handling for Vite HMR ───
  httpServer.on("upgrade", (req, socket, head) => {
    const hmrMatch = req.url?.match(/^\/dev-hmr\/([^/?#]+)/);
    const devMatch = req.url?.match(/^\/dev\/([^/?#]+)/);
    const projectId = hmrMatch?.[1] || devMatch?.[1];

    if (!projectId) {
      socket.destroy();
      return;
    }

    const devServer = getDevServer(projectId);
    if (!devServer) {
      console.warn(`[ws] No dev server for project: ${projectId}`);
      socket.destroy();
      return;
    }

    const wsProxy = createProxyMiddleware({
      target: `ws://127.0.0.1:${devServer.port}`,
      changeOrigin: true,
      ws: true,
      pathRewrite: hmrMatch
        ? () => "/"
        : (pathStr) => pathStr.replace(new RegExp(`^\\/dev\\/${projectId}`), "") || "/",
      on: {
        error: (err) => {
          console.error(`[ws] Proxy error for ${projectId}:`, err.message);
          try { socket.destroy(); } catch {}
        },
      },
    });

    wsProxy.upgrade(req, socket, head);
  });

  // Cleanup idle dev servers every 5 minutes
  setInterval(() => cleanupIdleServers(), 5 * 60 * 1000);
}

start();
