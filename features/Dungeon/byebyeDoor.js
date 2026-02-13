import c from "../../config"
import dungeonUtils from "../../../PrivateASF-Fabric/util/dungeonUtils"
const MinecraftClient = Java.type("net.minecraft.client.MinecraftClient")
const Blocks = Java.type("net.minecraft.block.Blocks")

const SCAN_RADIUS = 7
let startScanning = false

const GLASS_MAP = {
    "white": Blocks.WHITE_STAINED_GLASS,
    "orange": Blocks.ORANGE_STAINED_GLASS,
    "magenta": Blocks.MAGENTA_STAINED_GLASS,
    "light blue": Blocks.LIGHT_BLUE_STAINED_GLASS,
    "yellow": Blocks.YELLOW_STAINED_GLASS,
    "lime": Blocks.LIME_STAINED_GLASS,
    "pink": Blocks.PINK_STAINED_GLASS,
    "gray": Blocks.GRAY_STAINED_GLASS,
    "light gray": Blocks.LIGHT_GRAY_STAINED_GLASS,
    "cyan": Blocks.CYAN_STAINED_GLASS,
    "purple": Blocks.PURPLE_STAINED_GLASS,
    "blue": Blocks.BLUE_STAINED_GLASS,
    "brown": Blocks.BROWN_STAINED_GLASS,
    "green": Blocks.GREEN_STAINED_GLASS,
    "red": Blocks.RED_STAINED_GLASS,
    "black": Blocks.BLACK_STAINED_GLASS,
    "clear": Blocks.GLASS,
    "glass": Blocks.GLASS,
    "tinted": Blocks.TINTED_GLASS
}

function getGlassBlock() {
    if (!c.glassType) return Blocks.BLACK_STAINED_GLASS.getDefaultState()
    const key = c.glassType.toLowerCase()
    const block = GLASS_MAP[key] || Blocks.BLACK_STAINED_GLASS
    return block.getDefaultState()
}


const worldLoad = register("worldLoad", () => {
    startScanning = true
}).unregister()

register("chat", (msg) => {
    if (c.disableAfterStart) {
        if (msg.includes("[NPC] Mort: Here, I found this map when I first entered the dungeon.")) startScanning = false;
    }
    else {
        if (msg.includes("The BLOOD DOOR has been opened!")) {
            startScanning = false;
            ChatLib.chat("testinginigngs")
        }
    }
}).setCriteria("${msg}")


register("tick", () => {
    if (!startScanning || !dungeonUtils.inDungeon || dungeonUtils.inBoss) return

    const mc = MinecraftClient.getInstance()
    if (!mc || !mc.world || !mc.player) return

    const playerY = Player.getY()
    if (playerY < 69 || playerY > 71) return

    const playerPos = mc.player.getBlockPos()
    const glassState = getGlassBlock()
    const fullStartDoor = c.fullStartDoor
    const customColor = c.customColor

    for (let x = -SCAN_RADIUS; x <= SCAN_RADIUS; x++) {
        for (let y = 69; y <= 72; y++) {
            for (let z = -SCAN_RADIUS; z <= SCAN_RADIUS; z++) {

                const pos = playerPos.add(x, y - playerPos.getY(), z)
                const state = mc.world.getBlockState(pos)
                const block = state.getBlock()

                let desiredBlock = null

                if (block === Blocks.INFESTED_CHISELED_STONE_BRICKS) {
                    if (customColor) {
                        if (fullStartDoor) desiredBlock = glassState
                        else {
                            if (y === 69 || y === 71 || y === 72) desiredBlock = glassState
                            else if (y === 70) desiredBlock = Blocks.AIR.getDefaultState()
                        }
                    }
                    else {
                        if (fullStartDoor) desiredBlock = GLASS_MAP["light gray"].getDefaultState()
                        else {
                            if (y === 69) desiredBlock = GLASS_MAP["light gray"].getDefaultState()
                            else {if (y === 70 || y === 71 || y === 72) desiredBlock = Blocks.AIR.getDefaultState()}
                        }
                    }
                }


                else if (block === Blocks.COAL_BLOCK) {
                    if (customColor) desiredBlock = glassState
                    else desiredBlock = GLASS_MAP["black"].getDefaultState()
                }

                else if (block === Blocks.RED_TERRACOTTA) {
                    if (customColor) desiredBlock = glassState
                    else desiredBlock = GLASS_MAP["red"].getDefaultState()
                }

                if (desiredBlock && block !== desiredBlock.getBlock()) {
                    mc.world.setBlockState(pos, desiredBlock, 3)
                }
            }
        }
    }
})





c.registerListener("Bye Bye Door", (curr) => {
    if (curr) worldLoad.register()
    else {
        worldLoad.unregister()
        startScanning = false
    }
})

if (c.byebyeDoor) {
    worldLoad.register()
}