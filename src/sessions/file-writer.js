import fs from "fs-extra";
import path from "path";

export async function writeFilesToDisk(baseDir, files) {
  for (const filePath in files) {
    const fullPath = path.join(baseDir, filePath);
    const fileEntry = files[filePath]; // { content, binary }

    await fs.ensureDir(path.dirname(fullPath));

    // If entry is object → { content, binary }
    if (typeof fileEntry === "object" && "content" in fileEntry) {
      if (fileEntry.binary) {
        // Write binary file from base64
        await fs.writeFile(fullPath, Buffer.from(fileEntry.content, "base64"));
      } else {
        // Write text file
        await fs.writeFile(fullPath, fileEntry.content, "utf8");
      }
    }

    // If entry is just text string (fallback)
    else {
      await fs.writeFile(fullPath, fileEntry, "utf8");
    }
  }
}
