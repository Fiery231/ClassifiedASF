import { registerPacketChat } from "../../../PrivateASF-Fabric/util/Events";
import { ArmorStand, Vec3 } from "../../../PrivateASF-Fabric/util/utils";
import c from "../../config"
import { chat, getDistance3D, getSequence, PlayerInteractEntityC2SPacket, rightClick, pressMovementKey } from "../../util/utils";
import RotationUtils from "../../util/RotationUtils";
import dungeonUtils from "../../../PrivateASF-Fabric/util/dungeonUtils";

const RaycastContext = Java.type("net.minecraft.world.RaycastContext")
const ShapeType = Java.type("net.minecraft.world.RaycastContext$ShapeType")
const FluidHandling = Java.type("net.minecraft.world.RaycastContext$FluidHandling")
const BlockHitResult = Java.type("net.minecraft.util.hit.BlockHitResult")
let prevRelic = null;
let placed = false

register("worldLoad", () => {
    relicPickupAura.unregister()
    relicPickupTB.unregister()
    relicPlaceAura.unregister()
    relicPlaceTB.unregister()
    tickRelic.unregister()
    prevRelic = null
    placed = false
    hadRelic = false
})

registerPacketChat((message) => {
    if (message == "[BOSS] Necron: All this, for nothing...") {
        if (c.relicPickupTB || c.relicPickupAura) {
            if (c.relicPickupAura && c.hardCheat) relicPickupAura.register()
            else if (c.relicPickupTB) relicPickupTB.register()
        }

        if (c.relicPlaceAura || c.relicPlaceTB) {
            if (c.relicPlaceAura && c.hardCheat) relicPlaceAura.register()
            else if (c.relicPlaceTB) relicPlaceTB.register()
        }
        prevRelic = null
        placed = false
    }
    else if (message == "[BOSS] The Wither King: You... again?") {
        relicPickupAura.unregister()
        relicPickupTB.unregister()
        relicPlaceAura.unregister()
        relicPlaceTB.unregister()
    }
})

const relicPickupTB = register("renderWorld", () => {
    if (!Player.lookingAt() || !(Player.lookingAt() instanceof Entity)) return
    if (Player.lookingAt()?.getName() == "Armor Stand") {
        if (!Player.lookingAt()?.getStackInSlot(5)?.toString()?.includes("Relic")) return;
        rightClick(true, true)
        relicPickupTB.unregister()
    }
}).unregister()

const relicPickupAura = register("tick", () => {
    const px = Player.getX()
    const py = Player.getY()
    const pz = Player.getZ()

    const stands = World.getAllEntitiesOfType(ArmorStand)

    const entity = stands.find(e => {
        const name = e.getStackInSlot(5)?.toString()
        if (!name || !name.includes("Relic")) return false

        
        const dist = getDistance3D(
            px, py, pz,
            e.getX(), e.getY(), e.getZ()
        )

        return dist < 4
    })

    if (!entity) return

    interactEntity(entity)
    relicPickupAura.unregister()
}).unregister()

const EquipmentSlot = Java.type("net.minecraft.class_1304")
let hadRelic = false

register("packetSent", (packet) => {
    if (!c.relicLook || (dungeonUtils.currentPhase != 4 && dungeonUtils.currentPhase != 5)) return;
    const entity = World.getWorld().getEntityById(packet.entityId)
    if (!entity || !(entity instanceof ArmorStand)) return

    const helmet = entity.method_6118(EquipmentSlot.field_6169)
    if (!helmet) return;
    let relic = getRelicColor(helmet.getName()?.getString()?.removeFormatting())
    if (!relic || (relic != "Red" && relic != "Orange")) return; 
    let coords = placeblocks[relic.toLowerCase()]
    if (!coords) return;
    
    const [y, p] = RotationUtils.calcYawPitch(coords[0] + 0.5, 7.5, coords[1] + 0.5)
    RotationUtils.rotateSmoothly(y, p, c.relicLookTime, () => {tickRelic.register()})
    if (c.relicLookRun) pressMovementKey("forwardKey", true)
    hadRelic = false
}).setFilteredClass(PlayerInteractEntityC2SPacket)

const tickRelic = register("tick", () => {
    if (!c.relicLook || (dungeonUtils.currentPhase != 4 && dungeonUtils.currentPhase != 5)) {
        hadRelic = false
        tickRelic.unregister();
        return;
    }
    if (RotationUtils.isRotating()) return;
    let hotbarSlot = Player.getInventory().getItems()
        .slice(0, 9)
        .findIndex(item => item?.getName()?.includes("Relic"))

    if (hotbarSlot === -1) {
        if (hadRelic) {
            hadRelic = false
            tickRelic.unregister()
        }
        return
    }

    hadRelic = true

    let relic = getRelicColor(Player.getInventory()?.getStackInSlot(hotbarSlot)?.getName()?.removeFormatting())
    if (!relic || (relic != "Red" && relic != "Orange")) return; 

    let coords = placeblocks[relic.toLowerCase()]
    if (!coords) return

    const [y, p] = RotationUtils.calcYawPitch(coords[0] + 0.5, 7.5, coords[1] + 0.5)

    RotationUtils.rotateSmoothly(y, p, c.relicLookTime)
}).unregister()

const interactEntity = (entity) => {
    const dy = entity.getHeight() / 2
    const dx = 0.0
    const dz = 0.0
    const packet = PlayerInteractEntityC2SPacket.interactAt(
        entity.toMC(),
        Player.isSneaking(),
        Hand.MAIN_HAND,
        new Vec3(dx, dy, dz)
    );
    Client.sendPacket(packet)
}

const placeblocks = {
    "green": [49, 44],
    "red": [51, 42],
    "purple": [54, 41],
    "orange": [57, 42],
    "blue": [59, 44]
}
// y = 6 and 7
function getRelicColor(itemName) {
    const match = itemName.match(/Corrupted (\w+) Relic/);
    return match ? match[1] : null;
}


let lastClick = Date.now()
const relicPlaceTB = register("renderWorld", () => {
    if (Date.now() - lastClick < 600) return;
    
    const look = Player.lookingAt()
    if (!look || !(look instanceof Block)) return

    let hotbarSlot = Player.getInventory().getItems()
        .slice(0, 9)
        .findIndex(item => item?.getName()?.includes("Relic"))

    if (hotbarSlot == -1) return

    let relic = getRelicColor(Player.getInventory()?.getStackInSlot(hotbarSlot)?.getName()?.removeFormatting())
    if (!relic) return

    let coords = placeblocks[relic.toLowerCase()]
    if (!coords) return

    const pos = look.getPos()
    const [x, y, z] = [pos.getX(), pos.getY(), pos.getZ()]

    if (x == coords[0] && z == coords[1] && (y == 6 || y == 7)) {
        lastClick = Date.now()
        if (Player.getHeldItem()?.getName()?.includes("Relic")) rightClick(true, true, true, 3)
        else {
            Player.setHeldItemIndex(hotbarSlot)
            Client.scheduleTask(1, () => {
                if (!Player.getHeldItem()?.getName()?.includes("Relic")) return;
                rightClick(true, true, true, 3)
                lastClick = Date.now()
                if (c.relicLookRun)pressMovementKey("forwardKey", false)
            })
        }
    }
}).unregister()

const relicPlaceAura = register("tick", () => {

    let hotbarSlot = Player.getInventory().getItems().slice(0, 9).findIndex(item => item?.getName()?.includes("Relic"))
    if (hotbarSlot == -1) return;
    let relic = getRelicColor(Player.getInventory()?.getStackInSlot(hotbarSlot)?.getName()?.removeFormatting())
    if (!relic) return;
    if (prevRelic == null || relic != prevRelic) {
        prevRelic = relic
        placed = false
    }

    if (placed) return;

    let coords = placeblocks[relic.toLowerCase()]
    if (!coords) return;

    if (getDistance3D(Player.getX(), Player.getY(), Player.getZ(), coords[0], 7, coords[1]) < 6 && !placed) {
        placed = true
        if (Player.getHeldItem()?.getName()?.includes("Relic")) sendBlockInteract(coords[0], 7, coords[1])
        else {
            Player.setHeldItemIndex(hotbarSlot)
            Client.scheduleTask(1, () => {
                sendBlockInteract(coords[0], 7, coords[1])
                if (c.relicLookRun) pressMovementKey("forwardKey", false)
            })
        }
    }

}).unregister()

const PlayerInteractBlockC2SPacket = Java.type("net.minecraft.network.packet.c2s.play.PlayerInteractBlockC2SPacket")
const Direction = Java.type('net.minecraft.util.math.Direction');
const MCBlockPos = Java.type("net.minecraft.util.math.BlockPos");
const sendBlockInteract = (x, y, z) => {
    if (World.getBlockAt(x, y, z)?.getState()?.getBlock()?.getName()?.getString() == "Air") return ChatLib.chat("why this fail???")
    const hitResult = new BlockHitResult(
        new Vec3(x + 0.5, y + 0.5, z + 0.5),
        Direction.UP,
        new MCBlockPos(x, y, z),
        false
    )
    const packet = new PlayerInteractBlockC2SPacket(Hand.MAIN_HAND, hitResult, getSequence())
    Client.sendPacket(packet)
}
