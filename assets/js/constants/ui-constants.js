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

const CONF_ORDER = { high: 0, good: 1, fair: 2, low: 3, unreliable: 4 };

const SELLER_ORDER = { Trustworthy: 0, Neutral: 1, Suspicious: 2, Flagged: 3 };

const SKILL_TAG_CLASS = {
  mining: "st-mining",
  woodcutting: "st-woodcutting",
  hunting: "st-hunting",
  farming: "st-farming",
  fishing: "st-fishing",
  smelting: "st-smelting",
  arcane: "st-arcane",
};

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
