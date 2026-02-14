const c = require("./config").default;
const { activategui } = require("./managers/guiManager");
require("./managers/updateManager");

const File = Java.type("java.io.File")
const modulesDir = new File("./config/ChatTriggers/modules")
const Prefix = "&l&0ClassifiedASF&7 >> "
const MODULE_NAME = "ClassifiedASF"
const DEPENDENCY_NAME = "PrivateASF-Fabric"
const privateASFFolder = new File(modulesDir, DEPENDENCY_NAME);

Client.scheduleTask(0, () => {
    if (!privateASFFolder.exists()) {
        ChatLib.chat("");
        ChatLib.chat(`&c&lFATAL ERROR: &0${MODULE_NAME} &7requires &5${DEPENDENCY_NAME} &7to function!`);
        ChatLib.chat(`&7Please make sure the &5${DEPENDENCY_NAME} &7module is installed and up-to-date in your modules folder.`);
        ChatLib.chat("");
        return;
    }
})

const IGNORED_FEATURES = ["autoTerms", "autoMelody", "autoClicker"];

const FEATURE_FOLDERS = [
    "Dungeon",
    "autoTerms"
];

const moduleFolder = new File(`./config/ChatTriggers/modules/${MODULE_NAME}`);

export default function ClassifiedASF() {

    if (!privateASFFolder.exists()) return;

    if (!modulesDir.exists()) return;
    if (!moduleFolder.exists()) return;

    let loadedCount = 0;

    FEATURE_FOLDERS.forEach(folderName => {
        const folder = new File(moduleFolder, `features/${folderName}`);
        if (!folder.exists() || !folder.isDirectory()) return;

        folder.listFiles().forEach(file => {
            const fileName = file.getName();

            if (fileName.endsWith(".js")) {
                // Check if ignored
                if (IGNORED_FEATURES.includes(fileName) || IGNORED_FEATURES.includes(fileName.replace(".js", ""))) {
                    return;
                }

                try {
                    // require path is relative to the module root
                    const cleanName = fileName.replace(".js", "");
                    const modulePath = `./features/${folderName}/${cleanName}`;

                    const M = require(modulePath).default;

                    if (typeof M === "function") {
                        new M();
                    }
                    loadedCount++;
                } catch (e) {
                    console.error(`Error in ${folderName}/${fileName}:`);
                    console.error(e.stack);
                    ChatLib.chat(`&cError loading &f${folderName}/${fileName}`);
                    ChatLib.chat(`&7Reason: &c${e.message}`);
                }
            }
        });
    });

    ChatLib.chat(`${Prefix}&aModule Loaded! (&f${loadedCount}&a features)`);



    register("command", () => {
        c.openGUI()
    }).setName("cl").setAliases("classifiedasf", "cla", "clasf")

    register("command", () => {
        setTimeout(() => {
            activategui()
        }, 25);
    }).setName("cagui")

    
}
