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
export const Blocks = Java.type("net.minecraft.block.Blocks")
export const Vec3 = Java.type("net.minecraft.util.math.Vec3d");

export const getDistance3D = (x1, y1, z1, x2, y2, z2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
export const getDistance2D = (x1, z1, x2, z2) => Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);

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

export const getPlayerCoords = () => {
    return [Player.getX(), Player.getY(), Player.getZ()]
}

export const getDistanceToCoord = (x, y, z) => {
    let [x0, y0, z0] = getPlayerCoords()
    return getDistance3D(x0, y0, z0, x, y, z)
}

export function leftClick(legitClick = false) {
    if (legitClick) {
        Client.getMinecraft().options["attackKey"].setPressed(true)
        Client.scheduleTask(1, () => Client.getMinecraft().options["attackKey"].setPressed(false))
    }
    else {
        const mc = Client.getMinecraft()
        const hit = mc.crosshairTarget

        if (!hit) return
        const type = hit.getType().toString()

        if (type === "BLOCK") mc.interactionManager.attackBlock(hit.getBlockPos(), hit.getSide())
        else if (type === "ENTITY") mc.interactionManager.attackEntity(mc.player, hit.getEntity())

        mc.player.swingHand(Hand.field_5808)
    }
}


export function rightClick(shouldSwing = false, legitClick = false, trigEntity = true, time = 1) {
    if (legitClick) {
        Client.getMinecraft().options["useKey"].setPressed(true)
        Client.scheduleTask(time, () => Client.getMinecraft().options["useKey"].setPressed(false))
    }
    else {
        const mc = Client.getMinecraft()
        const hit = mc.crosshairTarget
        if (!hit) return;
        if (hit.getType().toString() === "BLOCK") mc.interactionManager.interactBlock(mc.player, Hand.field_5808, hit)
        else if (hit.getType().toString() === "ENTITY" && trigEntity) mc.interactionManager.interactEntity(mc.player, hit.getEntity(), Hand.field_5808)
        else mc.interactionManager.interactItem(mc.player, Hand.field_5808)

        if (shouldSwing) mc.player.swingHand(Hand.field_5808)
    }
}

export function rightClickItem() {
    const mc = Client.getMinecraft()
    const hit = mc.crosshairTarget
    if (!hit) return;
    mc.interactionManager.interactItem(mc.player, Hand.field_5808)
}


export function pressMovementKey(key, state, exec) {
    if (['backKey', 'rightKey', 'leftKey', 'sprintKey', 'forwardKey', 'attackKey', 'sneakKey', 'useKey', 'jumpKey'].includes(key)) {
        if (!Client.getMinecraft().options[key]) return chat("wrong key")
        Client.getMinecraft().options[key].setPressed(state)
        if (exec) exec()
    } else chat("wrong key")
}

export function isPlayerInBox(x1, y1, z1, x2, y2, z2) {
    const x = Player.getX();
    const y = Player.getY();
    const z = Player.getZ();

    return (x >= Math.min(x1, x2) && x <= Math.max(x1, x2) &&
        y >= Math.min(y1, y2) && y <= Math.max(y1, y2) &&
        z >= Math.min(z1, z2) && z <= Math.max(z1, z2));
}

export function getSequence() {
    const world = World.getWorld();
    if (!world) return;

    const managerField = world.getClass().getDeclaredField("field_37951");
    managerField.setAccessible(true);
    const updateManager = managerField.get(world);

    updateManager.method_41937(); // increment
    const sequence = Number(updateManager.method_41942()) || 0;
    return sequence
}

