import express from "express";
import cors from "cors";
import { createSession } from "./sessions/session-manager.js";
import { createProxyMiddleware } from "http-proxy-middleware";
import { sessionPorts } from "./sessions/session-registry.js";
import { flattenTemplate } from "./utils/flatten-template.js";
import { writeFilesToDisk } from "./sessions/file-writer.js";

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/preview/:sessionId", (req, res, next) => {
 const session = sessionPorts.get(req.params.sessionId);
if (!session) return res.status(404).send("Session not found");

const port = session.port;

  if (!port) {
    return res.status(404).send("Session not found");
  }

  return createProxyMiddleware({
    target: `http://127.0.0.1:${port}`,
    changeOrigin: true,
    ws: true,
  })(req, res, next);
});


app.get('/health', (req, res) => {
  res.send('OK');
});


app.post("/start", async (req, res) => {

    const structure = req.body.files || req.body; // FIX
    const framework = req.body.framework;

    try {
        const result = await createSession(structure, framework);
        res.json(result);
    } catch (err) {
        console.error("Runner error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/update", async (req, res) => {
  const { sessionId, files } = req.body;

  const session = sessionPorts.get(sessionId);
if (!session || !session.baseDir) {
  return res.status(404).json({ error: "Session not found or invalid" });
}

const flatFiles = flattenTemplate(files);
await writeFilesToDisk(session.baseDir, flatFiles);


  delete flatFiles["/package.json"];
delete flatFiles["/package-lock.json"];
delete flatFiles["/pnpm-lock.yaml"];
delete flatFiles["/yarn.lock"];

  await writeFilesToDisk(session.baseDir, flatFiles);

  res.json({ ok: true });
});


const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log("Runner service on port", PORT));
