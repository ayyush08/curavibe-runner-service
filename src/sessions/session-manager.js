import path from "path";
import fs from "fs-extra";
import { v4 as uuid } from "uuid";
import os from "os";

import { flattenTemplate } from "../utils/flatten-template.js";
import { writeFilesToDisk } from "./file-writer.js";
import { installDependencies, startDevServer } from "./process-runner.js";
import { cleanupSession } from "./cleanup.js";

let activeSession = null;
export async function createSession(structure, framework) {
    if (activeSession) {
        throw new Error("A session is already active. Only one session at a time is supported.");
    }
    activeSession = true;

    const sessionId = uuid();

    const baseTmp = os.tmpdir();                // ← FIXED
    const baseDir = path.join(baseTmp, `curavibe-${sessionId}`);

    await fs.ensureDir(baseDir);

    console.log("Flattening folder structure...");
    const flatFiles = flattenTemplate(structure);
    console.log("Flattened:");

    console.log("Writing files...");
    await writeFilesToDisk(baseDir, flatFiles);

    console.log("Installing dependencies...");
    await installDependencies(baseDir);

    console.log("Starting dev server...");
    const { url, pid } = await startDevServer(sessionId, baseDir,framework);

    setTimeout(() => cleanupSession(baseDir, pid), 5 * 60 * 1000);

    return { sessionId, previewUrl: url };

}
