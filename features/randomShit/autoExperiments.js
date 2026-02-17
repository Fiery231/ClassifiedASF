import c from "../../config"

let ultrasequencerOrder = [];
let chronomatronOrder = [];
let lastAdded = 0;
let lastClick = 0;
let clicks = 0;
let hasAdded = false;
let closing = false;
const nonDyedDyes = [
    'minecraft:bone_meal',
    'minecraft:ink_sac',
    'minecraft:lapis_lazuli',
    'minecraft:cocoa_beans'
]

register("tick", () => {
    if (!c.autoExperiment) return;
    const container = Player.getContainer();
    if (!container) return;

    const name = String(container.getName()).removeFormatting();

    if (name.startsWith("Chronomatron (")) { solveChronomatron(); return }
    if (name.startsWith("Ultrasequencer (")) { solveUltraSequencer(); return }
    resetStuff()
})

function resetStuff() {
    ultrasequencerOrder = [];
    chronomatronOrder = [];
    lastAdded = 0;
    lastClick = 0;
    clicks = 0;
    hasAdded = false;
    closing = false;
}

function solveChronomatron() {
    const maxChronomatron = c.AEmaxXP ? 15 : 11 - c.AEserumCount;
    const items = Player.getContainer().getItems()
    if (items[49]?.getType().getName().includes('Glowstone') && hasGlint(items[lastAdded])) {
        if (c.AEautoClose && chronomatronOrder.length > maxChronomatron && !closing) {
            closing = true;
            Client.getMinecraft().currentScreen.close()
        }
        hasAdded = false
    }
    if (!hasAdded && items[49]?.getType().getName().includes('Clock')) {
        for (let i = 10; i <= 43; i++) {
            if (items[i] && hasGlint(items[i])) {
                chronomatronOrder.push(i)
                lastAdded = i
                hasAdded = true
                clicks = 0
                break;
            }
        }
    }
    if (hasAdded && items[49]?.getType().getName().includes('Clock') && chronomatronOrder.length > clicks && Date.now() - lastClick > c.AEclickDelay) {
        Player.getContainer().click(chronomatronOrder[clicks], false, 'MIDDLE')
        lastClick = Date.now()
        clicks++
    }
}

function solveUltraSequencer() {
        const maxUltraSequencer = c.AEmaxXP ? 20 : 8 - c.AEserumCount;
        const items = Player.getContainer().getItems()
        if (items[49]?.getType().getName().includes('Clock')) hasAdded = false
        if (!hasAdded && items[49]?.getType().getName().includes('Glowstone')) {
            if (!items[44]) return
            ultrasequencerOrder = []
            for (let i = 9; i <= 44; i++) {
                let item = items[i]
                if (isDye(item)) ultrasequencerOrder[item.getStackSize() - 1] = i
                hasAdded = true;
                clicks = 0;
                if (ultrasequencerOrder.length > maxUltraSequencer && c.AEautoClose && !closing) {
                    closing = true;
                    Client.getMinecraft().currentScreen.close()
                }
            }
        }

        if (items[49]?.getType().getName().includes('Clock') && ultrasequencerOrder[clicks] && Date.now() - lastClick > c.AEclickDelay) {
            Player.getContainer().click(ultrasequencerOrder[clicks], false, 'MIDDLE')
            lastClick = Date.now()
            clicks++
        }
    }

function hasGlint(ctItem) {
    const nbt = ctItem.getNBT();
    if (!nbt) return false;

    const text = String(nbt);
    if (text.includes("minecraft:enchantment_glint_override=>true")) return true;
    return false;
}

function isDye(ctItem) {
    return (ctItem.getType().getRegistryName().includes('dye') || nonDyedDyes.includes(ctItem.getType().getRegistryName()))
}