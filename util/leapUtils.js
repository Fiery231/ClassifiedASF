import { registerPacketChat } from "../../PrivateASF-Fabric/util/Events";
import { playSound } from "../../PrivateASF-Fabric/util/utils";
import { chat, CloseHandledScreenC2SPacket, CloseScreenS2CPacket, OpenScreenS2CPacket, rightClick, ScreenHandlerSlotUpdateS2CPacket } from "./utils";

export default new class leapUtils {
    constructor() {
        this.leapQueue = [];
        this.menuOpened = false;
        this.shouldLeap = false;
        this.inProgress = false;
        this.clickedLeap = false;

        // register('tick', () => {
        //     utils.chat(`${this._inQueue()} ${this.menuOpened}`)
        // })

        register('packetReceived', (p, e) => {
            if (!this._inQueue() || !this.menuOpened) return;

            const slot = p.getSlot()
            const itemStack = p.getStack()
            const windowId = p.getSyncId()
            if (!windowId || !slot) return;
            if (!itemStack || itemStack.toString().includes("minecraft:air")) return;

            if (slot > 35) {
                chat(`Couldn't find &c${this._currentLeap()}`)
                this._reloadGUI()
                return;
            }

            const ctItem = new Item(itemStack)
            const itemName = ctItem?.getName().removeFormatting().toLowerCase()
            if (itemName !== this._currentLeap()?.toLowerCase()) return;
            Client.scheduleTask(() => {
                if (Player.getContainer()) {
                    Player.getContainer().click(slot, false, "MIDDLE")
                    chat("&aLeaping to " + this._currentLeap())
                    playSound("random.click", 1, 1.2);
                }
            })
            
            this._reloadGUI()
        }).setFilteredClass(ScreenHandlerSlotUpdateS2CPacket)

        register('packetReceived', (p, e) => {
            if (!this._inQueue()) return;

            const title = p.getName().getString()

            if (title !== "Spirit Leap") {
                this.menuOpened = false;
                return;
            }
            this.menuOpened = true;
            this.clickedLeap = false
        }).setFilteredClass(OpenScreenS2CPacket)

        registerPacketChat((message) => {
            if (!message.match(/^This ability is on cooldown for (\d+)s\.$/)) return;
            this.clickedLeap = false
            this.inProgress = false
            this.leapQueue.pop()
        })

        register('packetSent', () => {
            if (this.menuOpened) this.menuOpened = false
        }).setFilteredClass(CloseHandledScreenC2SPacket)

        register('packetReceived', () => {
            if (this.menuOpened) this.menuOpened = false
        }).setFilteredClass(CloseScreenS2CPacket)
    }

    _inQueue() {
        return this.leapQueue.length > 0
    }

    _currentLeap() {
        return this.leapQueue[0]
    }

    _reloadGUI() {
        this.menuOpened = false;
        this.leapQueue.shift();
        this.inProgress = false
    }

    clearQueue() {
        this.leapQueue = []
    }

    queueLeap(name) {
        this.leapQueue.push(name);
    }

    autoLeap(name) {
        if (this.clickedLeap) return;
        if (this.inProgress) return;

        const leapID = Player.getInventory().getItems().slice(0, 9).findIndex(a => a?.getName()?.toLowerCase()?.includes('leap'))
        if (!leapID || leapID === -1) return;

        this.inProgress = true;

        Player.setHeldItemIndex(leapID)

        Client.scheduleTask(1, () => {
            rightClick(false, true)
            this.clickedLeap = true
        })

        this.leapQueue.push(name)
    }
}