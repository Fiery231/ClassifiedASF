import c from "../../config"
import { rightClick } from "../../util/utils";
import dungeonUtils from "../../../PrivateASF-Fabric/util/dungeonUtils";

let wasActive = false

const chestTB = register("renderWorld", () => {
    if (!c.chestPlaceTB) return chestTB.unregister()
    if (!dungeonUtils.inBoss) return;
    if (!Player.lookingAt() || !Player.lookingAt().getType) return;
    const item = Player.getHeldItem();
    if (!item) return;
    const holdingItem = item.getName().includes("Soul Sand") || item.getName().includes("Chest");
    const velo = Player.getMotionY(); 
    if (velo >= -0.5) {
        targetY = 107;
    } else if (velo >= -1.5) {
        targetY = 108;
    } else {
        targetY = 109;
    }
    const inYRange = Player.getY() < targetY && Player.getY() > 106.875;
    if (holdingItem && inYRange && Player.lookingAt().getType()?.getRegistryName() === "minecraft:stone_bricks") {
        if (!wasActive) {
            rightClick(true, true)
            wasActive = true;
        }
        else {
            if (wasActive) {
                wasActive = false
            }
        }
    }
}).unregister()

dungeonUtils.registerWhenInDungeon(chestTB)