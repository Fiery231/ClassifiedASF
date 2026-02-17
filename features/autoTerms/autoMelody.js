import c from "../../config"
import terminalUtils from "../../util/terminalUtils"
import { chat, CloseScreenS2CPacket, OpenScreenS2CPacket, ScreenHandlerSlotUpdateS2CPacket } from "../../util/utils";

let inTerminal = false;
let cwid = -1;
const slots = [];
let windowSize = 0;
let lastOpen = 0;
let progress = [0, 4]
let progress2 = [0, 0];
//let blink = false;
//const blinkQueue = []

const melodyRegex = /^Click the button on time!$/

register("packetReceived", (packet, event) => {
    const currentTitle = packet.getName().getString()
    cwid = packet.getSyncId()
    
    let match = currentTitle.match(melodyRegex)
    if (match) {
        lastOpen = new Date().getTime();
        inTerminal = true;
        while (slots.length) slots.pop()
        windowSize = 44 // may change after the row removal :)
    }
    else inTerminal = false

}).setFilteredClass(OpenScreenS2CPacket)

register("packetReceived", (packet, event) => {
    inTerminal = false;
    cwid = -1
}).setFilteredClass(CloseScreenS2CPacket)

// register("packetReceived", (packet, event) => {
//     if (!inTerminal || !c.autoMelody) return;
//     const slot = packet.getSlot()
//     const itemStack = packet.getStack()
//     const windowId = packet.getSyncId()
//     if (slot < 0) return;
//     if (slot >= windowSize) return;
    
//     if (itemStack != null) {
//         if (itemStack.toString().includes("minecraft:air")) return;
//         const item = new Item(itemStack)
//         slots[slot] = {
//             slot,
//             name: item.getType().getRegistryName()
//         }
        
//         if (slots[slot].name == "minecraft:lime_stained_glass_pane") {
//             const correct = slots.find(slot => slot && slot.name == "minecraft:magenta_stained_glass_pane")?.slot - 1;
//             const button = Math.floor(slot / 9) - 1;
//             const current = slot % 9 - 1;
//             progress[0] = button;
//             progress2[0] = current;
//             progress2[1] = correct;
//             if (current !== correct) return;
//             const buttonSlot = button * 9 + 16;
//             const time = new Date().getTime()
            
//             Client.scheduleTask(0, () => click(buttonSlot, 2, net.minecraft.screen.slot.SlotActionType.CLONE))

//             if (time - lastOpen < 500 && current == 0 && c.noSkipFirst) return

//             if (((c.melodySkip == 1 && (current == 0 || current == 4)) || c.melodySkip == 2) && button != 0 && button != 3) {
//                 if (button <= 3) Client.scheduleTask(1, () => click(buttonSlot + 9, 2, net.minecraft.screen.slot.SlotActionType.CLONE))
//                 const shouldRestrict = c.onlySkip2 && (time - lastOpen < 500);
//                 if (!shouldRestrict) {
//                     if (button <= 2) Client.scheduleTask(2, () => click(buttonSlot + 18, 2, net.minecraft.screen.slot.SlotActionType.CLONE))
//                     if (button <= 1) Client.scheduleTask(3, () => click(buttonSlot + 27, 2, net.minecraft.screen.slot.SlotActionType.CLONE))
//                 }
//             }
//         }

//     }
// }).setFilteredClass(ScreenHandlerSlotUpdateS2CPacket)

// function click(slot, button, ActionType) {
//     if (slot == undefined || button == undefined) return;
//     if (slot < 16 || slot > 43) return;
//     if (cwid == -1 || !Client.getMinecraft()) return;
//     Client.getMinecraft().interactionManager.clickSlot(cwid, slot, button, ActionType, Client.getMinecraft().player)
// }


function click(slot, button = "MIDDLE") {
    if (slot == undefined || button == undefined) return;
    if (slot < 16 || slot > 43) return;
    
    const container = Player.getContainer()
    if (!container) return;

    try {
        container.click(slot, false, button)
    } catch (e) {}
}

register("packetReceived", (packet, event) => {
    if (!inTerminal || !c.autoMelody) return;
    const slot = packet.getSlot()
    const itemStack = packet.getStack()
    const windowId = packet.getSyncId()
    if (slot < 0) return;
    if (slot >= windowSize) return;
    if (cwid != windowId) return chat("this shouldn't happen???")
    if (itemStack != null) {
        if (itemStack.toString().includes("minecraft:air")) return;
        const item = new Item(itemStack)
        slots[slot] = {
            slot,
            name: item.getType().getRegistryName()
        }
        
        if (slots[slot].name == "minecraft:lime_stained_glass_pane") {
            const correct = slots.find(slot => slot && slot.name == "minecraft:magenta_stained_glass_pane")?.slot - 1;
            const button = Math.floor(slot / 9) - 1;
            const current = slot % 9 - 1;
            progress[0] = button;
            progress2[0] = current;
            progress2[1] = correct;
            if (current !== correct) return;
            const buttonSlot = button * 9 + 16;
            const time = new Date().getTime()
            //if (lastOpen + c.melodyFirstDelay > time) return; don't really think I ever needed this

            Client.scheduleTask(0, () => click(buttonSlot, "MIDDLE"))
            
            if (time - lastOpen < 500 && current == 0 && c.noSkipFirst) return

            if (((c.melodySkip == 1 && (current == 0 || current == 4)) || c.melodySkip == 2) && button != 3) {
                if (button <= 3) Client.scheduleTask(1, () => click(buttonSlot + 9, "MIDDLE"))
                const shouldRestrict = c.onlySkip2 && (time - lastOpen < 500);
                if (!shouldRestrict) {
                    if (button <= 2) Client.scheduleTask(2, () => click(buttonSlot + 18, "MIDDLE"))
                    if (button <= 1) Client.scheduleTask(3, () => click(buttonSlot + 27, "MIDDLE"))
                }
            }
        }

    }
}).setFilteredClass(ScreenHandlerSlotUpdateS2CPacket)
