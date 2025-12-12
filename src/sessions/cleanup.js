import fs from "fs-extra";

export function cleanupSession(baseDir, pid) {
  try {
    if (pid) process.kill(pid, "SIGTERM");
  } catch (err) {
    console.log("Process already stopped:", pid);
  }

  fs.remove(baseDir);
}
