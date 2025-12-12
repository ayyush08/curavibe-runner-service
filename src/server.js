import express from "express";
import cors from "cors";
import { createSession } from "./sessions/session-manager.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

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
