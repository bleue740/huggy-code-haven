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

    res.json({ url: `http://localhost:${port}` });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
