import { registerPacketChat } from "../../../PrivateASF-Fabric/util/Events"
import { CloseHandledScreenC2SPacket } from "../../util/utils"

const STAGES = {
    IDLE: 0,
    GET_STASH: 1,
    BAZAAR: 2,
    ARE_YOU_SURE: 3,
    CLOSE_BAZAAR: 4,
    AWAIT_STASH: 5
}

let isFinalRun = false

let stage = STAGES.IDLE
const validMenus = ["Bazaar ➜ Farming", "Bazaar ➜ Mining", "Bazaar ➜ Combat", "Bazaar ➜ Woods & Fishes", "Bazaar ➜ Oddities", "Are you sure?"]
const validBazaarMenus = ["Bazaar ➜ Farming", "Bazaar ➜ Mining", "Bazaar ➜ Combat", "Bazaar ➜ Woods & Fishes", "Bazaar ➜ Oddities"];
const confirmMenu = "Are you sure?"

register("command", () => {
    autoStash.register()
    killGui.register()
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
        stage = STAGES.BAZAAR
        ChatLib.command("bz")
        tickListener.register()
    }
    else if (message == "Your stash isn't holding any items or materials!") Client.scheduleTask(5, () => killSwitch())
    else if (message == "Couldn't unstash your item stash! Your inventory is full!") {
        stage = STAGES.BAZAAR
        ChatLib.command("bz")
        tickListener.register()
    }
    else if (message == "You may only use this command after 4s on the server!" || message == "[Bazaar] You don't have anything to sell!" || message == "You can't use this when the server is about to restart!" || message == "[Bazaar] No items could be matched to buyers!") killSwitch()
}).unregister()

let ticks = 0
let lastPickupTime = 0
const PICKUP_TIMEOUT = 1000
const tickListener = register("tick", () => {
    if (ticks++ % 10 != 0) return;
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
        if (Date.now() - lastPickupTime > PICKUP_TIMEOUT) {
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

const killGui = register("packetSent", () => {
    killSwitch()
}).setFilteredClass(CloseHandledScreenC2SPacket).unregister()


const killSwitch = () => {
    autoStash.unregister()
    tickListener.unregister()
    guiKill.unregister()
    killGui.unregister()
    ChatLib.chat("kill switch")
}

const guiKill = register("guiKey", () => {
    killSwitch()
}).unregister()