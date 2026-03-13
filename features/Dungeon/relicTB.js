import c from "../../config"
import { rightClick } from "../../util/utils";
let prevRelic = null;
let placed = false

register("worldLoad", () => {
    relicTB.unregister()
    relicPlaceTB.unregister()
})

register("chat", () => {
    if (c.relicPickupTB) relicTB.register()
    if (c.relicPlaceTB) relicPlaceTB.register()
}).setCriteria("[BOSS] Necron: All this, for nothing...")

const relicTB = register("tick", () => {
    if (!Player.lookingAt() || !(Player.lookingAt() instanceof Entity)) return
    if (Player.lookingAt()?.getName() == "Armor Stand") {
        if (!Player.lookingAt()?.getStackInSlot(5)?.toString()?.includes("Relic")) return;
        rightClick(true, true)
        relicTB.unregister()
    }
}).unregister()

const placeblocks = {
    "Green": [49, 44],
    "Red": [51, 42],
    "Purple": [54, 41],
    "Orange": [57, 42],
    "Blue": [59, 44]
}
// y = 6 and 7
function getRelicColor(itemName) {
    const match = itemName.match(/Corrupted (\w+) Relic/);
    return match ? match[1] : null;
}

const relicPlaceTB = register("tick", () => {
    const look = Player.lookingAt()
    if (!look || !(look instanceof Block)) return;
    let hotbarSlot = Player.getInventory().getItems().slice(0, 9).findIndex(item => item?.getName()?.includes("Relic"))
    if (hotbarSlot == -1) return;
    let relic = getRelicColor(Player.getInventory().getStackInSlot(hotbarSlot).getName())
    if (!relic) return;
    if (prevRelic == null || relic != prevRelic) {
        prevRelic = relic
        placed = false
    }

    if (placed) return;

    let coords = placeblocks[relic]
    if (!coords) return;

    const [x, y, z] = [look.getX(), look.getY(), look.getZ()]
    if (x == coords[0] && z == coords[1] && (y == 6 || y == 7) && Player.getHeldItem().getName().includes("Relic")) {
        rightClick(true, true)
        placed = true
    }
}).unregister()

