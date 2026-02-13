import PogObject from "../../PogData"
import { chat } from "../util/utils"

export const data = new PogObject(
    "ClassifiedASF",
    {
        globalShadow: true,
        screenWidth: Renderer.screen.getWidth(),
        screenHeight: Renderer.screen.getHeight()
    },
    "data/guidata.json"
)

const overlayDefs = {}
let resettime = 0
/**
 * Registers a new overlay with the manager and initializes its data if it doesn't exist.
 * * @param {string} name - Unique identifier for the overlay (used as the key in the JSON data).
 * @param {Object} def - The configuration object for the overlay.
 * @param {function(): string} def.text - Function that returns the string to be rendered.
 * @param {"left" | "center"} def.align - Horizontal alignment relative to the anchor point.
 * @param {function(): boolean} [def.setting] - Optional function; returns false to prevent rendering.
 * @param {boolean} [def.colors=true] - If false, disables color cycling and forces white ("&f").
 * @param {number} [def.w] - Optional manual width override.
 * @param {number} [def.h] - Optional manual height override.
 */
export function registerOverlay(name, def) {
    overlayDefs[name] = {
        ...def,
        setting: def.setting || (() => true),
        colors: def.colors !== false,
        w: def.w || null,
        h: def.h || null
    }

    if (!data[name]) {
        data[name] = {
            x: Renderer.screen.getWidth() / 2,
            y: Renderer.screen.getHeight() / 2 - 10,
            scale: 1,
            color: def.colors === false ? "&f" : "&d"
        }
        data.save()
    }
    else {
        if (def.colors === false && data[name].color !== "&f") {
            data[name].color = "&f";
            data.save();
        }
    }
}


for (let key in overlayDefs) {
    if (!data[key]) {
        const def = overlayDefs[key];
        data[key] = {
            x: Renderer.screen.getWidth() / 2,
            y: Renderer.screen.getHeight() / 2 - 10,
            scale: 1,
            color: def.colors === false ? "&f" : "&d"
        };
    }
}

for (let key in data) {
    if (data[key] && !data[key].color) {
        const def = overlayDefs[key];
        data[key].color = def && def.colors === false ? "&f" : "&d";
    }
}
data.save()


export const OverlayEditor = new Gui()
let activeOverlay = null

const guistuff1 = register("guiMouseClick", (mouseX, mouseY, button) => {
    if (!OverlayEditor.isOpen()) return;

    if (button === 0) { // Left click
        activeOverlay = null;
        for (let key in overlayDefs) {
            if (!overlayDefs[key].setting()) continue;
            if (isMouseOver(mouseX, mouseY, overlayDefs[key].text(), data[key], key)) {
                activeOverlay = key;
                isDragging = true;

                activeOverlay = key;
                isDragging = true;
                // Simple: How far is the mouse from the anchor?
                dragOffset.x = mouseX - data[key].x;
                dragOffset.y = mouseY - data[key].y;
                break;
            }
        }
    } else if (button === 1 && activeOverlay) { // Right click resets X
        data[activeOverlay].x = Renderer.screen.getWidth() / 2;
        data.save();
    } else if (button === 2) { // Middle click resets everything
        if (resettime < 2) {
            resettime++;
            return chat("Are you sure you want to reset? Middle click again to reset.");
        }
        for (let key in data) {
            if (!data[key].x) continue;
            data[key].x = Renderer.screen.getWidth() / 2;
            data[key].y = Renderer.screen.getHeight() / 2 - 10;
            data[key].scale = 1;
        }
        data.save();
        resettime = 0;
    }
}).unregister();

// Mouse move handler for dragging
const guistuff2 = register("guiMouseDrag", (mouseX, mouseY, btn) => {
    if (!OverlayEditor.isOpen()) return;
    if (activeOverlay && isDragging && btn != 1) {
        data[activeOverlay].x = mouseX - dragOffset.x;
        data[activeOverlay].y = mouseY - dragOffset.y;
    }
}).unregister();

// Mouse release handler
const guistuff2V2 = register("clicked", (x, y, button, down) => {
    if (!OverlayEditor.isOpen()) return;
    if (!down && isDragging) {
        data.save();
        isDragging = false;
    }
}).unregister();


const guistuff3 = register("scrolled", (x, y, dir) => {
    if (!OverlayEditor.isOpen()) return;

    // Dynamically calculate mouse position based on current GUI Scale
    const scaleFactor = Renderer.screen.getScale();
    const mouseX = x / scaleFactor;
    const mouseY = y / scaleFactor;

    if (activeOverlay) {
        let newScale = data[activeOverlay].scale + (dir === 1 ? 0.05 : -0.05);
        data[activeOverlay].scale = Math.max(0.1, newScale); // Allow scaling smaller if needed
        data.save();
    }
    else {
        for (let key in overlayDefs) {
            // Use the calculated mouseX and mouseY
            if (isMouseOver(mouseX, mouseY, overlayDefs[key].text(), data[key], key)) {
                activeOverlay = key;
                break;
            }
        }
    }
}).unregister();

const guistuff4 = register("guiKey", (char, keyCode, gui, event) => {
    if (!OverlayEditor.isOpen()) return;

    if (activeOverlay && keyCode == Keyboard.KEY_R) {
        const def = overlayDefs[activeOverlay];
        if (!def.colors) return;

        const colors = ["&f", "&a", "&b", "&c", "&d", "&e", "&6", "&9", "&5", "&7"];
        let i = colors.indexOf(data[activeOverlay].color);
        i = (i + 1) % colors.length;
        data[activeOverlay].color = colors[i];
        data.save();
    }
}).unregister();

const overlay = register("renderOverlay", (ctx) => {
    if (OverlayEditor.isOpen()) {
        for (let key in overlayDefs) {
            if (!overlayDefs[key].setting()) continue;
            drawText(ctx, overlayDefs[key].text(), data[key], overlayDefs[key].align === "center", key);
        }

        if (activeOverlay) {
            drawBoxAround(ctx, overlayDefs[activeOverlay].text(), data[activeOverlay],
                overlayDefs[activeOverlay].align === "center");

            const s = data[activeOverlay].scale;
            const labelText = `&7[${data[activeOverlay].color}${activeOverlay}&7]`;
            const cleanLabel = ChatLib.removeFormatting(labelText);

            // Get width minus shadow bias
            const labelWidth = Renderer.getStringWidth(cleanLabel) - 1;

            let labelX = data[activeOverlay].x;
            // Apply manual centering if the overlay itself is centered
            if (overlayDefs[activeOverlay].align === "center") {
                labelX = data[activeOverlay].x - (labelWidth * s / 2);
            }

            // Draw the label shifted up by 8 scaled pixels
            new Text(labelText, labelX / s, (data[activeOverlay].y - (9 * s)) / s)
                .setScale(s)
                .setAlign("left")
                .setShadow(data.globalShadow)
                .draw(ctx);
        }
    } else {
        guistuff1.unregister()
        guistuff2.unregister()
        guistuff2V2.unregister()
        guistuff3.unregister()
        guistuff4.unregister()
        activeOverlay = null
        resettime = 0
        isDragging = false
        overlay.unregister()
    }
}).unregister()

export function activategui() {
    OverlayEditor.open()
    setTimeout(() => {
        overlay.register()
        guistuff1.register()
        guistuff2.register()
        guistuff2V2.register()
        guistuff3.register()
        guistuff4.register()
        resettime = 0
    }, 150);
}

let dragOffset = { x: 0, y: 0 };
let isDragging = false;






/**
 * Renders a text string to the screen using the provided metadata. 
 * Handles scaling and centering logic.
 * * @param {Object} ctx - The Draw Context from the renderOverlay trigger.
 * @param {string} text - The raw text (without the color prefix) to draw.
 * @param {Object} info - The persistent data object for this overlay.
 * @param {number} info.x - The X coordinate.
 * @param {number} info.y - The Y coordinate.
 * @param {number} info.scale - The scale multiplier.
 * @param {string} info.color - The Minecraft color code (e.g., "&d").
 * @param {boolean} [center=true] - Whether to center the text on the X coordinate.
 * @param {string|Object} [overlayName=null] - The overlay ID or definition to check for color settings.
 */
export function drawText(ctx, text, info, center = true, overlayName = null) {
    const def = typeof overlayName === "string" ? overlayDefs[overlayName] : overlayName;
    const prefix = def && def.colors === false ? "" : info.color;
    const s = info.scale || 1;

    const cleanText = ChatLib.removeFormatting(text);
    // Get width at scale 1.0, minus the shadow bias
    const baseWidth = Renderer.getStringWidth(cleanText) - 1;

    let drawX = info.x;
    let drawY = info.y;

    if (center) {
        // Shift the X to the left by half the scaled width
        drawX = info.x - (baseWidth * s / 2);
    }
    
    new Text(prefix + text, drawX / s, drawY / s)
        .setShadow(data.globalShadow)
        .setScale(s)
        .setAlign("left") // Always left, even when "centered"
        .draw(ctx);
}

function getActualWidth(text, scale) {
    const cleanText = ChatLib.removeFormatting(text);
    // Return the FULL width. Don't divide by 2 here.
    return (Renderer.getStringWidth(cleanText) - 1) * scale;
}

function isMouseOver(mx, my, text, info, overlayName) {
    const def = overlayDefs[overlayName];
    if (!def) return false;

    const s = info.scale || 1;
    
    // --- CHANGE STARTS HERE ---
    // Use manual width if provided, otherwise calculate from text
    const w = def.w ? (def.w * s) : getActualWidth(text, s); 
    // Use manual height if provided, otherwise use default 9
    const h = def.h ? (def.h * s) : (9 * s);
    // ---------------------------

    const x = (def.align === "center") ? info.x - (w / 2) : info.x;
    const y = info.y;

    return mx >= x - 2 && mx <= x + w + 2 &&
           my >= y - 2 && my <= y + h + 2;
}

function drawBoxAround(ctx, text, info, center = true) {
    // We need the overlayName or def here to see the w/h
    // Since you only call this for activeOverlay, we can grab it
    const def = overlayDefs[activeOverlay]; 
    const s = info.scale || 1;

    // Use manual w/h if they exist
    const w = (def && def.w) ? (def.w * s) : getActualWidth(text, s);
    const h = (def && def.h) ? (def.h * s) : (9 * s);

    const x = center ? info.x - (w / 2) : info.x;
    const y = info.y;

    const color = 0x60FF00FF | 0;

    ctx.fill(x - 2, y - 2, x + w + 2, y + h + 2, color);
}

let lastWidth = data.screenWidth;
let lastHeight = data.screenHeight;
