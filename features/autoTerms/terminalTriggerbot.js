import c from "../../config"
import terminalUtils from "../../util/terminalUtils"
import { chat, CloseScreenS2CPacket, CommonPingS2CPacket, OpenScreenS2CPacket, PlayerInteractEntityC2SPacket, PlayerPositionLookS2CPacket, rightClick } from "../../util/utils"
import RenderUtils from "../../../PrivateASF-Fabric/util/renderUtils"
import { registerPacketChat } from "../../../PrivateASF-Fabric/util/Events"
import { ArmorStand } from "../../../PrivateASF-Fabric/util/utils"


let lastClick = 0
let lastS08 = 0

register("packetReceived", (packet, event) => {
    const title = packet?.getName()?.getString()
    if (title == "Click the button on time!") lastClick = 0
}).setFilteredClass(OpenScreenS2CPacket)


registerPacketChat((message) => {
    if (message == "This Terminal doesn't seem to be responsive at the moment.") lastClick = 0
})


register("packetReceived", (packet, event) => {
    if (!(packet instanceof CommonPingS2CPacket) || packet.getParameter() == 0 || lastClick == 0) return;
    lastClick--
}).setFilteredClass(CommonPingS2CPacket)

register("tick", () => {
    if (!c.terminalTB) return;
    if (terminalUtils.isInTerm() || Client.isInGui()) return;

    const leapDelayMs = c.terminalTBLeapDelay;

    if (Date.now() - lastS08 < leapDelayMs) return;

    if (lastClick > 0) return;
    if (Player?.getContainer()?.getName() !== undefined) return;


    if (Player.lookingAt()?.getName()?.removeFormatting() === "Inactive Terminal") {
        rightClick(false, true)
        lastClick = 20;
    }

})

register("packetReceived", () => {
	lastS08 = Date.now()
}).setFilteredClass(PlayerPositionLookS2CPacket)


const highlights = {};
let renderTriggerRegistered = false;

const renderTrigger = register("renderWorld", () => {
	const time = new Date().getTime();
	for (let highlight of Object.values(highlights)) {
		let progress = (time - highlight.start) / (highlight.end - highlight.start);
		let position = highlight.position;
		if (progress > 1) {
			delete highlights[position.join()];
			continue;
		}
		const w = 0.5
		const h = 1.975
		const alpha = ((1 - progress))
		const phase = true
		const colorFill = [1, 84 / 255, 1, alpha]
		const [x, y, z] = position
		const newBox = RenderUtils.getBox(x, y, z, w, h)
		RenderUtils.drawFilled(newBox, colorFill, phase)
	}
	if (Object.values(highlights).length <= 0) {
		renderTrigger.unregister();
		renderTriggerRegistered = false;
	}
}).unregister();

register("packetSent", (packet) => {
    if (!c.terminalTBHighlight) return;
    const mcEntity = World.getWorld().getEntityById(packet.entityId);
    if (!mcEntity) return;

    const entity = new Entity(mcEntity);
    if (entity.getName().removeFormatting() !== "Inactive Terminal") return;

    const time = new Date().getTime();
    const position = [entity.getX(), entity.getY(), entity.getZ()];

    highlights[position.join()] = {
        start: time,
        end: time + 500,
        position
    };

    if (!renderTriggerRegistered) renderTrigger.register();
    renderTriggerRegistered = true;

}).setFilteredClass(PlayerInteractEntityC2SPacket);

// register("tick", () => {
//     if (!c.terminalTBHighlight) return;
//     if (!World.isLoaded()) return;

//     const px = Player.getX();
//     const py = Player.getY();
//     const pz = Player.getZ();

//     const armorStands = World.getAllEntitiesOfType(ArmorStand);

//     const now = Date.now();

//     armorStands.forEach(entity => {
//         if (entity.getName()?.removeFormatting() !== "Inactive Terminal") return;

//         const dx = entity.getX() - px;
//         const dy = entity.getY() - py;
//         const dz = entity.getZ() - pz;

//         if ((dx * dx + dy * dy + dz * dz) > 49) return; // 5 blocks

//         const position = [entity.getX(), entity.getY(), entity.getZ()];
//         const key = position.join();

//         if (highlights[key]) return; // already highlighted

//         highlights[key] = {
//             start: now,
//             end: now + 1000,
//             position
//         };

//         if (!renderTriggerRegistered) {
//             renderTrigger.register();
//             renderTriggerRegistered = true;
//         }
//     });
// });
