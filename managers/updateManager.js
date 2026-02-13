import { chat } from "../util/utils";

const MODULE_NAME = "ClassifiedASF";
const BLACKLIST = [
    ".gitignore",
    "README.md"
];

const CACHE_BUST = `?t=${Date.now()}`;
const API_URL = `https://api.github.com/repos/Fiery231/ClassifiedASF/git/trees/main?recursive=1${CACHE_BUST}`;
const RAW_BASE = `https://raw.githubusercontent.com/Fiery231/ClassifiedASF/main/`;

const File = Java.type("java.io.File");

register("command", () => {
    chat("&aInitializing Update");

    new Thread(() => {
        try {
            const connection = new java.net.URL(API_URL).openConnection();
            connection.setRequestProperty("User-Agent", "ChatTriggers-Updater");

            const reader = new java.io.BufferedReader(new java.io.InputStreamReader(connection.getInputStream()));
            let response = "";
            let line;
            while ((line = reader.readLine()) !== null) response += line;
            reader.close();

            const data = JSON.parse(response);
            if (!data.tree) throw new Error("Could not find repository tree.");

            // 1. Get the list of files from GitHub
            const remoteFiles = data.tree
                .filter(item => item.type === "blob")
                .map(item => item.path);

            const filesToDownload = remoteFiles.filter(path => {
                return !BLACKLIST.includes(path) && !path.startsWith("data/");
            });


            const moduleFolder = new File(`./config/ChatTriggers/modules/${MODULE_NAME}`);
            if (moduleFolder.exists()) {
                chat("&7Cleaning up old files...");
                
                const deleteExtraFiles = (dir, currentPath = "") => {
                    const list = dir.listFiles();
                    if (!list) return;

                    list.forEach(file => {
                        const fileName = file.getName();
                        const relativePath = currentPath === "" ? fileName : `${currentPath}/${fileName}`;
                        
                        // Ignore data folder 
                        if (fileName === "data" || fileName.startsWith(".") || relativePath.startsWith("data/")) return;
                        
                        if (file.isDirectory()) {
                            deleteExtraFiles(file, relativePath);
                            // Delete folder if it's now empty
                            const remaining = file.listFiles();
                            if (remaining && remaining.length === 0) {
                                file.delete();
                            }
                        } else {
                            // If local file isn't on GitHub and isn't blacklisted, delete
                            if (!remoteFiles.includes(relativePath) && !BLACKLIST.includes(relativePath)) {
                                file.delete();
                                chat(`&8Removed: &7${relativePath}`);
                            }
                        }
                    });
                };
                deleteExtraFiles(moduleFolder);
            }
            // ---------------------

            let version = "Unknown";
            const metaFile = data.tree.find(item => item.path === "metadata.json");
            if (metaFile) {
                const metaContent = FileLib.getUrlContent(RAW_BASE + "metadata.json");
                try {
                    version = JSON.parse(metaContent).version || "Unknown";
                } catch (e) { }
            }

            let state = { modified: false };
            let versionMsg = (version !== "Unknown") ? `files. Updating to version: &e${version}` : "files. Updating...";
            chat(`Found ${versionMsg}`);

            // 2. Update/Download files
            filesToDownload.forEach((path, index) => {
                const newContent = FileLib.getUrlContent(RAW_BASE + path + CACHE_BUST);

                if (newContent && !newContent.startsWith("404")) {
                    const oldContent = FileLib.read(MODULE_NAME, path);

                    if (newContent !== oldContent) {
                        FileLib.write(MODULE_NAME, path, newContent, true);
                        state.modified = true;
                        if (path.endsWith(".js")) {
                            chat("&aUpdated: &f" + path.split("/").pop());
                        }
                    }

                    // Progress bar logic
                    if (index % 3 === 0 || index === filesToDownload.length - 1) {
                        Client.scheduleTask(0, () => {
                            let percent = Math.round(((index + 1) / filesToDownload.length) * 100);
                            let filled = Math.round(percent / 5);
                            let bar = "&a" + "■".repeat(filled) + "&7" + "■".repeat(20 - filled);
                            ChatLib.actionBar(`&bUpdating: [${bar}&b] &f${percent}%`);
                        });
                    }
                }
            });

            Client.scheduleTask(0, () => {
                ChatLib.actionBar("");
                if (state.modified) {
                    chat("&aUpdate successful! &8Reloading...");
                    ChatLib.command("ct load", true);
                } else {
                    chat("&eNo changes detected. &7Latest version confirmed.");
                }
            });

        } catch (e) {
            Client.scheduleTask(0, () => chat("&cUpdate failed! Check console."));
            console.error(e);
        }
    }).start();
}).setName("updateclassified");