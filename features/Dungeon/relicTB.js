import { registerPacketChat } from "../../../PrivateASF-Fabric/util/Events";
import { ArmorStand, Vec3 } from "../../../PrivateASF-Fabric/util/utils";
import c from "../../config"
import { getDistance3D, getSequence, PlayerInteractEntityC2SPacket, rightClick } from "../../util/utils";

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
    prevRelic = null
    placed = false
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
    if (Date.now() - lastClick < 150) return;
    
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
        if (Player.getHeldItem()?.getName()?.includes("Relic")) rightClick(true, false, true)
        else {
            Player.setHeldItemIndex(hotbarSlot)
            Client.scheduleTask(1, () => {
                if (!Player.getHeldItem()?.getName()?.includes("Relic")) return;
                rightClick(true, false, true)
                lastClick = Date.now()
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
            Client.scheduleTask(1, () => sendBlockInteract(coords[0], 7, coords[1]))
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

// const Handler = Java.type("net.minecraft.network.packet.c2s.play.PlayerInteractEntityC2SPacket$Handler")

// register("packetSent", (packet) => {

//     packet.handle(new Handler({
//         method_34219: (entity, hand) => {
//             ChatLib.chat("INTERACT")
//         },

//         method_34220: (entity, hand, vec) => {
//             ChatLib.chat("INTERACT_AT")
//         },

//         method_34218: (entity) => {
//             ChatLib.chat("ATTACK")
//         }
//     }))
//     ChatLib.chat("\n\n")
// }).setFilteredClass(PlayerInteractEntityC2SPacket)


// function getBlockHitResult(x, y, z) {
//     const player = Player.getPlayer()
//     const world = World.getWorld()

//     const start = player.getEyePos()
//     const end = new Vec3(x + 0.5, y + 0.5, z + 0.5)

//     const result = world.raycast(new RaycastContext(
//         start,
//         end,
//         ShapeType.OUTLINE,
//         FluidHandling.NONE,
//         player
//     ))
//     if (!result) return null
//     if (result.getType().toString() !== "BLOCK") return null
//     return result
// }
