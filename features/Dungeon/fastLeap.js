import leapUtils from "../../util/leapUtils"
import c from "../../config"
import dungeonUtils from "../../../PrivateASF-Fabric/util/dungeonUtils"
import { registerPacketChat } from "../../../PrivateASF-Fabric/util/Events"
import { chat, isPlayerInBox, rightClick } from "../../util/utils"

let lastOpener = "F_Fiery"

registerPacketChat((message) => {
    const match = message.match(/^(\w+) opened a WITHER door!$/)
    if (!match) return;

    lastOpener = match[1]
    //chat(lastOpener)
})

const leapStuff = register("clicked", (x, y, button, isDown) => {
    if (isDown && button === 1) {
        if (isHoldingLeap()) {
            leapUtils.clearQueue()
        }
    }

    else if (isDown && button === 0) {
        if (Player.lookingAt() instanceof Entity) return
        if (isHoldingLeap()) {
            if (!c.fastLeapToggle) return
            if (Client.getMinecraft().field_1755 || Client.isInGui()) return;

            let leapTo = getLeap()
            if (!leapTo || !leapTo.length || !isHoldingLeap() || leapTo == Player.getName() || !dungeonUtils.party.has(leapTo)) return chat("&7Failed leap!");
            if (Player.lookingAt() instanceof Block) rightClick(true, false)
            else rightClick(false, false, false)
            leapUtils.queueLeap(leapTo)
        }
    }
}).unregister()

dungeonUtils.registerWhenInDungeon(leapStuff)

const isHoldingLeap = () => {
    return Player.getHeldItem() && Player.getHeldItem().getName().toLowerCase().includes('leap')
}

const classNames = ["archer", "berserk", "healer", "mage", "tank"]

function getClassUser(className) {
    const party = dungeonUtils.playerClasses
    for (let playerName in party) {
        let playerClass = party[playerName].class
        if (className.toLowerCase() === playerClass.toLowerCase()) {
            return playerName
        }
    }
    chat(`&aNo player found with class &6${className}&c!`)
    return false
}

function getUserName(name = "empty") {
    if (classNames.includes(name.toLowerCase())) {
        return getClassUser(name)
    }
    return name
}

function getLeap() {
    let leapString = "";

    if (c.fastLeapDoor && !dungeonUtils.inBoss) leapString = getUserName(lastOpener)

    if (c.fastLeapTerm && dungeonUtils.inBoss && dungeonUtils.currentPhase == 3) {
        if (isPlayerInBox(62, 126, 34, 64, 128, 36) && dungeonUtils.currentStage == 1) {
            leapString = getUserName(c.i4Leap)
        }
        else if (isPlayerInBox(113, 160, 30, 90, 100, 143)) {
            leapString = getUserName(c.ee2Leap)
        }
        else if (isPlayerInBox(90, 160, 145, -3, 100, 121)) {
            leapString = getUserName(c.ee3Leap)
        }
        else if (isPlayerInBox(-6, 160, 121, 19, 100, 30)) {
            leapString = getUserName(c.coreLeap)
        }
        else if (isPlayerInBox(19, 160, 27, 90, 100, 51)) {
            leapString = getUserName(c.inCoreLeap)
        }
        else if (isPlayerInBox(91, 163, 96, 97, 168, 89)) {
            leapString == getUserName(c.lazyLeap)
        }
    }

    return leapString
}
