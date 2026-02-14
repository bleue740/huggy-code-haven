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
  const projectPath = path.join(process.cwd(), "projects", projectId);

  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
    fs.writeFileSync(
      path.join(projectPath, "index.html"),
      "<h1>Hello preview 🚀</h1>"
    );
  }

  exec(`npx serve ${projectPath} -p 4000`, () => {});

  res.json({ url: "http://localhost:4000" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
