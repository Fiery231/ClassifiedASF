import c from "../../config"
import { chat, getDistanceToCoord, rightClickItem } from "../../util/utils";
import RenderUtils from "../../../PrivateASF-Fabric/util/renderUtils"
import { registerPacketChat } from "../../../PrivateASF-Fabric/util/Events";
import dungeonUtils from "../../../PrivateASF-Fabric/util/dungeonUtils";
import leapUtils from "../../util/leapUtils";
import rotationUtils from "../../util/rotationUtils";

const BlockUpdateS2CPacket = Java.type("net.minecraft.network.packet.s2c.play.BlockUpdateS2CPacket");
const ChunkDeltaUpdateS2CPacket = Java.type("net.minecraft.network.packet.s2c.play.ChunkDeltaUpdateS2CPacket");
const Blocks = Java.type("net.minecraft.block.Blocks");
const TerracottaBlock = Java.type("net.minecraft.block.TerracottaBlock");

const blocks = [
    { x: 64, y: 126, z: 50 },
    { x: 66, y: 126, z: 50 },
    { x: 68, y: 126, z: 50 },
    { x: 64, y: 128, z: 50 },
    { x: 66, y: 128, z: 50 },
    { x: 68, y: 128, z: 50 },
    { x: 64, y: 130, z: 50 },
    { x: 66, y: 130, z: 50 },
    { x: 68, y: 130, z: 50 }
]

// Updated to Map to track expiration timestamps
let unshotBlocks = []
const predictedBlocks = new Set()
let shots = 0
let timeStarted
let active = false
let lastShot = Date.now()
let devicedone = false
let rodding = false

register("worldUnload", () => {
    restartI4()
    active = false
    start4(active)
    devicedone = false
    rodding = false
    BlockListener.unregister()
    MultiBlockListener.unregister()
})


const restartI4 = () => {
    predictedBlocks.clear()
    unshotBlocks = [...blocks]
}
const key = (x, y, z) => `${x},${y},${z}`
const getRandom = (min, max) => Math.random() * (max - min) + min;
const isEmerald = (x, y, z) => World.getBlockAt(x, y, z).getType().getName().includes("Emerald");
const AtI4 = () => getDistanceToCoord(63.5, 127, 35.5) < 0.75
const platePowered = () => World.getBlockAt(63, 127, 35).getState().toString().includes("power=1")

const start4 = (bool) => {
    if (bool) {
        auto4stuff.register()
        auto4solver.register()
        BlockListener.register()
        MultiBlockListener.register()
    }
    else {
        auto4stuff.unregister()
        auto4solver.unregister()
    }
}

const getBowCooldown = () => {
    const bowItem = Player.getInventory().getItems().slice(0, 8).find(item =>
        item &&
        item?.getType()?.getId() == 894 &&
        item?.getLore()?.some(line => line.toString().includes("Shot Cooldown"))
    )
    if (!bowItem) return 250
    const line = bowItem?.getLore()?.find(line => line.toString().includes("Shot Cooldown"))
    const match = line.toString().removeFormatting().match(/Shot Cooldown: (\d+\.?\d*)s/)
    if (!match) return 250
    return parseFloat(match[1]) * 1000
}

const getAdjacentPrediction = () => {
    const isTerm = Player.getHeldItem()?.getName()?.includes("Terminator")
    if (isTerm) {
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i]
            if (blocks[i].x === 66) continue
            if (!unshotBlocks.includes(block)) continue
            if (predictedBlocks.has(block)) continue
            let offsetDirection = block.x === 64 ? 1 : -1
            const offsetBlock = blocks[i + offsetDirection]
            if (isEmerald(block.x, block.y, block.z) || isEmerald(blocks[i + offsetDirection].x, block.y, block.z)) continue
            if (unshotBlocks.includes(offsetBlock) && !predictedBlocks.has(offsetBlock)) {
                return { x: block.x, y: block.y, z: block.z, index: i, offsetDirection: offsetDirection, adjacent: true }
            }
        }
    }
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        if (!unshotBlocks.includes(block)) continue
        if (predictedBlocks.has(block)) continue
        if (isEmerald(block.x, block.y, block.z)) continue
        return { x: block.x, y: block.y, z: block.z, index: i, adjacent: false }
    }
    return
}

const classNames = ["archer", "berserk", "healer", "mage", "tank"]
function getClassUser(className) {
    const party = dungeonUtils.playerClasses
    for (let playerName in party) {
        let playerClass = party[playerName].class
        if (className.toLowerCase() === playerClass.toLowerCase()) return playerName
    }
    chat(`&aNo player found with class &6${className}&c!`)
    return false
}

function getUserName(name = "") {
    if (classNames.includes(name.toLowerCase())) return getClassUser(name)
    return name
}

const auto4stuff = register("step", () => {
    if (!c.Auto4) return
    if (!active) return
    if (Player?.getHeldItem()?.getType()?.getId() !== 894 || Player?.getHeldItem()?.getName()?.toLowerCase()?.includes("last breath")) return
    if (!AtI4() || !platePowered()) {
        if (!platePowered() && unshotBlocks.length > 0) {
            predictedBlocks.clear()
            unshotBlocks = [...blocks]
        }
        return;
    }
    const bowCooldown = getBowCooldown()
    if (Date.now() - lastShot < (bowCooldown - c.Auto4Rotate)) return
    if (rotationUtils.isRotating()) return;
    let blockToShoot
    const prediction = getAdjacentPrediction()
    const emeraldBlock = unshotBlocks.find(({ x, y, z }) => World.getBlockAt(x, y, z).getType().getName().includes("Emerald"))

    if ((emeraldBlock && !predictedBlocks.has(emeraldBlock)) || (emeraldBlock && !prediction && unshotBlocks.length <= 2)) {
        blockToShoot = emeraldBlock
        if (Player.getHeldItem()?.getName()?.includes("Terminator")) {
            const offsetDirection = blockToShoot.x === 64 ? 1 : -1
            const index = blocks.indexOf(emeraldBlock) + (offsetDirection === -1 ? -1 : 0)
            const shotBlocks = [blocks[index], blocks[index + 1]]
            predictedBlocks.add(shotBlocks[0])
            predictedBlocks.add(shotBlocks[1])
            Client.scheduleTask(c.Auto4Timeout ?? 10, () => { predictedBlocks.delete(shotBlocks[0]); predictedBlocks.delete(shotBlocks[1]); })
        } else {
            const shotBlocks = blocks[blocks.indexOf(emeraldBlock)]
            predictedBlocks.add(shotBlocks)
            Client.scheduleTask(c.Auto4Timeout ?? 10, () => predictedBlocks.delete(shotBlocks))
        }

    } else if (c.Auto4Prediction > 0) { // Predict
        blockToShoot = prediction
        if (!blockToShoot) return
        const index = unshotBlocks.indexOf(blocks[blockToShoot.index]) + (blockToShoot.offsetDirection === -1 ? -1 : 0)
        if (blockToShoot.adjacent) {
            const shotBlocks = [unshotBlocks[index], unshotBlocks[index + 1]]
            predictedBlocks.add(shotBlocks[0])
            predictedBlocks.add(shotBlocks[1])
            Client.scheduleTask((c.Auto4Prediction * 5 * (getBowCooldown() / 250)) - 4, () => { predictedBlocks.delete(shotBlocks[0]); predictedBlocks.delete(shotBlocks[1]); })
        }
        else {
            const shotBlocks = unshotBlocks[index]
            predictedBlocks.add(shotBlocks)
            Client.scheduleTask((c.Auto4Prediction * 5 * (getBowCooldown() / 250)) - 4, () => predictedBlocks.delete(shotBlocks))
        }
    }
    if (!blockToShoot) return
    let offset = 0.5
    if (Player.getHeldItem()?.getName()?.includes("Terminator")) offset = blockToShoot.x === 64 ? 1.3 : -0.6
    let [yaw, pitch] = rotationUtils.calcYawPitch(blockToShoot.x + offset, blockToShoot.y + 1, blockToShoot.z);
    if (c.Auto4Randomize) {
        yaw += getRandom(-0.5, 0.5)
        pitch += getRandom(-0.5, 0.5)
    }

    if (c.Auto4Rotate > 0) {
        rotationUtils.rotateSmoothly(yaw, pitch, c.Auto4Rotate ?? 100, () => {
            lastShot = Date.now()
            rightClickItem()
            shots++;
        });
    }
    else {
        rotationUtils.rotate(yaw, pitch)
        shots++
        lastShot = Date.now()
        rightClickItem()
    }
}).setFps(100).unregister()

const auto4solver = register("renderWorld", (ctx) => {
    if (!active) return
    blocks.forEach(block => {
        let color
        if (isEmerald(block.x, block.y, block.z)) color = [0.2, 1.0, 0.3, 0.35]
        else if (!unshotBlocks.includes(block)) color = [1.0, 0.2, 0.2, 0.25]
        else if (predictedBlocks.has(block)) color = [0.7, 0.3, 1.0, 0.30]
        else return

        const box = RenderUtils.getBox(block.x + 0.5, block.y, block.z + 0.5, 1, 1)
        RenderUtils.drawFilled(box, color, true)
        RenderUtils.drawOutline(box, color, true)
    })
}).unregister()


registerPacketChat((message) => {
    if (!c.Auto4) return
    if (message == "[BOSS] Goldor: Who dares trespass into my domain?") {
        timeStarted = Date.now();
        shots = 0;
        restartI4()
        active = true
        start4(active)
        devicedone = false
        return;
    }
    else if (message == "[BOSS] Storm: I should have known that I stood no chance." && c.Auto4Early) {
        restartI4()
        active = true
        start4(active)
        devicedone = false
        return;
    }
    else if (/^(?:Your (?:⚚ )?Bonzo's Mask saved your life!|Second Wind Activated! Your Spirit Mask saved your life!)$/.test(message)) {
        if (!active || !c.Auto4Rod) return;
        if (!AtI4() || !platePowered()) return
        const rodSlot = Player.getInventory().getItems().findIndex(item => item?.getName().toLowerCase().includes("rod"))
        if (rodSlot > 7 || rodSlot < 0) return
        setTimeout(() => {
            if (getDistanceToCoord(63.5, 127, 35.5) > 0.75 || !active || devicedone) return
            rodding = true
            active = false
            //start4(active)
            const heldItemIndex = Player.getHeldItemIndex()
            Client.scheduleTask(1, () => {if (!devicedone) Player.setHeldItemIndex(rodSlot)})
            Client.scheduleTask(2, () => {if (!devicedone) rightClickItem()})
            Client.scheduleTask(3, () => {
                if (devicedone) {
                    I4AutoLeap()
                }
                else {
                    Player.setHeldItemIndex(heldItemIndex)
                    active = true
                    rodding = false
                    //start4(active)
                }
                
            })
        }, 2500)
    }
    const match = message.match(/^(\w{3,16}) completed a device! \(\d\/\d\)$/)
    if (!match || match[1] != Player.getName() || !AtI4() || !platePowered()) return;
    active = false
    start4(active)
    chat(`i4 took ${((Date.now() - timeStarted) / 1000).toFixed(2)} seconds and ${shots} shots to finish.`)
    devicedone = true
    rotationUtils.stopRotation()
    if (c.Auto4Leap) {
        if (!rodding) I4AutoLeap()
    }
})

const I4AutoLeap = () => {
    const user = getUserName(c.i4Leap)
    if (user) {
        chat("Auto Leaping to " + user)
        leapUtils.autoLeap(user)
    }
}

const BlockListener = register("packetReceived", (packet, event) => {
    if (!active) return
    const pos = packet.getPos();
    const positionXYZ = { x: pos.getX(), y: pos.getY(), z: pos.getZ() };

    const originalBlock = blocks.find(b => b.x === positionXYZ.x && b.y === positionXYZ.y && b.z === positionXYZ.z);
    if (!originalBlock) return;

    const index = unshotBlocks.findIndex(({ x, y, z }) => positionXYZ.x === x && positionXYZ.y === y && positionXYZ.z === z)
    const block = packet.getState().getBlock().getName().getString()

    if (block.includes("Emerald") && index === -1) {
        unshotBlocks.push(originalBlock);
        predictedBlocks.delete(originalBlock);
        return;
    }

    // Standard removal logic
    if (index === -1 || !block.includes("Terracotta")) return;
    if (isEmerald(positionXYZ.x, positionXYZ.y, positionXYZ.z)) {
        unshotBlocks.splice(index, 1);
    }
}).setFilteredClass(BlockUpdateS2CPacket).unregister()

const MultiBlockListener = register("packetReceived", (packet, event) => {
    if (!active) return;
    packet.visitUpdates((pos, state) => {
        const positionXYZ = { x: pos.getX(), y: pos.getY(), z: pos.getZ() };

        const originalBlock = blocks.find(b => b.x === positionXYZ.x && b.y === positionXYZ.y && b.z === positionXYZ.z);
        if (!originalBlock) return;

        const index = unshotBlocks.findIndex(({ x, y, z }) => positionXYZ.x === x && positionXYZ.y === y && positionXYZ.z === z)
        const block = state.getBlock().getName().getString();

        if (block.includes("Emerald") && index === -1) {
            unshotBlocks.push(originalBlock);
            predictedBlocks.delete(originalBlock);
            return;
        }

        if (index === -1 || !block.includes("Terracotta")) return;
        if (isEmerald(positionXYZ.x, positionXYZ.y, positionXYZ.z)) {
            unshotBlocks.splice(index, 1);
        }
    });
}).setFilteredClass(ChunkDeltaUpdateS2CPacket).unregister()

register("command", () => {
    restartI4()
    active = !active
    start4(active)
    chat(`auto4 ${active ? "enabled" : "disabled"}`)
}).setName("auto4test")