import { registerPacketChat } from "../../../PrivateASF-Fabric/util/Events"
import { CloseHandledScreenC2SPacket } from "../../util/utils"

const STAGES = {
    IDLE: 0,
    GET_STASH: 1,
    DROP_BOOKS: 2,
    BAZAAR: 3,
    ARE_YOU_SURE: 4,
    CLOSE_BAZAAR: 5,
    AWAIT_STASH: 6
}

let isFinalRun = false

let stage = STAGES.IDLE
const validMenus = ["Bazaar ➜ Farming", "Bazaar ➜ Mining", "Bazaar ➜ Combat", "Bazaar ➜ Woods & Fishes", "Bazaar ➜ Oddities", "Are you sure?"]
const validBazaarMenus = ["Bazaar ➜ Farming", "Bazaar ➜ Mining", "Bazaar ➜ Combat", "Bazaar ➜ Woods & Fishes", "Bazaar ➜ Oddities"];
const confirmMenu = "Are you sure?"

register("command", () => {
    autoStash.register()
    killGui.register()
    guiKill.register()
    ChatLib.command("pickupstash items")
    isFinalRun = false
    stage = STAGES.AWAIT_STASH
}).setName("autostash")

const autoStash = registerPacketChat((message) => {
    const match = message.match(/^You picked up (\d+|all) (items|item) from your item stash!$/)
    if (match) {
        if (match[1] === "all") {
            isFinalRun = true
        }
        stage = STAGES.DROP_BOOKS
        ChatLib.command("wd")
        //ChatLib.command("bz")
        throwBooks.register()
        throwBookTicks = 1
    }
    else if (message == "Your stash isn't holding any items or materials!") Client.scheduleTask(5, () => killSwitch())
    else if (message == "Couldn't unstash your item stash! Your inventory is full!") {
        stage = STAGES.DROP_BOOKS
        ChatLib.command("wd")
        //ChatLib.command("bz")
        throwBooks.register()
        throwBookTicks = 1
    }
    else if (message == "[Bazaar] You don't have anything to sell!") {
        stage = STAGES.CLOSE_BAZAAR
    }
    else if (message == "You may only use this command after 4s on the server!" || message == "You can't use this when the server is about to restart!") killSwitch()
}).unregister()

let ticks = 1
let lastPickupTime = 0
const tickListener = register("tick", () => {
    if (ticks++ % 9 != 0) return;
    let clickType = "MIDDLE"
    let shiftClick = false;
    ChatLib.chat(stage)
    if (stage == STAGES.GET_STASH) {
        ChatLib.command("pickupstash items")
        lastPickupTime = Date.now()
        stage = STAGES.AWAIT_STASH
    }
    else if (stage == STAGES.IDLE) return killSwitch()
    else if (stage == STAGES.AWAIT_STASH) {
        if (Date.now() - lastPickupTime > 1500) {
            ChatLib.command("pickupstash items")
            lastPickupTime = Date.now()
            ChatLib.chat("Resending /pickupstash due to timeout...")
        }
    }

    const container = Player.getContainer();
    if (!container) return;
    const containerName = container.getName().toString().removeFormatting()
    if (!validMenus.includes(containerName)) return;

    if (stage == STAGES.BAZAAR && validBazaarMenus.includes(containerName) && container?.getStackInSlot(47)?.getName()?.removeFormatting() == "Sell Inventory Now") {
        container.click(47, shiftClick, clickType)
        stage = STAGES.ARE_YOU_SURE
    }
    else if (stage == STAGES.ARE_YOU_SURE && containerName == confirmMenu && container?.getStackInSlot(11)?.getName()?.removeFormatting() == "Selling whole inventory") {
        container.click(11, shiftClick, clickType)
        stage = STAGES.CLOSE_BAZAAR
    }
    else if (stage == STAGES.CLOSE_BAZAAR && validBazaarMenus.includes(containerName) && container?.getStackInSlot(49)?.getName()?.removeFormatting() == "Close") {
        container.click(49, shiftClick, clickType)
        if (isFinalRun) stage = STAGES.IDLE
        else stage = STAGES.GET_STASH
    }
}).unregister()

const uselessbooks = ["FEATHER_FALLING", "ULTIMATE_COMBO", "INFINITE_QUIVER", "ULTIMATE_BANK", "ULTIMATE_NO_PAIN_NO_GAIN", "ULTIMATE_JERRY"]

let throwBookTicks = 1
const throwBooks = register("tick", () => {
    if (throwBookTicks > 100) {
        killGui()
        ChatLib.chat("why are you still here? Run command again :)")
        return;
    }
    if (throwBookTicks++ % 6 != 0) return;
    const inv = Player.getContainer();

    if (!inv || !inv.getName().toString().removeFormatting().includes("Wardrobe")) {
        ChatLib.chat("Open your wardrobe first");
        return;
    }

    let foundBook = false;

    for (let i = 0; i < inv.getSize(); i++) {
        const item = inv.getStackInSlot(i);
        if (!item) continue;

        const name = item.getName().removeFormatting();
        
        if (name.startsWith("Enchanted Book") && uselessbooks.includes(getSingleEnchantBook(item))) {
            ChatLib.chat(`Dropping slot ${i}`);
            inv.drop(i, true);
            foundBook = true;
            throwBookTicks = 1
            break;
        }
    }

    if (!foundBook) {
        tickListener.register()
        throwBooks.unregister()
        stage = STAGES.BAZAAR
        ticks = 1
        ChatLib.command("bz") 
    }
}).unregister()

const clickCloseItem = (items) => {
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if (!item) continue;

        const typeName = item.getType().getName().removeFormatting();
        const itemName = item.getName().removeFormatting();

        if (typeName.includes("Barrier") && itemName.includes("Close")) {
            Player.getContainer().click(i, false, "MIDDLE");
            break; 
        }
    }
    
}

function getSingleEnchantBook(item) {
    if (!item) return null;

    try {
        const nbtString = item.getNBT().toString();
        const customData = extractCustomData(nbtString);
        if (!customData) return null;

        const idMatch = customData.match(/\bid:"([^"]+)"/);
        if (!idMatch) return null;

        const id = idMatch[1];
        if (id !== "ENCHANTED_BOOK") return null;

        const enchantMatch = customData.match(/enchantments:\{([^}]+)\}/);
        if (!enchantMatch) return null;

        const enchants = enchantMatch[1]
            .split(",")
            .map(e => e.split(":")[0].toUpperCase());

        if (enchants.length !== 1) return null;

        return enchants[0];
    } catch (e) {
        console.error("Failed to parse enchanted book:", e);
        return null;
    }
}

function extractCustomData(nbtString) {
    const startKey = "minecraft:custom_data=>{";
    const startIndex = nbtString.indexOf(startKey);
    if (startIndex === -1) return null;

    let i = startIndex + startKey.length;
    let depth = 1;
    let result = "";

    while (i < nbtString.length && depth > 0) {
        const char = nbtString[i];

        if (char === "{") depth++;
        if (char === "}") depth--;

        if (depth > 0) result += char;
        i++;
    }

    return result;
}

const killGui = register("packetSent", () => {
    killSwitch()
}).setFilteredClass(CloseHandledScreenC2SPacket).unregister()


const killSwitch = () => {
    autoStash.unregister()
    tickListener.unregister()
    guiKill.unregister()
    killGui.unregister()
    throwBooks.unregister()
    ChatLib.chat("kill switch")
}

const guiKill = register("guiKey", () => {
    killSwitch()
}).unregister()



