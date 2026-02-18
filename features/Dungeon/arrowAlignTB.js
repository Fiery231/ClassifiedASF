const possibleSolutions = [
    [7, 7, -1, -1, -1, 1, -1, -1, -1, -1, 1, 3, 3, 3, 3, -1, -1, -1, -1, 1, -1, -1, -1, 7, 1],
    [-1, -1, 7, 7, 5, -1, 7, 1, -1, 5, -1, -1, -1, -1, -1, -1, 7, 5, -1, 1, -1, -1, 7, 7, 1],
    [7, 7, -1, -1, -1, 1, -1, -1, -1, -1, 1, 3, -1, 7, 5, -1, -1, -1, -1, 5, -1, -1, -1, 3, 3],
    [5, 3, 3, 3, -1, 5, -1, -1, -1, -1, 7, 7, -1, -1, -1, 1, -1, -1, -1, -1, 1, 3, 3, 3, -1],
    [5, 3, 3, 3, 3, 5, -1, -1, -1, 1, 7, 7, -1, -1, 1, -1, -1, -1, -1, 1, -1, 7, 7, 7, 1],
    [7, 7, 7, 7, -1, 1, -1, -1, -1, -1, 1, 3, 3, 3, 3, -1, -1, -1, -1, 1, -1, 7, 7, 7, 1],
    [-1, -1, -1, -1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, 1, 1, -1, 1, -1, 1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, 1, 3, 3, 3, 3, -1, -1, -1, -1, 1, 7, 7, 7, 7, 1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, 1, -1, 1, -1, 7, 1, 7, 1, 3, 1, -1, 1, -1, 1, -1, -1, -1, -1, -1]
];

function getFramePositionFromIndex(index) {
    return {
        x: frameGridCorner.x,
        y: frameGridCorner.y + (index % 5),
        z: frameGridCorner.z + Math.floor(index / 5)
    }
}

function calculateClicksNeeded(current, target) {
    return (8 - current + target) % 8
}

function getFrames() {
    const itemFrames = World.getAllEntitiesOfType(net.minecraft.entity.decoration.ItemFrameEntity)
        .filter(f => {
            const stack = f.toMC().getHeldItemStack()
            return stack != null && !stack.isEmpty() && stack.getItem().toString() == "minecraft:arrow"
        })

    if (itemFrames.length == 0) return Array(25).fill(-1)

    const map = {}

    itemFrames.forEach(frame => {
        const itemFrame = frame.toMC()
        const pos = itemFrame.getBlockPos()
        map[`${pos.getX()},${pos.getY()},${pos.getZ()}`] = itemFrame.getRotation()
    })

    return Array(25).fill(0).map((_, index) => {
        const p = getFramePositionFromIndex(index)
        return map[`${p.x},${p.y},${p.z}`] ?? -1
    })
}


const frameGridCorner = { x: -2, y: 120, z: 75 };
let clicksRemaining = {};
let currentFrameRotations = Array(25).fill(-1);
let targetSolution = null;
import dungeonUtils from "../../../PrivateASF-Fabric/util/dungeonUtils"
import { PlayerInteractEntityC2SPacket } from "../../util/utils";

register("tick", () => {
    if (dungeonUtils.currentPhase != 3) return;

    clicksRemaining.clear()

    if (Player.getX() ** 2 + Player.getZ() ** 2 > 200 ** 2) {
        currentFrameRotations = null
        targetSolution = null
        return
    }

    currentFrameRotations = getFrames()
    
    possibleSolutions.forEach(arr => {
        for (let i = 0; i < arr.length; i++) {
            if ((arr[i] == -1 || currentFrameRotations[i] == -1) && arr[i] !== currentFrameRotations[i]) return;
        }

        targetSolution = arr

        for (let i = 0; i < arr.length; i++) {
            let clicks = calculateClicksNeeded(currentFrameRotations[i], arr[i])
            if (clicks !== 0) clicksRemaining[i] = clicks
        }
    })
})

register("packetSent", (packet, event) => {
    if (dungeonUtils.currentPhase != 3) return;

    let entity = packet.getEntity()
    return ChatLib.chat(entity)
    if (!(entity instanceof net.minecraft.entity.item.EntityItemFrame)) return
    if (!entity.func_82335_i() || entity.func_82335_i().getItem() !== net.minecraft.init.Items.arrow) return

    let pos = entity.getPosition()
    let frameIndex = ((pos.getY() - frameGridCorner.y) +
        (pos.getZ() - frameGridCorner.z) * 5)

    if (pos.getX() !== frameGridCorner.x) return
    if (frameIndex < 0 || frameIndex > 24) return

    if (!clicksRemaining.hasOwnProperty(frameIndex) &&
        Player.isSneaking() === invertSneak &&
        blockWrong) {
        cancel(event)
        return
    }

    recentClickTimestamps[frameIndex] = Date.now()

    if (currentFrameRotations) {
        currentFrameRotations[frameIndex] =
            (currentFrameRotations[frameIndex] + 1) % 8
    }

    if (targetSolution) {
        let needed = calculateClicksNeeded(
            currentFrameRotations[frameIndex],
            targetSolution[frameIndex]
        )

        if (needed === 0) delete clicksRemaining[frameIndex]
    }
}).setFilteredClass(PlayerInteractEntityC2SPacket)