import { chat } from "./util/utils";
import { activategui, data } from "./managers/guiManager";
import {
    @ButtonProperty,
    @CheckboxProperty,
    Color,
    @ColorProperty,
    @PercentSliderProperty,
    @DecimalSliderProperty,
    @SelectorProperty,
    @SwitchProperty,
    @TextProperty,
    @Vigilant,
    @SliderProperty
} from '../Vigilance/index';

@Vigilant("ClassifiedASF/data", "§5ClassifiedASF", {
    getCategoryComparator: () => (a, b) => {
        const categories = ["Dungeon", "Auto Terms", 'GUI', "Settings"];
        return categories.indexOf(a.name) - categories.indexOf(b.name);
    }
})


class config {
    constructor() {
        this.initialize(this)

        this.addDependency("Glass Color", "Bye Bye Door");
        this.addDependency("Full Glass Start Door", "Bye Bye Door");
        this.addDependency("Disable On Dungeon Start", "Bye Bye Door");

        this.registerListener("Open Gui Editor", (curr) => {
            Client.currentGui.close()
            activategui()
            this.guiEditor = false
        })

        this.registerListener("Disable Text Shadow", (curr) => {
            data.globalShadow = !data.globalShadow
            data.save()
            chat(`§aOverlays shadow is now: ${data.globalShadow ? "§bON" : "§cOFF"}`)
        })


    }

    @SwitchProperty({
        name: "Bye Bye Door",
        description: "Ghost blocks the wither doors",
        category: "Dungeon",
        subcategory: "Doors"
    })
    byebyeDoor = false

    @CheckboxProperty({
        name: "Full Glass Start Door",
        description: "",
        category: "Dungeon",
        subcategory: "Doors"
    })
    fullStartDoor = false

    @CheckboxProperty({
        name: "Custom Color",
        description: "If toggled off, will use black glass and red glass",
        category: "Dungeon",
        subcategory: "Doors"
    })
    customColor = false

    @TextProperty({
        name: "Glass Color",
        description: "What color of glass to replace the door",
        category: "Dungeon",
        subcategory: "Doors"
    })
    glassType = ""

    @CheckboxProperty({
        name: "Disable On Dungeon Start",
        description: "Disable after dungeon start instead of after blood open",
        category: "Dungeon",
        subcategory: "Doors"
    })
    disableAfterStart = false



    @SwitchProperty({
        name: "Terminal Trigger Bot",
        description: "",
        category: "Auto Terms",
        subcategory: "Trigger Bot"
    })
    terminalTB = false

    @SwitchProperty({
        name: "Terminal Highlight",
        description: "Highlight the Box of the Terminal when right clicking",
        category: "Auto Terms",
        subcategory: "Highlight"
    })
    terminalTBHighlight = false

    @SliderProperty({
        name: "Terminal TB Leap Delay",
        description: "Delay for when it should start clicking after leaping (it is in mS so 1000 = 1 second)",
        category: "Auto Terms",
        subcategory: "Auto Terms",
        min: 1,
        max: 2000,
        increment: 1,
    })
    terminalTBLeapDelay = 0;


    @SwitchProperty({
        name: "Open Gui Editor",
        description: "§aLMB §7= Select | §aDrag §7= Move | §cRMB §7= Center | §bScroll §7= Scale | §eMiddle Click §7= Reset | §dR §7= Change color",
        category: "GUI",
        subcategory: "Editor"
    })
    guiEditor = false

    @SwitchProperty({
        name: "Disable Text Shadow",
        description: "Disable the text shadows for CLASSIFIED GUIS ONLY",
        category: "GUI",
        subcategory: "Editor"
    })
    disableTextShadow = false

    @SelectorProperty({
        name: "Prefix for mod chats",
        description: "",
        category: "Settings",
        subcategory: "Prefix",
        options: ["ClassifiedASF", "Classified", "PrivateASF", "Private", "PA", "PASF"]
    })
    customPrefix = 0;

    @SwitchProperty({
        name: "More legit right clicks???",
        description: "This might just be schitzo idk, use it if you feel more safe",
        category: "Settings",
        subcategory: "Right clicks"
    })
    legitRightClick = false

}

export default new config()