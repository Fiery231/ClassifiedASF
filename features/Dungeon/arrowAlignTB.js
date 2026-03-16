import c from "../../config"
import dungeonUtils from "../../../PrivateASF-Fabric/util/dungeonUtils"
import { PlayerInteractEntityC2SPacket, rightClick, Vec3 } from "../../util/utils";
import RenderUtils from "../../../PrivateASF-Fabric/util/renderUtils";
import { registerPacketChat } from "../../../PrivateASF-Fabric/util/Events";
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

const alignSolver1 = register("step", () => {
    if (!dungeonUtils.inBoss) return;
    clicksRemaining = {}

    const dist = Math.sqrt(Math.pow(Player.getX() - 0, 2) + Math.pow(Player.getZ() - 77, 2));
    if (dist > 25) {
        currentFrameRotations = null;
        targetSolution = null;
        return;
    }

    currentFrameRotations = getFrames()

    possibleSolutions.forEach(arr => {
        let valid = true
        for (let i = 0; i < arr.length; i++) {
            if ((arr[i] === -1 || currentFrameRotations[i] === -1) && arr[i] !== currentFrameRotations[i]) {
                valid = false
                break
            }
        }
        if (!valid) return

        targetSolution = arr;

        for (let i = 0; i < arr.length; i++) {
            const needed = calculateClicksNeeded(currentFrameRotations[i], arr[i]);
            if (needed !== 0) clicksRemaining[i] = needed;
        }
    });
}).setFps(100).unregister()

const alignSolver2 = register("packetSent", (packet, event) => {
    if (!dungeonUtils.inBoss) return;
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


const lastFinalClick = {};

const arrowAlignTB = register("step", () => {
    if (!dungeonUtils.inBoss) return
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
        const clicks = clicksRemaining[frameIndex]

        if (clicks < 2) {
            const now = Date.now()
            if (!lastFinalClick[frameIndex] || now - lastFinalClick[frameIndex] >= c.arrowAlignDelay * 2) {
                rightClick(true, true)
                lastFinalClick[frameIndex] = now
            }
        }
        else if (clicks < 3) {
            const now = Date.now()
            if (!lastFinalClick[frameIndex] || now - lastFinalClick[frameIndex] >= c.arrowAlignDelay * 2) {
                rightClick(true, false)
                lastFinalClick[frameIndex] = now
            }
        }
        else {
            rightClick(true, false)
        }
    }
}).setFps(1000 / (c.arrowAlignDelay ?? 150)).unregister()


const alignSolver3 = register("renderWorld", () => {
    if (Object.keys(clicksRemaining).length === 0 || !dungeonUtils.inBoss) return;

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
        alignSolver3.unregister()
        if (c.arrowAlignTB) return
        alignSolver1.unregister()
        alignSolver2.unregister()
    }
})

c.registerListener("Arrow Align Click Delay", (curr) => {
    arrowAlignTB.setFps(1000 / (c.arrowAlignDelay ?? 150))
})

if (c.arrowAlignTB || c.arrowAlignSolver) {
    alignSolver1.register()
    alignSolver2.register()
    if (c.arrowAlignSolver) alignSolver3.register()
    if (c.arrowAlignTB) arrowAlignTB.register()
}

c.registerListener("Arrow Align TriggerBot", (curr) => {
    if (curr) {
        alignSolver1.register()
        alignSolver2.register()
        arrowAlignTB.register()
        if (c.arrowAlignSolver) alignSolver3.register()
    }
    else {
        arrowAlignTB.unregister()
        if (!c.arrowAlignSolver) {
            alignSolver1.unregister()
            alignSolver2.unregister()
            alignSolver3.unregister()
        }
    }

})



let inP3 = false;
const solutions = [[7, 7, 7, 7, null, 1, null, null, null, null, 1, 3, 3, 3, 3, null, null, null, null, 1, null, 7, 7, 7, 1], [null, null, null, null, null, 1, null, 1, null, 1, 1, null, 1, null, 1, 1, null, 1, null, 1, null, null, null, null, null], [5, 3, 3, 3, null, 5, null, null, null, null, 7, 7, null, null, null, 1, null, null, null, null, 1, 3, 3, 3, null], [null, null, null, null, null, null, 1, null, 1, null, 7, 1, 7, 1, 3, 1, null, 1, null, 1, null, null, null, null, null], [null, null, 7, 7, 5, null, 7, 1, null, 5, null, null, null, null, null, null, 7, 5, null, 1, null, null, 7, 7, 1], [7, 7, null, null, null, 1, null, null, null, null, 1, 3, 3, 3, 3, null, null, null, null, 1, null, null, null, 7, 1], [5, 3, 3, 3, 3, 5, null, null, null, 1, 7, 7, null, null, 1, null, null, null, null, 1, null, 7, 7, 7, 1], [7, 7, null, null, null, 1, null, null, null, null, 1, 3, null, 7, 5, null, null, null, null, 5, null, null, null, 3, 3], [null, null, null, null, null, 1, 3, 3, 3, 3, null, null, null, null, 1, 7, 7, 7, 7, 1, null, null, null, null, null]];
const deviceStandLocation = [0, 120, 77];
const deviceCorner = [-2, 120, 75];
const recentClicks = [];
let currentFrames = null;

function getCurrentFrames() {
    const entities = World.getAllEntitiesOfType(EntityItemFrame);
    const frames = {};

    for (let entity of entities) {
        const itemFrame = entity.toMC()
        let pos = [itemFrame.getX(), itemFrame.getY(), itemFrame.getZ()].map(Math.floor);
        let posStr = pos.join();
        let mcItem = itemFrame.getHeldItemStack()
        if (!mcItem) continue;
        if (mcItem.getItem().toString() !== "minecraft:arrow") continue;
        let rotation = itemFrame.getRotation();
        frames[posStr] = { entity, rotation };
    }

    let [x, y0, z0] = deviceCorner;
    let array = [];
    for (let dz = 0; dz < 5; dz++) {
        for (let dy = 0; dy < 5; dy++) {
            let index = dy + dz * 5;
            if (currentFrames && Date.now() - recentClicks[index] < 1000) {
                array.push(currentFrames[index]);
                continue;
            }
            let y = y0 + dy;
            let z = z0 + dz;
            let posStr = [x, y, z].join();
            if (posStr in frames) {
                array.push(frames[posStr]);
                continue;
            }
            array.push(null);
        }
    }

    return array;
}

const aura = register("tick", () => {
    if (!dungeonUtils.inDungeon) return;
    if ((Player.getX() - deviceStandLocation[0]) ** 2 + (Player.getY() - deviceStandLocation[1]) ** 2 + (Player.getZ() - deviceStandLocation[2]) ** 2 > 100) {
        currentFrames = null;
        return;
    }
    currentFrames = getCurrentFrames();
    const rotations = currentFrames.map(frame => frame?.rotation ?? null);
    const solution = solutions.find(solution => !solution.some((value, index) => value === null ^ rotations[index] === null));
    if (!solution) return;
    for (let z of Object.entries(currentFrames).sort((a, b) => a[1] && b[1] && ((Player.getX() - b[1].entity.toMC().getX()) ** 2 + (Player.getY() + Player.getPlayer().getEyeHeight(Player.getPlayer().getPose()) - b[1].entity.toMC().getY()) ** 2 + (Player.getZ() - b[1].entity.toMC().getZ()) ** 2) - ((Player.getX() - a[1].entity.toMC().getX()) ** 2 + (Player.getY() + Player.getPlayer().getEyeHeight(Player.getPlayer().getPose()) - a[1].entity.toMC().getY()) ** 2 + (Player.getZ() - a[1].entity.toMC().getZ()) ** 2))) {
        let [index, frame] = z;
        if (!frame) continue;
        const entity = frame.entity.toMC();
        const eyeHeight = Player.getY() + Player.getPlayer().getEyeHeight(Player.getPlayer().getPose())
        if ((Player.getX() - entity.getX()) ** 2 + (eyeHeight - entity.getY()) ** 2 + (Player.getZ() - entity.getZ()) ** 2 > 25) continue;
        let clicksNeeded = (solution[index] - frame.rotation + 8) % 8;
        if (clicksNeeded <= 0) continue;
        if (!entity) return;
        if (!inP3 && currentFrames.filter((frame, index) => frame && (solution[index] - frame.rotation + 8) % 8 > 0).length <= 1) --clicksNeeded;
        if (clicksNeeded > 0) recentClicks[index] = Date.now();
        for (let i = 0; i < clicksNeeded; ++i) {
            frame.rotation = (frame.rotation + 1) % 8;
            const packet1 = PlayerInteractEntityC2SPacket.interact(
                entity,
                Player.isSneaking(),
                Hand.MAIN_HAND
            );
            const packet2 = PlayerInteractEntityC2SPacket.interactAt(
                entity,
                Player.isSneaking(),
                Hand.MAIN_HAND,
                new Vec3(0.03125, 0.0, 0.0)
            )
            Client.sendPacket(packet2)
            Client.sendPacket(packet1)
        }
        break;
    }
}).unregister()

registerPacketChat((message) => {
    if (message === "[BOSS] Goldor: Who dares trespass into my domain?") inP3 = true;
    else if (message === "The Core entrance is opening!") inP3 = false;
})

register("worldUnload", () => {
    inP3 = false;
});

c.registerListener("Arrow Align Aura", (curr) => {
    if (curr) aura.register()
    else aura.unregister()
})

if (c.alignAura) aura.register()





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
