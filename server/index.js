import express from "express";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/preview", (req, res) => {
  const projectId = "demo";
  const port = 5000 + Math.floor(Math.random() * 1000);

  const projectPath = path.join(process.cwd(), "projects", projectId);

  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
    fs.writeFileSync(
      path.join(projectPath, "index.html"),
      "<h1>Hello Docker Preview 🚀</h1>"
    );
  }

  const cmd = `docker run -d -p ${port}:3000 -v ${projectPath}:/app preview-image`;

  exec(cmd, (err) => {
    if (err) {
      return res.status(500).json({ error: "docker failed" });
    }

    const publicBaseUrl = process.env.PUBLIC_URL || `http://localhost:${port}`;
    res.json({ url: `${publicBaseUrl}:${port}` });
  });
});

// ── GitHub Bidirectional Sync ──

// Push project files to GitHub
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

    // Get default branch
    const repoResp = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (!repoResp.ok) {
      const err = await repoResp.json();
      return res.status(repoResp.status).json({ error: err.message || "Cannot access repo" });
    }
    const repoData = await repoResp.json();
    const branch = repoData.default_branch || "main";

    // Get latest commit SHA
    const refResp = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, { headers });
    if (!refResp.ok) {
      return res.status(400).json({ error: "Cannot get branch ref" });
    }
    const refData = await refResp.json();
    const latestCommitSha = refData.object.sha;

    // Get base tree
    const commitResp = await fetch(`https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`, { headers });
    const commitData = await commitResp.json();
    const baseTreeSha = commitData.tree.sha;

    // Create blobs for each file
    const tree = [];
    for (const [filePath, content] of Object.entries(files)) {
      const blobResp = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content, encoding: "utf-8" }),
      });
      const blobData = await blobResp.json();
      tree.push({
        path: filePath,
        mode: "100644",
        type: "blob",
        sha: blobData.sha,
      });
    }

    // Create tree
    const treeResp = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({ base_tree: baseTreeSha, tree }),
    });
    const treeData = await treeResp.json();

    // Create commit
    const newCommitResp = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: message || "Update from Blink AI",
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    });
    const newCommitData = await newCommitResp.json();

    // Update branch ref
    await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: newCommitData.sha }),
    });

    res.json({ success: true, commitSha: newCommitData.sha, branch });
  } catch (err) {
    console.error("GitHub push error:", err);
    res.status(500).json({ error: "GitHub push failed" });
  }
});

// Pull files from GitHub
app.post("/github/pull", async (req, res) => {
  const { repo, token, path: subPath } = req.body;
  if (!repo || !token) {
    return res.status(400).json({ error: "repo and token are required" });
  }

  try {
    const headers = {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    };

    // Get repo tree recursively
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

    // Filter for code files
    const codeExtensions = [".tsx", ".ts", ".jsx", ".js", ".css", ".html", ".json", ".md"];
    const relevantFiles = treeData.tree.filter(
      (item) =>
        item.type === "blob" &&
        codeExtensions.some((ext) => item.path.endsWith(ext)) &&
        (!subPath || item.path.startsWith(subPath))
    );

    // Fetch content for each file (limit to 50 files)
    const files = {};
    for (const file of relevantFiles.slice(0, 50)) {
      const blobResp = await fetch(
        `https://api.github.com/repos/${repo}/git/blobs/${file.sha}`,
        { headers }
      );
      const blobData = await blobResp.json();
      files[file.path] = Buffer.from(blobData.content, "base64").toString("utf-8");
    }

    res.json({ success: true, files, branch, fileCount: Object.keys(files).length });
  } catch (err) {
    console.error("GitHub pull error:", err);
    res.status(500).json({ error: "GitHub pull failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
