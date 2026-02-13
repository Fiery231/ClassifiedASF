import { chat, leftClick } from "../../util/utils"



register("clicked", (mouseX, mouseY, button, isButtonDown) => {
    if (button != 0) return
    if (isButtonDown) {
        if (Player.lookingAt() instanceof Block) return;
        const item = Player.getHeldItem()
        if (!item) return

        const isMageItem = items.some(s => item.getName()?.toLowerCase().includes(s))
        if (!isMageItem) return

        keyCanceled = true
        lastClick = 3
    } else {
        keyCanceled = false
    }
})
let lastClick = 0
let keyCanceled = false
const items = ["claymore", "hyperion", "midas", "ragnarock", "ice spray"]

register("tick", () => {
    const mc = Client.getMinecraft()

    // GUI open = stop clicking
    if (Client.isInGui()) {
        keyCanceled = false
        return
    }
    lastClick--

    const attackHeld = mc.options.attackKey.isPressed()

    if ((keyCanceled || attackHeld) && Player && !mc.player.isUsingItem()) {
        const item = Player.getHeldItem()
        if (!item) return

        if (items.some(s => item.getName()?.toLowerCase().includes(s))) {
            if (lastClick <= 0) {
                leftClick()
                lastClick = Math.random() > 0.8 ? 3 : 2
            }
        }
    }
})


// register("packetReceived", (packet, event) => {

//     if (packet.overlay()) return;

//     const content = packet.content();

//     const message = content.getString();

//     if (message.trim().length > 0) {
//         console.log(message);
//     }
// }).setFilteredClass(GameMessageS2CPacket);