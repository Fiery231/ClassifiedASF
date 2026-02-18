import c from "../../config"
import terminalUtils from "../../util/terminalUtils"
import { chat, CloseScreenS2CPacket, OpenScreenS2CPacket, ScreenHandlerSlotUpdateS2CPacket } from "../../util/utils";
import { playSound } from "../../../PrivateASF-Fabric/util/utils"

let lastClickTime
let clickedWindow = false;
let firstClick
let lastWindowId = -1;
let pendingSlot = -1;

const main = register('renderworld', () => {
    if (!c.autoTerm) return;

    let currentDelay = (c.autoTermDelay ?? 150)
    const fcDelay = (c.autoTermFCDelay ?? 400)
    const breakThreshold = (c.autoTermBreakThres ?? 500)

    const randomFactor = 1 + (Math.random() * 0.05) + (Math.sin(Date.now() / 300) * 0.03) + (Math.random() * Math.random() * 0.1);

    currentDelay *= randomFactor

    if (firstClick && (Date.now() - lastClickTime < fcDelay)) return;
    if (Date.now() - lastClickTime < currentDelay) return
    if (Date.now() - lastClickTime > breakThreshold) clickedWindow = false

    if (!terminalUtils.isInTerm() || clickedWindow) return;

    const Solution = terminalUtils.getSolution();

    if (!Solution || !Solution.length) return;

    const currentClick = Solution.shift()

    if (Player.getContainer() && lastWindowId != -1) {
        const click = currentClick[2] === 0 ? "MIDDLE" : "RIGHT"
        pendingSlot = currentClick[1]
        Player.getContainer().click(currentClick[1], false, click)
        //Client.getMinecraft().interactionManager.clickSlot(lastWindowId, currentClick[1], 2, net.minecraft.screen.slot.SlotActionType.CLONE, Client.getMinecraft().player)
        //console.log("sent syncId: " + lastWindowId + " slot: " + currentClick[1] + " button: 2 Actiontype:Clone")
        lastClickTime = Date.now()
        clickedWindow = true
        firstClick = false;
    }
}).unregister()



register('step', () => {
    if (!terminalUtils.isInTerm()) {
        firstClick = true
        lastClickTime = Date.now()
        lastWindowId = -1
        pendingSlot = -1
    }
})

register("packetReceived", () => {
    main.unregister()
    firstClick = true
    lastClickTime = Date.now()
    lastWindowId = -1
    pendingSlot = -1
}).setFilteredClass(CloseScreenS2CPacket)

register('packetReceived', (packet, event) => {
    if (!terminalUtils.isInTerm()) return

    if (packet.getSyncId() !== lastWindowId) return;
    if (pendingSlot === -1) return;
    lastWindowId = packet.getSyncId()
    if (packet.getSlot() == pendingSlot) {
        terminalUtils.clickedIndex.push(pendingSlot)
        pendingSlot = -1;
    }
}).setFilteredClass(ScreenHandlerSlotUpdateS2CPacket)

register("guiMouseClick", (x, y, button, isPressed, gui, event) => {
    if (!c.autoTerm) return
    if (!terminalUtils.isInTerm()) return
    if (!gui.class.toString().includes("class_476")) return
    cancel(event)
    if (isPressed) {
        chat("You are in a terminal!")
        playSound("random.orb", 1, 0.5)
    }
})

register("guiKey", (char, keyCode, gui, event) => { // Schizo check #2
    if (!c.autoTerm) return
    if (!terminalUtils.isInTerm()) return
    if (!gui.class.toString().includes("class_476")) return

    const mc = Client.getMinecraft()
    const hotbarKeys = mc.options.hotbarKeys.map(key => key.getDefaultKey().getCode())

    if (!hotbarKeys.includes(keyCode)) return

    cancel(event)
    chat("You are in a terminal!")
    playSound("random.orb", 1, 0.5)
})

register("packetReceived", (packet, event) => {
    if (!(packet instanceof OpenScreenS2CPacket)) return
    try {
        const windowTitle = packet.getName().getString();
        clickedWindow = false
        lastWindowId = packet.getSyncId()
        main.register()
        if (!windowTitle) return chat("no title???");

    } catch (e) {
        main.unregister()
        chat("hi something bad happened")
    }
}).setFilteredClass(OpenScreenS2CPacket)