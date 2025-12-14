import express from "express";
import cors from "cors";
import { createSession } from "./sessions/session-manager.js";
import { createProxyMiddleware } from "http-proxy-middleware";
import { sessionPorts } from "./sessions/session-registry.js";

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
app.use(express.json({ limit: "50mb" }));

app.use("/preview/:sessionId", (req, res, next) => {
  const port = sessionPorts.get(req.params.sessionId);
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

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log("Runner service on port", PORT));
