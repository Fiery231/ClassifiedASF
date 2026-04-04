import { registerPacketChat } from "../../../PrivateASF-Fabric/util/Events"
import c from "../../config"
import { chat, CommonPingS2CPacket, pressMovementKey } from "../../util/utils"

const PlayerMoveC2SPacket = Java.type("net.minecraft.network.packet.c2s.play.PlayerMoveC2SPacket")
const PlayerMoveFull = Java.type("net.minecraft.network.packet.c2s.play.PlayerMoveC2SPacket$Full")
const PlayerInputC2SPacket = Java.type("net.minecraft.network.packet.c2s.play.PlayerInputC2SPacket")

let preparing = true
let packetSentTime = Date.now()
let freezePos = null
const instaMidTrigger = register("packetSent", (packet, event) => {
    if (!(packet instanceof PlayerMoveC2SPacket) && !(packet instanceof PlayerInputC2SPacket)) return;
    cancel(event)
    const riding = !!Player.asPlayerMP().getRiding();
    if (riding) {
        preparing = false;
    }
    if (!riding && !preparing && freezePos) {
        instaMidTrigger.unregister()
        preparing = true;
        if (c.instaMidPacket) Client.sendPacket(new PlayerMoveFull(freezePos.x, freezePos.y, freezePos.z, freezePos.yaw, freezePos.pitch, false, false))
        chat("attempting to instamid")
        packetSentTime = Date.now()
        Client.scheduleTask(20, () => midListener.register())
        pressMovementKey("jumpKey", false)
    }
}).setFilteredClasses([PlayerMoveC2SPacket, PlayerInputC2SPacket]).unregister()

const midListener = register("tick", () => {
    if (isOnPlatform()) {
        midListener.unregister()
        Client.showTitle("", "&5Yay?", 0, 40, 0)
    }
    else if (Date.now() - packetSentTime > 3000) {
        Client.showTitle("", "&5Failed", 0, 40, 0)
        midListener.unregister()
    }
}).unregister()


const ImidStuff = registerPacketChat((message) => {
    if (!c.hardCheat) return ImidStuff.unregister()
    if (message == "[BOSS] Necron: You went further than any human before, congratulations.") {
        if (isOnPlatform()) {
            pressMovementKey("jumpKey", true)
            Client.scheduleTask(1, () => testThingy.register())
        }
        else instaMidGui.unregister()
    }
    else if (message == "[BOSS] Goldor: You have done it, you destroyed the factory…") instaMidGui.register()
}).unregister()


const instaMidGui = register("renderOverlay", (ctx) => {
    if (!isOnPlatform()) return;
    new Text("&5Instamid Active", Renderer.screen.getWidth() / 2, Renderer.screen.getHeight() / 2 + 15)
        .setScale(1)
        .setAlign("center")
        .setShadow(true)
        .draw(ctx);
}).unregister()

const testThingy = register("packetReceived", (packet) => {
    if (!(packet instanceof CommonPingS2CPacket) || packet.getParameter() == 0) return;
    if (Player.getPlayer().isOnGround()) return;
    testThingy.unregister()
    preparing = true;
    instaMidTrigger.register()
    freezePos = { x: Player.getX(), y: Player.getY(), z: Player.getZ(), yaw: Player.getYaw(), pitch: Player.getPitch() }
    Client.scheduleTask(0, () => {
        Thread.sleep(c.instaMidTime)
        preparing = false
    })
    //Thread.sleep(c.instaMidTime)
}).setFilteredClass(CommonPingS2CPacket).unregister()

register("worldLoad", () => {
    freezePos = null
    instaMidGui.unregister()
    testThingy.unregister()
    instaMidTrigger.unregister()
})

function isOnPlatform() {
    if (Player.getY() > 100) return false;
    if (Player.getY() < 64) return false;
    return Math.abs(Player.getX() - 54.5) ** 2 + Math.abs(Player.getZ() - 76.5) ** 2 < 56.25;
}

c.registerListener("Insta Mid", (curr) => {
    if (curr && c.hardCheat) ImidStuff.register()
    else ImidStuff.unregister()
})

if (c.hardCheat && c.instaMid) ImidStuff.register()
