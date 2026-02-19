import c from "../../config"
import dungeonUtils from "../../../PrivateASF-Fabric/util/dungeonUtils"
import { chat, PlayerInteractEntityC2SPacket, rightClick } from "../../util/utils";
import RenderUtils from "../../../PrivateASF-Fabric/util/renderUtils";
const EntityItemFrame = Java.type("net.minecraft.entity.decoration.ItemFrameEntity")
const recentClickTimestamps = {};
const frameGridCorner = { x: -2, y: 120, z: 75 };
let clicksRemaining = {};
let currentFrameRotations = Array(25).fill(-1);
let targetSolution = null;

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
    const itemFrames = World.getAllEntitiesOfType(EntityItemFrame)
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
        const p = getFramePositionFromIndex(index);
        return map[`${p.x},${p.y},${p.z}`] ?? -1;
    });
}

const alignSolver1 = register("tick", () => {
    if (dungeonUtils.getPhase() != 3) return;
    clicksRemaining = {}

    const dist = Math.sqrt(Math.pow(Player.getX() - 0, 2) + Math.pow(Player.getZ() - 77, 2));
    if (dist > 200) {
        currentFrameRotations = null;
        targetSolution = null;
        return;
    }

    currentFrameRotations = getFrames()

    possibleSolutions.forEach(arr => {
        for (let i = 0; i < arr.length; i++) {
            if ((arr[i] === -1 || currentFrameRotations[i] === -1) && arr[i] !== currentFrameRotations[i]) return;
        }

        targetSolution = arr;

        for (let i = 0; i < arr.length; i++) {
            const needed = calculateClicksNeeded(currentFrameRotations[i], arr[i]);
            if (needed !== 0) clicksRemaining[i] = needed;
        }
    });
}).unregister()

const alignSolver2 = register("packetSent", (packet, event) => {
    if (dungeonUtils.getPhase() != 3) return;
    const entity = World.getWorld().getEntityById(packet.entityId);
    if (!entity || !(entity instanceof EntityItemFrame)) return;

    const MCEntity = new Entity(entity)
    if (!MCEntity.toMC().getHeldItemStack() || MCEntity.toMC().getHeldItemStack().getItem().toString() !== "minecraft:arrow") return

    const pos = [
        Math.floor(MCEntity.getX()),
        Math.floor(MCEntity.getY()),
        Math.floor(MCEntity.getZ())
    ]
    let frameIndex = ((pos[1] - frameGridCorner.y) +
        (pos[2] - frameGridCorner.z) * 5)


    if (pos[0] !== frameGridCorner.x || frameIndex < 0 || frameIndex > 24 || currentFrameRotations[frameIndex] === -1) return;

    if (!clicksRemaining.hasOwnProperty(frameIndex) && (Player.isSneaking() == c.arrowAlignInvertSneak) && c.arrowAlignBlockWrong) {
        ChatLib.chat("canceling")
        cancel(event);
        return;
    }

    recentClickTimestamps[frameIndex] = Date.now();

    if (targetSolution) {
        if (calculateClicksNeeded(currentFrameRotations[frameIndex], targetSolution[frameIndex]) === 0) {
            delete clicksRemaining[frameIndex];
        }
    }

}).setFilteredClass(PlayerInteractEntityC2SPacket).unregister()


const arrowAlignTB = register("step", () => {
    if (dungeonUtils.getPhase() != 3) return
    if ((Player.isSneaking()) || Object.keys(clicksRemaining).length == 0) return;

    const looking = Player.lookingAt();
    if (!looking || !(looking instanceof Entity)) return;

    const mcEntity = looking.toMC();
    if (!(mcEntity instanceof EntityItemFrame)) return;

    const pos = mcEntity.getBlockPos();
    const x = Math.floor(pos.getX()), y = Math.floor(pos.getY()), z = Math.floor(pos.getZ());

    const frameIndex = (y - frameGridCorner.y) + (z - frameGridCorner.z) * 5;

    if (x !== frameGridCorner.x || frameIndex < 0 || frameIndex > 24 || currentFrameRotations[frameIndex] === -1) return;

    if (clicksRemaining.hasOwnProperty(frameIndex)) {
        rightClick(true, false)
    }
}).setFps(1000 / (c.arrowAlignDelay ?? 150)).unregister()


const alignSolver3 = register("renderWorld", () => {
    if (Object.keys(clicksRemaining).length === 0 || dungeonUtils.getPhase() !== 3) return;

    Object.keys(clicksRemaining).forEach(indexString => {
        const index = parseInt(indexString);
        const clicks = clicksRemaining[index];

        if (clicks === 0) return;

        let colorCode = "§c";
        if (clicks < 3) {
            colorCode = "§2";
        } else if (clicks < 5) {
            colorCode = "§6";
        }


        const pos = getFramePositionFromIndex(index);

        const renderX = pos.x;
        const renderY = pos.y + 0.6;
        const renderZ = pos.z + 0.5;

        RenderUtils.drawText(
            `${colorCode}${clicks}`,
            renderX,
            renderY,
            renderZ,
            1,
            false
        );
    });
}).unregister()


if (c.arrowAlignSolver) {
    alignSolver1.register()
    alignSolver2.register()
    alignSolver3.register()
}

c.registerListener("Arrow Align Solver", (curr) => {
    clicksRemaining = {}
    targetSolution = null;
    if (curr) {
        alignSolver1.register()
        alignSolver2.register()
        alignSolver3.register()
    }
    else {
        alignSolver1.unregister()
        alignSolver2.unregister()
        alignSolver3.unregister()
    }
})

if (c.arrowAlignTB && c.arrowAlignSolver) {
    alignSolver1.register()
    alignSolver2.register()
    alignSolver3.register()
}

c.registerListener("Arrow Align TriggerBot", (curr) => {
    if (curr && c.arrowAlignSolver) arrowAlignTB.register()
    else arrowAlignTB.unregister()
})






// const nearbyFrames = World.getAllEntitiesOfType(EntityItemFrame).filter(frame => {

//     return Player.toMC().distanceTo(frame.toMC()) <= 5;
// });
// nearbyFrames.forEach(frame => {
//     const mcEntity = frame.toMC();
//     const pos = mcEntity.getBlockPos();

//     const x = Math.floor(pos.getX());
//     const y = Math.floor(pos.getY());
//     const z = Math.floor(pos.getZ());
//     const frameIndex = (y - frameGridCorner.y) + (z - frameGridCorner.z) * 5;

//     if (x === frameGridCorner.x && clicksRemaining.hasOwnProperty(frameIndex)) {

//         const packet = PlayerInteractEntityC2SPacket.interact(
//             frame.toMC(),
//             Player.isSneaking(),
//             Hand.MAIN_HAND
//         );
//         chat("sending packet")
//         Client.sendPacket(packet);
//     }
// });
//const InteractHandler = Java.type("net.minecraft.network.packet.c2s.play.PlayerInteractEntityC2SPacket$InteractHandler");


// ^^^ this is some align aura and idk if its bans
