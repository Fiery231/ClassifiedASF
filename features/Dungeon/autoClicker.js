// import { chat, leftClick, pressMovementKey } from "../../util/utils"

// // not usable yet, barely ported

// // register("clicked", (mouseX, mouseY, button, isButtonDown) => {
// //     if (button != 0) return
// //     if (isButtonDown) {
// //         if (Player.lookingAt() instanceof Block) return;
// //         const item = Player.getHeldItem()
// //         if (!item) return

// //         const isMageItem = items.some(s => item.getName()?.toLowerCase().includes(s))
// //         if (!isMageItem) return
// //         pressMovementKey("attackKey", false)
// //         keyCanceled = true
// //         lastClick = 3
// //     } else {
// //         keyCanceled = false
// //     }
// // })

// // register("playerInteract", (action, pos, event) => {
// //     // Action 0 is typically Right Click
// //     chat(action)
// // });
// let lastClick = 0
// let keyCanceled = false
// const items = ["claymore", "hyperion", "midas", "ragnarock", "ice spray"]

// register("tick", () => {
//     const mc = Client.getMinecraft()

//     // GUI open = stop clicking
//     if (Client.isInGui()) {
//         keyCanceled = false
//         return
//     }
//     lastClick--

//     const attackHeld = mc.options.attackKey.isPressed()

//     if ((keyCanceled || attackHeld) && Player && !mc.player.isUsingItem()) {
//         const item = Player.getHeldItem()
//         if (!item) return

//         if (items.some(s => item.getName()?.toLowerCase().includes(s))) {
//             if (lastClick <= 0) {
//                 leftClick(false)
//                 lastClick = Math.random() > 0.8 ? 3 : 2
//             }
//         }
//     }
// })
