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

// let customTermSize = 1.7; // "Term Size" setting
// const gap = 0;            // "Gap" setting
// const GLFW = Java.type("org.lwjgl.glfw.GLFW")
// let currentSlot = -1;
// let randX = 0;
// let randY = 0;

// let startX = 0;
// let startY = 0;
// let moveStartTime = 0;
// let guiOpenTime = 0; // Track when the terminal opened

// let controlX = 0;
// let controlY = 0;

// const mousestuff = register("renderOverlay", () => {
//     if (!terminalUtils.isInTerm() || !c.autoTerm) return guiOpenTime = Date.now();
//     if (!Player.getContainer()) return;
//     const Solution = terminalUtils.getSolution();
//     if (!Solution || !Solution.length) return;
//     if (Date.now() - guiOpenTime < c.autoTermFCDelay - 100) return;
//     const slotIndex = Solution.shift()[1]; // Peek at the current target
//     const currentDelay = (c.autoTermDelay ?? 150);

//     const sw = Renderer.screen.getWidth() * 3 / Renderer.screen.getScale();
//     const sh = Renderer.screen.getHeight() * 3 / Renderer.screen.getScale();
//     const scale = 3;

//     if (slotIndex !== currentSlot) {
//         currentSlot = slotIndex;
//         moveStartTime = Date.now();

//         startX = Client.getMouseX();
//         startY = Client.getMouseY();

//         const slotSize = 16 * customTermSize;
//         const safeZone = slotSize * 0.8;
//         const margin = (slotSize - safeZone) / 2;

//         randX = margin + (Math.random() * safeZone);
//         randY = margin + (Math.random() * safeZone);

//         const totalSlotSpace = 18 * customTermSize + gap;
//         const totalGuiWidth = (9 * totalSlotSpace) - gap;
//         const totalGuiHeight = (6 * totalSlotSpace) - gap;
//         const guiLeft = (sw - totalGuiWidth) / 2;
//         const headerOffset = 10 * customTermSize;
//         const guiTop = (sh - totalGuiHeight) / 2 + headerOffset;

//         const col = slotIndex % 9;
//         const row = Math.floor(slotIndex / 9);

//         const finalDestX = (guiLeft + (col * totalSlotSpace) + randX) * scale;
//         const finalDestY = (guiTop + (row * totalSlotSpace) + randY) * scale;

//         // --- GENERATE RANDOM CONTROL POINT ---
//         // This offsets the "middle" of the path to create an arc
//         const midX = (startX + finalDestX) / 2;
//         const midY = (startY + finalDestY) / 2;
//         const travelDist = Math.sqrt(Math.pow(finalDestX - startX, 2) + Math.pow(finalDestY - startY, 2));

//         // Randomly arc left or right by up to 20% of the travel distance
//         const offset = (Math.random() - 0.5) * (travelDist * 0.4);
//         controlX = midX + offset;
//         controlY = midY + offset;
//     }

//     // 2. Calculate Destination
//     const elapsed = Date.now() - moveStartTime;
//     let t = Math.min(elapsed / currentDelay, 1);

//     // Quadratic Bezier Formula: (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
//     // This creates a curved path using the control point
//     const invT = 1 - t;

//     // Recalculate destination (to handle screen resizing during move)
//     const totalSlotSpace = 18 * customTermSize + gap;
//     const totalGuiWidth = (9 * totalSlotSpace) - gap;
//     const totalGuiHeight = (6 * totalSlotSpace) - gap;
//     const guiLeft = (sw - totalGuiWidth) / 2;
//     const guiTop = (sh - totalGuiHeight) / 2 + (10 * customTermSize);
//     const destX = (guiLeft + (slotIndex % 9 * totalSlotSpace) + randX) * scale;
//     const destY = (guiTop + (Math.floor(slotIndex / 9) * totalSlotSpace) + randY) * scale;

//     const nextX = (invT * invT * startX) + (2 * invT * t * controlX) + (t * t * destX);
//     const nextY = (invT * invT * startY) + (2 * invT * t * controlY) + (t * t * destY);

//     const window = Client.getMinecraft().getWindow().getHandle();
//     GLFW.glfwSetCursorPos(window, nextX, nextY);
// }).unregister()



//org.mozilla.javascript.EcmaError: TypeError: Cannot find function #getStack in object class_2813[containerId=0, stateId=37, slotNum=9, buttonNum=0, clickType=PICKUP, changedSlots={9=><empty>},

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
    //mousestuff.unregister()
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
    const dropKeyCode = mc.options.dropKey.getDefaultKey().getCode();
    if (!hotbarKeys.includes(keyCode) && keyCode !== dropKeyCode) return

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
        //mousestuff.register()
        if (!windowTitle) return chat("no title???");

    } catch (e) {
        main.unregister()
        //mousestuff.unregister()
        chat("hi something bad happened")
    }
}).setFilteredClass(OpenScreenS2CPacket)