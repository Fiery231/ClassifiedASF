import * as ConfigModule from "../config";
export const InventoryScreen = Java.type("net.minecraft.client.gui.screen.ingame.InventoryScreen")
export const OpenScreenS2CPacket = Java.type("net.minecraft.network.packet.s2c.play.OpenScreenS2CPacket")
export const ScreenHandlerSlotUpdateS2CPacket = Java.type("net.minecraft.network.packet.s2c.play.ScreenHandlerSlotUpdateS2CPacket")
export const CloseScreenS2CPacket = Java.type('net.minecraft.network.packet.s2c.play.CloseScreenS2CPacket')
export const ClickSlotC2SPacket = Java.type('net.minecraft.network.packet.c2s.play.ClickSlotC2SPacket')
export const CloseHandledScreenC2SPacket = Java.type('net.minecraft.network.packet.c2s.play.CloseHandledScreenC2SPacket')
export const PlayerInteractEntityC2SPacket = Java.type("net/minecraft/network/packet/c2s/play/PlayerInteractEntityC2SPacket")
export const CommonPingS2CPacket = Java.type('net.minecraft.network.packet.s2c.common.CommonPingS2CPacket')
export const PlayerPositionLookS2CPacket = Java.type("net.minecraft.network.packet.s2c.play.PlayerPositionLookS2CPacket"); // s08packet


const prefixOptions = ["ClassifiedASF", "Classified", "PrivateASF", "Private", "PA", "PASF"];

export function getPrefix() {
    const c = ConfigModule.default;
    const index = (c && typeof c.customPrefix === 'number') ? c.customPrefix : 0;
    const name = prefixOptions[index] || "ClassifiedASF";
    return `&l&0${name}&7 >>`;
}

export function chat(msg) {
    ChatLib.chat(`${getPrefix()} &r${msg}`)
}

export function leftClick() {
    //const c = ConfigModule.default;
    const mc = Client.getMinecraft()
    const hit = mc.crosshairTarget

    if (!hit) return
    const type = hit.getType().toString()

    if (type === "BLOCK") mc.interactionManager.attackBlock(hit.getBlockPos(), hit.getSide())
    else if (type === "ENTITY") mc.interactionManager.attackEntity(mc.player, hit.getEntity())

    mc.player.swingHand(Hand.field_5808)
}


export function rightClick(shouldSwing = false, legitClick = false) {
    if (legitClick) {
        Client.getMinecraft().options["useKey"].setPressed(true)
        Client.scheduleTask(1, () => Client.getMinecraft().options["useKey"].setPressed(false))
    }
    else {
        const mc = Client.getMinecraft()
        const hit = mc.crosshairTarget
        if (!hit) return;
        if (hit.getType().toString() === "BLOCK") mc.interactionManager.interactBlock(mc.player, Hand.field_5808, hit)
        //else if (hit.getType().toString() === "ENTITY") mc.interactionManager.interactEntity(mc.player, hit.getEntity(), Hand.field_5808)
        else mc.interactionManager.interactItem(mc.player, Hand.field_5808)

        if (shouldSwing) mc.player.swingHand(Hand.field_5808)
    }
}


export function pressMovementKey(key, state, exec) {
    if (['backKey', 'rightKey', 'leftKey', 'sprintKey', 'forwardKey', 'attackKey', 'sneakKey', 'useKey', 'jumpKey'].includes(key)) {
        if (!Client.getMinecraft().options[key]) return chat("wrong key")
        Client.getMinecraft().options[key].setPressed(state)
        if (exec) exec()
    } else chat("wrong key")
}