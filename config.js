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
        const categories = ["Dungeon", "Terminals", "Random", 'GUI', "Settings"];
        return categories.indexOf(a.name) - categories.indexOf(b.name);
    }
})


class config {
    constructor() {
        this.initialize(this)

        this.addDependency("Glass Color", "Bye Bye Door" && "Custom Color");
        this.addDependency("Full Glass Start Door", "Bye Bye Door");
        this.addDependency("Disable On Dungeon Start", "Bye Bye Door");
        this.addDependency("Custom Color", "Bye Bye Door")

        this.addDependency("Arrow Align TriggerBot", "Arrow Align Solver")
        this.addDependency("Click Delay", "Arrow Align TriggerBot" && "Arrow Align Solver")
        this.addDependency("Invert Sneak", "Arrow Align Solver")
        this.addDependency("Block Wrong Clicks", "Arrow Align Solver")

        this.addDependency("Melody Skip On", "Auto Melody")
        this.addDependency("Don't Skip First Slot", "Auto Melody")
        this.addDependency("Only skip two on open", "Auto Melody")

        this.addDependency("Terminal TB Leap Delay", "Terminal Trigger Bot")
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
        name: "Chest TriggerBot for P3",
        description: "",
        category: "Dungeon",
        subcategory: "P3"
    })
    chestPlaceTB = false

    @SwitchProperty({
        name: "Arrow Align Solver",
        description: "",
        category: "Dungeon",
        subcategory: "Device"
    })
    arrowAlignSolver = false;

    @SwitchProperty({
        name: "Block Wrong Clicks",
        description: "Sneak to disable",
        category: "Dungeon",
        subcategory: "Device"
    })
    arrowAlignBlockWrong = false;


    @SwitchProperty({
        name: "Invert Sneak",
        description: "",
        category: "Dungeon",
        subcategory: "Device"
    })
    arrowAlignInvertSneak = false;

    @SwitchProperty({
        name: "Arrow Align TriggerBot",
        description: "Sneak to disable",
        category: "Dungeon",
        subcategory: "Device"
    })
    arrowAlignTB = false;

    @SliderProperty({
        name: "Click Delay",
        description: "",
        category: "Dungeon",
        subcategory: "Device",
        min: 75,
        max: 1000,
        increment: 1
    })
    arrowAlignDelay = 150;

    @SwitchProperty({
        name: "Auto Term",
        description: "",
        category: "Terminals",
        subcategory: "AutoTerms"
    })
    autoTerm = false

    @SliderProperty({
        name: "Auto Term Delay",
        description: "",
        category: "Terminals",
        subcategory: "AutoTerms",
        min: 20,
        max: 200,
        increment: 1,
    })
    autoTermDelay = 150;

    @SliderProperty({
        name: "Auto Term FC Delay",
        description: "",
        category: "Terminals",
        subcategory: "AutoTerms",
        min: 350,
        max: 500,
    })
    autoTermFCDelay = 350;

    @SliderProperty({
        name: "Auto Term Break Threshold",
        description: "",
        category: "Terminals",
        subcategory: "AutoTerms",
        min: 500,
        max: 1000
    })
    autoTermBreakThres = 500;

    @SwitchProperty({
        name: "Send Terminal Time Taken",
        description: "",
        category: "Terminals",
        subcategory: "AutoTerms"
    })
    sendTermTime = false

    @SwitchProperty({
        name: "Auto Melody",
        description: "",
        category: "Terminals",
        subcategory: "Melody"
    })
    autoMelody = false

    @SelectorProperty({
        name: "Melody Skip On",
        description: "",
        category: "Terminals",
        subcategory: "Melody",
        options: ["None", "Edges", "All"]
    })
    melodySkip = 0;

    @SwitchProperty({
        name: "Don't Skip First Slot",
        description: "",
        category: "Terminals",
        subcategory: "Melody"
    })
    noSkipFirst = false

    @SwitchProperty({
        name: "Only skip two on open",
        description: "",
        category: "Terminals",
        subcategory: "Melody"
    })
    onlySkip2 = false

    @SwitchProperty({
        name: "Terminal Trigger Bot",
        description: "",
        category: "Terminals",
        subcategory: "Trigger Bot"
    })
    terminalTB = false

    @SliderProperty({
        name: "Terminal TB Leap Delay",
        description: "Delay for when it should start clicking after leaping (it is in mS so 1000 = 1 second)",
        category: "Terminals",
        subcategory: "Trigger Bot",
        min: 1,
        max: 2000,
        increment: 1,
    })
    terminalTBLeapDelay = 0;

    @SwitchProperty({
        name: "Terminal Highlight",
        description: "Highlight the Box of the Terminal when right clicking",
        category: "Terminals",
        subcategory: "Highlight"
    })
    terminalTBHighlight = false

    @SwitchProperty({
        name: "Terminal Highlight All Nearby",
        description: "",
        category: "Terminals",
        subcategory: "Highlight"
    })
    terminalTBHighlightNearby = false



    @SwitchProperty({
        name: "Toggle Auto Experiments",
        description: "",
        category: "Random",
        subcategory: "Experiments"
    })
    autoExperiment = false

    @SwitchProperty({
        name: "AE Get Max XP",
        description: "",
        category: "Random",
        subcategory: "Experiments"
    })
    AEmaxXP = false

    @SliderProperty({
        name: "AE Serum Count",
        description: "",
        category: "Random",
        subcategory: "Experiments",
        min: 0,
        max: 3
    })
    AEserumCount = 0;

    @SwitchProperty({
        name: "AE Auto Close",
        description: "",
        category: "Random",
        subcategory: "Experiments"
    })
    AEautoClose = false

    @SliderProperty({
        name: "AE Click Delay",
        category: "Random",
        subcategory: "Experiments",
        min: 120,
        max: 500
    })
    AEclickDelay = 150;

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
        subcategory: "§0Prefix",
        options: ["ClassifiedASF", "Classified", "PrivateASF", "Private", "PA", "PASF"]
    })
    customPrefix = 0;

    // @SwitchProperty({
    //     name: "More legit right clicks???",
    //     description: "This might just be schitzo idk, use it if you feel more safe",
    //     category: "Settings",
    //     subcategory: "Clicks"
    // })
    // legitClicks = false

}

export default new config()