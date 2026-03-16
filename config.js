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
        const categories = ["Dungeon", "Terminals", "Boss", "Random", "Fast Leap", 'GUI', "Settings"];
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
        this.addDependency("Arrow Align Click Delay", "Arrow Align TriggerBot" && "Arrow Align Solver")
        this.addDependency("Invert Sneak", "Arrow Align Solver")
        this.addDependency("Block Wrong Clicks", "Arrow Align Solver")

        this.addDependency("SS Auto Start Delay", "SS Auto Start")
        this.addDependency("SS Display Progress", "SS Solver")
        this.addDependency("SS Block Wrong Clicks", "SS Solver")
        this.addDependency("SS Block Wrong Start Clicks", "SS Solver")
        this.addDependency("SS Block Wrong Start Clicks", "SS Solver")
        this.addDependency("SS Max Start Clicks", "SS Solver")
        this.addDependency("SS TriggerBot", "SS Solver")
        this.addDependency("SS TriggerBot Delay", "SS Solver")
        this.addDependency("SS Auto Rotate", "SS Solver")
        this.addDependency("SS Rotate Delay", "SS Solver")

        this.addDependency("Melody Skip On", "Auto Melody")
        this.addDependency("Don't Skip First Slot", "Auto Melody")
        this.addDependency("Only skip two on open", "Auto Melody")

        this.addDependency("Auto sell delay", "Auto sell")

        this.addDependency("Door Fast Leap", "Toggle Fast Leap")
        this.addDependency("Fast Leap in Terms", "Toggle Fast Leap")
        this.addDependency("Lazy Mage Leap", "Toggle Fast Leap")
        this.addDependency("EE2 Leap", "Toggle Fast Leap")
        this.addDependency("EE3 Leap", "Toggle Fast Leap")
        this.addDependency("Core Leap", "Toggle Fast Leap")
        this.addDependency("In-Core Leap", "Toggle Fast Leap")
        this.addDependency("I4 Leap", "Toggle Fast Leap")

        this.addDependency("Terminal TB Leap Delay", "Terminal Trigger Bot")
        this.addDependency("Terminal Trigger Bot CPS", "Terminal Trigger Bot")
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

        this.addDependency("Relic Pickup Aura", "hardCheatInternal")
        this.addDependency("Relic Place Aura", "hardCheatInternal")
        this.addDependency("Arrow Align Aura", "hardCheatInternal")
    }
    @SwitchProperty({
        name: "hardCheatInternal",
        description: "internal use only",
        category: "Hidden",
        subcategory: "Hidden",
        hidden: true
    })
    hardCheat = false

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
        name: "Auto Term",
        description: "",
        category: "Terminals",
        subcategory: "AutoTerms"
    })
    autoTerm = false

    @SelectorProperty({
        name: "Auto Term Sorting",
        description: "",
        category: "Terminals",
        subcategory: "AutoTerms",
        options: ["Normal", "Up-Down", "Humanized"]
    })
    autoTermSorting = 0;


    @SliderProperty({
        name: "Auto Term Delay",
        description: "",
        category: "Terminals",
        subcategory: "AutoTerms",
        min: 80,
        max: 300,
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
        name: "Terminal Trigger Bot CPS",
        description: "",
        category: "Terminals",
        subcategory: "Trigger Bot",
        min: 1,
        max: 20,
        increment: 1
    })
    terminalTBCPS = 10;

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
        name: "Relic Pickup TB",
        description: "",
        category: "Boss",
        subcategory: "Relics"
    })
    relicPickupTB = false

    @SwitchProperty({
        name: "Relic Place TB",
        description: "",
        category: "Boss",
        subcategory: "Relics"
    })
    relicPlaceTB = false

    @SwitchProperty({
        name: "Relic Pickup Aura",
        description: "",
        category: "Boss",
        subcategory: "§dAuras"
    })
    relicPickupAura = false

    @SwitchProperty({
        name: "Relic Place Aura",
        description: "",
        category: "Boss",
        subcategory: "§dAuras"
    })
    relicPlaceAura = false

    @SwitchProperty({
        name: "Arrow Align Aura",
        description: "",
        category: "Boss",
        subcategory: "§dAuras"
    })
    alignAura = false

    @SwitchProperty({
        name: "SS Auto Start",
        description: "&cWIP",
        category: "Device",
        subcategory: "SS"
    })
    SSAutoStart = false;

    @SliderProperty({
        name: "SS Auto Start Delay",
        description: "Auto Start Delay with small randomization&cWIP",
        category: "Device",
        subcategory: "SS",
        min: 80,
        max: 300,
        increment: 1
    })
    SSAutoStartDelay = 120;

    @SwitchProperty({
        name: "SS Solver",
        description: "&cWIP",
        category: "Device",
        subcategory: "SS"
    })
    SSSolver = false;

    @CheckboxProperty({
        name: "SS Filled",
        description: "Filled instead of outline&cWIP",
        category: "Device",
        subcategory: "SS"
    })
    SSSolverFilled = false;

    @SwitchProperty({
        name: "SS Block Wrong Clicks",
        description: "Needed for TB to be consistent, too lazy to fix&cWIP",
        category: "Device",
        subcategory: "SS"
    })
    SSBlockWrong = false;

    @SwitchProperty({
        name: "SS Block Wrong Start Clicks",
        description: "&cWIP",
        category: "Device",
        subcategory: "SS"
    })
    SSBlockWrongStart = false;

    @SwitchProperty({
        name: "SS Display Progress",
        description: "Displays what set of buttons SS is at&cWIP",
        category: "Device",
        subcategory: "SS"
    })
    SSDisplay = false;

    @SwitchProperty({
        name: "SS TriggerBot",
        description: "&cWIP",
        category: "Device",
        subcategory: "SS"
    })
    SSTriggerBot = false;

    @SwitchProperty({
        name: "SS Auto Rotate",
        description: "Just full on autoSS &cworks but idk if I fucked up on any code :)",
        category: "Device",
        subcategory: "SS"
    })
    SSAutoRotate = false;

    @SliderProperty({
        name: "SS Max Start Clicks",
        description: "&cWIP",
        category: "Device",
        subcategory: "SS",
        max: 10,
        min: 1,
        increment: 1,
    })
    SSMaxStartClicks = 3;

    @SliderProperty({
        name: "SS TriggerBot Delay",
        description: "&cWIP",
        category: "Device",
        subcategory: "SS",
        max: 1000,
        min: 50,
        increment: 1
    })
    SSTBDelay = 120;

    @SliderProperty({
        name: "SS Rotate Delay",
        description: "&cWIP",
        category: "Device",
        subcategory: "SS",
        max: 500,
        min: 50,
        increment: 1
    })
    SSRotateDelay = 150;

    @SwitchProperty({
        name: "Arrow Align Solver",
        description: "",
        category: "Device",
        subcategory: "Arrow Align"
    })
    arrowAlignSolver = false;

    @SwitchProperty({
        name: "Block Wrong Clicks",
        description: "Sneak to disable",
        category: "Device",
        subcategory: "Arrow Align"
    })
    arrowAlignBlockWrong = false;


    @SwitchProperty({
        name: "Invert Sneak",
        description: "",
        category: "Device",
        subcategory: "Arrow Align"
    })
    arrowAlignInvertSneak = false;

    @SwitchProperty({
        name: "Arrow Align TriggerBot",
        description: "Sneak to disable",
        category: "Device",
        subcategory: "Arrow Align"
    })
    arrowAlignTB = false;

    @SliderProperty({
        name: "Arrow Align Click Delay",
        description: "",
        category: "Device",
        subcategory: "Arrow Align",
        min: 75,
        max: 1000,
        increment: 1
    })
    arrowAlignDelay = 150;

    @SwitchProperty({
        name: "Auto sell",
        description: "/paautosell to edit stuff",
        category: "Random",
        subcategory: "Auto Sell"
    })
    ASToggle = false

    @SliderProperty({
        name: "Auto sell delay",
        description: "",
        category: "Random",
        subcategory: "Auto Sell",
        min: 75,
        max: 500,
        increment: 1
    })
    ASSellDelay = 150;

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
        name: "Toggle Fast Leap",
        description: "&cWIP",
        category: "Fast Leap",
        subcategory: "General"
    })
    fastLeapToggle = false


    @SwitchProperty({
        name: "Door Fast Leap",
        description: "fast leap to door opener",
        category: "Fast Leap",
        subcategory: "General"
    })
    fastLeapDoor = false

    @SwitchProperty({
        name: "Fast Leap in Terms",
        description: "auto leap to ees",
        category: "Fast Leap",
        subcategory: "General"
    })
    fastLeapTerm = false

    @TextProperty({
        name: "Lazy Mage Leap",
        description: "Player/class to leap to for after storm crush",
        category: "Fast Leap",
        subcategory: "Leaps"
    })
    lazyLeap = ""

    @TextProperty({
        name: "EE2 Leap",
        description: "Player/class to leap to for EE2",
        category: "Fast Leap",
        subcategory: "Leaps"
    })
    ee2Leap = ""


    @TextProperty({
        name: "EE3 Leap",
        description: "Player/class to leap to for EE3",
        category: "Fast Leap",
        subcategory: "Leaps"
    })
    ee3Leap = ""


    @TextProperty({
        name: "Core Leap",
        description: "Player/class to leap to for Core",
        category: "Fast Leap",
        subcategory: "Leaps"
    })
    coreLeap = ""


    @TextProperty({
        name: "In-Core Leap",
        description: "Player/class to leap to for inside Core",
        category: "Fast Leap",
        subcategory: "Leaps"
    })
    inCoreLeap = ""


    @TextProperty({
        name: "I4 Leap",
        description: "Player/class to leap to from I4",
        category: "Fast Leap",
        subcategory: "Leaps"
    })
    i4Leap = ""

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