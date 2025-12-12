export function flattenTemplate(folder, parentPath = "") {
    if (!folder || typeof folder !== "object") return {};

    let files = {};

    if (!Array.isArray(folder.items)) return {};

    for (const item of folder.items) {

        // --- FILE ---
        if (item && "fileExtension" in item) {

            if(item.fileExtension == 'ico') continue; // skip .ico files
            const name = item.filename?.trim()
                ? `${item.filename}.${item.fileExtension}`
                : `.${item.fileExtension}`;

            const filePath = parentPath ? `${parentPath}/${name}` : name;

            files[filePath] = {
                content: item.content,
                binary: item.binary || false,
            };

            continue;
        }

        // --- FOLDER ---
        if (item.folderName && Array.isArray(item.items)) {
            const newPath = parentPath
                ? `${parentPath}/${item.folderName}`
                : item.folderName;

            Object.assign(files, flattenTemplate(item, newPath));
        }
    }

    return files;
}
