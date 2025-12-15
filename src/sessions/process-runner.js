import { spawn } from "child_process";
import getPort from "get-port";
import { detectPreviewReady } from "../utils/detect-preview-url.js";
import { sessionPorts } from "./session-registry.js";
import { cleanupSession } from "./cleanup.js";

export function installDependencies(cwd) {
    return new Promise((resolve, reject) => {
        const installer = spawn("npm", ["install", "--include=dev","--no-audit", "--no-fund"], {
            cwd,
            stdio: "inherit",
            shell: true
        });

        installer.on("exit", (code) => {
            code === 0 ? resolve() : reject(new Error("npm install failed"));
        });
    });
}

function portRange(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export async function startDevServer(sessionId, cwd, framework) {
  // const port = await getPort({ port: portRange(3000, 3999) });
  const port = process.env.PORT

  // 👇 determine public host
  const host =
    process.env.RENDER_EXTERNAL_HOSTNAME
      ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
      : "http://localhost";

  return new Promise((resolve, reject) => {
    const dev = spawn("npm", ["run", "dev"], {
      cwd,
      env: { ...process.env, PORT: String(port) },
      shell: true,
    });

    let previewResolved = false;

    dev.stdout.on("data", (data) => {
      const line = data.toString();
      console.log(line);

      if (!previewResolved && detectPreviewReady(line)) {
        previewResolved = true;

        sessionPorts.set(sessionId, {
  baseDir: cwd,
  port,
  pid: dev.pid,
  createdAt: Date.now(),
});

        resolve({
  url: `${host}/preview/${sessionId}`,
  pid: dev.pid,
});

      }
    });

    dev.stderr.on("data", (data) => console.error(data.toString()));

    dev.on("exit", (code) => {
      if (!previewResolved) {
        console.warn("Dev server exited before preview was ready");
      }
      cleanupSession(cwd, dev.pid);
      sessionPorts.delete(sessionId);
      console.log(`Dev server for session ${sessionId} exited with code ${code}`);
    });
  });
}