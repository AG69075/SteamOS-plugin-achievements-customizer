const manifest = {"name":"Achievement Customizer"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const callable = api.callable;
const addEventListener = api.addEventListener;
const removeEventListener = api.removeEventListener;
const toaster = api.toaster;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

/**
 * @fileoverview Theme settings: presets, validation of persisted values and
 * the settings the live toast renders with.
 */
const PRESET_NAMES = [
    'xbox',
    'playstation',
    'steam',
    'nintendo',
    'gold',
    'midnight',
    'sky-day',
    'sky-night',
    'pixel-day',
    'pixel-night',
    'pixel-sakura',
    'pixel-halloween',
    'custom',
];
const ICON_SHAPES = ['circle', 'rounded', 'square'];
const BANNER_STYLES = ['gradient', 'solid', 'glass'];
// Each id needs a Theme registered in decorations/index.tsx.
const DECORATIONS = [
    'none',
    'sparkles',
    'sky-day',
    'sky-night',
    'pixel-day',
    'pixel-night',
    'pixel-sakura',
    'pixel-halloween',
];
const ENTRANCE_STYLES = [
    'pop',
    'slide',
    'fade',
    'bounce',
    'unfold',
    'drop',
    'flip',
    'retro',
];
// 'default' keeps Steam's own notification position.
const TOAST_POSITIONS = [
    'default',
    'top-left',
    'top-center',
    'top-right',
    'middle-left',
    'middle-center',
    'middle-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
];
const BASE = {
    primaryColor: '#107C10',
    secondaryColor: '#0e6b0e',
    accentColor: '#52b043',
    textColor: '#ffffff',
    descColor: '#a0d9a0',
    glowEnabled: true,
    glowIntensity: 20,
    borderRadius: 12,
    iconBorder: true,
    iconShape: 'circle',
    bannerStyle: 'gradient',
    rarityEffects: true,
    popupAnimation: true,
    decorativeElements: 'none',
    entranceStyle: 'unfold',
    shineEnabled: true,
};
const SKY_DAY = {
    ...BASE,
    primaryColor: '#5EA6D6',
    secondaryColor: '#3D7EAE',
    accentColor: '#ECCA2F',
    textColor: '#FFF8E7',
    descColor: '#FFF8E7',
    glowIntensity: 15,
    borderRadius: 14,
    decorativeElements: 'sky-day',
    entranceStyle: 'drop',
};
const SKY_NIGHT = {
    ...BASE,
    primaryColor: '#2A2D3E',
    secondaryColor: '#1D1F2C',
    accentColor: '#C4C9D1',
    textColor: '#E8EBF2',
    descColor: '#E8EBF2',
    glowIntensity: 15,
    borderRadius: 14,
    decorativeElements: 'sky-night',
    entranceStyle: 'fade',
};
/** The values each built-in preset applies. */
const PRESETS = {
    'xbox': BASE,
    'playstation': {
        ...BASE,
        primaryColor: '#003087',
        secondaryColor: '#00246B',
        accentColor: '#0070D1',
        descColor: '#87CEEB',
        borderRadius: 8,
        entranceStyle: 'drop',
    },
    'steam': {
        ...BASE,
        primaryColor: '#1b2838',
        secondaryColor: '#0e1620',
        accentColor: '#66c0f4',
        textColor: '#c7d5e0',
        descColor: '#8f98a0',
        glowEnabled: false,
        glowIntensity: 10,
        borderRadius: 4,
        iconBorder: false,
        iconShape: 'rounded',
        bannerStyle: 'solid',
        entranceStyle: 'slide',
    },
    'nintendo': {
        ...BASE,
        primaryColor: '#e60012',
        secondaryColor: '#c20010',
        accentColor: '#ff4d4d',
        descColor: '#ffcccc',
        glowIntensity: 15,
        borderRadius: 16,
        entranceStyle: 'fade',
    },
    'gold': {
        ...BASE,
        primaryColor: '#44330a',
        secondaryColor: '#2a1f06',
        accentColor: '#ffd700',
        textColor: '#ffd700',
        descColor: '#daa520',
        glowIntensity: 25,
        borderRadius: 10,
        entranceStyle: 'pop',
    },
    'midnight': {
        ...BASE,
        primaryColor: '#0d0221',
        secondaryColor: '#0a0118',
        accentColor: '#cc00ff',
        textColor: '#e0b0ff',
        descColor: '#9966cc',
        glowIntensity: 30,
        borderRadius: 14,
        entranceStyle: 'bounce',
    },
    'sky-day': SKY_DAY,
    'sky-night': SKY_NIGHT,
    // The pixel skies are four bands from Secondary (top) to Primary (bottom),
    // so these are the band ends.
    'pixel-day': {
        ...SKY_DAY,
        primaryColor: '#84c1ef',
        secondaryColor: '#3b86d1',
        borderRadius: 4,
        decorativeElements: 'pixel-day',
        entranceStyle: 'retro',
    },
    'pixel-night': {
        ...SKY_NIGHT,
        primaryColor: '#28306b',
        secondaryColor: '#0f1030',
        borderRadius: 4,
        decorativeElements: 'pixel-night',
        entranceStyle: 'retro',
    },
    'pixel-sakura': {
        ...BASE,
        primaryColor: '#fff3f7',
        secondaryColor: '#ffd6e4',
        accentColor: '#e0457b',
        textColor: '#5c1a3e',
        descColor: '#7d2f58',
        glowIntensity: 15,
        borderRadius: 4,
        decorativeElements: 'pixel-sakura',
        entranceStyle: 'retro',
    },
    // The graveyard sky is a vignette: Primary around the moon, Secondary toward
    // the edges.
    'pixel-halloween': {
        ...BASE,
        primaryColor: '#2E2A55',
        secondaryColor: '#15121F',
        accentColor: '#B8A5E6',
        textColor: '#F4F2FF',
        descColor: '#C9C4DD',
        glowIntensity: 18,
        borderRadius: 4,
        decorativeElements: 'pixel-halloween',
        entranceStyle: 'retro',
    },
};
/**
 * The xbox preset plus user preferences. Keep in sync with DEFAULT_SETTINGS in
 * main.py.
 */
const DEFAULT_SETTINGS = {
    preset: 'xbox',
    duration: 6000,
    ignoreReducedMotion: false,
    position: 'default',
    sound: 'default',
    soundVolume: 100,
    ...PRESETS.xbox,
};
/** Preset dropdown entries, in menu order. */
const PRESET_OPTIONS = [
    { data: 'xbox', label: 'Xbox' },
    { data: 'playstation', label: 'PlayStation' },
    { data: 'steam', label: 'Steam' },
    { data: 'nintendo', label: 'Nintendo' },
    { data: 'gold', label: 'Gold' },
    { data: 'midnight', label: 'Midnight' },
    { data: 'sky-day', label: 'Sky Day' },
    { data: 'sky-night', label: 'Sky Night' },
    { data: 'pixel-day', label: 'Pixel Day' },
    { data: 'pixel-night', label: 'Pixel Night' },
    { data: 'pixel-sakura', label: 'Cherry Blossom' },
    { data: 'pixel-halloween', label: 'Halloween' },
    { data: 'custom', label: 'Custom' },
];
/** Toast position dropdown entries. */
const POSITION_OPTIONS = [
    { data: 'default', label: 'Steam Default' },
    { data: 'top-left', label: 'Top Left' },
    { data: 'top-center', label: 'Top Center' },
    { data: 'top-right', label: 'Top Right' },
    { data: 'middle-left', label: 'Middle Left' },
    { data: 'middle-center', label: 'Middle Center' },
    { data: 'middle-right', label: 'Middle Right' },
    { data: 'bottom-left', label: 'Bottom Left' },
    { data: 'bottom-center', label: 'Bottom Center' },
    { data: 'bottom-right', label: 'Bottom Right' },
];
/** Icon shape dropdown entries. */
const ICON_SHAPE_OPTIONS = [
    { data: 'circle', label: 'Circle' },
    { data: 'rounded', label: 'Rounded' },
    { data: 'square', label: 'Square' },
];
/** Banner style dropdown entries. */
const BANNER_STYLE_OPTIONS = [
    { data: 'gradient', label: 'Gradient' },
    { data: 'solid', label: 'Solid' },
    { data: 'glass', label: 'Glass (Blur)' },
];
/** Toast corner radius choices, in px. */
const TOAST_SHAPE_OPTIONS = [
    { data: 0, label: 'Square' },
    { data: 8, label: 'Rounded' },
    { data: 16, label: 'Very Rounded' },
    { data: 24, label: 'Pill' },
];
/** Entrance style dropdown entries. */
const ENTRANCE_OPTIONS = [
    { data: 'unfold', label: 'Unfold (Xbox)' },
    { data: 'drop', label: 'Drop (PlayStation)' },
    { data: 'slide', label: 'Slide In' },
    { data: 'pop', label: 'Pop' },
    { data: 'bounce', label: 'Bounce' },
    { data: 'fade', label: 'Fade' },
    { data: 'flip', label: 'Flip' },
    { data: 'retro', label: 'Retro (16-bit)' },
];
/** Decoration dropdown entries. */
const DECORATION_OPTIONS = [
    { data: 'none', label: 'None' },
    { data: 'sparkles', label: 'Sparkles' },
    { data: 'sky-day', label: 'Sky Day' },
    { data: 'sky-night', label: 'Sky Night' },
    { data: 'pixel-day', label: 'Pixel Day (16-bit)' },
    { data: 'pixel-night', label: 'Pixel Night (16-bit)' },
    { data: 'pixel-sakura', label: 'Cherry Blossom (16-bit)' },
    { data: 'pixel-halloween', label: 'Halloween (16-bit)' },
];
const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const RRGGBB_PATTERN = /^#[0-9a-fA-F]{6}$/;
// Decky's ColorPickerModal confirms with `hsla(H, S%, L%, A)`, and its sliders
// can hold decimals.
const HSL_PATTERN = /^hsla?\(\s*(-?[\d.]+)(?:deg)?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*(?:,\s*[\d.]+%?\s*)?\)$/i;
function safeColor(value, fallback) {
    if (typeof value !== 'string' || !HEX_COLOR_PATTERN.test(value)) {
        return fallback;
    }
    if (value.length === 4) {
        const [, r, g, b] = value;
        return `#${r}${r}${g}${g}${b}${b}`;
    }
    return value.toLowerCase();
}
function clampNumber(value, min, max, fallback) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return fallback;
    return Math.min(max, Math.max(min, value));
}
function safeChoice(value, choices, fallback) {
    return choices.find((choice) => choice === value) ?? fallback;
}
function safeBoolean(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
/**
 * Validates persisted settings field by field, since every value can end up in
 * a CSS string.
 */
function sanitizeSettings(raw) {
    const input = raw ?? {};
    const defaults = DEFAULT_SETTINGS;
    return {
        preset: safeChoice(input.preset, PRESET_NAMES, 'custom'),
        primaryColor: safeColor(input.primaryColor, defaults.primaryColor),
        secondaryColor: safeColor(input.secondaryColor, defaults.secondaryColor),
        accentColor: safeColor(input.accentColor, defaults.accentColor),
        textColor: safeColor(input.textColor, defaults.textColor),
        descColor: safeColor(input.descColor, defaults.descColor),
        glowEnabled: safeBoolean(input.glowEnabled, defaults.glowEnabled),
        glowIntensity: clampNumber(input.glowIntensity, 0, 50, defaults.glowIntensity),
        borderRadius: clampNumber(input.borderRadius, 0, 32, defaults.borderRadius),
        duration: clampNumber(input.duration, 1000, 30000, defaults.duration),
        iconBorder: safeBoolean(input.iconBorder, defaults.iconBorder),
        iconShape: safeChoice(input.iconShape, ICON_SHAPES, defaults.iconShape),
        bannerStyle: safeChoice(input.bannerStyle, BANNER_STYLES, defaults.bannerStyle),
        rarityEffects: safeBoolean(input.rarityEffects, defaults.rarityEffects),
        popupAnimation: safeBoolean(input.popupAnimation, defaults.popupAnimation),
        decorativeElements: safeChoice(input.decorativeElements, DECORATIONS, defaults.decorativeElements),
        entranceStyle: safeChoice(input.entranceStyle, ENTRANCE_STYLES, defaults.entranceStyle),
        shineEnabled: safeBoolean(input.shineEnabled, defaults.shineEnabled),
        ignoreReducedMotion: safeBoolean(input.ignoreReducedMotion, defaults.ignoreReducedMotion),
        position: safeChoice(input.position, TOAST_POSITIONS, defaults.position),
        sound: safeChoice(input.sound, SOUND_NAMES, defaults.sound),
        soundVolume: clampNumber(input.soundVolume, 0, 300, defaults.soundVolume),
    };
}
/** Red, green and blue (0-255) of a "#rrggbb" color; anything else is black. */
function rgbChannels(hex) {
    if (!RRGGBB_PATTERN.test(hex))
        return [0, 0, 0];
    const value = parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
/** Converts "#rrggbb" to "r g b", for `rgb(var(--x) / alpha)` in CSS. */
function hexToRgbTriplet(hex) {
    return rgbChannels(hex).join(' ');
}
/**
 * Converts "#rrggbb" to whole degrees and percents, the color picker's
 * starting point.
 */
function hexToHsl(hex) {
    const [red, green, blue] = rgbChannels(hex).map((channel) => channel / 255);
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const lightness = (max + min) / 2;
    let hue = 0;
    let saturation = 0;
    if (max !== min) {
        const delta = max - min;
        saturation =
            lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        if (max === red) {
            hue = ((green - blue) / delta + (green < blue ? 6 : 0)) / 6;
        }
        else if (max === green) {
            hue = ((blue - red) / delta + 2) / 6;
        }
        else {
            hue = ((red - green) / delta + 4) / 6;
        }
    }
    return {
        h: Math.round(hue * 360),
        s: Math.round(saturation * 100),
        l: Math.round(lightness * 100),
    };
}
/**
 * Converts "hsl(...)" or "hsla(...)" (alpha ignored) to lowercase "#rrggbb",
 * or returns null when the value does not parse.
 */
function hslToHex(value) {
    const match = HSL_PATTERN.exec(value.trim());
    if (!match)
        return null;
    const [hue, saturation, lightness] = match
        .slice(1, 4)
        .map((group) => Number(group));
    if (![hue, saturation, lightness].every((part) => Number.isFinite(part))) {
        return null;
    }
    const h = ((hue % 360) + 360) % 360;
    const s = Math.min(100, Math.max(0, saturation)) / 100;
    const l = Math.min(100, Math.max(0, lightness)) / 100;
    const channel = (n) => {
        const k = (n + h / 30) % 12;
        const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        return Math.round(c * 255)
            .toString(16)
            .padStart(2, '0');
    };
    return `#${channel(0)}${channel(8)}${channel(4)}`;
}
/** Returns the WCAG relative luminance of "#rrggbb": 0 for black, 1 for white. */
function relativeLuminance(hex) {
    const [red, green, blue] = rgbChannels(hex).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
/** Whether text laid over this color has to be dark (luminance above 0.55). */
function isLightColor(hex) {
    return relativeLuminance(hex) > 0.55;
}
let currentSettings = DEFAULT_SETTINGS;
/** Returns the sanitized settings the live toast renders with. */
function getCurrentSettings() {
    return currentSettings;
}
/** Replaces the settings the live toast renders with; pass sanitized values. */
function setCurrentSettings(next) {
    currentSettings = next;
    muteSteamSound(next.sound !== 'default');
}

/** Returns the box-shadow of one art pixel at (x, y). */
function pixel(x, y, color, scale = 2) {
    const half = scale / 2;
    return `${x * scale + half}px ${y * scale + half}px 0 ${half}px ${color}`;
}
/**
 * Converts ASCII art into box-shadows: each character is looked up in
 * `palette`, and characters missing from it stay transparent.
 */
function rowsSprite(rows, palette, { left = 0, top = 0, scale = 2 } = {}) {
    const out = [];
    rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            const color = palette[row[x]];
            if (color)
                out.push(pixel(x + left, y + top, color, scale));
        }
    });
    return out;
}
/** Returns a size x size block of art pixels colored by `colorAt`. */
function gridSprite(size, colorAt, { from = 0, scale = 2 } = {}) {
    const out = [];
    for (let y = from; y < from + size; y++) {
        for (let x = from; x < from + size; x++) {
            const color = colorAt(x, y);
            if (color)
                out.push(pixel(x, y, color, scale));
        }
    }
    return out.join(', ');
}
/**
 * Returns the clip-path of a flat shape given as a [top, bottom) span per 1px
 * column. Every edge sits on whole pixels, so a solid span clipped with it
 * paints as crisp as the same shape in box-shadows, at a fraction of the CSS.
 */
function columnClip(columns) {
    const length = (n) => (n === 0 ? '0' : `${n}px`);
    // Merges runs of equal height into one edge each: [x0, x1, y].
    const edgesOf = (side) => {
        const edges = [];
        for (let x = 0; x < columns.length; x++) {
            const last = edges[edges.length - 1];
            if (last && last[2] === columns[x][side]) {
                last[1] = x + 1;
            }
            else {
                edges.push([x, x + 1, columns[x][side]]);
            }
        }
        return edges;
    };
    const top = edgesOf(0).flatMap(([x0, x1, y]) => [
        `${length(x0)} ${length(y)}`,
        `${length(x1)} ${length(y)}`,
    ]);
    const bottom = edgesOf(1)
        .reverse()
        .flatMap(([x0, x1, y]) => [
        `${length(x1)} ${length(y)}`,
        `${length(x0)} ${length(y)}`,
    ]);
    return `polygon(${[...top, ...bottom].join(', ')})`;
}
/**
 * Returns a round sprite centred on a size x size grid, its edge 0.2 art px
 * beyond the outermost pixel centres.
 */
function discSprite(size, options) {
    const centre = (size - 1) / 2;
    return gridSprite(size, (x, y) => {
        const distance = Math.hypot(x - centre, y - centre);
        if (distance > centre + 0.2)
            return null;
        const isSpot = options.spots?.some(([sx, sy]) => sx === x && sy === y);
        if (options.spotColor && isSpot)
            return options.spotColor;
        if (distance > options.rimFrom)
            return options.rim;
        if (options.highlightColor && options.highlight?.(x, y)) {
            return options.highlightColor;
        }
        return options.body;
    });
}
/**
 * Rasterizes straight limbs into `put`, shading each one lit top, middle,
 * underside (a single row uses the middle).
 */
function drawLimbs(limbs, put, shades) {
    const [lit, middle, underside] = shades;
    for (const [x0, y0, x1, y1, thickness] of limbs) {
        const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let i = 0; i <= steps; i++) {
            const x = Math.round(x0 + ((x1 - x0) * i) / steps);
            const y = Math.round(y0 + ((y1 - y0) * i) / steps - thickness / 2);
            for (let row = 0; row < thickness; row++) {
                let color = middle;
                if (thickness > 1 && row === 0)
                    color = lit;
                if (thickness > 1 && row === thickness - 1)
                    color = underside;
                put(x, y + row, color);
            }
        }
    }
}
/**
 * Joins three copies of a drifting layer, 146 art px (292 CSS px) apart, so
 * translating by -292px loops seamlessly on toasts and Quick Access previews
 * up to 584px wide.
 */
function looped(build) {
    return [...build(0), ...build(146), ...build(292)].join(', ');
}
/**
 * Returns a seeded (mulberry32) random number generator, so every toast draws
 * exactly the same branches, petals and leaves.
 */
function seeded(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
// Pixel skies are four 20px bands like a 16-bit gradient, from --ac-px-b0
// (Secondary) at the top to --ac-px-b3 (Primary). Without color-mix() (older
// Steam clients) the middle bands snap to the nearer end.
const SUPPORTS_COLOR_MIX = typeof CSS === 'undefined' ||
    CSS.supports('color', 'color-mix(in srgb, red 50%, blue)');
const BAND_1 = SUPPORTS_COLOR_MIX
    ? 'color-mix(in srgb, var(--ac-primary) 33%, var(--ac-secondary))'
    : 'var(--ac-secondary)';
const BAND_2 = SUPPORTS_COLOR_MIX
    ? 'color-mix(in srgb, var(--ac-primary) 67%, var(--ac-secondary))'
    : 'var(--ac-primary)';
/** The four-band sky background of the banded pixel themes. */
const BANDS = 'linear-gradient(180deg, var(--ac-px-b0) 0 20px, var(--ac-px-b1) 20px 40px, var(--ac-px-b2) 40px 60px, var(--ac-px-b3) 60px)';
/** 2px checkerboard strips over each band edge. */
const DITHER = [0, 1, 2]
    .map((i) => `
      .ac-px-decoration .ac-px-d${i + 1} {
        top: ${18 + i * 20}px;
        background: repeating-conic-gradient(var(--ac-px-b${i}) 0 25%, var(--ac-px-b${i + 1}) 0 50%) 0 0 / 4px 4px;
      }`)
    .join('\n');
/** Band variables, sprite boxes and keyframes shared by every pixel theme. */
const PIXEL_BASE = `
  .ac-toast {
    --ac-px-b0: var(--ac-secondary);
    --ac-px-b1: ${BAND_1};
    --ac-px-b2: ${BAND_2};
    --ac-px-b3: var(--ac-primary);
  }
  .ac-px-decoration span { position: absolute; display: block; }
  .ac-px-dither { left: 0; right: 0; height: 4px; }
  .ac-px-spr { width: 0; height: 0; }
  @keyframes ac-px-flap { 0% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes ac-px-blink {
    0%  { opacity: 1; }
    30% { opacity: 0.35; }
    45% { opacity: 1; }
    70% { opacity: 0.5; }
    85% { opacity: 1; }
  }
  @keyframes ac-px-drift { to { translate: -292px 0; } }`;
/** Builds sprites that flutter while falling in hard steps. */
function fallingSprites(options) {
    const random = seeded(options.seed);
    const [x0, x1] = options.area.x;
    const [y0, y1] = options.area.y;
    const [minCycle, maxCycle] = options.cycle;
    const sprites = Array.from({ length: options.count }, () => {
        const cycle = Math.round((minCycle + random() * (maxCycle - minCycle)) * 10) / 10;
        return {
            cycle,
            x: Math.round(random() * ((x1 - x0) / 2)) * 2 + x0,
            y: Math.round(random() * ((y1 - y0) / 2)) * 2 + y0,
            delay: -Math.round(random() * cycle * 10) / 10,
        };
    });
    const name = options.name;
    const frameRules = options.palettes.map((palette, p) => {
        const [a, b] = options.frames.map((rows) => rowsSprite(rows, palette).join(', '));
        return `
      .ac-px-${name}-a${p} {
        box-shadow: ${a};
        animation: ac-px-flap 0.6s steps(1, end) infinite;
      }
      .ac-px-${name}-b${p} {
        box-shadow: ${b};
        animation: ac-px-flap 0.6s steps(1, end) -0.3s infinite;
      }`;
    });
    const startRules = sprites.map((sprite, i) => `
      .ac-decoration .ac-px-${name}-${i + 1} {
        left: ${sprite.x}px;
        top: ${sprite.y}px;
        --ac-pt-t: ${sprite.cycle}s;
        --ac-pt-d: ${sprite.delay}s;
      }`);
    const [stepX, stepY] = options.vector;
    return {
        markup: () => [...sprites.keys()].map((i) => {
            const p = i % options.palettes.length;
            return (SP_JSX.jsxs("span", { className: `ac-px-${name} ac-px-${name}-${i + 1}`, children: [SP_JSX.jsx("span", { className: `ac-px-spr ac-px-${name}-a${p}` }), SP_JSX.jsx("span", { className: `ac-px-spr ac-px-${name}-b${p}` })] }, i));
        }),
        always: `
      .ac-px-${name} { opacity: 0; }
      ${frameRules.join('\n')}
      ${startRules.join('\n')}`,
        full: `
      .ac-px-${name} {
        animation: ac-px-fall-${name} var(--ac-pt-t) steps(${options.steps}, end) var(--ac-pt-d) infinite;
      }
      @keyframes ac-px-fall-${name} {
        0%   { translate: 0 0; opacity: 0; }
        6%   { opacity: 1; }
        85%  { opacity: 1; }
        100% {
          translate: ${stepX * options.steps}px ${stepY * options.steps}px;
          opacity: 0;
        }
      }`,
    };
}
/**
 * Builds stars that pulse from a core pixel to a plus with one-pixel arms and
 * two-pixel tips.
 */
function twinkleStars(points, { scale = 2, tones = ['#fff', '#c9d3ff', '#7f8cc9'] } = {}) {
    const [core, arm, tip] = tones;
    const plus = (distance, color) => `${distance}px 0 ${color}, -${distance}px 0 ${color}, 0 ${distance}px ${color}, 0 -${distance}px ${color}`;
    const placed = points.map(([x, y, cycle, phase], i) => `
      .ac-decoration .ac-px-tw-${i + 1} {
        left: ${x}px;
        top: ${y}px;
        --ac-tw-t: ${cycle}s;
        --ac-tw-d: ${phase}s;
      }`);
    const timing = 'var(--ac-tw-t) steps(1, end) var(--ac-tw-d) infinite';
    const css = `
      .ac-px-tw {
        width: ${scale}px;
        height: ${scale}px;
        background: ${core};
        animation: ac-px-core ${timing};
      }
      .ac-px-tw::before, .ac-px-tw::after {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        width: ${scale}px;
        height: ${scale}px;
        opacity: 0;
      }
      .ac-px-tw::before {
        box-shadow: ${plus(scale, arm)};
        animation: ac-px-arms ${timing};
      }
      .ac-px-tw::after {
        box-shadow: ${plus(scale * 2, tip)};
        animation: ac-px-tips ${timing};
      }
      @keyframes ac-px-core {
        0%  { opacity: 0.55; }
        45% { opacity: 1; }
        75% { opacity: 0.8; }
      }
      @keyframes ac-px-arms {
        0%  { opacity: 0; }
        45% { opacity: 1; }
        72% { opacity: 0; }
      }
      @keyframes ac-px-tips {
        0%  { opacity: 0; }
        52% { opacity: 1; }
        62% { opacity: 0; }
      }
      ${placed.join('\n')}`;
    return {
        markup: () => [...points.keys()].map((i) => (SP_JSX.jsx("span", { className: `ac-px-tw ac-px-tw-${i + 1}` }, i))),
        css,
    };
}

const SCALE = 1;
// CSS px: the decoration area of a toast.
const WIDTH = 288;
// CSS px: the decoration area of a card with a two-line description.
const HEIGHT = 81;
// The compact toast window fits the text 4px higher.
const COMPACT_SHIFT = 4;
const INK = '#0e0c16';
const LIT = '#1c1a2e';
// Moonlight catching the edge of a branch.
const RIM = '#3a3466';
const WHITE = '#f4f2ff';
const LAVENDER = '#b8a5e6';
const MOON_BODY = '#f6edc2';
const MOON_RIM = '#ebddaa';
const CRATER = '#e9bc8c';
// Light text gets a dark halo to read over the moon, ghosts and stones; the
// title and description stop short of the moon, and the % pill (which sits on
// it) gets a backdrop.
const TEXT$3 = `
  .ac-title, .ac-desc, .ac-eyebrow, .ac-progress {
    text-shadow: 0 0 2px ${INK}, 0 0 5px rgb(14 12 22 / 0.95), 0 1px 0 ${INK};
  }
  .ac-decoration-space .ac-title,
  .ac-decoration-space .ac-desc,
  .ac-decoration-space .ac-progress { padding-right: 52px; }
  .ac-toast .ac-pill { padding: 1px 6px; background: rgb(14 12 22 / 0.7); }`;
// Stepped vignette, brightest behind the moon, from the band variables so
// Primary and Secondary recolor it.
const VIGNETTE = 'radial-gradient(ellipse 90% 150% at 62% 38%, var(--ac-px-b3) 0 45%, var(--ac-px-b2) 45% 70%, var(--ac-px-b1) 70% 90%, var(--ac-px-b0) 90%)';
function dot(x, y, color) {
    return pixel(x, y, color, SCALE);
}
function art(rows, palette, left = 0, top = 0) {
    return rowsSprite(rows, palette, { left, top, scale: SCALE }).join(', ');
}
/** Returns the box-shadow list for a map of "x,y" art cells to colors. */
function cellSprite(cells) {
    return [...cells]
        .map(([key, color]) => {
        const [x, y] = key.split(',').map((part) => Number(part));
        return dot(x, y, color);
    })
        .join(', ');
}
// Moon: a rim disc under a body disc, with seeded blotchy craters and a faint
// halo ring.
const MOON_SIZE = 52;
// From the right edge.
const MOON_INSET = 6;
const MOON_CENTRE = (MOON_SIZE - 1) / 2;
const MOON_AT = { x: WIDTH - MOON_INSET - MOON_SIZE, y: 4 };
// Sprites are 0px wide, so anchoring one to the right edge puts its left edge
// at the moon's.
const MOON_RIGHT = WIDTH - MOON_AT.x;
const MOON_EDGE = MOON_CENTRE + 0.2;
// The 2px beyond it are rim.
const MOON_BODY_REACH = 23.6;
const CRATER_REACH = 21.5;
/**
 * Returns [top, bottom) of the pixels within `reach` of the moon's centre, per
 * column; columns outside collapse to its middle.
 */
function discColumns(reach) {
    const line = [...Array.from({ length: MOON_SIZE }).keys()];
    return line.map((x) => {
        const inside = line.filter((y) => Math.hypot(x - MOON_CENTRE, y - MOON_CENTRE) <= reach);
        if (inside.length === 0)
            return [MOON_SIZE / 2, MOON_SIZE / 2];
        return [inside[0], inside[inside.length - 1] + 1];
    });
}
// Each crater grows from a seed by adding random neighbours, so it comes out
// as a rough blob of 10-25 pixels.
function drawCraters() {
    const random = seeded(5);
    const within = (x, y, reach) => Math.hypot(x - MOON_CENTRE, y - MOON_CENTRE) <= reach;
    const seeds = [];
    for (let tries = 0; seeds.length < 8 && tries < 800; tries++) {
        const x = Math.floor(random() * MOON_SIZE);
        const y = Math.floor(random() * MOON_SIZE);
        const apart = seeds.every(([sx, sy]) => Math.hypot(sx - x, sy - y) >= 12);
        if (within(x, y, 18) && apart)
            seeds.push([x, y]);
    }
    const cells = new Map();
    for (const [sx, sy] of seeds) {
        const blob = [[sx, sy]];
        const size = 10 + Math.floor(random() * 16);
        cells.set(`${sx},${sy}`, CRATER);
        for (let guard = 0; blob.length < size && guard < 400; guard++) {
            const [x, y] = blob[Math.floor(random() * blob.length)];
            const direction = Math.floor(random() * 4);
            const nextX = x + [1, -1, 0, 0][direction];
            const nextY = y + [0, 0, 1, -1][direction];
            const taken = cells.has(`${nextX},${nextY}`);
            if (!within(nextX, nextY, CRATER_REACH) || taken)
                continue;
            cells.set(`${nextX},${nextY}`, CRATER);
            blob.push([nextX, nextY]);
        }
    }
    return cellSprite(cells);
}
// A ring just outside the disc, 2px thick; it starts at -3 to reach the art
// pixels above and left of the anchor.
const HALO = gridSprite(MOON_SIZE + 6, (x, y) => {
    const distance = Math.hypot(x - MOON_CENTRE, y - MOON_CENTRE);
    const onRing = distance >= MOON_EDGE + 0.5 && distance <= MOON_EDGE + 2.5;
    return onRing ? MOON_BODY : null;
}, { from: -3, scale: SCALE });
// Bare tree growing up the left edge, its crown reaching about a third of the
// way across. A flat limb is as thick as it is tall, a steep one as it is
// wide.
const TREE_LIMBS = [
    [1, 41, 2, 22, 5],
    [2, 22, 3, 8, 4],
    [2, 8, 16, 4, 4],
    [16, 4, 30, 5, 3],
    [30, 5, 44, 3, 2],
    [44, 3, 56, 6, 1],
    [56, 6, 64, 4, 1],
    [16, 4, 22, 12, 2],
    [22, 12, 30, 16, 1],
    [30, 5, 34, 11, 1],
    [44, 3, 48, 0, 1],
    [8, 6, 11, 0, 1],
    [24, 4, 27, 0, 1],
    [38, 4, 41, 9, 1],
    [50, 5, 54, 10, 1],
];
function drawTree() {
    const cells = new Map();
    const put = (x, y, color) => {
        if (x >= 0 && y >= 0)
            cells.set(`${x},${y}`, color);
    };
    for (const limb of TREE_LIMBS) {
        const [x0, y0, x1, y1, thickness] = limb;
        // drawLimbs stacks the thickness vertically; a steep limb is drawn with the
        // axes swapped, lit on the moon side.
        if (Math.abs(y1 - y0) > Math.abs(x1 - x0)) {
            const swapped = [y0, x0, y1, x1, thickness];
            const putSwapped = (y, x, color) => {
                put(x, y, color);
            };
            drawLimbs([swapped], putSwapped, [INK, INK, RIM]);
        }
        else {
            drawLimbs([limb], put, [RIM, INK, INK]);
        }
    }
    return { sprite: cellSprite(cells), cells: new Set(cells.keys()) };
}
const TREE = drawTree();
// Ghosts: the same 18x16 sprite three times; the middle one sits behind the
// text, one is mirrored.
const GHOST = art([
    '......WWWW........',
    '.....WWWWWWL......',
    '....WWWWWWWL......',
    '....WWEWWEWL......',
    '....WWEWWEWL......',
    '.W..WWWWWWWL......',
    '.WWWWWWWWWLLL.....',
    '..WWWWWWWWLLL.....',
    '...WWWWWWWLL......',
    '...WWWWWWWLL......',
    '...WWWWWWWLL......',
    '...WWWWWWWLLL.....',
    '....WWWWWWLLL.....',
    '.....WWWWWLLLL....',
    '......WWWWWLLLLL..',
    '........WWLLLLLLLL.',
], { W: WHITE, L: LAVENDER, E: INK });
const GHOST_WIDTH = 18;
const GHOST_HEIGHT = 16;
const GHOSTS = [
    { x: 140, y: 41, anchor: 'left', opacity: 0.75, bob: [3.4, -0.7] },
    { x: 264, y: 53, anchor: 'right', fromBottom: true, bob: [2.8, -1.9] },
    { x: 204, y: 4, anchor: 'right', mirror: true, bob: [2.4, -1.1] },
];
// Sparkles and stars: seeded, clear of the moon, the tree and the ghosts; half
// of them blink in two alternating groups.
const SPARKLE_AT = [
    [92, 3, 3.2, -1.1],
    [134, 6, 2.7, -0.3],
    [172, 3, 3.9, -2.4],
    [220, 46, 3.4, -1.7],
    [60, 4, 2.9, -0.8],
];
const SPARKLES$1 = twinkleStars(SPARKLE_AT, {
    scale: SCALE,
    tones: [WHITE, LAVENDER, '#7d6db3'],
});
function drawStars() {
    const random = seeded(11);
    const stars = [];
    const moonX = MOON_AT.x + MOON_CENTRE;
    const moonY = MOON_AT.y + MOON_CENTRE;
    const nearTree = (x, y) => [-2, -1, 0, 1, 2].some((dx) => [-2, -1, 0, 1, 2].some((dy) => TREE.cells.has(`${x + dx},${y + dy}`)));
    const behindGhost = (x, y) => GHOSTS.some((ghost) => x >= ghost.x - 1 &&
        x <= ghost.x + GHOST_WIDTH &&
        y >= ghost.y - 1 &&
        y <= ghost.y + GHOST_HEIGHT);
    const nearSparkle = (x, y) => SPARKLE_AT.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < 8);
    for (let tries = 0; stars.length < 40 && tries < 4000; tries++) {
        const x = 2 + Math.floor(random() * (WIDTH - 4));
        const y = 2 + Math.floor(random() * 44);
        const color = random() < 0.65 ? WHITE : LAVENDER;
        if (Math.hypot(x - moonX, y - moonY) < MOON_EDGE + 6)
            continue;
        if (nearTree(x, y) || behindGhost(x, y) || nearSparkle(x, y))
            continue;
        if (stars.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < 9))
            continue;
        stars.push([x, y, color]);
    }
    // Odd stars stay still; the even ones alternate between two blink groups.
    const still = [];
    const blinkA = [];
    const blinkB = [];
    stars.forEach(([x, y, color], i) => {
        if (i % 2 === 1) {
            still.push(dot(x, y, color));
        }
        else if (i % 4 === 0) {
            blinkA.push(dot(x, y, color));
        }
        else {
            blinkB.push(dot(x, y, color));
        }
    });
    return {
        still: still.join(', '),
        blinkA: blinkA.join(', '),
        blinkB: blinkB.join(', '),
    };
}
const STARS$1 = drawStars();
// Bats: two wing frames each, toggled with the shared flap; each crosses the
// sky in 1px steps.
const BAT = { '#': INK };
const BAT_BIG = [
    [
        '.....#.#.....',
        '#...#####...#',
        '##.#######.##',
        '#############',
        '.##.#####.##.',
        '..#..#.#..#..',
    ],
    [
        '.....#.#.....',
        '....#####....',
        '...#######...',
        '.###########.',
        '##.#######.##',
        '#....#.#....#',
    ],
].map((rows) => art(rows, BAT));
const BAT_SMALL = [
    ['..#.#..', '#.###.#', '#######', '.#.#.#.'],
    ['..#.#..', '..###..', '.#####.', '##.#.##'],
].map((rows) => art(rows, BAT));
const BATS = [
    { size: 'big', x: 180, y: 12, direction: -1, cross: [14, -3], flap: 0 },
    { size: 'big', x: 110, y: 22, direction: 1, cross: [17, -9], flap: -0.15 },
    { size: 'big', x: 236, y: 28, direction: -1, cross: [11, -5], flap: -0.3 },
    { size: 'small', x: 60, y: 8, direction: 1, cross: [20, -13], flap: -0.05 },
];
const BAT_WIDTH = { big: 13, small: 7 };
const BAT_HEIGHT = { big: 6, small: 4 };
// Grass: 1-5px blades. The ground is one solid span, the lighter blade tips
// are box-shadows.
const GRASS_ROWS = 5;
function drawGrass() {
    const random = seeded(41);
    const heights = Array.from({ length: WIDTH }, () => 1 + Math.floor(random() * GRASS_ROWS));
    const tips = heights
        .flatMap((height, x) => height >= 3 ? [dot(x, GRASS_ROWS - height, LIT)] : [])
        .join(', ');
    return { heights, tips };
}
const GRASS = drawGrass();
const GRASS_CLIP = columnClip(GRASS.heights.map((height) => [
    GRASS_ROWS - height,
    GRASS_ROWS,
]));
// Skyline: jagged spruces as one solid span clipped to their outline.
const SKYLINE_ROWS = 28;
const TREE_COUNT = 20;
// Trees wrap around the edges, so the repeats shown in wide previews meet
// without a seam.
function drawSkyline() {
    const random = seeded(23);
    const top = Array.from({ length: WIDTH }, () => SKYLINE_ROWS);
    for (let i = 0; i < TREE_COUNT; i++) {
        const x = Math.round(6 + (i * WIDTH) / TREE_COUNT) + Math.floor(random() * 5) - 2;
        const height = 14 + Math.floor(random() * 15);
        for (let row = 0; row < height; row++) {
            const halfWidth = Math.max(0, Math.floor(row / 2) - (row % 3 === 2 ? 1 : 0));
            for (let dx = -halfWidth; dx <= halfWidth; dx++) {
                const column = (x + dx + WIDTH) % WIDTH;
                top[column] = Math.min(top[column], SKYLINE_ROWS - height + row);
            }
        }
    }
    return columnClip(top.map((t) => [t, SKYLINE_ROWS]));
}
const SKYLINE = drawSkyline();
// Tombstones: carved by hand, lit on the left. All bottom-anchored; the grass
// covers their bases.
const STONE = {
    H: '#eee8e4',
    M: '#7e7490',
    S: '#5a4e72',
    D: '#3a2f55',
    K: '#2a2042',
};
// prettier-ignore
const STONES = {
    1: [
        '.....HHH.....', '....HSSSH....', '...HSSSSSH...', '..HSSSSSSSH..',
        '.HSSSSSSSSSD.', 'HMSSSSSSSSSSD', 'HMSSSSSSSSSSD', 'HMSSSSMSSSSSD',
        'HMSSSKMKSSSSD', 'HMSSMMMMMSSSD', 'HMSSSKMKSSSSD', 'HMSSSSMSSSSSD',
        'HMSSSSMSSSSSD', 'HMSSSSSSSSSSD', 'HMSSSSSSSSSSD', 'HMSSSSSSSSSSD',
        'HMSSSSSSSSSSD',
    ],
    2: [
        '....MH.....', '...MMHH....', '..MMKKHH...', '..MMKKHH...', '...MMHH....',
        '....MH.....', '....MH.....', '....MH.....', '..DSSSSSH..', '.DSSSSSSSH.',
        'DDSSSSSSSSH', 'DDSKKKKKSSH', 'DDSSSSSSSSH', 'DDSKKSSKKSH', 'DDSSSSSSSSH',
        'DDSKKKSKKSH', 'DDSSSSSSSSH', 'DDSSKKKSSSH', 'DDSSSSSSSSH', 'DDSKKSKKSSH',
        'DDSSSSSSSSH',
    ],
    3: [
        '..HHHH..', '.DSSSSD.', 'DSSSSSSD', 'DSSSSSSD', 'DSKKKKSD',
        'DSSSSSSD', 'DSKKKSSD', 'DSSSSSSD', 'DSSSSSSD', 'DSSSSSSD',
    ],
    4: [
        '...SS....', '..SSSS...', '.HSSSSS..', '.HSSSSSD.', 'DSSSKSSSD',
        'DSSSSSSSD', 'DSSKSKSSD', 'DSSKSKSSD', 'DSSKSKSSD', 'DSSSSSSSD',
        'DSSSKSSSD', 'DSSSSSSSD',
    ],
    5: [
        '....HMM....', '....HMM....', '..HHMMMMM..', '..HMMMMMD..', '....HMM....',
        '....HMM....', '....HMM....', '...HMMMMD..', '..HMMMMMMD.', 'HHMMMMMMMMD',
        '.DDDDDDDDD.', '.HSSSSSSSD.', '.HSKKKSSSD.', '.HSSSSSSSD.', '.HSKKKSKKD.',
        '.HSSSSSSSD.', '.HSKKKSKKD.', '.HSSSSSSSD.', '.HSKKKKKSD.', '.HSSSSSSSD.',
        '.HSKKSKSSD.', '.HSSSSSSSD.',
    ],
    6: [
        '....HM....', '....HM....', '..HHHMMM..', '..MMMMMM..', '....HM....',
        '....HM....', 'HHHHHHHHHH', 'HSSSSSSSSD', 'HSKKKKKKSD', 'HSSSSSSSSD',
        'HSKKSKKKSD', 'HSSSSSSSSD', 'HSKKKKKSSD', 'HSSSSSSSSD', 'HSKKSKKKSD',
        'HSSSSSSSSD', 'HSSKKKKSSD', 'HSSSSSSSSD', 'HSSSSSSSSD',
    ],
};
const STONE_ROWS = 22;
const BACK_RAISE = 3;
// x and design: the small rounded stones stand a little further back.
const FRONT_STONES = [
    [4, 1],
    [50, 5],
    [104, 4],
    [150, 6],
    [244, 2],
];
const BACK_STONES = [
    [30, 3],
    [80, 3],
    [128, 3],
];
// Cells the grass hides anyway are left out of the sprite.
function stoneSprite(stones, raise) {
    return stones
        .map(([x, design]) => {
        const rows = STONES[design];
        const visible = rows.map((row, rowIndex) => {
            const depth = rows.length - 1 - rowIndex + raise;
            return [...row]
                .map((cell, column) => GRASS.heights[x + column] > depth ? '.' : cell)
                .join('');
        });
        return art(visible, STONE, x, STONE_ROWS - rows.length);
    })
        .join(', ');
}
// The Quick Access preview is wider than a toast: stars and ground repeat every
// 288px there and stay hidden elsewhere. Solid spans carry only their own
// class; the rest are 0px sprites.
const FILLS = new Set(['skyline', 'grass']);
function repeatedClass(name, copy) {
    const sprite = FILLS.has(name) ? '' : 'ac-px-spr ';
    const extra = copy > 0 ? ` ac-px-more ac-px-more-${copy}` : '';
    return `${sprite}ac-px-${name}${extra}`;
}
function Repeated({ names }) {
    return (SP_JSX.jsx(SP_JSX.Fragment, { children: [0, 1, 2].flatMap((copy) => names.map((name) => (SP_JSX.jsx("span", { className: repeatedClass(name, copy) }, `${copy}${name}`)))) }));
}
function Layer$3() {
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [['t', 'b', 'l', 'r'].map((side) => (SP_JSX.jsx("span", { className: `ac-px-edge ac-px-edge-${side}` }, side))), SP_JSX.jsx(Repeated, { names: ['stars', 'stars-a', 'stars-b'] }), SPARKLES$1.markup(), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-halo" }), SP_JSX.jsx("span", { className: "ac-px-moon-rim" }), SP_JSX.jsx("span", { className: "ac-px-moon-body" }), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-craters" }), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-tree" }), SP_JSX.jsx(Repeated, { names: ['skyline'] }), GHOSTS.map(({ mirror }, i) => {
                const body = SP_JSX.jsx("span", { className: "ac-px-spr ac-px-ghost-art" });
                return (SP_JSX.jsx("span", { className: `ac-px-ghost ac-px-ghost-${i + 1}`, children: mirror ? SP_JSX.jsx("span", { className: "ac-px-flip", children: body }) : body }, i));
            }), BATS.map(({ size, direction }, i) => {
                const wings = (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx("span", { className: "ac-px-spr ac-px-bat-a" }), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-bat-b" })] }));
                return (SP_JSX.jsx("span", { className: `ac-px-bat ac-px-bat-${i + 1} ac-px-bat-${size}`, children: direction > 0 ? (SP_JSX.jsx("span", { className: "ac-px-flip", children: wings })) : (wings) }, i));
            }), SP_JSX.jsx(Repeated, { names: ['stones-back', 'stones', 'grass', 'tips'] })] }));
}
// Under Reduce Motion the bats stay parked and flap and the stars blink and
// twinkle (opacity only); the ghosts bobbing and the bats crossing are full
// motion.
function css$3() {
    const ghostAt = GHOSTS.map(({ x, y, anchor, fromBottom, opacity }, i) => {
        const side = anchor === 'left'
            ? `left: ${x}px`
            : `right: ${WIDTH - x - GHOST_WIDTH}px`;
        const vertical = fromBottom
            ? `bottom: ${HEIGHT - y - GHOST_HEIGHT}px`
            : `top: ${y}px`;
        const fade = opacity ? ` opacity: ${opacity};` : '';
        return `.ac-px-ghost-${i + 1} { ${side}; ${vertical};${fade} }`;
    });
    const batAt = BATS.map(({ x, y, flap }, i) => `.ac-px-bat-${i + 1} { left: ${x}px; top: ${y}px; --ac-px-d: ${flap}s; }`);
    const bobs = GHOSTS.map(({ bob }, i) => `
      .ac-px-ghost-${i + 1} {
        animation: ac-px-bob ${bob[0]}s steps(1, end) ${bob[1]}s infinite;
      }`);
    // A straight line from just off one edge to just off the other, one step per
    // pixel.
    const crossings = BATS.map(({ size, x, direction, cross }, i) => {
        const width = BAT_WIDTH[size];
        const [from, to] = direction < 0 ? [WIDTH - x, -width - x] : [-width - x, WIDTH - x];
        return `
      @keyframes ac-px-cross-${i + 1} {
        from { translate: ${from}px 0; }
        to   { translate: ${to}px 0; }
      }
      .ac-px-bat-${i + 1} {
        animation: ac-px-cross-${i + 1} ${cross[0]}s steps(${WIDTH + width}, end) ${cross[1]}s infinite;
      }`;
    });
    const sprites = '.ac-px-stars, .ac-px-stars-a, .ac-px-stars-b, .ac-px-tree, ' +
        '.ac-px-skyline, .ac-px-stones-back, .ac-px-stones, .ac-px-grass, ' +
        '.ac-px-tips';
    return {
        always: `
      .ac-px-edge {
        background: repeating-conic-gradient(var(--ac-px-b0) 0 25%, transparent 0 50%) 0 0 / 2px 2px;
      }
      .ac-px-edge-t, .ac-px-edge-b { left: 0; right: 0; height: 4px; }
      .ac-px-edge-l, .ac-px-edge-r { top: 0; bottom: 0; width: 4px; }
      .ac-px-edge-t { top: 0; }
      .ac-px-edge-b { bottom: 0; }
      .ac-px-edge-l { left: 0; }
      .ac-px-edge-r { right: 0; }
      ${sprites} { left: 0; }
      .ac-px-stars, .ac-px-stars-a, .ac-px-stars-b, .ac-px-tree { top: 0; }
      .ac-px-stars { box-shadow: ${STARS$1.still}; }
      .ac-px-stars-a {
        box-shadow: ${STARS$1.blinkA};
        animation: ac-px-blink 2.8s steps(1, end) infinite;
      }
      .ac-px-stars-b {
        box-shadow: ${STARS$1.blinkB};
        animation: ac-px-blink 2.8s steps(1, end) -1.4s infinite;
      }
      .ac-px-more-1 { left: ${WIDTH}px; }
      .ac-px-more-2 { left: ${WIDTH * 2}px; }
      .ac-px-decoration .ac-px-more { display: none; }
      .ac-preview .ac-px-decoration .ac-px-more { display: block; }
      ${SPARKLES$1.css}
      .ac-px-halo {
        right: ${MOON_RIGHT}px;
        top: ${MOON_AT.y}px;
        box-shadow: ${HALO};
        opacity: 0.3;
      }
      .ac-px-moon-rim, .ac-px-moon-body {
        right: ${MOON_INSET}px;
        top: ${MOON_AT.y}px;
        width: ${MOON_SIZE}px;
        height: ${MOON_SIZE}px;
      }
      .ac-px-moon-rim {
        background: ${MOON_RIM};
        clip-path: ${columnClip(discColumns(MOON_EDGE))};
      }
      .ac-px-moon-body {
        background: ${MOON_BODY};
        clip-path: ${columnClip(discColumns(MOON_BODY_REACH))};
      }
      .ac-px-craters {
        right: ${MOON_RIGHT}px;
        top: ${MOON_AT.y}px;
        box-shadow: ${drawCraters()};
      }
      .ac-px-tree { box-shadow: ${TREE.sprite}; }
      .ac-px-skyline {
        bottom: 0;
        width: ${WIDTH}px;
        height: ${SKYLINE_ROWS}px;
        background: ${INK};
        clip-path: ${SKYLINE};
      }
      .ac-px-ghost { width: ${GHOST_WIDTH}px; height: ${GHOST_HEIGHT}px; }
      ${ghostAt.join('\n')}
      .ac-compact .ac-px-ghost-1 { top: ${GHOSTS[0].y - COMPACT_SHIFT}px; }
      .ac-px-ghost-art { box-shadow: ${GHOST}; }
      .ac-px-flip { scale: -1 1; }
      .ac-px-ghost .ac-px-flip {
        width: ${GHOST_WIDTH}px;
        height: ${GHOST_HEIGHT}px;
      }
      .ac-px-bat-big .ac-px-flip {
        width: ${BAT_WIDTH.big}px;
        height: ${BAT_HEIGHT.big}px;
      }
      .ac-px-bat-small .ac-px-flip {
        width: ${BAT_WIDTH.small}px;
        height: ${BAT_HEIGHT.small}px;
      }
      ${batAt.join('\n')}
      .ac-px-bat-big .ac-px-bat-a { box-shadow: ${BAT_BIG[0]}; }
      .ac-px-bat-big .ac-px-bat-b { box-shadow: ${BAT_BIG[1]}; }
      .ac-px-bat-small .ac-px-bat-a { box-shadow: ${BAT_SMALL[0]}; }
      .ac-px-bat-small .ac-px-bat-b { box-shadow: ${BAT_SMALL[1]}; }
      .ac-px-bat-a {
        animation: ac-px-flap 0.5s steps(1, end) var(--ac-px-d) infinite;
      }
      .ac-px-bat-b {
        animation: ac-px-flap 0.5s steps(1, end) calc(var(--ac-px-d) - 0.25s) infinite;
      }
      .ac-px-stones-back {
        bottom: ${STONE_ROWS + BACK_RAISE}px;
        box-shadow: ${stoneSprite(BACK_STONES, BACK_RAISE)};
      }
      .ac-px-stones {
        bottom: ${STONE_ROWS}px;
        box-shadow: ${stoneSprite(FRONT_STONES, /* raise= */ 0)};
      }
      .ac-compact .ac-px-stones-back, .ac-compact .ac-px-stones {
        translate: 0 ${COMPACT_SHIFT}px;
      }
      .ac-px-grass {
        bottom: 0;
        width: ${WIDTH}px;
        height: ${GRASS_ROWS}px;
        background: ${INK};
        clip-path: ${GRASS_CLIP};
      }
      .ac-px-tips { bottom: ${GRASS_ROWS}px; box-shadow: ${GRASS.tips}; }
      ${TEXT$3}`,
        full: `
      @keyframes ac-px-bob { 50% { translate: 0 -1px; } }
      ${bobs.join('\n')}
      ${crossings.join('\n')}`,
        reduced: '',
    };
}
/** Halloween graveyard theme. */
const halloween = {
    Layer: Layer$3,
    css: css$3,
    background: VIGNETTE,
    pixel: 'custom',
};

// A hard 1px outline keeps text readable over white pixel clouds.
const TEXT$2 = `
  .ac-title, .ac-desc {
    text-shadow: 1px 0 0 #2b5f8f, -1px 0 0 #2b5f8f, 0 1px 0 #2b5f8f, 0 -1px 0 #2b5f8f, 0 1px 3px rgb(25 60 90 / 0.6);
  }`;
const SUN = discSprite(/* size= */ 13, {
    body: '#ffd84a',
    rim: '#f0a81c',
    rimFrom: 5.1,
    highlight: (x, y) => (x - 4) ** 2 + (y - 4) ** 2 < 4,
    highlightColor: '#fff2a6',
});
function rays(positions) {
    return positions.map(([x, y]) => pixel(x, y, '#ffe27a')).join(', ');
}
const SUN_RAYS_A = rays([
    [6, -2],
    [6, 14],
    [-2, 6],
    [14, 6],
]);
const SUN_RAYS_B = rays([
    [-1, -1],
    [13, -1],
    [-1, 13],
    [13, 13],
]);
const CLOUD_BIG = [
    '.......WWWW...........',
    '.....WWWWWWWW.........',
    '....WWWWWWWWWW.WWWW...',
    '..WWWWWWWWWWWWWWWWWWW.',
    '.WWWWWWWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWW',
    'SWWWWWWWWWWWWWWWWWWWWS',
    '.SSSSSSSSSSSSSSSSSSSS.',
];
const CLOUD_SMALL = [
    '....WWWW.....',
    '..WWWWWWWWW..',
    '.WWWWWWWWWWW.',
    'WWWWWWWWWWWWW',
    '.SSSSSSSSSSS.',
];
const CLOUD_FRONT = { W: '#ffffff', S: '#cfe6f7' };
const CLOUD_BACK = { W: '#dceefb', S: '#b9d8f0' };
const FRONT_CLOUDS = looped((dx) => [
    ...rowsSprite(CLOUD_BIG, CLOUD_FRONT, { left: 4 + dx }),
    ...rowsSprite(CLOUD_SMALL, CLOUD_FRONT, { left: 60 + dx, top: 3 }),
    ...rowsSprite(CLOUD_BIG, CLOUD_FRONT, { left: 98 + dx }),
]);
const BACK_CLOUDS = looped((dx) => [
    ...rowsSprite(CLOUD_SMALL, CLOUD_BACK, { left: 26 + dx }),
    ...rowsSprite(CLOUD_SMALL, CLOUD_BACK, { left: 84 + dx, top: 1 }),
    ...rowsSprite(CLOUD_SMALL, CLOUD_BACK, { left: 126 + dx }),
]);
const BIRD = { '#': '#2b5f8f' };
const BIRDS_UP = rowsSprite(['#...#..', '.#.#...', '..#....', '.......', '..#...#', '...#.#.', '....#..'], BIRD).join(', ');
const BIRDS_FLAT = rowsSprite(['.......', '##.##..', '..#....', '.......', '.......', '..##.##', '....#..'], BIRD).join(', ');
function Layer$2() {
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx("span", { className: "ac-px-spr ac-px-clouds-back" }), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-clouds-front" }), SP_JSX.jsxs("span", { className: "ac-px-birds", children: [SP_JSX.jsx("span", { className: "ac-px-spr ac-px-birds-up" }), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-birds-flat" })] }), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-sun" }), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-rays-a" }), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-rays-b" })] }));
}
function css$2() {
    return {
        always: `
      .ac-compact .ac-px-sun,
      .ac-compact .ac-px-rays-a,
      .ac-compact .ac-px-rays-b { top: 22px; }
      .ac-px-clouds-back { left: 0; bottom: 24px; box-shadow: ${BACK_CLOUDS}; }
      .ac-px-clouds-front { left: 0; bottom: 16px; box-shadow: ${FRONT_CLOUDS}; }
      .ac-px-birds { left: 100%; top: 14px; }
      .ac-px-birds-up {
        box-shadow: ${BIRDS_UP};
        animation: ac-px-flap 0.5s steps(1, end) infinite;
      }
      .ac-px-birds-flat {
        box-shadow: ${BIRDS_FLAT};
        animation: ac-px-flap 0.5s steps(1, end) -0.25s infinite;
      }
      .ac-px-sun, .ac-px-rays-a, .ac-px-rays-b { right: 38px; top: 26px; }
      .ac-px-sun { box-shadow: ${SUN}; }
      .ac-px-rays-a {
        box-shadow: ${SUN_RAYS_A};
        animation: ac-px-flap 1.2s steps(1, end) infinite;
      }
      .ac-px-rays-b {
        box-shadow: ${SUN_RAYS_B};
        animation: ac-px-flap 1.2s steps(1, end) -0.6s infinite;
      }
      ${TEXT$2}`,
        full: `
      .ac-px-clouds-front { animation: ac-px-drift 26s steps(146, end) infinite; }
      .ac-px-clouds-back { animation: ac-px-drift 48s steps(146, end) infinite; }
      .ac-px-birds { animation: ac-px-fly 18s steps(198, end) infinite; }
      @keyframes ac-px-fly { to { translate: -396px 0; } }`,
        reduced: '',
    };
}
/** Pixel Day theme. */
const pixelDay = {
    Layer: Layer$2,
    css: css$2,
    background: BANDS,
    pixel: 'banded',
};

const TEXT$1 = `
  .ac-title, .ac-desc {
    text-shadow: 0 0 8px rgb(20 22 35 / 0.9), 0 1px 3px rgb(0 0 0 / 0.6);
  }`;
function inCircle(x, y, cx, cy, r) {
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}
const MOON = gridSprite(/* size= */ 12, (x, y) => {
    const disc = (a, b) => inCircle(a, b, 5.5, 5.5, 5.7);
    const shade = (a, b) => inCircle(a, b, 8.2, 3.8, 4.6);
    const near = (test) => test(x - 1, y) || test(x + 1, y) || test(x, y - 1) || test(x, y + 1);
    if (!disc(x, y) || shade(x, y))
        return null;
    if (near((a, b) => !disc(a, b)))
        return '#9aa3c7';
    if (near(shade))
        return '#c3cae8';
    return '#eef1ff';
});
const STAR_TONES = ['#ffffff', '#c9d3ff', '#8f9bd8', '#8f9bd8'];
// x, y, tone
const FAR_STAR_AT = [
    [0, 37, 0],
    [42, 9, 1],
    [106, 22, 2],
    [48, 31, 3],
    [110, 22, 0],
    [99, 26, 1],
    [119, 10, 2],
    [54, 29, 3],
    [101, 3, 0],
    [99, 19, 1],
    [134, 33, 2],
    [17, 21, 3],
    [134, 28, 0],
    [93, 24, 1],
    [133, 37, 2],
    [54, 14, 3],
    [122, 14, 0],
    [22, 12, 1],
    [62, 12, 2],
    [136, 23, 3],
    [106, 36, 0],
    [8, 11, 1],
    [81, 21, 2],
    [61, 8, 3],
    [132, 3, 0],
    [53, 14, 1],
];
const FAR_STARS = looped((dx) => FAR_STAR_AT.map(([x, y, tone]) => pixel(x + dx, y, STAR_TONES[tone])));
const BLINK_STAR_AT = [
    [20, 30],
    [41, 6],
    [70, 24],
    [92, 38],
    [118, 8],
    [133, 30],
    [8, 14],
    [55, 40],
];
const BLINK_STARS = BLINK_STAR_AT.map(([x, y]) => pixel(x, y, '#ffffff')).join(', ');
const SHOOTING_STAR_AT = [
    [0, 0, '#ffffff'],
    [-1, 0, '#ffffff'],
    [-2, 0, '#e3e8ff'],
    [-3, -1, '#c9d3ff'],
    [-4, -1, '#c9d3ff'],
    [-5, -1, '#a6b1e8'],
    [-6, -2, '#8f9bd8'],
    [-7, -2, '#717cba'],
    [-8, -2, '#5b6496'],
];
const SHOOTING_STAR = SHOOTING_STAR_AT.map(([x, y, color]) => pixel(x, y, color)).join(', ');
const TWINKLES = twinkleStars([
    [12, 8, 3.2, -1.1],
    [58, 30, 2.7, -0.3],
    [104, 10, 3.9, -2.4],
    [150, 36, 3.4, -1.7],
    [196, 14, 2.9, -0.8],
    [264, 56, 4.2, -3.1],
]);
function Layer$1() {
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx("span", { className: "ac-px-spr ac-px-far" }), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-blink" }), TWINKLES.markup(), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-shoot" }), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-moon" })] }));
}
function css$1() {
    return {
        always: `
      .ac-compact .ac-px-moon { top: 22px; }
      .ac-px-far, .ac-px-blink { left: 0; top: 0; }
      .ac-px-far { box-shadow: ${FAR_STARS}; }
      .ac-px-blink {
        box-shadow: ${BLINK_STARS};
        animation: ac-px-blink 2.8s steps(1, end) infinite;
      }
      ${TWINKLES.css}
      .ac-px-shoot {
        left: 30px;
        top: 6px;
        opacity: 0;
        box-shadow: ${SHOOTING_STAR};
      }
      .ac-px-moon { right: 36px; top: 26px; box-shadow: ${MOON}; }
      ${TEXT$1}`,
        full: `
      .ac-px-far { animation: ac-px-drift 90s steps(146, end) infinite; }
      .ac-px-shoot { animation: ac-px-shoot 6.5s 0.8s infinite; }
      @keyframes ac-px-shoot {
        0% {
          translate: 0 0;
          opacity: 1;
          animation-timing-function: steps(16, end);
        }
        9% {
          translate: 96px 32px;
          opacity: 1;
          animation-timing-function: steps(1, end);
        }
        9.5%, 100% { translate: 96px 32px; opacity: 0; }
      }`,
        reduced: '',
    };
}
/** Pixel Night theme. */
const pixelNight = {
    Layer: Layer$1,
    css: css$1,
    background: BANDS,
    pixel: 'banded',
};

// Dark text over pink blossoms keeps a soft white halo.
const TEXT = `
  .ac-title, .ac-desc, .ac-eyebrow {
    text-shadow: 0 0 2px #fff, 0 0 4px rgb(255 243 247 / 0.95), 0 1px 0 rgb(255 255 255 / 0.8);
  }`;
// Blossom-covered branches bursting in from the left edge over about half the
// card (art px): brown limbs first, then layered five-petal flowers clustered
// along them.
const LIMBS = [
    [-1, 4, 16, 8, 4],
    [16, 8, 30, 7, 3],
    [30, 7, 46, 10, 2],
    [46, 10, 60, 8, 2],
    [60, 8, 70, 10, 1],
    [16, 8, 26, 15, 2],
    [26, 15, 38, 20, 1],
    [-1, 27, 12, 23, 4],
    [12, 23, 26, 26, 3],
    [26, 26, 40, 31, 2],
    [40, 31, 52, 30, 1],
    [12, 23, 20, 16, 1],
    [-1, 38, 10, 35, 2],
    [10, 35, 22, 38, 1],
];
// x, y, radius, flowers
const CLUSTERS = [
    [4, 2, 6, 15],
    [12, 4, 6, 18],
    [20, 4, 6, 18],
    [28, 3, 6, 15],
    [36, 6, 6, 15],
    [44, 7, 6, 15],
    [52, 6, 6, 14],
    [60, 6, 5, 12],
    [68, 8, 5, 10],
    [70, 3, 4, 7],
    [62, 14, 5, 10],
    [56, 14, 4, 7],
    [22, 12, 5, 12],
    [30, 16, 5, 11],
    [38, 19, 5, 10],
    [66, 20, 4, 6],
    [4, 24, 6, 15],
    [10, 19, 5, 12],
    [18, 22, 6, 15],
    [26, 24, 5, 12],
    [34, 28, 5, 11],
    [44, 29, 5, 11],
    [52, 28, 5, 9],
    [58, 22, 4, 7],
    [20, 15, 4, 9],
    [4, 35, 5, 11],
    [14, 34, 4, 9],
];
// Lit top, middle, shaded underside.
const BARK = ['#8a5a44', '#7a4a3a', '#5a3428'];
const BLOSSOM = {
    soft: '#ffc3d7',
    light: '#ffd6e5',
    mid: '#ff9ec0',
    deep: '#f37ea6',
    heart: '#e0457b',
};
function drawBranches() {
    const random = seeded(29);
    const cells = new Map();
    const put = (x, y, color) => {
        if (x >= 0 && y >= 0 && y <= 42)
            cells.set(`${x},${y}`, color);
    };
    // A soft blossom mass behind the branches, so each cluster reads as full
    // bloom.
    for (const [cx, cy, r] of CLUSTERS) {
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + 2 * dy * dy <= r * r && random() < 0.6) {
                    put(cx + dx, cy + dy, random() < 0.5 ? BLOSSOM.soft : BLOSSOM.mid);
                }
            }
        }
    }
    drawLimbs(LIMBS, put, BARK);
    const hearts = [];
    for (const [cx, cy, r, flowers] of CLUSTERS) {
        for (let i = 0; i < flowers; i++) {
            const x = cx + Math.round((random() * 2 - 1) * r);
            const y = cy + Math.round((random() * 2 - 1) * r * 0.7);
            const petal = random() < 0.3 ? BLOSSOM.deep : BLOSSOM.mid;
            put(x, y - 1, BLOSSOM.light);
            put(x - 1, y, BLOSSOM.light);
            put(x + 1, y, petal);
            put(x, y + 1, petal);
            if (random() < 0.6) {
                put(x - 1, y - 1, BLOSSOM.light);
                put(x + 1, y + 1, petal);
                put(x + 1, y - 1, BLOSSOM.mid);
                put(x - 1, y + 1, BLOSSOM.mid);
            }
            put(x, y, BLOSSOM.heart);
            hearts.push([x, y]);
        }
    }
    // Two sets of glints on the flowers take turns: every ninth flower from
    // `offset`, at most six.
    const glints = (offset) => {
        const picked = [];
        for (let i = offset; i < hearts.length && picked.length < 6; i += 9) {
            const [x, y] = hearts[i];
            picked.push(pixel(x, y - 1, '#fff4f8'));
        }
        return picked.join(', ');
    };
    const branches = [...cells].map(([key, color]) => {
        const [x, y] = key.split(',').map((part) => Number(part));
        return pixel(x, y, color);
    });
    return {
        branches: branches.join(', '),
        glintA: glints(0),
        glintB: glints(4),
    };
}
const SAKURA = drawBranches();
// Petals let go of the branches and drift down and right.
const PETALS = fallingSprites({
    name: 'petal',
    count: 24,
    seed: 7,
    frames: [
        ['PP.', '.PD'],
        ['.P', 'PP', 'D.'],
    ],
    palettes: [
        { P: '#ff8fb3', D: '#e0457b' },
        { P: '#ffc2d6', D: '#ff8fb3' },
    ],
    area: { x: [0, 120], y: [-4, 32] },
    cycle: [5.5, 9.5],
    vector: [4, 2],
    steps: 40,
});
function Layer() {
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx("span", { className: "ac-px-spr ac-px-branches" }), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-shimmer-a" }), SP_JSX.jsx("span", { className: "ac-px-spr ac-px-shimmer-b" }), PETALS.markup()] }));
}
function css() {
    return {
        always: `
      .ac-px-branches, .ac-px-shimmer-a, .ac-px-shimmer-b { left: 0; top: 0; }
      .ac-px-branches { box-shadow: ${SAKURA.branches}; }
      .ac-px-shimmer-a {
        box-shadow: ${SAKURA.glintA};
        animation: ac-px-flap 1.4s steps(1, end) infinite;
      }
      .ac-px-shimmer-b {
        box-shadow: ${SAKURA.glintB};
        animation: ac-px-flap 1.4s steps(1, end) -0.7s infinite;
      }
      ${PETALS.always}
      ${TEXT}`,
        full: PETALS.full,
        reduced: '',
    };
}
/** Cherry Blossom theme. */
const sakura = {
    Layer,
    css,
    background: BANDS,
    pixel: 'banded',
};

const SPARKLES = [
    { top: '18%', left: '16%', size: 10, delay: 0, duration: 2.4 },
    { top: '64%', left: '12%', size: 7, delay: 0.9, duration: 2.8 },
    { top: '34%', left: '27%', size: 6, delay: 1.7, duration: 2.2 },
    { top: '78%', left: '33%', size: 9, delay: 0.45, duration: 3.0 },
    { top: '12%', left: '43%', size: 8, delay: 1.3, duration: 2.6 },
    { top: '70%', left: '51%', size: 6, delay: 2.1, duration: 2.4 },
    { top: '26%', left: '58%', size: 12, delay: 0.7, duration: 3.2 },
    { top: '80%', left: '66%', size: 7, delay: 1.55, duration: 2.5 },
    { top: '20%', left: '74%', size: 9, delay: 2.35, duration: 2.9 },
    { top: '58%', left: '80%', size: 8, delay: 1.05, duration: 2.7 },
];
// size px, top %, left %, delay s, duration s
const STARS = [
    [2, 10, 5, 0, 2.5],
    [3, 24, 16, 0.3, 2.5],
    [2, 78, 9, 0.7, 2.5],
    [2, 55, 22, 1.2, 2.5],
    [4, 12, 31, 1.8, 2.5],
    [2, 83, 28, 0.5, 2.5],
    [2, 8, 42, 1.5, 2.5],
    [3, 85, 48, 0.9, 2.5],
    [2, 16, 54, 0.4, 1.8],
    [2, 74, 59, 1.1, 2.5],
    [2, 10, 65, 0.8, 3.5],
    [3, 81, 71, 1.6, 2.5],
    [2, 20, 77, 0.2, 2.5],
    [2, 68, 83, 1.9, 1.8],
    [3, 12, 89, 0.6, 3.5],
    [2, 86, 93, 1.3, 2.5],
];
const CONSTELLATION_PATH = 'M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688Z';
const CONSTELLATIONS = [
    { top: '15%', left: '12%', width: 8, opacity: 0.7 },
    { top: '62%', left: '36%', width: 6, opacity: 0.4 },
    { top: '26%', left: '58%', width: 10, opacity: 0.8 },
    { top: '67%', left: '80%', width: 7, opacity: 0.5 },
];
function ConstellationHalf() {
    return (SP_JSX.jsx("div", { className: "ac-drift-half", children: CONSTELLATIONS.map((constellation, i) => (SP_JSX.jsx("svg", { className: "ac-constellation", viewBox: "133 0 8 9", style: {
                top: constellation.top,
                left: constellation.left,
                width: constellation.width,
                opacity: constellation.opacity,
            }, children: SP_JSX.jsx("path", { d: CONSTELLATION_PATH }) }, i))) }));
}
// The sky follows the Primary/Secondary colors, so recoloring a preset
// recolors the scene.
const SMOOTH_SKY = 'linear-gradient(160deg, var(--ac-primary) 0%, var(--ac-secondary) 100%)';
const DAY_TEXT = `
  .ac-title, .ac-desc {
    text-shadow: 0 1px 3px rgb(25 60 90 / 0.7), 0 0 6px rgb(25 60 90 / 0.35);
  }`;
const NIGHT_TEXT = `
  .ac-title, .ac-desc {
    text-shadow: 0 0 8px rgb(20 22 35 / 0.9), 0 1px 3px rgb(0 0 0 / 0.6);
  }`;
const DRIFT_KEYFRAMES = '@keyframes ac-drift-left { to { transform: translateX(-50%); } }';
const SMOOTH_BASE = `
  .ac-drift { position: absolute; inset: 0; overflow: hidden; }
  .ac-drift-track { display: flex; width: 200%; height: 100%; }
  .ac-drift-half { width: 50%; height: 100%; position: relative; }
  .ac-compact .ac-sun, .ac-compact .ac-moon { top: 18px; }
  @keyframes ac-glow { from { opacity: 0.35; } to { opacity: 1; } }`;
function SparklesLayer() {
    return (SP_JSX.jsx(SP_JSX.Fragment, { children: [...SPARKLES.keys()].map((i) => (SP_JSX.jsx("div", { className: `ac-sparkle ac-sparkle-${i + 1}` }, i))) }));
}
// Per-element timing rules carry `.ac-decoration` so the animation shorthands
// in either motion branch cannot reset them.
function sparklesCss() {
    const placed = SPARKLES.map((sparkle, i) => `
      .ac-decoration .ac-sparkle-${i + 1} {
        top: ${sparkle.top};
        left: ${sparkle.left};
        width: ${sparkle.size}px;
        height: ${sparkle.size}px;
        animation-delay: ${sparkle.delay}s;
        animation-duration: ${sparkle.duration}s;
      }`);
    return {
        always: `${SMOOTH_BASE}
      .ac-sparkle {
        position: absolute;
        background: var(--ac-accent);
        clip-path: polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%);
        opacity: 0;
        box-shadow: 0 0 6px rgb(var(--ac-accent-rgb) / 0.67);
      }
      ${placed.join('\n')}`,
        full: `
      .ac-sparkle { animation: ac-sparkle 2.5s ease-in-out infinite; }
      @keyframes ac-sparkle {
        0%, 100% { opacity: 0; transform: scale(0.2) rotate(0deg); }
        35% { opacity: 1; transform: scale(1) rotate(25deg); }
        65% { opacity: 0.85; transform: scale(0.9) rotate(35deg); }
      }`,
        reduced: '.ac-sparkle { animation: ac-glow 2.5s ease-in-out infinite alternate; }',
    };
}
function SkyDayLayer() {
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx("div", { className: "ac-sun" }), SP_JSX.jsxs("svg", { className: "ac-birds", viewBox: "0 0 60 20", width: "40", height: "20", children: [SP_JSX.jsx("path", { d: "M2 10 Q 7 2 12 10 Q 17 2 22 10", fill: "none", stroke: "#FFF8E7", strokeWidth: "1.5", strokeLinecap: "round" }), SP_JSX.jsx("path", { d: "M25 15 Q 30 7 35 15 Q 40 7 45 15", fill: "none", stroke: "#FFF8E7", strokeWidth: "1.5", strokeLinecap: "round" })] }), SP_JSX.jsx("div", { className: "ac-drift", children: SP_JSX.jsxs("div", { className: "ac-drift-track ac-drift-back", children: [SP_JSX.jsx("div", { className: "ac-drift-half", children: SP_JSX.jsx("div", { className: "ac-cloud-3" }) }), SP_JSX.jsx("div", { className: "ac-drift-half", children: SP_JSX.jsx("div", { className: "ac-cloud-3" }) })] }) }), SP_JSX.jsx("div", { className: "ac-drift", children: SP_JSX.jsxs("div", { className: "ac-drift-track ac-drift-front", children: [SP_JSX.jsxs("div", { className: "ac-drift-half", children: [SP_JSX.jsx("div", { className: "ac-cloud-1" }), SP_JSX.jsx("div", { className: "ac-cloud-2" })] }), SP_JSX.jsxs("div", { className: "ac-drift-half", children: [SP_JSX.jsx("div", { className: "ac-cloud-1" }), SP_JSX.jsx("div", { className: "ac-cloud-2" })] })] }) })] }));
}
function skyDayCss() {
    const sunGlow = 'inset 1px 1px 2px rgb(254 255 239 / 0.6), inset 0 -1px 2px rgb(161 135 42 / 0.5)';
    return {
        always: `${SMOOTH_BASE}
      .ac-sun {
        position: absolute;
        top: 26px;
        right: 10px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #ECCA2F;
        box-shadow: ${sunGlow}, 0 0 12px rgb(236 202 47 / 0.35);
        animation: ac-sun 4s ease-in-out infinite;
      }
      @keyframes ac-sun {
        50% { box-shadow: ${sunGlow}, 0 0 18px rgb(236 202 47 / 0.7); }
      }
      .ac-birds { position: absolute; top: 22%; left: 40%; opacity: 0.5; }
      .ac-cloud-1, .ac-cloud-2, .ac-cloud-3 {
        position: absolute;
        border-radius: 50%;
      }
      .ac-cloud-1 {
        width: 26px;
        height: 26px;
        background: #F3FDFF;
        top: 82%;
        left: 4%;
        box-shadow: 20px -6px 0 7px #F3FDFF, 44px 3px 0 -3px #F3FDFF, -15px 5px 0 -5px #F3FDFF;
      }
      .ac-cloud-2 {
        width: 32px;
        height: 32px;
        background: #F3FDFF;
        top: 80%;
        left: 55%;
        box-shadow: 24px 7px 0 -3px #F3FDFF, 48px -5px 0 5px #F3FDFF, -21px 9px 0 -7px #F3FDFF, 69px 9px 0 -6px #F3FDFF;
      }
      .ac-cloud-3 {
        width: 28px;
        height: 28px;
        background: #AACADF;
        top: 74%;
        left: 28%;
        box-shadow: 27px -5px 0 4px #AACADF, 57px 7px 0 -3px #AACADF, -24px 7px 0 -6px #AACADF, 81px -3px 0 5px #AACADF, 111px 6px 0 -5px #AACADF;
      }
      .ac-drift-back { opacity: 0.7; }
      .ac-drift-front { opacity: 0.9; }
      ${DAY_TEXT}`,
        full: `
      .ac-drift-back { animation: ac-drift-left 30s linear infinite; }
      .ac-drift-front { animation: ac-drift-left 20s linear infinite; }
      ${DRIFT_KEYFRAMES}`,
        reduced: '',
    };
}
function SkyNightLayer() {
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx("div", { className: "ac-moon" }), [...STARS.keys()].map((i) => (SP_JSX.jsx("div", { className: `ac-star ac-star-${i + 1}` }, i))), SP_JSX.jsx("div", { className: "ac-drift", children: SP_JSX.jsxs("div", { className: "ac-drift-track ac-drift-stars", children: [SP_JSX.jsx(ConstellationHalf, {}), SP_JSX.jsx(ConstellationHalf, {})] }) })] }));
}
function skyNightCss() {
    const stars = STARS.map(([size, top, left, delay, duration], i) => `
      .ac-decoration .ac-star-${i + 1} {
        width: ${size}px;
        height: ${size}px;
        top: ${top}%;
        left: ${left}%;
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
      }`);
    const crescent = 'radial-gradient(circle at 76% 41%, transparent 44%, #000 45%)';
    return {
        always: `${SMOOTH_BASE}
      .ac-moon {
        position: absolute;
        top: 26px;
        right: 11px;
        width: 26px;
        height: 26px;
        animation: ac-moon 5s ease-in-out infinite;
      }
      .ac-moon::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: #C4C9D1;
        box-shadow: inset 1px 1px 2px rgb(254 255 239 / 0.5);
        -webkit-mask: ${crescent};
        mask: ${crescent};
      }
      @keyframes ac-moon {
        50% { filter: drop-shadow(0 0 5px rgb(255 255 255 / 0.45)); }
      }
      .ac-star {
        position: absolute;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 0 4px rgb(255 255 255 / 0.85);
      }
      ${stars.join('\n')}
      .ac-constellation { position: absolute; fill: #fff; }
      ${NIGHT_TEXT}`,
        full: `
      .ac-star { animation: ac-twinkle 2.5s ease-in-out infinite alternate; }
      @keyframes ac-twinkle {
        from { opacity: 0.25; transform: scale(0.7); }
        to   { opacity: 1; transform: scale(1.25); }
      }
      .ac-drift-stars { animation: ac-drift-left 60s linear infinite; }
      ${DRIFT_KEYFRAMES}`,
        reduced: '.ac-star { animation: ac-glow 2.5s ease-in-out infinite alternate; }',
    };
}
/** Accent-colored sparkles that twinkle over the card. */
const sparkles = { Layer: SparklesLayer, css: sparklesCss };
/** A daytime sky with sun, birds and drifting clouds. */
const skyDay = {
    Layer: SkyDayLayer,
    css: skyDayCss,
    background: SMOOTH_SKY,
};
/** A night sky with a crescent moon, stars and drifting constellations. */
const skyNight = {
    Layer: SkyNightLayer,
    css: skyNightCss,
    background: SMOOTH_SKY,
};

const THEMES = {
    'none': null,
    'sparkles': sparkles,
    'sky-day': skyDay,
    'sky-night': skyNight,
    'pixel-day': pixelDay,
    'pixel-night': pixelNight,
    'pixel-sakura': sakura,
    'pixel-halloween': halloween,
};
/** Returns the card background of a decoration that paints its own scene. */
function decorationBackground(decoration) {
    return THEMES[decoration]?.background ?? null;
}
/** Whether the decoration paints the whole card background. */
function hasDecorationBackground(decoration) {
    return decorationBackground(decoration) !== null;
}
/** Renders a decoration's sprites inside the shared `.ac-decoration` box. */
function DecorationLayer({ variant }) {
    const theme = THEMES[variant];
    if (!theme)
        return null;
    const { Layer, pixel } = theme;
    return (SP_JSX.jsxs("div", { className: pixel ? 'ac-decoration ac-px-decoration' : 'ac-decoration', children: [pixel === 'banded' &&
                [1, 2, 3].map((i) => (SP_JSX.jsx("span", { className: `ac-px-dither ac-px-d${i}` }, i))), SP_JSX.jsx(Layer, {})] }));
}
const NO_DECORATION = { always: '', full: '', reduced: '' };
// DecorationLayer wraps every theme in .ac-decoration, so this rule goes ahead
// of the theme's own CSS.
const DECORATION_BASE = `
  .ac-decoration {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: calc(var(--ac-radius) - 2px);
    pointer-events: none;
    z-index: 0;
  }`;
/** Returns the CSS of a decoration, shared base rules included. */
function decorationCss(decoration) {
    const theme = THEMES[decoration];
    if (!theme)
        return NO_DECORATION;
    const parts = theme.css();
    const base = [DECORATION_BASE];
    if (theme.pixel)
        base.push(PIXEL_BASE);
    if (theme.pixel === 'banded')
        base.push(DITHER);
    return { ...parts, always: `${base.join('\n')}\n${parts.always}` };
}

/**
 * @fileoverview Entrance and exit animations. Springs use Motion's maths,
 * precomputed into CSS `linear()` easings.
 */
const SPRING_SAMPLES = 48;
// Motion's duration-based spring (mass 1): visualDuration and bounce give
// stiffness and damping; the closed-form oscillator is sampled into linear()
// until its envelope settles.
function springEasing({ visualDuration, bounce }) {
    const omega = (2 * Math.PI) / (visualDuration * 1.2);
    const dampingRatio = Math.min(1, Math.max(0.05, 1 - bounce));
    const dampedOmega = omega * Math.sqrt(1 - dampingRatio * dampingRatio);
    const decay = dampingRatio * omega;
    const position = (t) => dampingRatio < 1
        ? 1 -
            Math.exp(-decay * t) *
                (Math.cos(dampedOmega * t) +
                    (decay / dampedOmega) * Math.sin(dampedOmega * t))
        : 1 - Math.exp(-omega * t) * (1 + omega * t);
    const envelope = (t) => dampingRatio < 1
        ? Math.exp(-decay * t) * Math.hypot(1, decay / dampedOmega)
        : Math.exp(-omega * t) * (1 + omega * t);
    let settleTime = 0.05;
    while (envelope(settleTime) > 0.002 && settleTime < 4) {
        settleTime += 0.01;
    }
    const points = [];
    for (let i = 0; i < SPRING_SAMPLES; i++) {
        const t = (settleTime * i) / SPRING_SAMPLES;
        points.push(String(Number(position(t).toFixed(3))));
    }
    points.push('1');
    return {
        easing: `linear(${points.join(', ')})`,
        durationMs: Math.round(settleTime * 1000),
    };
}
const SUPPORTS_LINEAR_EASING = typeof CSS === 'undefined' ||
    CSS.supports('animation-timing-function', 'linear(0, 1)');
// Older Steam clients lack linear(): fall back to an ease-out of similar
// length. It never overshoots, so Slide cannot run past the window edge.
function spring(options) {
    if (SUPPORTS_LINEAR_EASING)
        return springEasing(options);
    return {
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        durationMs: Math.round(options.visualDuration * 1300),
    };
}
const SPRING = {
    slide: spring({ visualDuration: 0.45, bounce: 0.12 }),
    drop: spring({ visualDuration: 0.5, bounce: 0.22 }),
    pop: spring({ visualDuration: 0.35, bounce: 0.5 }),
    flip: spring({ visualDuration: 0.5, bounce: 0.3 }),
};
const LIVE_TOAST = '.ac-toast:not(.ac-preview)';
const AT_EXIT = 'var(--toast-duration, 6000ms)';
const ACCELERATE = 'cubic-bezier(0.4, 0, 1, 1)';
const ACCELERATE_HARD = 'cubic-bezier(0.55, 0, 1, 0.45)';
const DECELERATE = 'cubic-bezier(0, 0.55, 0.45, 1)';
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
// Unfold's disc around the icon; --ac-disc-x/--ac-disc-r follow the compact
// layout.
const DISC_CLIP = 'inset(calc(50% - var(--ac-disc-r)) calc(100% - var(--ac-disc-x) - var(--ac-disc-r)) calc(50% - var(--ac-disc-r)) calc(var(--ac-disc-x) - var(--ac-disc-r)) round var(--ac-disc-r))';
// Negative insets keep the glow inside the clip.
const OPEN_CLIP = 'inset(-48px round var(--ac-radius))';
const TEXT_IN = 'ac-text-in 420ms cubic-bezier(0.2, 0.8, 0.2, 1) 520ms both';
const RETRO_SHOW = 'ac-retro-show 420ms steps(1, end) both';
// Vertical travel (--ac-fall) stays inside the toast window: a centred card
// has ~21px above it, a compact or bottom-anchored in-game one ~8px.
const ENTRANCES = {
    // Xbox: the icon disc pops in, holds, then the card unfolds out of it; the
    // exit folds it back.
    unfold: {
        card: ['ac-in-unfold 1000ms cubic-bezier(0.25, 0.8, 0.3, 1) both'],
        enter: `
      .ac-in-unfold { transform-origin: var(--ac-disc-x) 50%; }
      .ac-in-unfold .ac-text { animation: ${TEXT_IN}; }
      @keyframes ac-in-unfold {
        0% {
          opacity: 0;
          transform: scale(0.4);
          clip-path: ${DISC_CLIP};
        }
        18%  { opacity: 1; transform: scale(1.08); }
        28%  { transform: none; }
        48%  { clip-path: ${DISC_CLIP}; }
        100% { clip-path: ${OPEN_CLIP}; }
      }
      @keyframes ac-text-in {
        from { opacity: 0; transform: translateX(-10px); }
      }`,
        exit: 'ac-out-unfold 460ms',
        exitRoot: 'transform-origin: var(--ac-disc-x) 50%;',
        exitRules: `
      ${LIVE_TOAST} .ac-in-unfold .ac-text {
        animation:
          ${TEXT_IN},
          ac-text-out 140ms ${ACCELERATE} ${AT_EXIT} forwards;
      }
      @keyframes ac-text-out {
        to { opacity: 0; transform: translateX(-8px); }
      }
      @keyframes ac-out-unfold {
        0% {
          clip-path: ${OPEN_CLIP};
          animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4);
        }
        62% {
          clip-path: ${DISC_CLIP};
          opacity: 1;
          transform: none;
          animation-timing-function: ${ACCELERATE};
        }
        100% {
          clip-path: ${DISC_CLIP};
          opacity: 0;
          transform: scale(0.6);
        }
      }`,
    },
    // PlayStation: settles down from above, with one pass of light around the
    // icon.
    drop: {
        card: [
            'ac-fade-in 200ms ease-out both',
            `ac-in-drop ${SPRING.drop.durationMs}ms ${SPRING.drop.easing} both`,
        ],
        enter: `
      .ac-toast:not(.ac-rare):not(.ac-ultra) .ac-in-drop .ac-ring {
        opacity: 1;
        background: conic-gradient(from 0deg, transparent 0 62%, rgb(255 255 255 / 0.85) 82%, transparent 100%);
        animation: ac-spin-once 1.1s ease-out 350ms both;
      }
      @keyframes ac-in-drop {
        from { translate: 0 calc(var(--ac-fall) * -1); }
        to   { translate: 0 0; }
      }
      @keyframes ac-spin-once {
        from { transform: rotate(0turn); opacity: 1; }
        to   { transform: rotate(1turn); opacity: 0; }
      }`,
        exit: `ac-out-drop 280ms ${ACCELERATE}`,
        exitRules: `
      @keyframes ac-out-drop {
        to { transform: translateY(calc(var(--ac-fall) * -1)); opacity: 0; }
      }`,
    },
    slide: {
        card: [
            'ac-fade-in 180ms ease-out both',
            `ac-in-slide ${SPRING.slide.durationMs}ms ${SPRING.slide.easing} both`,
        ],
        enter: `
      @keyframes ac-in-slide {
        from { translate: calc(var(--ac-dx) * 115%) 0; }
        to   { translate: 0 0; }
      }`,
        exit: `ac-out-slide 320ms ${ACCELERATE_HARD}`,
        exitRules: `
      @keyframes ac-out-slide {
        to { transform: translateX(calc(var(--ac-dx) * 115%)); }
      }`,
    },
    pop: {
        card: [
            'ac-fade-in 140ms ease-out both',
            `ac-in-pop ${SPRING.pop.durationMs}ms ${SPRING.pop.easing} both`,
        ],
        enter: '@keyframes ac-in-pop { from { scale: 0.5; } to { scale: 1; } }',
        exit: `ac-out-pop 220ms ${ACCELERATE}`,
        exitRules: `
      @keyframes ac-out-pop {
        to { transform: scale(0.82); opacity: 0; }
      }`,
    },
    // Gravity: two decaying bounces with squash and stretch; the exit hops, then
    // drops.
    bounce: {
        card: ['ac-in-bounce 950ms both'],
        enter: `
      .ac-in-bounce { transform-origin: 50% 100%; }
      @keyframes ac-in-bounce {
        0% {
          opacity: 0;
          translate: 0 calc(var(--ac-fall) * -1);
          scale: 0.98 1.02;
          animation-timing-function: ${ACCELERATE_HARD};
        }
        8% { opacity: 1; }
        34% {
          translate: 0 0;
          scale: 1.06 0.9;
          animation-timing-function: ${DECELERATE};
        }
        52% {
          translate: 0 calc(var(--ac-fall) * -0.35);
          scale: 0.98 1.03;
          animation-timing-function: ${ACCELERATE_HARD};
        }
        68% {
          translate: 0 0;
          scale: 1.03 0.95;
          animation-timing-function: ${DECELERATE};
        }
        80% {
          translate: 0 calc(var(--ac-fall) * -0.12);
          scale: 1 1;
          animation-timing-function: ${ACCELERATE_HARD};
        }
        90%  { translate: 0 0; scale: 1.01 0.98; }
        100% { opacity: 1; translate: 0 0; scale: 1 1; }
      }`,
        exit: 'ac-out-bounce 420ms',
        exitRules: `
      @keyframes ac-out-bounce {
        0% { transform: none; animation-timing-function: ${DECELERATE}; }
        30% {
          transform: translateY(calc(var(--ac-fall) * -0.5)) scale(1.02, 0.98);
          animation-timing-function: ${ACCELERATE_HARD};
        }
        100% { transform: translateY(var(--ac-fall)); opacity: 0; }
      }`,
    },
    fade: {
        card: [`ac-in-fade 520ms ${EASE_OUT} both`],
        enter: `
      @keyframes ac-in-fade {
        from { opacity: 0; filter: blur(10px); scale: 1.05; }
        to   { opacity: 1; filter: none; scale: 1; }
      }`,
        exit: `ac-out-fade 320ms ${ACCELERATE}`,
        exitRules: `
      @keyframes ac-out-fade {
        to { opacity: 0; filter: blur(8px); transform: scale(0.97); }
      }`,
    },
    // A sign on a hinge: swings down from the top edge, then flips away.
    flip: {
        card: [
            'ac-fade-in 160ms ease-out both',
            `ac-in-flip ${SPRING.flip.durationMs}ms ${SPRING.flip.easing} both`,
        ],
        enter: `
      .ac-in-flip { transform-origin: 50% 0; }
      @keyframes ac-in-flip {
        from { transform: perspective(700px) rotateX(-100deg); }
        to   { transform: perspective(700px) rotateX(0deg); }
      }`,
        exit: `ac-out-flip 340ms ${ACCELERATE_HARD}`,
        exitRoot: 'transform-origin: 50% 100%;',
        exitRules: `
      @keyframes ac-out-flip {
        to { transform: perspective(700px) rotateX(95deg); opacity: 0; }
      }`,
    },
    // 16-bit text box: opens from a dot to a line to full height in hard steps,
    // content after.
    retro: {
        card: ['ac-in-retro 420ms both'],
        enter: `
      .ac-in-retro .ac-icon, .ac-in-retro .ac-text { animation: ${RETRO_SHOW}; }
      @keyframes ac-in-retro {
        0%   { scale: 0.04 0.06; animation-timing-function: steps(4, end); }
        45%  { scale: 1 0.06; animation-timing-function: steps(4, end); }
        100% { scale: 1 1; }
      }
      @keyframes ac-retro-show { from { opacity: 0; } to { opacity: 1; } }`,
        exit: 'ac-out-retro 300ms',
        exitRules: `
      ${LIVE_TOAST} .ac-in-retro .ac-icon, ${LIVE_TOAST} .ac-in-retro .ac-text {
        animation: ${RETRO_SHOW}, ac-retro-clear 1ms ${AT_EXIT} forwards;
      }
      @keyframes ac-retro-clear { to { opacity: 0; } }
      @keyframes ac-out-retro {
        0% {
          transform: scale(1, 1);
          animation-timing-function: steps(3, end);
        }
        55% {
          transform: scale(1, 0.06);
          animation-timing-function: steps(3, end);
        }
        99%  { transform: scale(0.04, 0.06); opacity: 1; }
        100% { transform: scale(0.04, 0.06); opacity: 0; }
      }`,
    },
};
const PLAIN_EXIT = 'ac-out 300ms ease-in';
const PLAIN_EXIT_KEYFRAMES = `
  @keyframes ac-out {
    to { opacity: 0; transform: translateX(calc(var(--ac-dx) * 20px)); }
  }`;
/**
 * Returns the CSS for an entrance (or none) and its matching exit; the rarity
 * pulse is appended to the card animations.
 */
function motionCss(style, pulse) {
    const entrance = style ? ENTRANCES[style] : null;
    const cardRule = (list) => {
        const animations = pulse ? [...list, pulse] : list;
        const value = animations.length > 0 ? animations.join(', ') : 'none';
        return `.ac-card { animation: ${value}; }`;
    };
    // !important: the root is GamepadToastPopup's direct child, which Steam
    // animates itself.
    const exitRule = (animation, root = '') => `${LIVE_TOAST} { ${root} animation: ${animation} ${AT_EXIT} forwards !important; }`;
    const full = entrance
        ? `${cardRule(entrance.card)}
      ${entrance.enter}
      ${exitRule(entrance.exit, entrance.exitRoot)}
      ${entrance.exitRules}`
        : `${cardRule([])}
      ${exitRule(PLAIN_EXIT)}
      ${PLAIN_EXIT_KEYFRAMES}`;
    return {
        always: `
      .ac-toast { --ac-disc-x: 38px; --ac-disc-r: 32px; --ac-fall: 18px; }
      .ac-toast.ac-compact { --ac-disc-x: 32px; --ac-disc-r: 26px; --ac-fall: 6px; }
      .ac-toast[data-edge~="ingame"]:not([data-edge~="top"]) { --ac-fall: 6px; }
      @keyframes ac-fade-in { from { opacity: 0; } }`,
        full,
        reduced: `
      ${cardRule(entrance ? ['ac-fade-in 200ms ease-out both'] : [])}
      ${exitRule('ac-rm-out 250ms ease-out')}
      @keyframes ac-rm-out { to { opacity: 0; } }`,
    };
}

/** Corner radius of the achievement icon for each icon shape. */
const ICON_RADIUS = {
    circle: '50%',
    rounded: '8px',
    square: '0px',
};
function rarityTier(globalPercent, enabled) {
    if (!enabled || !(globalPercent > 0))
        return 'none';
    if (globalPercent < 1)
        return 'ultra';
    if (globalPercent < 10)
        return 'rare';
    if (globalPercent < 25)
        return 'uncommon';
    return 'none';
}
const UNLOCK_LABEL = {
    none: 'Achievement unlocked',
    uncommon: 'Uncommon unlock',
    rare: 'Rare achievement',
    ultra: 'Ultra rare unlock',
};
function formatPercent(percent) {
    return `${percent < 10 ? percent.toFixed(1) : Math.round(percent)}%`;
}
function formatCount(count) {
    return count.toLocaleString(undefined, {
        maximumFractionDigits: Number.isInteger(count) ? 0 : 1,
    });
}
const BADGE_PATH = 'M30 30.05H26L24 34.05L20.11 27.57L22.9 24.8701L26.9 24.81L30 30.05ZM13.1 24.8701L9.1 24.81L6 30.05H10L12 34.05L15.89 27.57L13.1 24.8701ZM22.5 13.05C22.5 12.16 22.2361 11.29 21.7416 10.55C21.2471 9.80996 20.5443 9.23318 19.7221 8.89259C18.8998 8.552 17.995 8.46288 17.1221 8.63651C16.2492 8.81015 15.4474 9.23873 14.818 9.86807C14.1887 10.4974 13.7601 11.2992 13.5865 12.1721C13.4128 13.0451 13.5019 13.9499 13.8425 14.7721C14.1831 15.5944 14.7599 16.2972 15.4999 16.7917C16.24 17.2861 17.11 17.55 18 17.55C18.5913 17.5514 19.1771 17.4359 19.7236 17.2102C20.2702 16.9845 20.7668 16.6531 21.1849 16.235C21.603 15.8168 21.9345 15.3202 22.1601 14.7737C22.3858 14.2271 22.5013 13.6414 22.5 13.05ZM29 13.05L25.85 16.3L25.78 20.83L21.25 20.9L18 24.05L14.75 20.9L10.22 20.83L10.15 16.3L7 13.05L10.15 9.80005L10.22 5.27005L14.75 5.20005L18 2.05005L21.25 5.20005L25.78 5.27005L25.85 9.80005L29 13.05Z';
function Badge() {
    return (SP_JSX.jsx("svg", { viewBox: "0 0 36 36", "aria-hidden": "true", children: SP_JSX.jsx("path", { d: BADGE_PATH }) }));
}
const PULSE = {
    none: null,
    uncommon: null,
    rare: 'ac-pulse-rare 2.5s ease-in-out 900ms infinite',
    ultra: 'ac-pulse-ultra 2s ease-in-out 900ms infinite',
};
function backgroundCss(settings) {
    const scene = decorationBackground(settings.decorativeElements);
    if (scene)
        return `background: ${scene};`;
    if (settings.bannerStyle === 'solid')
        return 'background: var(--ac-primary);';
    if (settings.bannerStyle === 'glass') {
        return `
      background: rgb(var(--ac-primary-rgb) / 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);`;
    }
    return 'background: linear-gradient(135deg, var(--ac-primary), var(--ac-secondary));';
}
function rarityCss(tier) {
    if (tier === 'rare') {
        return {
            always: `
        .ac-rare .ac-card { border-color: #FFD700; }
        .ac-rare .ac-pill { background: rgb(255 215 0 / 0.18); color: #FFD700; }
        .ac-rare .ac-ring {
          opacity: 1;
          background: conic-gradient(from 0deg, transparent 0 55%, #FFD700 80%, transparent 100%);
        }
        @keyframes ac-pulse-rare {
          0%, 100% {
            box-shadow: 0 0 14px rgb(255 215 0 / 0.5), 0 0 30px rgb(255 165 0 / 0.2), 0 6px 18px rgb(0 0 0 / 0.35);
          }
          50% {
            box-shadow: 0 0 22px rgb(255 215 0 / 0.75), 0 0 48px rgb(255 165 0 / 0.4), 0 6px 18px rgb(0 0 0 / 0.35);
          }
        }`,
            full: '.ac-rare .ac-ring { animation: ac-spin 2.6s linear infinite; }',
            reduced: '',
        };
    }
    if (tier === 'ultra') {
        return {
            always: `
        .ac-ultra .ac-card { border-color: #E5E4E2; }
        .ac-ultra .ac-pill { background: rgb(229 228 226 / 0.22); color: #F4FAFF; }
        .ac-ultra .ac-ring {
          opacity: 1;
          background: conic-gradient(from 0deg, transparent 0 50%, #7FF6FF 72%, #E5E4E2 84%, transparent 100%);
        }
        @keyframes ac-pulse-ultra {
          0%, 100% {
            box-shadow: 0 0 14px rgb(229 228 226 / 0.55), 0 0 30px rgb(0 255 255 / 0.25), 0 6px 18px rgb(0 0 0 / 0.35);
          }
          50% {
            box-shadow: 0 0 24px rgb(0 255 255 / 0.65), 0 0 52px rgb(229 228 226 / 0.4), 0 6px 18px rgb(0 0 0 / 0.35);
          }
        }`,
            full: '.ac-ultra .ac-ring { animation: ac-spin 2.2s linear infinite; }',
            reduced: '',
        };
    }
    return { always: '', full: '', reduced: '' };
}
function shineCss(settings, intense) {
    if (!settings.shineEnabled)
        return { always: '', full: '', reduced: '' };
    return {
        always: `
      .ac-card::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 2;
        border-radius: inherit;
        pointer-events: none;
        opacity: 0;
        background: linear-gradient(105deg, transparent 35%, rgb(255 255 255 / ${intense ? 0.5 : 0.28}) 50%, transparent 65%);
        background-size: 300% 100%;
        background-repeat: no-repeat;
      }`,
        full: `
      .ac-card::after {
        animation: ac-shine ${intense ? '1100ms' : '900ms'} ease-in-out 300ms ${intense ? 2 : 1} both;
      }
      @keyframes ac-shine {
        0%   { background-position: 150% 0; opacity: 0; }
        15%  { opacity: 1; }
        85%  { opacity: 1; }
        100% { background-position: -150% 0; opacity: 0; }
      }`,
        reduced: '',
    };
}
function baseCss(settings, tier) {
    const glowPx = Math.min(24, Math.max(4, settings.glowIntensity));
    const glowAlpha = (0.3 + settings.glowIntensity / 100).toFixed(2);
    const shadow = settings.glowEnabled
        ? `0 0 ${glowPx}px rgb(var(--ac-accent-rgb) / ${glowAlpha}), 0 0 ${glowPx * 2}px rgb(var(--ac-accent-rgb) / 0.25), 0 6px 18px rgb(0 0 0 / 0.35)`
        : '0 6px 18px rgb(0 0 0 / 0.35)';
    const shine = shineCss(settings, tier === 'rare' || tier === 'ultra');
    const iconBorder = settings.iconBorder
        ? 'border: 2px solid var(--ac-accent); box-shadow: 0 0 8px rgb(var(--ac-accent-rgb) / 0.4);'
        : 'border: 0; box-shadow: none;';
    return {
        // round() keeps an odd-height card on whole pixels so pixel art stays
        // sharp; older clients drop it and keep -50%.
        always: `
      .ac-toast {
        --ac-dx: 1;
        position: absolute !important;
        left: -6px;
        right: 14px;
        top: 50%;
        translate: 0 -50%;
        translate: 0 round(-50%, 1px);
        margin: 0;
        font-family: "Motiva Sans", "Segoe UI", Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .ac-toast[data-edge~="left"] { --ac-dx: -1; }
      .ac-toast[data-edge~="ingame"] { top: auto; bottom: 58px; translate: none; }
      .ac-toast[data-edge~="ingame"][data-edge~="top"] { top: 38px; bottom: auto; }
      .ac-toast.ac-preview {
        position: relative !important;
        left: auto;
        right: auto;
        top: auto;
        translate: none;
        width: 100%;
        animation: none !important;
      }

      .ac-card {
        position: relative;
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        min-height: 64px;
        padding: 10px 12px;
        box-sizing: border-box;
        border: 2px solid var(--ac-accent);
        border-radius: var(--ac-radius);
        ${backgroundCss(settings)}
        box-shadow: ${shadow};
        color: var(--ac-text);
        isolation: isolate;
      }
      .ac-compact .ac-card { min-height: 0; padding: 6px 10px; gap: 10px; }

      .ac-icon {
        position: relative;
        z-index: 1;
        flex: 0 0 48px;
        width: 48px;
        height: 48px;
        border-radius: var(--ac-icon-radius);
      }
      .ac-compact .ac-icon { flex-basis: 40px; width: 40px; height: 40px; }
      .ac-icon img, .ac-icon-fallback {
        display: block;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border-radius: inherit;
        object-fit: cover;
        background: rgb(0 0 0 / 0.3);
        ${iconBorder}
      }
      .ac-icon-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--ac-accent);
      }
      .ac-icon-fallback svg { width: 60%; height: 60%; fill: currentColor; }
      .ac-ring {
        position: absolute;
        inset: -4px;
        border-radius: calc(var(--ac-icon-radius) + 4px);
        padding: 2px;
        opacity: 0;
        pointer-events: none;
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        mask-composite: exclude;
      }

      .ac-text {
        position: relative;
        z-index: 1;
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .ac-decoration-space .ac-title,
      .ac-decoration-space .ac-desc,
      .ac-decoration-space .ac-progress { padding-right: 34px; }
      .ac-eyebrow {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        font-size: 10px;
        line-height: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ac-accent);
      }
      .ac-eyebrow svg {
        flex: 0 0 auto;
        width: 12px;
        height: 12px;
        fill: currentColor;
      }
      .ac-eyebrow-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ac-pill {
        margin-left: auto;
        flex: 0 0 auto;
        padding: 1px 6px;
        border-radius: 999px;
        font-size: 9px;
        line-height: 12px;
        letter-spacing: 0.06em;
        white-space: nowrap;
        background: rgb(var(--ac-accent-rgb) / 0.18);
        color: var(--ac-accent);
      }
      .ac-pill.ac-pct {
        padding: 0;
        background: none;
        color: var(--ac-desc);
        opacity: 0.85;
      }
      .ac-title {
        font-size: 14px;
        line-height: 17px;
        font-weight: 600;
        color: var(--ac-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ac-desc {
        font-size: 11px;
        line-height: 14px;
        color: var(--ac-desc);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .ac-compact .ac-desc { -webkit-line-clamp: 1; }
      .ac-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        line-height: 14px;
        color: var(--ac-desc);
      }
      .ac-bar {
        flex: 1 1 auto;
        height: 6px;
        border-radius: 3px;
        background: rgb(var(--ac-accent-rgb) / 0.22);
        overflow: hidden;
      }
      .ac-fill {
        height: 100%;
        border-radius: inherit;
        background: var(--ac-accent);
        transform-origin: left;
      }
      .ac-count { flex: 0 0 auto; font-variant-numeric: tabular-nums; }
      ${shine.always}`,
        full: `
      .ac-fill {
        animation: ac-fill 700ms cubic-bezier(0.2, 0.8, 0.2, 1) 350ms both;
      }
      @keyframes ac-fill { from { transform: scaleX(0); } }
      @keyframes ac-spin { to { transform: rotate(1turn); } }
      ${shine.full}`,
        reduced: '',
    };
}
/**
 * Builds the complete stylesheet of a toast. Exported so the CSS can be
 * checked off-device; pass sanitized settings.
 */
function buildToastCss(settings, tier) {
    const parts = [
        baseCss(settings, tier),
        motionCss(settings.popupAnimation ? settings.entranceStyle : null, PULSE[tier]),
        rarityCss(tier),
        decorationCss(settings.decorativeElements),
    ];
    const join = (key) => parts.map((part) => part[key]).join('\n');
    if (settings.ignoreReducedMotion) {
        return `${join('always')}\n${join('full')}`;
    }
    // Steam's Reduce Motion setting reaches the toast window as
    // prefers-reduced-motion.
    return `${join('always')}
    @media (prefers-reduced-motion: no-preference) {${join('full')}}
    @media (prefers-reduced-motion: reduce) {${join('reduced')}}`;
}
function cssTokens(settings) {
    const tokens = {
        '--ac-primary': settings.primaryColor,
        '--ac-primary-rgb': hexToRgbTriplet(settings.primaryColor),
        '--ac-secondary': settings.secondaryColor,
        '--ac-accent': settings.accentColor,
        '--ac-accent-rgb': hexToRgbTriplet(settings.accentColor),
        '--ac-text': settings.textColor,
        '--ac-desc': settings.descColor,
        '--ac-radius': `${settings.borderRadius}px`,
        '--ac-icon-radius': ICON_RADIUS[settings.iconShape],
    };
    // CSSProperties has no index signature for custom properties.
    return tokens;
}
/**
 * @fileoverview Achievement sounds, synthesized with Web Audio so no audio
 * files have to ship. Each note is [frequency Hz, start s, length s, wave, gain].
 */
const SOUND_OPTIONS = [
    { data: 'default', label: 'Steam Default' },
    { data: 'playstation', label: 'PlayStation Style' },
    { data: 'xbox', label: 'Xbox Style' },
    { data: 'switch', label: 'Switch Style' },
    { data: 'epic', label: 'Epic Style' },
    { data: 'gog', label: 'GOG Style' },
    { data: 'chime', label: 'Chime' },
    { data: 'sparkle', label: 'Sparkle' },
    { data: 'xbox-rare', label: 'Xbox Rare Achievement' },
];
const SOUND_NAMES = SOUND_OPTIONS.map((option) => option.data);
const SOUND_NOTES = {
    chime: [
        [1318.5, 0, 0.9, 'sine', 0.35],
        [1760, 0.12, 1.1, 'sine', 0.3],
        [2637, 0.24, 1.3, 'sine', 0.18],
    ],
    sparkle: [
        [2093, 0, 0.35, 'sine', 0.22],
        [2637, 0.07, 0.35, 'sine', 0.2],
        [3136, 0.14, 0.4, 'sine', 0.18],
        [2349, 0.22, 0.35, 'sine', 0.18],
        [3520, 0.3, 0.7, 'sine', 0.16],
    ],
    // Original sounds written in the spirit of each platform; not copies.
    playstation: [
        [1568, 0, 1.4, 'sine', 0.3],
        [2349, 0.18, 1.4, 'sine', 0.22],
        [3136, 0.36, 1.6, 'sine', 0.14],
        [784, 0, 0.5, 'triangle', 0.12],
    ],
    xbox: [
        [196, 0, 0.5, 'sine', 0.5],
        [293.7, 0.02, 0.45, 'triangle', 0.25],
        [392, 0.14, 0.6, 'sine', 0.3],
    ],
    switch: [
        [1318.5, 0, 0.12, 'square', 0.12],
        [1568, 0.1, 0.12, 'square', 0.12],
        [2093, 0.2, 0.4, 'square', 0.13],
        [2093, 0.2, 0.4, 'sine', 0.2],
    ],
    epic: [
        [440, 0, 0.12, 'sawtooth', 0.1],
        [659.3, 0.1, 0.12, 'sawtooth', 0.1],
        [880, 0.2, 0.7, 'sawtooth', 0.12],
        [1318.5, 0.2, 0.7, 'sine', 0.2],
    ],
    gog: [
        [523.3, 0, 0.5, 'triangle', 0.35],
        [659.3, 0.15, 0.5, 'triangle', 0.3],
        [783.99, 0.3, 1.0, 'triangle', 0.35],
        [1567.98, 0.3, 1.0, 'sine', 0.1],
    ],
};
// Recorded sounds, embedded as base64 MP3 so the plugin stays a single file.
const SOUND_SAMPLES = {
    'xbox-rare': 'data:audio/mpeg;base64,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qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpUQUd3d3cudm9pY3kubmV0d29yawAAAAAAAAAAAAAAAAB3d3cudm9pY3kubmV0d29yawAAAAAAAAAAAAAAAAB3d3cudm9pY3kubmV0d29yawAAAAAAAAAAAAAAAAAyMDIzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/w==',
};
const sampleBuffers = {};
let audioContext;
/** Master bus: boosts every sound, with a limiter-style compressor to avoid clipping. */
const MASTER_GAIN = 3;
let masterBus;
function getMasterBus(context, volume = 100) {
    if (!masterBus || masterBus.context !== context) {
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -6;
        compressor.knee.value = 6;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.15;
        const boost = context.createGain();
        boost.gain.value = MASTER_GAIN;
        boost.connect(compressor).connect(context.destination);
        masterBus = boost;
        masterBus.context = context;
    }
    masterBus.gain.value = MASTER_GAIN * (volume / 100);
    return masterBus;
}
/** Plays an embedded MP3 sample, decoding it once and caching the buffer. */
function loadSample(context, name) {
    return (sampleBuffers[name] ??= (async () => {
        const response = await fetch(SOUND_SAMPLES[name]);
        return context.decodeAudioData(await response.arrayBuffer());
    })());
}
function playSample(context, name, volume) {
    const decoded = loadSample(context, name);
    decoded
        .then((buffer) => {
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(getMasterBus(context, volume));
        source.start(context.currentTime + 0.1);
        lastAudioPath += ` buf=${buffer.duration.toFixed(1)}s`;
    })
        .catch((error) => {
        delete sampleBuffers[name];
        console.warn('[AchievementCustomizer] Could not play sample', error);
    });
}

const WAV_RATE = 22050;
const wavCache = {};
/** Renders a synthesized sound to a WAV data URL, for playback outside the Web Audio autoplay rules. */
function renderWavUrl(name, volume) {
    const key = `${name}@${volume}`;
    if (wavCache[key])
        return wavCache[key];
    const notes = SOUND_NOTES[name];
    const total = Math.ceil((Math.max(...notes.map(([, start, length]) => start + length)) + 0.1) * WAV_RATE);
    const mix = new Float32Array(total);
    for (const [frequency, start, length, wave, gain] of notes) {
        const from = Math.floor(start * WAV_RATE);
        const count = Math.min(total - from, Math.floor(length * WAV_RATE));
        for (let i = 0; i < count; i++) {
            const t = i / WAV_RATE;
            const phase = (t * frequency) % 1;
            const raw = wave === 'square' ? (phase < 0.5 ? 1 : -1)
                : wave === 'sawtooth' ? 2 * phase - 1
                    : wave === 'triangle' ? 4 * Math.abs(phase - 0.5) - 1
                        : Math.sin(2 * Math.PI * phase);
            const level = t < 0.01
                ? 0.0001 * Math.pow(gain / 0.0001, t / 0.01)
                : gain * Math.pow(0.0001 / gain, (t - 0.01) / Math.max(length - 0.01, 0.001));
            mix[from + i] += raw * level;
        }
    }
    const bytes = new Uint8Array(44 + total * 2);
    const view = new DataView(bytes.buffer);
    const text = (offset, value) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
    text(0, 'RIFF');
    view.setUint32(4, 36 + total * 2, true);
    text(8, 'WAVEfmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, WAV_RATE, true);
    view.setUint32(28, WAV_RATE * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    text(36, 'data');
    view.setUint32(40, total * 2, true);
    for (let i = 0; i < total; i++) {
        const sample = Math.tanh(mix[i] * MASTER_GAIN * (volume / 100));
        view.setInt16(44 + i * 2, Math.round(sample * 32767), true);
    }
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000)
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return (wavCache[key] = `data:audio/wav;base64,${btoa(binary)}`);
}
/**
 * Plays through Steam's own audio when the Web Audio context is still blocked
 * (it needs a user gesture, which an in-game toast never has). Returns whether it was handed off.
 */
function playThroughSteam(name, volume) {
    try {
        const audio = steamGlobals.SteamClient?.Audio;
        if (typeof audio?.PlayAudioURL !== 'function')
            return false;
        audio.PlayAudioURL(SOUND_SAMPLES[name] ?? renderWavUrl(name, volume));
        return true;
    }
    catch (error) {
        console.warn('[AchievementCustomizer] Steam audio fallback failed', error);
        return false;
    }
}
/** Creates the audio context early and resumes it on the first input, so later toasts can play. */
function primeAudio() {
    const unlock = () => {
        try {
            const Context = window.AudioContext ?? window.webkitAudioContext;
            if (!Context)
                return;
            audioContext = audioContext ?? new Context();
            if (audioContext.state === 'suspended')
                void audioContext.resume();
        }
        catch (error) {
            console.warn('[AchievementCustomizer] Could not prepare audio', error);
        }
    };
    const events = ['pointerdown', 'keydown', 'touchstart', 'gamepadconnected'];
    events.forEach((name) => window.addEventListener(name, unlock, true));
    unlock();
    return () => events.forEach((name) => window.removeEventListener(name, unlock, true));
}
let lastAudioPath = 'aucun son joué';
/** One-line audio status shown in the panel, to diagnose silent toasts. */
function audioStatus() {
    return `Audio: contexte ${audioContext?.state ?? 'absent'} t=${audioContext ? audioContext.currentTime.toFixed(1) : '-'}s · dernier son: ${lastAudioPath}`;
}
let keepAlive;
/**
 * Keeps the audio output awake with an inaudible tone: an idle output device
 * can swallow the start of the first sound played after a long pause.
 */
function startKeepAlive(context) {
    if (keepAlive === context)
        return;
    try {
        const oscillator = context.createOscillator();
        const level = context.createGain();
        oscillator.frequency.value = 40;
        level.gain.value = 0.00005;
        oscillator.connect(level).connect(context.destination);
        oscillator.start();
        keepAlive = context;
    }
    catch (error) {
        console.warn('[AchievementCustomizer] Could not keep audio awake', error);
    }
}
/** Creates and resumes the audio context now (call from a click or panel open), so the first toast finds it running. */
function warmUpAudio() {
    try {
        const Context = window.AudioContext ?? window.webkitAudioContext;
        if (!Context)
            return;
        audioContext = audioContext ?? new Context();
        startKeepAlive(audioContext);
        getMasterBus(audioContext, getCurrentSettings().soundVolume);
        if (audioContext.state === 'suspended')
            void audioContext.resume();
        // Decode the MP3 samples ahead of time so the first toast plays at once.
        for (const sample of Object.keys(SOUND_SAMPLES)) {
            loadSample(audioContext, sample).catch(() => {
                delete sampleBuffers[sample];
            });
        }
    }
    catch (error) {
        console.warn('[AchievementCustomizer] Could not warm up audio', error);
    }
}
/** Plays the chosen sound; 'default' (Steam's own sound) and failures are silent. */
function playAchievementSound(name, volume = 100) {
    const notes = SOUND_NOTES[name];
    if (!notes && !SOUND_SAMPLES[name])
        return;
    try {
        const Context = window.AudioContext ?? window.webkitAudioContext;
        if (!Context)
            return;
        audioContext = audioContext ?? new Context();
        const context = audioContext;
        startKeepAlive(context);
        const play = () => {
            try {
                if (!notes) {
                    playSample(context, name, volume);
                    return;
                }
                const origin = context.currentTime + 0.1;
                for (const [frequency, start, length, wave, gain] of notes) {
                    const oscillator = context.createOscillator();
                    const envelope = context.createGain();
                    oscillator.type = wave;
                    oscillator.frequency.value = frequency;
                    envelope.gain.setValueAtTime(0.0001, origin + start);
                    envelope.gain.exponentialRampToValueAtTime(gain, origin + start + 0.01);
                    envelope.gain.exponentialRampToValueAtTime(0.0001, origin + start + length);
                    oscillator.connect(envelope).connect(getMasterBus(context, volume));
                    oscillator.start(origin + start);
                    oscillator.stop(origin + start + length + 0.05);
                }
            }
            catch (error) {
                console.warn('[AchievementCustomizer] Could not play sound', error);
            }
        };
        if (context.state === 'running') {
            lastAudioPath = `Web Audio (direct) [${lastAudioPath.startsWith('TOAST') ? 'depuis le TOAST' : 'depuis le menu'}] vol=${volume} gain=${masterBus ? masterBus.gain.value : '?'} t=${context.currentTime.toFixed(2)} à ${new Date().toLocaleTimeString()}`;
            play();
            return;
        }
        // resume() is asynchronous: wait for it (briefly) instead of reading the
        // state right away, otherwise the first toast always misses the context.
        const fallback = () => {
            if (playThroughSteam(name, volume)) {
                lastAudioPath = `repli Steam (contexte ${context.state})`;
                return;
            }
            lastAudioPath = `Web Audio différé (contexte ${context.state})`;
            play();
        };
        const timeout = new Promise((resolve) => setTimeout(() => resolve(false), 1500));
        const resumed = context.resume().then(() => context.state === 'running');
        Promise.race([resumed, timeout])
            .then((running) => {
            if (running) {
                lastAudioPath = 'Web Audio (après reprise)';
                play();
            }
            else
                fallback();
        })
            .catch(fallback);
    }
    catch (error) {
        console.warn('[AchievementCustomizer] Could not play sound', error);
    }
}
/** Renders one achievement toast with the given theme. */
function AchievementToast({ achievement, settings: rawSettings, mode, edgeOf, onActivate, }) {
    const settings = SP_REACT.useMemo(() => sanitizeSettings(rawSettings), [rawSettings]);
    const rootRef = SP_REACT.useRef(null);
    const [edge, setEdge] = SP_REACT.useState(undefined);
    const [compact, setCompact] = SP_REACT.useState(false);
    const [imageFailed, setImageFailed] = SP_REACT.useState(false);
    // Runs before first paint so the entrance already knows which edge it comes
    // from, and whether the toast window is the stock 80px one.
    SP_REACT.useLayoutEffect(() => {
        const root = rootRef.current;
        if (mode !== 'live' || !root)
            return;
        const anchor = edgeOf?.(root);
        if (anchor) {
            const vertical = anchor.top ? 'top' : 'bottom';
            const horizontal = anchor.left ? 'left' : 'right';
            setEdge(`${vertical} ${horizontal}${anchor.inGame ? ' ingame' : ''}`);
        }
        const height = root.parentElement?.clientHeight ?? 0;
        if (height > 0 && height < 100)
            setCompact(true);
    }, [mode, edgeOf]);
    // Custom sound: plays once when a live toast appears (not for progress updates).
    SP_REACT.useEffect(() => {
        if (mode === 'live' && achievement.achieved !== false) {
            lastAudioPath = `TOAST ${new Date().toLocaleTimeString()} son=${settings.sound} vol=${settings.soundVolume} → pas de lecture`;
            // The settings this toast was rendered with can predate the saved ones
            // (plugin just reloaded), so read the stored sound just before playing.
            getSettings()
                .then((stored) => {
                const fresh = sanitizeSettings(stored);
                setCurrentSettings(fresh);
                return fresh;
            })
                .catch(() => settings)
                .then((fresh) => {
                lastAudioPath = `TOAST ${new Date().toLocaleTimeString()} son=${fresh.sound} vol=${fresh.soundVolume} → pas de lecture`;
                playAchievementSound(fresh.sound, fresh.soundVolume);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const tier = rarityTier(achievement.globalPercent, settings.rarityEffects);
    const css = SP_REACT.useMemo(() => buildToastCss(settings, tier), [settings, tier]);
    const { progress } = achievement;
    const shownProgress = !achievement.achieved && progress && progress.max > progress.min
        ? progress
        : null;
    const fillPercent = shownProgress
        ? Math.min(100, Math.max(0, ((shownProgress.current - shownProgress.min) /
            (shownProgress.max - shownProgress.min)) *
            100))
        : 0;
    const classes = ['ac-toast'];
    if (mode === 'preview')
        classes.push('ac-preview');
    if (compact)
        classes.push('ac-compact');
    if (tier !== 'none')
        classes.push(`ac-${tier}`);
    if (hasDecorationBackground(settings.decorativeElements)) {
        classes.push('ac-decoration-space');
    }
    const cardClass = settings.popupAnimation
        ? `ac-card ac-in-${settings.entranceStyle}`
        : 'ac-card';
    const pill = achievement.globalPercent > 0 ? (SP_JSX.jsx("span", { className: tier === 'none' ? 'ac-pill ac-pct' : 'ac-pill', children: formatPercent(achievement.globalPercent) })) : null;
    return (SP_JSX.jsxs("div", { ref: rootRef, className: classes.join(' '), "data-edge": edge, style: cssTokens(settings), onClick: onActivate, children: [SP_JSX.jsx("style", { children: css }), SP_JSX.jsxs("div", { className: cardClass, children: [SP_JSX.jsx(DecorationLayer, { variant: settings.decorativeElements }), SP_JSX.jsxs("div", { className: "ac-icon", children: [achievement.image && !imageFailed ? (SP_JSX.jsx("img", { src: achievement.image, alt: "", onError: () => {
                                    setImageFailed(true);
                                } })) : (SP_JSX.jsx("div", { className: "ac-icon-fallback", children: SP_JSX.jsx(Badge, {}) })), SP_JSX.jsx("div", { className: "ac-ring" })] }), SP_JSX.jsxs("div", { className: "ac-text", children: [SP_JSX.jsxs("div", { className: "ac-eyebrow", children: [SP_JSX.jsx(Badge, {}), SP_JSX.jsx("span", { className: "ac-eyebrow-label", children: shownProgress ? 'Achievement progress' : UNLOCK_LABEL[tier] }), pill] }), SP_JSX.jsx("div", { className: "ac-title", children: achievement.name }), shownProgress ? (SP_JSX.jsxs("div", { className: "ac-progress", children: [SP_JSX.jsx("div", { className: "ac-bar", children: SP_JSX.jsx("div", { className: "ac-fill", style: { width: `${fillPercent}%` } }) }), SP_JSX.jsxs("span", { className: "ac-count", children: [formatCount(shownProgress.current), " /", ' ', formatCount(shownProgress.max)] })] })) : (SP_JSX.jsx("div", { className: "ac-desc", children: achievement.description }))] })] })] }));
}

/**
 * @fileoverview The only file that touches Valve and Decky internals. Every
 * access is optional and failures fall back to stock Steam behavior.
 */
// EClientNotificationType.Achievement
const ACHIEVEMENT_TYPE = 5;
// Toast render locations: 1 = Gamepad UI popup, 3 = Quick Access notifications
// tray.
const POPUP_LOCATION = 1;
// Steam's notification sound ids; Decky's default is ToastMisc (6).
const SOUND_ACHIEVEMENT = 5;
// ProcessNotification's update kind: 0 = New, 1 = Update, 2 = Remove.
const NEW_NOTIFICATION = 0;
// ENotificationSource: 1 = client, 2 = server.
const CLIENT_SOURCE = 1;
const FIRST_TEST_NOTIFICATION_ID = 10000;
const CSS_CLASS_PATTERN$1 = /^[A-Za-z0-9_-]+$/;
// Decky and Steam install these on the shared context's global object.
const steamGlobals = globalThis;
/** Calls a protobuf getter; a missing or throwing getter reads as undefined. */
function readField(message, field) {
    try {
        return message[field]?.();
    }
    catch {
        return undefined;
    }
}
function stringField(message, field) {
    const value = readField(message, field);
    return typeof value === 'string' ? value : '';
}
function numberField(message, field) {
    const value = readField(message, field);
    return typeof value === 'number' ? value : 0;
}
function booleanField(message, field) {
    const value = readField(message, field);
    return typeof value === 'boolean' ? value : true;
}
// The popup notification's `data` is the deserialized
// CClientNotificationAchievement protobuf.
function readAchievement(data) {
    if (!data || typeof data !== 'object')
        return null;
    // Protobuf messages expose each field as a getter method.
    const message = data;
    const name = stringField(message, 'name');
    if (!name)
        return null;
    return {
        appId: numberField(message, 'appid'),
        id: stringField(message, 'achievement_id'),
        name,
        description: stringField(message, 'description'),
        image: stringField(message, 'image_url'),
        achieved: booleanField(message, 'achieved'),
        globalPercent: numberField(message, 'global_achieved_pct'),
        progress: {
            min: numberField(message, 'min_progress'),
            current: numberField(message, 'current_progress'),
            max: numberField(message, 'max_progress'),
        },
    };
}
function achievementFromProps(props) {
    const group = props.group;
    const first = group?.notifications?.[0];
    if (!group || !first)
        return null;
    if (group.decky) {
        // Decky toasts carry the ToastData they were created with.
        const data = first.data;
        return data?.achievementToast ?? null;
    }
    return group.eType === ACHIEVEMENT_TYPE ? readAchievement(first.data) : null;
}
function openAchievements(appId) {
    if (appId > 0)
        DFL.Navigation.Navigate(`/library/app/${appId}/achievements`);
}
/**
 * Renders achievement popups with AchievementToast and hands every other toast
 * back to Steam. Returns the uninstaller.
 *
 * Decky trampolines Valve's toast renderer and swaps its `component`; stacking
 * a patch on that same object lets this run first.
 */
function installToastRenderPatch() {
    const host = steamGlobals.__TOASTER_INSTANCE?.toastPatch?.object;
    if (!host || typeof host.component !== 'function') {
        console.warn('[AchievementCustomizer] Decky toast renderer not found; native toasts stay stock');
        return () => { };
    }
    const patch = DFL.replacePatch(host, 'component', (args) => {
        // Valve's renderer receives its props as the only argument.
        const props = args[0];
        if (!props || props.location !== POPUP_LOCATION)
            return DFL.callOriginal;
        const achievement = achievementFromProps(props);
        if (!achievement)
            return DFL.callOriginal;
        ensureMainWindowCss();
        // Keyed per notification so a follow-up toast remounts and replays its
        // entrance.
        return SP_REACT.createElement(DFL.ErrorBoundary, { key: props.group?.notifications?.[0]?.notificationID ?? achievement.id }, SP_REACT.createElement(AchievementToast, {
            achievement,
            settings: getCurrentSettings(),
            mode: 'live',
            edgeOf: readToastEdge,
            onActivate: () => {
                openAchievements(achievement.appId);
                props.onDismiss?.();
            },
        }));
    });
    return () => {
        patch.unpatch();
    };
}
/**
 * Applies the user's display duration to achievement toasts. Returns the
 * uninstaller.
 *
 * The toast host takes the next toast from PopNextToastNotification right
 * before rendering it and reads nToastDurationMS from that object.
 * (ProcessNotification is a bound, non-writable MobX action.)
 */
// Original `playSound` of Steam's achievement target, saved while muted.
let savedPlaySound;
/**
 * Silences (or restores) Steam's own achievement sound. The notification
 * target carries the `playSound` flag Steam checks before playing.
 */
function muteSteamSound(muted) {
    try {
        const target = steamGlobals.NotificationStore?.GetNotificationTargets?.()[ACHIEVEMENT_TYPE];
        if (!target)
            return;
        if (muted) {
            if (!savedPlaySound)
                savedPlaySound = { value: target.playSound };
            target.playSound = false;
        }
        else if (savedPlaySound) {
            target.playSound = savedPlaySound.value;
            savedPlaySound = undefined;
        }
    }
    catch (error) {
        console.warn('[AchievementCustomizer] Could not change Steam sound', error);
    }
}
function installDurationPatch() {
    const store = steamGlobals.NotificationStore;
    if (!store || typeof store.PopNextToastNotification !== 'function') {
        return () => { };
    }
    // The handler gets the call's arguments, then its return value.
    const patch = DFL.afterPatch(store, 'PopNextToastNotification', (...[, popped]) => {
        // The store's queue holds toast objects (or nothing).
        const toast = popped;
        if (toast && toast.eType === ACHIEVEMENT_TYPE && !toast.decky) {
            toast.nToastDurationMS = getCurrentSettings().duration;
        }
        return popped;
    });
    return () => {
        patch.unpatch();
    };
}
/**
 * Sends a real achievement notification through Steam's own pipeline (same
 * sound, renderer and duration as an unlock) without adding it to the tray.
 * Falls back to a Decky toast that the render patch also handles.
 */
function fireTestAchievement(achievement) {
    const store = steamGlobals.NotificationStore;
    const target = store?.GetNotificationTargets?.()[ACHIEVEMENT_TYPE];
    const fromObject = target?.proto?.fromObject;
    if (store?.ProcessNotification && target && fromObject) {
        const nowSeconds = Math.floor(Date.now() / 1000);
        try {
            const data = fromObject.call(target.proto, {
                achievement_id: achievement.id,
                appid: achievement.appId,
                name: achievement.name,
                description: achievement.description,
                image_url: achievement.image,
                achieved: achievement.achieved,
                rtime_unlocked: achievement.achieved ? nowSeconds : 0,
                min_progress: achievement.progress?.min ?? 0,
                current_progress: achievement.progress?.current ?? 0,
                max_progress: achievement.progress?.max ?? 0,
                global_achieved_pct: achievement.globalPercent,
            });
            const id = store.m_nNextTestNotificationID ?? FIRST_TEST_NOTIFICATION_ID;
            store.m_nNextTestNotificationID = id + 1;
            store.ProcessNotification({ ...target, fnTray: null }, {
                notificationID: id,
                rtCreated: nowSeconds,
                eType: ACHIEVEMENT_TYPE,
                nToastDurationMS: 0,
                eSource: CLIENT_SOURCE,
                data,
                bNewIndicator: true,
            }, NEW_NOTIFICATION);
            return;
        }
        catch (error) {
            console.warn('[AchievementCustomizer] native test toast failed, using Decky toast', error);
        }
    }
    const toast = {
        title: achievement.name,
        body: achievement.description,
        logo: SP_REACT.createElement('img', {
            src: achievement.image,
            style: { width: 40, height: 40, objectFit: 'cover' },
        }),
        sound: SOUND_ACHIEVEMENT,
        playSound: getCurrentSettings().sound === 'default',
        duration: getCurrentSettings().duration,
        achievementToast: achievement,
    };
    toaster.toast(toast);
}
// Undefined until the first lookup; null when the module is unavailable.
let cachedWindowClasses;
function resolveToastWindowClasses() {
    if (cachedWindowClasses !== undefined)
        return cachedWindowClasses;
    cachedWindowClasses = null;
    try {
        const classModule = DFL.findClassModule((candidate) => candidate.GamepadToastPlaceholder && candidate.GamepadToastPopup) ?? {};
        const pick = (key) => CSS_CLASS_PATTERN$1.test(classModule[key] ?? '') ? classModule[key] : '';
        const resolved = {
            placeholder: pick('GamepadToastPlaceholder'),
            inGame: pick('InGame'),
            positionTop: pick('PositionTop'),
            positionLeft: pick('PositionLeft'),
        };
        if (resolved.placeholder &&
            resolved.inGame &&
            resolved.positionTop &&
            resolved.positionLeft) {
            cachedWindowClasses = resolved;
        }
    }
    catch (error) {
        console.warn('[AchievementCustomizer] toast placeholder classes unavailable:', error);
    }
    return cachedWindowClasses;
}
/**
 * Returns the CSS that grows Steam's toast window to 320x128, or an empty
 * string when its classes cannot be resolved.
 *
 * Steam sizes the notification window from this placeholder (stock: 300x40
 * plus 20px padding on top/bottom/left, anchored 30px from the bottom; 50px
 * from the top; 10px closer to the edge in game). Growing the padding and
 * moving the anchors by the same amount keeps every stock toast at its exact
 * screen position while the window becomes 320x128 (320x152 in game, where the
 * card sits so close to the edge that ours has to be bottom-anchored instead).
 */
function buildToastWindowCss(settings) {
    const classes = resolveToastWindowClasses();
    if (!classes)
        return '';
    const placeholder = `.${classes.placeholder}`;
    const inGame = `.${classes.inGame}`;
    const top = `.${classes.positionTop}`;
    const left = `.${classes.positionLeft}`;
    return `
    ${placeholder} {
      height: 40px !important;
      padding: 44px 0 44px 20px !important;
      bottom: 6px !important;
    }
    ${placeholder}${left} { padding: 44px 20px 44px 0 !important; }
    ${placeholder}${inGame} {
      bottom: -46px !important;
      padding: 68px 0 44px 20px !important;
    }
    ${placeholder}${inGame}${left} { padding: 68px 20px 44px 0 !important; }
    ${placeholder}${top} { top: 26px !important; bottom: unset !important; }
    ${placeholder}${top}${inGame} { top: -26px !important; }
    ${customPositionCss(placeholder, settings?.position)}
  `;
}
/** Splits 'top-left' into its vertical and horizontal parts; null for 'default'. */
function splitPosition(position) {
    if (!position || position === 'default')
        return null;
    const [vertical, horizontal] = position.split('-');
    return { vertical, horizontal };
}
/**
 * Moves the toast window to one of the nine screen spots. The selector is
 * repeated to outrank Steam's position and in-game rules; every edge is set so
 * none of them can leak through.
 */
function customPositionCss(placeholder, position) {
    const spot = splitPosition(position);
    if (!spot)
        return '';
    const selector = placeholder.repeat(3);
    const rules = ['position: fixed !important;'];
    const transforms = [];
    if (spot.vertical === 'top') {
        rules.push('top: 26px !important; bottom: auto !important;');
    }
    else if (spot.vertical === 'bottom') {
        rules.push('bottom: 6px !important; top: auto !important;');
    }
    else {
        rules.push('top: 50% !important; bottom: auto !important;');
        transforms.push('translateY(-50%)');
    }
    if (spot.horizontal === 'left') {
        rules.push('left: 0 !important; right: auto !important; padding: 44px 20px 44px 0 !important;');
    }
    else if (spot.horizontal === 'right') {
        rules.push('right: 0 !important; left: auto !important; padding: 44px 0 44px 20px !important;');
    }
    else {
        rules.push('left: 50% !important; right: auto !important; padding: 44px 10px !important;');
        transforms.push('translateX(-50%)');
    }
    if (transforms.length > 0) {
        rules.push(`transform: ${transforms.join(' ')} !important;`);
    }
    return `${selector} { ${rules.join(' ')} }`;
}
// The popup element carries the same position classes as the placeholder; the
// in-game flag only exists on the placeholder in the main window.
function readToastEdge(root) {
    const classes = resolveToastWindowClasses();
    if (!classes)
        return { top: false, left: false, inGame: false };
    // A chosen position replaces Steam's corner (and its in-game offsets).
    const spot = splitPosition(getCurrentSettings().position);
    if (spot) {
        return {
            top: spot.vertical === 'top',
            left: spot.horizontal === 'left',
            inGame: false,
        };
    }
    const popupClasses = root.parentElement?.classList;
    const placeholder = mainDocument()?.querySelector(`.${classes.placeholder}`);
    return {
        top: popupClasses?.contains(classes.positionTop) ?? false,
        left: popupClasses?.contains(classes.positionLeft) ?? false,
        inGame: placeholder?.classList.contains(classes.inGame) ?? false,
    };
}

/**
 * @fileoverview CSS for Steam's main window: the achievements page theme and
 * the larger toast window.
 */

const CSS_CLASS_PATTERN = /^[A-Za-z0-9_-]+$/;
const STYLE_ID = 'achievement-customizer-main';
function classSelector(name) {
    return name && CSS_CLASS_PATTERN.test(name) ? `.${name}` : null;
}
function rowBackground(settings) {
    if (settings.bannerStyle === 'solid')
        return settings.primaryColor;
    if (settings.bannerStyle === 'glass') {
        return `rgb(${hexToRgbTriplet(settings.primaryColor)} / 0.8)`;
    }
    return `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`;
}
// Light rows take the theme's text color; mid-tone rows keep Steam's light
// text and get a shadow behind it.
function rowTextCss(row, settings) {
    if (isLightColor(settings.primaryColor)) {
        return `
      ${row} { color: ${settings.textColor} !important; }
      ${row} * { color: inherit !important; }`;
    }
    if (relativeLuminance(settings.primaryColor) > 0.4) {
        return `${row} { text-shadow: 0 1px 2px rgb(0 0 0 / 0.55) !important; }`;
    }
    return '';
}
// Themes the achievements list to match the toast. Class names come from
// Steam's CSS module map; when a key is missing that rule is skipped rather
// than guessed.
function buildAchievementPageCss(rawSettings) {
    const settings = sanitizeSettings(rawSettings);
    const row = classSelector(DFL.achievementClasses?.AchievementListItemBase);
    const image = classSelector(DFL.achievementClasses?.ImageContainer);
    const unlock = classSelector(DFL.achievementClasses?.UnlockContainer);
    const date = classSelector(DFL.achievementClasses?.UnlockDate);
    if (!row)
        return '';
    const accent = hexToRgbTriplet(settings.accentColor);
    const radius = ICON_RADIUS[settings.iconShape];
    const imageCss = image
        ? `
      ${image} {
        border-radius: ${radius} !important;
        border: 2px solid ${settings.accentColor} !important;
        box-shadow: 0 0 12px rgb(${accent} / 0.4) !important;
        overflow: hidden !important;
      }
      ${image} img { border-radius: ${radius} !important; }`
        : '';
    const labels = [unlock, date].filter((selector) => selector !== null);
    const labelCss = labels.length > 0
        ? `
      ${labels.join(', ')} {
        color: ${settings.accentColor} !important;
        font-weight: bold !important;
      }`
        : '';
    const unlockedCss = unlock
        ? `
      ${row}:has(${unlock}) {
        border-color: ${settings.accentColor} !important;
        animation: achievement-customizer-glow 3s ease-in-out infinite !important;
      }
      @keyframes achievement-customizer-glow {
        0%, 100% { box-shadow: 0 0 5px rgb(${accent} / 0.4); }
        50% {
          box-shadow: 0 0 20px rgb(${accent} / 0.6), 0 0 40px rgb(${accent} / 0.4);
        }
      }`
        : '';
    return `
    ${row} {
      background: ${rowBackground(settings)} !important;
      border: 1px solid rgb(${accent} / 0.3) !important;
      border-radius: ${settings.borderRadius}px !important;
      margin-bottom: 8px !important;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease !important;
    }
    ${rowTextCss(row, settings)}
    ${row}:hover, ${row}.gpfocus {
      border-color: ${settings.accentColor} !important;
      box-shadow: 0 0 15px rgb(${accent} / 0.4) !important;
      transform: scale(1.02) !important;
    }
    ${imageCss}
    ${labelCss}
    ${unlockedCss}
  `;
}
/**
 * Returns the Gamepad UI main window's document, or null before it exists.
 *
 * It is a separate document from the shared context this plugin runs in, but
 * same-origin, and Steam exposes it through the window store. Writing the
 * `<style>` directly is synchronous and can be checked again whenever it
 * matters, which survives Steam recreating the window.
 */
function mainDocument() {
    try {
        return (DFL.Router.WindowStore?.GamepadUIMainWindowInstance?.BrowserWindow
            ?.document ?? null);
    }
    catch {
        return null;
    }
}
let currentCss = '';
/**
 * Writes the plugin's main-window CSS if it is missing or stale. Passing
 * settings rebuilds the CSS first. Returns false while the window does not
 * exist yet.
 */
function ensureMainWindowCss(settings) {
    if (settings) {
        currentCss = buildAchievementPageCss(settings) + buildToastWindowCss(settings);
    }
    const windowDocument = mainDocument();
    if (!windowDocument?.head)
        return false;
    let style = windowDocument.getElementById(STYLE_ID);
    if (!currentCss.trim()) {
        style?.remove();
        return true;
    }
    if (!style) {
        style = windowDocument.createElement('style');
        style.id = STYLE_ID;
        windowDocument.head.appendChild(style);
    }
    if (style.textContent !== currentCss)
        style.textContent = currentCss;
    return true;
}
/** Removes the plugin's main-window CSS and forgets it. */
function removeMainWindowCss() {
    currentCss = '';
    mainDocument()?.getElementById(STYLE_ID)?.remove();
}

/**
 * @license
 * Palette icon from Font Awesome Free 5.15.4 by @fontawesome
 * (https://fontawesome.com), licensed under CC BY 4.0
 * (https://creativecommons.org/licenses/by/4.0/).
 */
const PALETTE_PATH = 'M204.3 5C104.9 24.4 24.8 104.3 5.2 203.4c-37 187 131.7 326.4 258.8 306.7 41.2-6.4 61.4-54.6 42.5-91.7-23.1-45.4 9.9-98.4 60.9-98.4h79.7c35.8 0 64.8-29.6 64.9-65.3C511.5 97.1 368.1-26.9 204.3 5zM96 320c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm32-128c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128-64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128 64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z';
/** The plugin's Quick Access tab icon, sized and colored like its label. */
function PaletteIcon() {
    return (SP_JSX.jsx("svg", { viewBox: "0 0 512 512", width: "1em", height: "1em", fill: "currentColor", stroke: "currentColor", strokeWidth: "0", children: SP_JSX.jsx("path", { d: PALETTE_PATH }) }));
}

const getSettings$1 = callable('get_settings');
const saveSettings = callable('save_settings');
const SAMPLE_IMAGE = 'https://shared.steamstatic.com/community_assets/images/apps/22380/ee1e9636c2b7d5add9123ef556c80fdd87ba1669.jpg';
const SAMPLES = {
    unlock: {
        appId: 0,
        id: 'sample_unlock',
        name: 'Master of the Entirely Unnecessary Grind',
        description: 'Unlock every collectible across all nine regions without fast travel',
        image: SAMPLE_IMAGE,
        achieved: true,
        globalPercent: 42.5,
    },
    rare: {
        appId: 0,
        id: 'sample_rare',
        name: 'Sharpshooter',
        description: 'Land 50 consecutive headshots without missing a single shot',
        image: SAMPLE_IMAGE,
        achieved: true,
        globalPercent: 4.2,
    },
    ultra: {
        appId: 0,
        id: 'sample_ultra',
        name: 'Diamond Hands',
        description: 'Finish the campaign on Nightmare without dying once',
        image: SAMPLE_IMAGE,
        achieved: true,
        globalPercent: 0.6,
    },
    progress: {
        appId: 0,
        id: 'sample_progress',
        name: 'Collector',
        description: 'Collect 10,000 gold',
        image: SAMPLE_IMAGE,
        achieved: false,
        globalPercent: 18,
        progress: { min: 0, current: 3456, max: 10000 },
    },
};
const PREVIEW = {
    ...SAMPLES.unlock,
    name: 'Achievement Unlocked',
    description: 'Preview of your theme',
};
const TEST_BUTTONS = [
    {
        sample: 'unlock',
        label: 'Achievement',
        description: 'Long title and description to check truncation',
    },
    { sample: 'rare', label: 'Rare', description: 'Under 10% of players' },
    { sample: 'ultra', label: 'Ultra Rare', description: 'Under 1% of players' },
    {
        sample: 'progress',
        label: 'Progress',
        description: 'Partial progress toward an achievement',
    },
];
function ColorButton({ color, label, onChange }) {
    const hsl = hexToHsl(color);
    const openPicker = () => {
        DFL.showModal(SP_JSX.jsx(DFL.ColorPickerModal, { title: label, defaultH: hsl.h, defaultS: hsl.s, defaultL: hsl.l, onConfirm: (value) => {
                const hex = hslToHex(value);
                // Untouched sliders return the rounded start color; keep the exact
                // one and the preset.
                const start = hslToHex(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
                if (hex && hex !== start)
                    onChange(hex);
            }, closeModal: () => { } }));
    };
    return (SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: openPicker, children: SP_JSX.jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [SP_JSX.jsx("div", { style: {
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        backgroundColor: color,
                        border: '1px solid rgba(255,255,255,0.3)',
                        flexShrink: 0,
                    } }), SP_JSX.jsx("span", { children: label })] }) }));
}
/** The plugin's Quick Access panel. */
function Panel() {
    const [audioInfo, setAudioInfo] = SP_REACT.useState(audioStatus());
    SP_REACT.useEffect(() => {
        warmUpAudio();
        const timer = setInterval(() => setAudioInfo(audioStatus()), 500);
        return () => clearInterval(timer);
    }, []);
    const [settings, setSettings] = SP_REACT.useState(getCurrentSettings());
    const [loaded, setLoaded] = SP_REACT.useState(false);
    // Steam's Reduce Motion setting reaches every CEF window as
    // prefers-reduced-motion.
    const [steamReducesMotion] = SP_REACT.useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    SP_REACT.useEffect(() => {
        getSettings$1()
            .then((stored) => {
            const clean = sanitizeSettings(stored);
            setSettings(clean);
            setCurrentSettings(clean);
            ensureMainWindowCss(clean);
        })
            .catch((error) => {
            console.error('[AchievementCustomizer] Failed to load settings', error);
        })
            .finally(() => {
            setLoaded(true);
        });
    }, []);
    const update = (partial) => {
        const next = sanitizeSettings({ ...settings, ...partial });
        setSettings(next);
        setCurrentSettings(next);
        saveSettings(next).catch((error) => {
            console.error('[AchievementCustomizer] Failed to save settings', error);
        });
        ensureMainWindowCss(next);
    };
    const applyPreset = (preset) => {
        update(preset === 'custom' ? { preset } : { preset, ...PRESETS[preset] });
    };
    if (!loaded)
        return null;
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSection, { title: "Preview", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(AchievementToast
                    // Keyed on the settings so every change replays the entrance.
                    , { achievement: PREVIEW, settings: settings, mode: "preview" }, JSON.stringify(settings)) }) }), SP_JSX.jsxs(DFL.PanelSection, { title: "Test Toasts", children: [TEST_BUTTONS.map((button) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", description: button.description, onClick: () => {
                                warmUpAudio();
                                fireTestAchievement(SAMPLES[button.sample]);
                            }, children: button.label }) }, button.sample))), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: '12px', opacity: 0.7, padding: '4px 0' }, children: "Test toasts go through Steam's own notification system. If nothing shows up, check Steam Settings \u203A Notifications \u203A Achievement Unlocked." }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Sound", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Achievement Sound", description: "Plays when you unlock. Preview plays on selection. Steam's own sound is muted when a custom one is chosen.", rgOptions: SOUND_OPTIONS, selectedOption: settings.sound, onChange: (option) => {
                            playAchievementSound(option.data, settings.soundVolume);
                            update({ sound: option.data });
                        } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: '11px', opacity: 0.7 }, children: audioInfo }) }), settings.sound !== 'default' && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "Volume", description: "Loudness of the custom achievement sound", value: settings.soundVolume, min: 0, max: 300, step: 25, onChange: (value) => {
                            playAchievementSound(settings.sound, value);
                            update({ soundVolume: value });
                        }, showValue: true, valueSuffix: "%" }) }))] }), SP_JSX.jsx(DFL.PanelSection, { title: "Theme", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Preset", rgOptions: PRESET_OPTIONS, selectedOption: settings.preset, onChange: (option) => {
                            applyPreset(option.data);
                        } }) }) }), SP_JSX.jsxs(DFL.PanelSection, { title: "Colors", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(ColorButton, { color: settings.primaryColor, label: "Primary", onChange: (color) => {
                                update({ primaryColor: color, preset: 'custom' });
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(ColorButton, { color: settings.secondaryColor, label: "Secondary", onChange: (color) => {
                                update({ secondaryColor: color, preset: 'custom' });
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(ColorButton, { color: settings.accentColor, label: "Accent / Glow", onChange: (color) => {
                                update({ accentColor: color, preset: 'custom' });
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(ColorButton, { color: settings.textColor, label: "Title Text", onChange: (color) => {
                                update({ textColor: color, preset: 'custom' });
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(ColorButton, { color: settings.descColor, label: "Description Text", onChange: (color) => {
                                update({ descColor: color, preset: 'custom' });
                            } }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Style", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Banner Style", rgOptions: BANNER_STYLE_OPTIONS, selectedOption: settings.bannerStyle, onChange: (option) => {
                                update({ bannerStyle: option.data });
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Icon Shape", rgOptions: ICON_SHAPE_OPTIONS, selectedOption: settings.iconShape, onChange: (option) => {
                                update({ iconShape: option.data });
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Icon Border", checked: settings.iconBorder, onChange: (checked) => {
                                update({ iconBorder: checked });
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Toast Shape", rgOptions: TOAST_SHAPE_OPTIONS, selectedOption: TOAST_SHAPE_OPTIONS.find((option) => option.data === settings.borderRadius)?.data ?? 8, onChange: (option) => {
                                update({ borderRadius: option.data });
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Decorations", description: "Animated overlay behind the toast text", rgOptions: DECORATION_OPTIONS, selectedOption: settings.decorativeElements, onChange: (option) => {
                                update({ decorativeElements: option.data });
                            } }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Effects", children: [steamReducesMotion && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Animate anyway", description: "Steam's Reduce Motion is on, so toasts use simple fades. Turn this on for full animations.", checked: settings.ignoreReducedMotion, onChange: (checked) => {
                                update({ ignoreReducedMotion: checked });
                            } }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Entrance Animation", description: "Animate the toast as it appears", checked: settings.popupAnimation, onChange: (checked) => {
                                update({ popupAnimation: checked });
                            } }) }), settings.popupAnimation && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Entrance Style", rgOptions: ENTRANCE_OPTIONS, selectedOption: settings.entranceStyle, onChange: (option) => {
                                update({ entranceStyle: option.data });
                            } }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Shine Sweep", description: "Light sweeps across the toast on arrival", checked: settings.shineEnabled, onChange: (checked) => {
                                update({ shineEnabled: checked });
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Glow Effect", checked: settings.glowEnabled, onChange: (checked) => {
                                update({ glowEnabled: checked });
                            } }) }), settings.glowEnabled && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "Glow Intensity", value: settings.glowIntensity, min: 5, max: 50, step: 5, onChange: (value) => {
                                update({ glowIntensity: value });
                            }, showValue: true }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Rarity Effects", description: "Gold for rare, diamond for ultra rare unlocks", checked: settings.rarityEffects, onChange: (checked) => {
                                update({ rarityEffects: checked });
                            } }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Position & Timing", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "Toast Position", description: "Where achievement toasts appear on screen", rgOptions: POSITION_OPTIONS, selectedOption: settings.position, onChange: (option) => {
                            update({ position: option.data });
                        } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "Display Duration", value: settings.duration / 1000, min: 3, max: 15, step: 1, onChange: (seconds) => {
                            update({ duration: seconds * 1000 });
                        }, showValue: true, valueSuffix: "s" }) })] }), SP_JSX.jsx(DFL.PanelSection, { title: "Reset", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => {
                            update(DEFAULT_SETTINGS);
                        }, children: "Reset to Default" }) }) })] }));
}

const getSettings = callable('get_settings');
const CSS_RETRY_MS = 5000;
// Sent by main.py after every save.
const SETTINGS_CHANGED = 'settings_changed';
// Decky Loader loads a plugin through the bundle's default export.
var index = definePlugin(() => {
    const unprimeAudio = primeAudio();
    warmUpAudio();
    const unpatchRender = installToastRenderPatch();
    const unpatchDuration = installDurationPatch();
    // When Decky reloads the plugin, the Quick Access menu can keep showing the
    // previous copy's panel, whose changes never reach this copy's toast hooks.
    // Every save is broadcast by the backend, so the hooks follow any panel.
    const onSettingsChanged = (stored) => {
        setCurrentSettings(sanitizeSettings(stored));
        ensureMainWindowCss(getCurrentSettings());
    };
    addEventListener(SETTINGS_CHANGED, onSettingsChanged);
    // The main window may not exist yet while Decky is still starting up.
    let retry;
    const applyCss = () => {
        if (ensureMainWindowCss(getCurrentSettings()) && retry) {
            clearInterval(retry);
            retry = undefined;
        }
    };
    getSettings()
        .then((stored) => {
        setCurrentSettings(sanitizeSettings(stored));
    })
        .catch((error) => {
        console.error('[AchievementCustomizer] Failed to load settings', error);
    })
        .finally(() => {
        if (!ensureMainWindowCss(getCurrentSettings())) {
            retry = setInterval(applyCss, CSS_RETRY_MS);
        }
    });
    return {
        name: 'Achievement Customizer',
        titleView: (SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "Achievement Customizer" })),
        content: SP_JSX.jsx(Panel, {}),
        icon: SP_JSX.jsx(PaletteIcon, {}),
        onDismount() {
            removeEventListener(SETTINGS_CHANGED, onSettingsChanged);
            if (retry)
                clearInterval(retry);
            unprimeAudio();
            unpatchRender();
            unpatchDuration();
            muteSteamSound(false);
            removeMainWindowCss();
        },
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
