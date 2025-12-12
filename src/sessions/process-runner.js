import { spawn } from "child_process";
import getPort from "get-port";
import { detectPreviewUrl } from "../utils/detect-preview-url.js";

export function installDependencies(cwd) {
    return new Promise((resolve, reject) => {
        const installer = spawn("npm", ["install", "--no-audit", "--no-fund"], {
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
    // pick a port between 3000–3999
    const port = await getPort({
        port: portRange(3000, 3999)
    });


    return new Promise((resolve, reject) => {
        const dev = spawn("npm", ["run", "dev"], {
            cwd,
            env: { ...process.env, PORT: String(port) },
            shell: true
        });

        let previewResolved = false;

        dev.stdout.on("data", (data) => {
            const line = data.toString();
            console.log(line);

            const url = detectPreviewUrl(line, port);
            if (url && !previewResolved) {
                previewResolved = true;

                // return BOTH: url + PID
                resolve({ url, pid: dev.pid });
            }
        });

        dev.stderr.on("data", (data) => console.error(data.toString()));

        dev.on("exit", (code) => {
            console.log("Dev server exited:", code);

            // ONLY reject if preview never resolved
            if (!previewResolved) {
                reject(new Error("Dev server exited before startup"));
            }
        });
    });
}
