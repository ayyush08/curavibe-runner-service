import { spawn } from "child_process";
import getPort from "get-port";
import { detectPreviewReady } from "../utils/detect-preview-ready.js";

function portRange(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export async function startDevServer(sessionId, cwd, framework) {
  const port = await getPort({ port: portRange(3000, 3999) });

  // 👇 determine public host
  const host =
  process.env.FLY_APP_NAME
    ? `https://${process.env.FLY_APP_NAME}.fly.dev`
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

        resolve({
          url: `${host}:${port}`,
          pid: dev.pid,
        });
      }
    });

    dev.stderr.on("data", (data) => console.error(data.toString()));

    dev.on("exit", (code) => {
      if (!previewResolved) {
        reject(new Error("Dev server exited before startup"));
      }
    });
  });
}
