import PogObject from "../../../PogData";
import c from "../../config"
import { chat } from "../../util/utils";

const defaultItems = [
    "enchanted ice", "rotten", "skeleton grunt", "cutlass",
    "skeleton lord", "skeleton soldier", "zombie soldier", "zombie knight", "zombie commander", "zombie lord",
    "skeletor", "super heavy", "heavy", "sniper helmet", "dreadlord", "earth shard", "zombie commander whip",
    "machine gun", "sniper bow", "soulstealer bow", "silent death", "training weight",
    "beating heart", "premium flesh", "mimic fragment", "enchanted rotten flesh", "sign",
    "enchanted bone", "defuse kit", "optical lens", "tripwire hook", "button", "carpet", "lever", "diamond atom",
    "healing viii splash potion", "healing 8 splash potion", "candycomb"
];

export const data = new PogObject(
    "ClassifiedASF",
    {
        sellList: []
    },
    "data/autoSell.json"
)

let lastClick = 0;
const validMenus = ["Trades", "Booster Cookie", "Farm Merchant", "Ophelia"];


register("tick", () => {
    if (!c.ASToggle) return;
    if (Date.now() - lastClick < c.ASSellDelay) return;

    const container = Player.getContainer();
    if (!container || !validMenus.includes(container.getName().toString().removeFormatting())) return;

    for (let i = 54; i < 90; i++) {
        const item = container.getStackInSlot(i);
        if (!item || item.getType()?.getId() == -1) continue;

        const itemName = item.getName().removeFormatting().toLowerCase();
        const shouldSell = data.sellList.some(sellItem => itemName.includes(sellItem.toLowerCase()))
        if (shouldSell) {
            let clickType = "MIDDLE"
            let shiftClick = false;
            if (Player.getContainer()) Player.getContainer().click(i, shiftClick, clickType)
                lastClick = Date.now()
            break;
        }
    }
});

register("command", (...args) => {
    if (!args || !args[0]) {
        ChatLib.chat("§b[AutoSell] §7Usage: /paautosell <add/remove/clear/defaults/list>");
        return;
    }

    const action = args[0].toLowerCase();
    const query = args.slice(1).join(" ").toLowerCase();

    switch (action) {
        case "add":
            if (!query) return ChatLib.chat("§cPlease specify an item name to add!");
            if (data.sellList.includes(query)) return ChatLib.chat(`§c"${query}" is already in the list.`);
            
            data.sellList.push(query);
            data.save();
            chat(`§aAdded §6${query} §ato the sell list.`);
            break;

        case "remove":
            if (!query) return ChatLib.chat("§cPlease specify an item name to remove!");
            const index = data.sellList.indexOf(query);
            if (index > -1) {
                data.sellList.splice(index, 1);
                data.save();
                chat(`§aRemoved §6${query} §afrom the sell list.`);
            } else {
                chat(`§cCould not find "${query}" in the list.`);
            }
            break;

        case "defaults":

            data.sellList = [...new Set([...data.sellList, ...defaultItems])];
            data.save();
            chat("§aAdded default items to Auto Sell.");
            break;

        case "clear":
            data.sellList = [];
            data.save();
            chat("§aCleared Auto Sell list.");
            break;

        case "list":
            chat(`§bAuto Sell List: §f${data.sellList.join(", ")}`);
            break;

        default:
            chat("§cUnknown command. Use add, remove, clear, defaults, or list.");
            break;
    }
}).setName("paautosell");

