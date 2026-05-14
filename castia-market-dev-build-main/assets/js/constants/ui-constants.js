/**
 * UI display constants: category labels, ordering maps, color schemes, and tag classes.
 * These are consumed by ui.js, panel.js, and data.js for rendering decisions.
 *
 * @module constants/ui-constants
 */

/**
 * Human-readable labels for each item category key.
 * Displayed in category filter dropdowns, badges, and chips.
 * @type {Object<string, string>}
 */
const CAT_LABELS = {
  "set-gear": "Set Gear",
  "enchanted-book": "Enchanted Book",
  spawner: "Spawner",
  "spawn-egg": "Spawn Egg",
  runestone: "Runestone",
  "unique-relic": "Unique Relic",
  resource: "Resource",
  utility: "Utility",
  "music-disc": "Music Disc",
  fish: "Fish",
  vanilla: "Vanilla",
  misc: "Misc",
};

/**
 * Numeric ordering for confidence levels, used for sort comparisons.
 * Lower number = higher confidence (sorts to top in descending order).
 * @type {Object<string, number>}
 */
const CONF_ORDER = { high: 0, good: 1, fair: 2, low: 3, unreliable: 4 };

/**
 * Color scheme for each seller accuracy label.
 * Each entry provides background, text, and border colors for badge styling.
 * @type {Object<string, {bg: string, color: string, border: string}>}
 */
const SELLER_COLORS = {
  Trustworthy: {
    bg: "rgba(70,214,121,.1)",
    color: "#46d679",
    border: "rgba(70,214,121,.25)",
  },
  Neutral: {
    bg: "rgba(133,138,160,.08)",
    color: "#858aa0",
    border: "rgba(133,138,160,.2)",
  },
  Suspicious: {
    bg: "rgba(237,184,74,.1)",
    color: "#edb84a",
    border: "rgba(237,184,74,.25)",
  },
  Flagged: {
    bg: "rgba(240,100,100,.1)",
    color: "#f06464",
    border: "rgba(240,100,100,.25)",
  },
};

/**
 * Numeric ordering for seller accuracy labels, used for sort comparisons.
 * Lower number = better seller (sorts to top in ascending order).
 * @type {Object<string, number>}
 */
const SELLER_ORDER = { Trustworthy: 0, Neutral: 1, Suspicious: 2, Flagged: 3 };

/**
 * CSS class names for skill tag badges on unique relics (e.g. Christmas Cap variants).
 * Keys match the skill name as it appears in bracket notation, e.g. "christmas cap [mining]".
 * @type {Object<string, string>}
 */
const SKILL_TAG_CLASS = {
  mining: "st-mining",
  woodcutting: "st-woodcutting",
  hunting: "st-hunting",
  farming: "st-farming",
  fishing: "st-fishing",
  smelting: "st-smelting",
  arcane: "st-arcane",
};

/**
 * Words that should remain lowercase in title-case conversion,
 * unless they are the first word in the string.
 * Follows standard English title case rules for articles, conjunctions, and prepositions.
 * @type {Set<string>}
 */
const LOWER_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "but",
  "or",
  "for",
  "nor",
  "on",
  "at",
  "to",
  "by",
  "in",
  "of",
  "up",
  "as",
  "vs",
  "via",
]);
