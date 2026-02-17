import { registerPacketChat } from "../../PrivateASF-Fabric/util/Events"
import { CloseScreenS2CPacket, CloseHandledScreenC2SPacket, OpenScreenS2CPacket, ClickSlotC2SPacket, ScreenHandlerSlotUpdateS2CPacket, chat, InventoryScreen, PlayerInteractEntityC2SPacket, CommonPingS2CPacket } from "./utils"
import c from "../config"
const Terminals = {
    NUMBERS: { id: 0, regex: /^Click in order!$/, slotCount: 35 },
    COLORS: { id: 1, regex: /^Select all the (.+?) items!$/, slotCount: 53 },
    STARTSWITH: { id: 2, regex: /^What starts with: '(.+?)'\?$/, slotCount: 44 },
    RUBIX: { id: 3, regex: /^Change all to same color!$/, slotCount: 44 },
    REDGREEN: { id: 4, regex: /^Correct all the panes!$/, slotCount: 44 },
    MELODY: { id: 5, regex: /^Click the button on time!$/, slotCount: 44 },
}

const colorReplacements = {
    "light gray": "silver",
    "wool": "white",
    "bone": "white",
    "ink": "black",
    "lapis": "blue",
    "cocoa": "brown",
    "dandelion": "yellow",
    "rose": "red",
    "cactus": "green"
}

const fixColorItemName = (itemName) => {
    Object.entries(colorReplacements).forEach(([from, to]) => {
        itemName = itemName.replace(new RegExp(`^${from}`), to)
    })
    return itemName
}


const colorOrder = ['minecraft:red_stained_glass_pane', 'minecraft:orange_stained_glass_pane', 'minecraft:yellow_stained_glass_pane', 'minecraft:green_stained_glass_pane', 'minecraft:blue_stained_glass_pane']


export default new class TerminalUtils {
    constructor() {
        this.inTerm = false;
        this.currentItems = [];
        this.shouldSolve = false;
        this.initialOpen = 0;
        this.terminalID = -1;
        this.maxSlot = 999;
        this.currentTitle = "";
        this.solutionLength = -1;
        this.lastWindowID = -52345234532;
        this.lastInteract = 0;
        this.clickedIndex = []

        register("packetReceived", (packet, event) => {
            if (!(packet instanceof OpenScreenS2CPacket)) return
            const windowTitle = packet.getName().getString();
            this.currentTitle = windowTitle;
            let terminalFound = false;
            let term, id, regex, slotCount;

            for (let i of Object.entries(Terminals)) {
                [term, { id, regex, slotCount }] = i;
                let match = windowTitle.match(regex);
                if (!match) continue;
                terminalFound = true;
                break;
            }

            if (terminalFound) {
                if (!this.inTerm) {
                    this.initialOpen = Date.now()
                    const currentGui = Client.getMinecraft().field_1755;
                    if (currentGui && (currentGui instanceof InventoryScreen)) {
                        Client.getMinecraft().setScreen(null)
                    }
                }
                this.terminalID = id;
                this.maxSlot = slotCount;
                this.inTerm = true;
                this.currentItems = [];
                this.lastWindowID = packet.getSyncId();
                this.shouldSolve = false;
                // if (Settings().TerminalInvwalk && this.terminalID !== 5) {
                //     cancel(event);
                // }
            } else {
                this.inTerm = false;
                this._reloadTerm();
            }
        }).setFilteredClass(OpenScreenS2CPacket);

        register("packetReceived", (packet, event) => {
            if (!this.inTerm || this.shouldSolve) return;

            const itemStack = packet.getStack()
            if (!itemStack || itemStack.toString().includes("minecraft:air")) return;
            const slot = packet.getSlot();
            const windowId = packet.getSyncId();
            const ctItem = new Item(itemStack);

            // if (Settings().TerminalInvwalk && this.terminalID !== 5) {

            //     const gui = Client.getMinecraft().field_71462_r
            //     if (gui) {
            //         if (gui.class.getName().includes("net.minecraft.client.gui.inventory")) Client.getMinecraft().func_147108_a(null)
            //     }
            // }

            if (windowId !== this.lastWindowID) return;
            if (slot > this.maxSlot) {
                this.shouldSolve = true
                return;
            };

            // This does not need to be cancelled in order to invwalk and NOT cancelling it should prevent ghost GUIs from appearing at all.
            // Me from the future: Actually this doesn't fix it nevermind

            //if (Settings().TerminalInvwalk && (this.terminalID !== 5)) cancel(event)

            this.currentItems.push([windowId, slot, itemStack, ctItem])
        }).setFilteredClass(ScreenHandlerSlotUpdateS2CPacket)


        

        register("packetSent", () => {
            this.inTerm = false
            //chat(`Terminal &d${this.currentTitle} &7completed in &d${(Date.now() - this.initialOpen) / 1000}&7s`)
            this._reloadTerm()
        }).setFilteredClass(CloseHandledScreenC2SPacket)

        register("packetReceived", () => {
            if (!this.inTerm) return;
            this.inTerm = false
            if (c.sendTermTime) chat(`&d${this.currentTitle} &7took &d${(Date.now() - this.initialOpen) / 1000}&7s`)
            this._reloadTerm()
        }).setFilteredClass(CloseScreenS2CPacket)

        register("packetSent", (packet, event) => {
            //console.log("syncId: " + packet.syncId() + " slot: " + packet.slot() + " button: " + packet.button() + " actionType: " + packet.actionType())
            if (!this.inTerm) return;
            if (this.terminalID == 5) return;
            if (Date.now() - this.initialOpen < 300 || packet.syncId() !== this.lastWindowID || this.initialOpen == 0) {
                cancel(event)
                ChatLib.chat("First Click Protection")
            }
        }).setFilteredClass(ClickSlotC2SPacket)

        register("packetSent", (packet, event) => {
            if (!Player.lookingAt() || Player.lookingAt() instanceof Block || Player.lookingAt().getName().removeFormatting() != "Inactive Terminal") return;
            
            if (this.lastInteract > 0 || this.isInTerm()) cancel(event)
            else this.lastInteract = 10

            // Some safety for term triggerbot I suppose
        }).setFilteredClass(PlayerInteractEntityC2SPacket)

        register("packetReceived", (packet) => {
            if (!(packet instanceof CommonPingS2CPacket) || packet.getParameter() == 0 || this.lastInteract == 0) return;
            this.lastInteract--
        }).setFilteredClass(CommonPingS2CPacket)

        registerPacketChat((msg) => {
            if (msg.includes("This Terminal doesn't seem to be responsive at the moment.")) this.lastInteract = 0
        })

        register("packetReceived", (packet, event) => {
            const title = packet.getName().getString()
            this.currentTitle = title
            if (this.currentTitle.includes("Click the button on time!")) this.lastInteract = 0
        }).setFilteredClass(OpenScreenS2CPacket)

        register("worldLoad", () => {
            this.inTerm = false;
            this._reloadTerm();
        })

        // register("RenderOverlay", () => {
        //     if (!Settings().TerminalInvwalk) return;
        //     if (!this.isInTerm()) return;
        //     const inTerminalText = "&5In Terminal";
        //     const clicksRemainingText = "&5Clicks Remaining: &a" + this.solutionLength;
        //     const scale = 1.5;
        //     if (this.terminalID == 5) return;
        //     Renderer.scale(scale);
        //     Renderer.drawStringWithShadow(inTerminalText, (Renderer.screen.getWidth() / scale - Renderer.getStringWidth(inTerminalText)) / 2, Renderer.screen.getHeight() / scale / 2 + 10);
        //     if (this.solutionLength < 0) return;
        //     Renderer.scale(scale)
        //     Renderer.drawStringWithShadow(clicksRemainingText, (Renderer.screen.getWidth() / scale - Renderer.getStringWidth(clicksRemainingText)) / 2, Renderer.screen.getHeight() / scale / 2 + 20)
        // })

    }

    _reloadTerm() {
        this.currentItems = []
        this.shouldSolve = false
        this.initialOpen = 0
        this.terminalID = -1
        this.maxSlot = 999
        this.solutionLength = -1
        this.currentTitle = ""
        this.lastWindowID = -52345234532
        this.inTerm = false
        this.clickedIndex = []
    }


    isInTerm() {
        return this.inTerm
    }

    getLastWindowID() {
        return this.lastWindowID
    }

    getTermID() {
        return this.terminalID
    }

    getSolution() {
        if (!this.shouldSolve) return null
        let solution = []
        // [WindowID, Slot, ClickType]

        switch (this.terminalID) {
            case Terminals.NUMBERS.id:

                let filteredItems = this.currentItems.filter(item => item[3].getType().getRegistryName().includes("minecraft:red_stained_glass_pane")).sort((a, b) => a[3].getStackSize() - b[3].getStackSize());
                solution = filteredItems.map(item => [item[0], item[1], 0]);
                break;

            case Terminals.COLORS.id:

                let color = this.currentTitle.match(/Select all the (.+) items!/)[1].toLowerCase()
                if (!color) return;

                solution = this.currentItems.filter(item => {
                    if (!item[2] || item[2].hasGlint()) return false;
                    if (!item[3]) return false;
                    const fixedName = fixColorItemName(item[3].getName().removeFormatting().toLowerCase());
                    return fixedName.startsWith(color);
                }).map(item => [item[0], item[1], 0]);

                break;

            case Terminals.STARTSWITH.id:
                let match = this.currentTitle.match(/What starts with: '(\w+)'?/);

                if (!match) return;

                let matchLetter = match[1].toLowerCase();

                solution = this.currentItems.filter(item => item[3].getName().removeFormatting().toLowerCase().startsWith(matchLetter) && !this.clickedIndex.includes(item[1]) /*!item[2]?.hasGlint()*/).map(item => [item[0], item[1], 0]);

                break;


            case Terminals.RUBIX.id:
                let rubixItems = this.currentItems.filter(item => !item[3].getType().getRegistryName().includes("minecraft:black_stained_glass_pane") && item[3].getType().getRegistryName().includes("stained_glass_pane"));
                /* safer than item[3].getType().getId() !== 561 for version changes ig*/
                let minIndex = -1;
                let minTotal = Infinity;


                for (let targetIndex = 0; targetIndex < 5; targetIndex++) {
                    let totalClicks = 0;

                    for (let i = 0; i < rubixItems.length; i++) {
                        let currentMetadata = rubixItems[i][3].getType().getRegistryName()
                        let currentIndex = colorOrder.indexOf(currentMetadata);
                        let clockwiseClicks = (targetIndex - currentIndex + colorOrder.length) % colorOrder.length;
                        let counterclockwiseClicks = (currentIndex - targetIndex + colorOrder.length) % colorOrder.length;
                        totalClicks += Math.min(clockwiseClicks, counterclockwiseClicks);
                    }

                    if (totalClicks < minTotal) {
                        minTotal = totalClicks;
                        minIndex = targetIndex;
                    }
                }

                for (let i = 0; i < rubixItems.length; i++) {
                    let item = rubixItems[i];
                    let currentMetadata = item[3].getType().getRegistryName();
                    let currentIndex = colorOrder.indexOf(currentMetadata);

                    let clockwiseClicks = (minIndex - currentIndex + colorOrder.length) % colorOrder.length;
                    let counterclockwiseClicks = (currentIndex - minIndex + colorOrder.length) % colorOrder.length;

                    if (clockwiseClicks <= counterclockwiseClicks) {
                        for (let j = 0; j < clockwiseClicks; j++) {
                            solution.push([item[0], item[1], 0]);
                        }
                    } else {
                        for (let j = 0; j < counterclockwiseClicks; j++) {
                            solution.push([item[0], item[1], 1]);
                        }
                    }
                }

                break;



            case Terminals.REDGREEN.id:
                solution = this.currentItems.filter(item => item[3].getType().getRegistryName().includes("minecraft:red_stained_glass_pane")).map(item => [item[0], item[1], 0]);
                break;

            default:
                break
        }

        this.solutionLength = solution.length
        return solution

    }

}