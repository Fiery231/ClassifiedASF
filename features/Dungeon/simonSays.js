import c from "../../config"
import { CommonPingS2CPacket, rightClick } from "../../util/utils";
import RenderUtils from "../../../PrivateASF-Fabric/util/renderUtils"
import { data, drawText, registerOverlay } from "../../managers/guiManager";
import dungeonUtils from "../../../PrivateASF-Fabric/util/dungeonUtils";

const startButtonPos = [110, 121, 91];
const grid = [
    [110, 123, 92], [110, 123, 93], [110, 123, 94], [110, 123, 95],
    [110, 122, 92], [110, 122, 93], [110, 122, 94], [110, 122, 95],
    [110, 121, 92], [110, 121, 93], [110, 121, 94], [110, 121, 95],
    [110, 120, 92], [110, 120, 93], [110, 120, 94], [110, 120, 95]
];

const BlockUpdateS2CPacket = Java.type("net.minecraft.network.packet.s2c.play.BlockUpdateS2CPacket");
const ChunkDeltaUpdateS2CPacket = Java.type("net.minecraft.network.packet.s2c.play.ChunkDeltaUpdateS2CPacket");
const PlayerInteractBlockC2SPacket = Java.type("net.minecraft.network.packet.c2s.play.PlayerInteractBlockC2SPacket")

const ssCache = new Map();

function getCacheKey(x, y, z) {
    return `${x},${y},${z}`;
}

function refreshSSCache() {
    ssCache.clear();
}

let clickInOrder = [];
let clickNeeded = 0;
let firstPhase = true;
let startClickCounter = 0;
let lastLanternTick = -1;
let inP3S1 = false
let isDoingSS = false
let lastClick = Date.now()
let rotatingTo = -1;
let rotationInProgress = false;
let sneakLocked = false

function resetSolution() {
    clickInOrder = [];
    clickNeeded = 0;
    lastLanternTick = -1;
}

const isAtSS = () => {
    const dx = Player.getX() - 108.5;
    const dy = Player.getY() - 120;
    const dz = Player.getZ() - 94;

    return Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.5;
};

function getPlayerEyeCoords() {
    const eyeHeight = Player.isSneaking() ? 1.27 : 1.62;
    return [
        Player.getX(),
        Player.getY() + eyeHeight,
        Player.getZ()
    ];
}

function getYawPitch(x, y, z) {
    const [px, py, pz] = getPlayerEyeCoords();

    const dx = x - px;
    const dy = y - py;
    const dz = z - pz;

    const dist = Math.sqrt(dx * dx + dz * dz);

    const yaw = Math.atan2(dz, dx) * 180 / Math.PI - 90;
    const pitch = -(Math.atan2(dy, dist) * 180 / Math.PI);

    return [yaw, pitch];
}

function rotate(yaw, pitch) {
    if (Number.isNaN(yaw) || Number.isNaN(pitch)) return;

    Player.getPlayer().setYaw(yaw)
    Player.getPlayer().setPitch(pitch)
}

let activeRotation = null;

function normalizeYaw(yaw) {
    while (yaw > 180) yaw -= 360;
    while (yaw < -180) yaw += 360;
    return yaw;
}

function getShortestYaw(from, to) {
    let diff = normalizeYaw(to - from);
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff;
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function rotateSmoothly(targetYaw, targetPitch, duration = 150) {

    if (activeRotation) activeRotation.unregister();

    const startYaw = Player.getYaw();
    const startPitch = Player.getPitch();

    const yawDiff = getShortestYaw(startYaw, targetYaw);
    const pitchDiff = targetPitch - startPitch;

    const startTime = Date.now();

    rotationInProgress = true;

    activeRotation = register("step", () => {

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const eased = easeOutCubic(progress);

        const yaw = startYaw + yawDiff * eased;
        const pitch = startPitch + pitchDiff * eased;

        rotate(yaw, pitch);

        if (progress >= 1) {
            activeRotation.unregister();
            activeRotation = null;
            rotationInProgress = false;
        }

    }).setFps(120); // very smooth
}


function isLookingAtBlock(target) {
    const hit = Player.lookingAt();
    if (!hit) return false;

    const x = hit.getX();
    const y = hit.getY();
    const z = hit.getZ();

    return x === target.x - 1 && y === target.y && z === target.z;
}

function processLogic(x, y, z, state) {
    const newBlock = state.getBlock().getName().getString();
    const key = getCacheKey(x, y, z);
    const oldBlock = ssCache.get(key);
    ssCache.set(key, newBlock);
    const isPowered = state.toString().includes("powered=true");
    const oldPowered = World.getBlockAt(x, y, z).getState().toString().includes("powered=true")

    if (x === startButtonPos[0] && y === startButtonPos[1] && z === startButtonPos[2]) {
        refreshSSCache()
        resetSolution();
        firstPhase = true;
        rotatingTo = -1
        rotationInProgress = false
        return;
    }

    if (y < 120 || y > 123 || z < 92 || z > 95) return;

    if (x == 111) {
        if (newBlock == "Obsidian" && oldBlock == "Sea Lantern") {
            if (clickInOrder.some(p => p.y === y && p.z === z)) return;
            clickInOrder.push({ x: x, y: y, z: z });
            console.log(
                "ClickInOrder:",
                clickInOrder.map((p, i) => `#${i + 1} (${p.x}, ${p.y}, ${p.z})`).join(" -> ")
            );
            lastLanternTick = 0;
            if (firstPhase) {
                //if (clickInOrder.length === 2) clickInOrder.reverse();
                if (clickInOrder.length === 3) clickInOrder.splice(clickInOrder.length - 2, 1);
            }
        }
    }
    else if (x == 110) {
        if (newBlock == "Air" && !firstPhase) resetSolution()
        else if (oldBlock == "Stone Button" && oldPowered) {

            clickNeeded = clickInOrder.findIndex(pos => pos.x == x + 1 && pos.y == y && pos.z == z) + 1;
            if (clickNeeded >= clickInOrder.length) {
                resetSolution()
                firstPhase = false;
            }
        }
    }
}


register("worldLoad", () => {
    resetSolution();
    firstPhase = true;
    startClickCounter = 0;
    rotatingTo = -1
    rotationInProgress = false
});

const SSAutoStartRegister = register("chat", () => {
    startClickCounter = 0;
    if (!isAtSS() || Player.lookingAt()?.getType()?.getName()?.toString()?.removeFormatting() != "Stone Button" || Player.isSneaking()) return;

    let totalDelay = 0;

    for (let i = 0; i < 3; i++) {
        let randomFactor = 1 + (Math.random() * 0.2 - 0.1);
        let delay = c.SSAutoStartDelay ?? 150 * randomFactor * i;
        if (i === 2) delay += 40;
        totalDelay += delay;

        setTimeout(() => {
            Client.scheduleTask(() => {
                rightClick(true, false);
            });
        }, totalDelay);
        if (i == 2 && c.SSAuto) {
            Client.scheduleTask(Math.ceil(totalDelay / 50) + 2, () => {
                rotateSmoothly(-90.2, 0.7, c.SSRotateDelay)
            })
        }
    }
}).setCriteria("[BOSS] Goldor: Who dares trespass into my domain?").unregister()

const SSSolverReg = register("chat", (boss, msg, event) => {
    name = boss.removeFormatting();
    if (name == "Goldor") inP3S1 = true
    else if (msg == 'I should have known that I stood no chance.') inP3S1 = true
    else inP3S1 = false
}).setCriteria("[BOSS] ${boss}: ${msg}").unregister()

const SSSolverReg1 = register("packetReceived", (packet) => {
    if (!(packet instanceof CommonPingS2CPacket) || packet.getParameter() == 0) return;
    if (dungeonUtils.getStage() != 1 && dungeonUtils.getStage() != 0) return inP3S1 = false
    if (!firstPhase) return;
    if (lastLanternTick++ > 10 && grid.filter(([x, y, z]) => World.getBlockAt(x, y, z)?.type?.getName()?.removeFormatting() === "Stone Button").length > 8) {
        firstPhase = false;
        startClickCounter = 0
    }
}).setFilteredClass(CommonPingS2CPacket).unregister()

const SSSolverReg2 = register("packetReceived", (packet, event) => {
    if (!inP3S1 || !c.SSSolver) return;
    const pos = packet.getPos();
    processLogic(pos.getX(), pos.getY(), pos.getZ(), packet.getState());
}).setFilteredClass(BlockUpdateS2CPacket).unregister()

const SSSolverReg3 = register("packetReceived", (packet, event) => {
    if (!inP3S1 || !c.SSSolver) return;
    packet.visitUpdates((pos, state) => {
        processLogic(pos.getX(), pos.getY(), pos.getZ(), state);
    });
}).setFilteredClass(ChunkDeltaUpdateS2CPacket).unregister()

const SSSolverReg4 = register("packetSent", (packet, event) => {
    if (!inP3S1 || !c.SSSolver) return;
    const hit = packet.getBlockHitResult()
    if (!hit) return;

    const pos = hit.getBlockPos();
    const [x, y, z] = [pos.getX(), pos.getY(), pos.getZ()]
    const isShift = Player.isSneaking()
    if (x === startButtonPos[0] && y === startButtonPos[1] && z === startButtonPos[2]) {
        resetSolution()
        refreshSSCache()
    }
    if (x === startButtonPos[0] && y === startButtonPos[1] && z === startButtonPos[2] && firstPhase && c.SSBlockWrongStart) {

        if (startClickCounter++ >= c.SSMaxStartClicks && !isShift) {
            cancel(event);
            return;
        }
        isDoingSS = true;
        sneakLocked = false
        lastClick = Date.now()
        return;
    }
    if (x === 110 && y >= 120 && y <= 123 && z >= 92 && z <= 95) {
        if (c.SSBlockWrong && !isShift) {

            const correct = clickInOrder[clickNeeded];
            if (!correct || x + 1 !== correct.x || y !== correct.y || z !== correct.z) {
                cancel(event);
                return;
            }
            else {
                isDoingSS = true
                sneakLocked = false
                lastClick = Date.now()
            }
        }
    }
}).setFilteredClass(PlayerInteractBlockC2SPacket).unregister()


const SSSolverReg5 = register("renderWorld", () => {
    if (clickInOrder.length === 0 || clickNeeded >= clickInOrder.length) return;

    for (let i = clickNeeded; i < clickInOrder.length; i++) {
        if (i < clickNeeded) continue;

        let pos = clickInOrder[i];
        let color = [1, 0, 0, 0.5];

        if (i === clickNeeded) color = [0, 1, 0, 0.5];
        else if (i === clickNeeded + 1) color = [1, 0.5, 0, 0.5];

        const centerX = pos.x - 0.07
        const centerZ = pos.z + 0.5
        const box = RenderUtils.getRectBox(
            centerX,
            pos.y + 0.37,
            centerZ,
            0.12,
            0.38,
            0.26
        )

        if (!c.SSSolverFilled) RenderUtils.drawOutline(box, color, true)
        else RenderUtils.drawFilled(box, color, true)
        const number = (i - clickNeeded + 1).toString();

        RenderUtils.drawText(
            number,
            centerX,
            pos.y + 0.59,
            centerZ,
            0.7,
            false
        );
    }
}).unregister()

registerOverlay("SSDisplay", { text: () => "SS: X/5", align: "center", colors: true, setting: c.displaySS })

const SSDisplayGUI = register("renderOverlay", (ctx) => {
    if (!inP3S1 || !c.SSSolver) return;
    if (clickInOrder.length === 0) return;
    if (clickNeeded > clickInOrder.length) return;

    const total = clickInOrder.length;
    let color;
    if (total <= 2) {
        color = "&c"; // red (1-2)
    } else if (total <= 4) {
        color = "&e"; // yellow (3-4)
    } else {
        color = "&a"; // green (5)
    }

    const displayText = `SS: ${color}${total}&d/&a5`;

    drawText(ctx, displayText, data.SSDisplay, true, "SSDisplay")
}).unregister()

// SSBlockWrongStart SSMaxStartClicks SSBlockWrong SSTriggerBot SSAuto SSSolver displaySS

const autoSSTB = register("step", () => {
    if (!inP3S1 || !c.SSSolver) return;
    if (clickInOrder.length === 0 || clickNeeded >= clickInOrder.length) return;
    if (Player.isSneaking()) {
        sneakLocked = true;
        return;
    }
    if (!isAtSS() || !isDoingSS) return isDoingSS = false;
    const next = clickInOrder[clickNeeded];
    if (!next) return;
    if (firstPhase) return;
    if (rotatingTo !== clickNeeded && !rotationInProgress && c.SSAuto && !sneakLocked) {
        rotatingTo = clickNeeded;
        rotationInProgress = true;
        const buttonX = next.x - 1 + 0.85 + plusMinus(0.05);
        const buttonY = next.y + 0.5 + plusMinus(0.08);
        const buttonZ = next.z + 0.5 + plusMinus(0.15);
        const [yaw, pitch] = getYawPitch(buttonX, buttonY, buttonZ);

        rotateSmoothly(yaw, pitch, c.SSRotateDelay);
    }
    if (Date.now() - lastClick < (c.SSTBDelay ?? 150)) return
    const lookingAt = Player.lookingAt();
    if (!lookingAt) return;

    if (isLookingAtBlock(next)) {
        rightClick(true, false)
        lastClick = Date.now();
        clickNeeded++;
        rotatingTo = -1;
        rotationInProgress = false;
    }
}).setFps(100).unregister()

function plusMinus(range) {
    return (Math.random() - 0.5) * 2 * range;
}

c.registerListener("SS TriggerBot", (curr) => {
    if (curr) autoSSTB.register()
    else autoSSTB.unregister()
})

if (c.SSTriggerBot) autoSSTB.register()

c.registerListener("SS Display Progress", (curr) => {
    if (curr) SSDisplayGUI.register()
    else SSDisplayGUI.unregister()
})

if (c.SSDisplay) SSDisplayGUI.register()

c.registerListener("SS Auto Start", (curr) => {
    if (curr) SSAutoStartRegister.register()
    else SSAutoStartRegister.unregister()
})

if (c.SSAutoStart) SSAutoStartRegister.register()

const solverReg = (bool) => {
    if (bool) {
        SSSolverReg.register()
        SSSolverReg1.register()
        SSSolverReg2.register()
        SSSolverReg3.register()
        SSSolverReg4.register()
        SSSolverReg5.register()
    }
    else {
        SSSolverReg.unregister()
        SSSolverReg1.unregister()
        SSSolverReg2.unregister()
        SSSolverReg3.unregister()
        SSSolverReg4.unregister()
        SSSolverReg5.unregister()
    }
}

c.registerListener("SS Solver", (curr) => {
    solverReg(curr)
})

if (c.SSSolver) solverReg(true)


// const Blocks = Java.type("net.minecraft.block.Blocks");
// const BlockPostil = Java.type("net.minecraft.util.math.BlockPos");

// function removeBlockClientSide(x, y, z) {
//     const pos = new BlockPostil(x, y, z);
//     const airState = Blocks.AIR.getDefaultState();
//     World.getWorld().setBlockState(pos, airState, 3)
// }

// register("step", () => {
//     removeBlockClientSide(62, 135, 142)
//     removeBlockClientSide(62, 134, 142)
//     removeBlockClientSide(61, 133, 142)
//     removeBlockClientSide(61, 134, 142)
//     removeBlockClientSide(61, 135, 142)
//     removeBlockClientSide(61, 136, 142)
//     removeBlockClientSide(60, 136, 142)
//     removeBlockClientSide(60, 133, 142)
//     removeBlockClientSide(59, 133, 142)
//     removeBlockClientSide(59, 134, 142)
//     removeBlockClientSide(59, 135, 142)
//     removeBlockClientSide(59, 136, 142)
//     removeBlockClientSide(58, 134, 142)
//     removeBlockClientSide(58, 135, 142)
//     removeBlockClientSide(58, 14, 142)
// }).setFps(2)


// let recording = false

// register("command", (arg) => {
//     if (!arg) {
//         Client.scheduleTask(3, () => sneak())
//         Client.scheduleTask(4, () => {swapToItem("aspect")})
//         Client.scheduleTask(5, () => {nextAOTV.register()})
//     }
//     else if (arg == "reset") {
//         useItemList.length = 0
//     }
//     else {
//         recording = !recording
//         if (recording) {
//             listen.register()
//         }
//         else listen.unregister()
//     }
// }).setName("testaotv")

// const useItemList = [];

// const listen = register("clicked", (x, y, btn, isDown) => {
//     if (isDown && btn == 1 && Player.getHeldItem().getName().removeFormatting().includes("Aspect") && Player.isSneaking()) {
//         useItemList.push({yaw: Player.getPlayer().getYaw(), pitch: Player.getPlayer().getPitch()})
//         ChatLib.chat("Added Yaw: " + Player.getPlayer().getYaw() + " Pitch: " + Player.getPlayer().getPitch())
//     }
// }).unregister()

// export const swapToItem = (targetItemName) => {
//     const itemSlot = Player?.getInventory()?.getItems()?.findIndex(item => { return item?.getName()?.toLowerCase()?.includes(targetItemName.toLowerCase()) })
//     if (itemSlot === -1 || itemSlot > 7) {
//         ChatLib.chat("breh")
//         return
//     } else {
//         heldItem = Player.getHeldItemIndex() 
//         Player.setHeldItemIndex(itemSlot)
//     }
// }

// const nextAOTV = register("tick", () => {
//     if (!Player.getHeldItem()?.getName()?.removeFormatting()?.includes("Aspect")) return nextAOTV.unregister()
//     for (let i = 0; i < useItemList.length; i++) {
//         const pos = useItemList[i];
//         senduseitem(pos.yaw, pos.pitch);
//     }
//     swapToItem("pearl")
//     Client.scheduleTask(0, () => unsneak())
//     Client.scheduleTask(0, () => {pearlListener.register()})
//     nextAOTV.unregister()
// }).unregister()

// const pearlListener = register("tick", () => {
//     senduseitem(-180, -90)
//     Client.scheduleTask(0, () => senduseitem(-180, -90))
//     Client.scheduleTask(1, () => senduseitem(-180, -90))
//     pearlListener.unregister()
// }).unregister()

// register("command", () => {
//     ChatLib.chat(Player.getPlayer().getYaw() + " " + Player.getPlayer().getPitch())
// }).setName("getyp")

// const PlayerInteractItemC2SPacket = Java.type("net.minecraft.class_2886")
// function senduseitem(yaw = Player.getPlayer().getYaw(), pitch = Player.getPlayer().getPitch()) {
//     sequence = 0
//     const hand_yuritil = Java.type("net.minecraft.class_1268")
//     const mainhand = hand_yuritil.MAIN_HAND
//     const c08tosend = new PlayerInteractItemC2SPacket(mainhand, sequence, yaw, pitch)
//     Client.sendPacket(c08tosend)
// }

// function sneak() {
//     const sneakKey = Client.getMinecraft().field_1690.field_1832;
//     try {
//         sneakKey.method_23481(true);
//     } catch (e) {
//         debugp("&cError sneaking: " + e);
//     }
// }

// function unsneak() {
//     const sneakKey = Client.getMinecraft().field_1690.field_1832;
//     try {
//         sneakKey.method_23481(false);
//     } catch (e) {
//         debugp("&cError unsneaking: " + e);
//     }
// }