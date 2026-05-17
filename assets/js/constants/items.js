/**
 * Game item classification constants.
 * Contains all item sets used by data.js for categorising market listings
 * into display groups (set gear, enchanted books, fish, vanilla blocks, etc.).
 *
 * Build order matters: VANILLA_BLOCKS is assembled from the sub-sets defined
 * above it (WOOD_BLOCKS, STONE_BLOCKS, COLORED_BLOCKS, …), so this file must
 * be loaded as a single unit — do not reorder the declarations.
 *
 * @module constants/items
 */

/**
 * Returns a string of star characters based on the tier level
 * @param {number} tier - The tier level (0-3)
 * @returns {string} String containing 0-3 star characters ('', '★', '★★', '★★★')
 */
function tierStars(tier) {
  return ["", "★", "★★", "★★★"][tier] || "";
}

/**
 * Mithril gear sets available in the game
 * @type {string[]}
 */
const MITHRIL_SETS = [
  "Springtide",
  "Jolly",
  "Rosewood",
  "Nightfall",
  "Lunar",
  "Silversnow",
  "Prismatic",
  "Pandora",
  "Daydream",
  "Eldritch",
  "Aerondight",
  "Fluorite",
  "Witherbone",
  "Halgrabind",
  "Elven",
  "Erphis",
  "Llanakin",
  "Shoopon",
  "Athanasia",
  "Bogmath",
  "Curtana",
  "Kayran",
  "Malediction",
  "Oceanis",
  "Phezar",
  "Saprophyte",
  "Vurgohk",
  "Azertuan",
  "Hulia",
  "Igru",
  "Oldus",
  "Opulent",
  "Paragon",
  "Requinox",
  "Serpent",
  "Vertigo",
  "Manticore",
  "Mistle",
  "Posh",
];

/**
 * Valid gear suffixes for item categorization
 * @type {Set<string>}
 */
const GEAR_SUFFIXES = new Set([
  "helmet",
  "chestplate",
  "leggings",
  "boots",
  "sword",
  "axe",
  "pickaxe",
  "shovel",
  "hoe",
  "mace",
  "bow",
  "crossbow",
  "trident",
  "shield",
  "shears",
  "fishing rod",
  "staff",
  "wand",
  "elytra",
]);

/**
 * Exact matches for unique relics (no variants)
 * @type {Set<string>}
 */
const UNIQUE_RELICS_EXACT = new Set([
  "mistle toes",
  "posh wellies",
  "pet rock",
  "bamboozle",
]);

/**
 * Base names for unique relics with variants (e.g., "christmas cap [mining]")
 * @type {string[]}
 */
const UNIQUE_RELICS_VARIANT = ["christmas cap", "knowledge cap"];

/**
 * Available runestone types
 * @type {Set<string>}
 */
const RUNESTONES = new Set([
  "ruby's fire",
  "end veil",
  "sculk smite",
  "dune walker",
  "decapitation",
  "obby breaker",
  "deepfry",
  "comb cutter",
  "cat eyes",
  "bait",
  "potent poison",
  "mint breath",
  "magma walker",
  "vein miner",
  "treefeller",
  "collection",
  "fire react",
  "solar lure",
  "lunar lure",
]);

/**
 * Resource items (essences, ores, special materials)
 * @type {Set<string>}
 */
const RESOURCES = new Set([
  "mithril core",
  "mithril essence",
  "legendary essence",
  "epic essence",
  "rare essence",
  "common essence",
  "essence fragment",
  "essence fragments",
  "echo shard",
  "end crystal",
  "heavy core",
  "golden apple",
  "enchanted golden apple",
  "beacon",
  "wither skeleton skull",
  "nether star",
  "bottle o' enchanting",
  "budding amethyst",
  "heart of the sea",
  "netherite scrap",
  "netherite ingot",
  "ominous trial key",
  "trial key",
  "shulker shell",
  "dragon egg",
  "dragon head",
  "totem of undying",
  "nautilus shell",
  "prismarine shard",
  "prismarine crystals",
  "blaze rod",
  "blaze powder",
  "ghast tear",
  "magma cream",
  "slimeball",
  "spider eye",
  "fermented spider eye",
  "rabbit foot",
  "rabbit hide",
  "ancient debris",
  "block of netherite",
  "block of coal",
  "block of raw copper",
  "block of diamond",
  "block of emerald",
  "block of gold",
  "block of iron",
  "block of lapis lazuli",
  "block of raw copper",
  "block of raw gold",
  "block of raw iron",
  "block of redstone",
  "block of copper",
  "ink sac",
  "glow ink sac",
]);

/**
 * Utility items (quest items, tracking oils, mushrooms, etc.)
 * @type {Set<string>}
 */
const UTILITY = new Set([
  "elite quest crystal",
  "quest crystal",
  "ore seed",
  "spawner spinner",
  "uranium nugget",
  "tracking oil",
  "block tracking oil",
  "kill tracking oil",
  "fish tracking oil",
  "hostile mystery egg",
  "passive mystery egg",
  "glass cutter",
  "begrimed item",
  "historical codex",
  "liquid exp",
  "blessing dust",
  "mob catcher",
  "essence",
  "rename kit",
  "repair oil",
  "the grand scrambler",
  "elytra",
  "saddle",
  "lead",
  "name tag",
  "mystic mushroom",
  "mining mushroom",
  "woodcutting mushroom",
  "hunting mushroom",
  "farming mushroom",
  "fishing mushroom",
  "smelting mushroom",
  "arcane mushroom",
  "netherite upgrade",
  "mace",
  "sentry armor trim",
  "vex armor trim",
  "wild armor trim",
  "coast armor trim",
  "dune armor trim",
  "wayfinder armor trim",
  "raiser armor trim",
  "shaper armor trim",
  "host armor trim",
  "ward armor trim",
  "silence armor trim",
  "tide armor trim",
  "snout armor trim",
  "rib armor trim",
  "eye armor trim",
  "spire armor trim",
  "flow armor trim",
  "bolt armor trim",
  "dried ghast",
  "coal ore seed",
  "copper ore seed",
  "iron ore seed",
  "gold ore seed",
  "lapis ore seed",
  "redstone ore seed",
  "diamond ore seed",
  "emerald ore seed",
  "field masoned banner pattern",
  "bordure indented banner pattern",
  "flower charge banner pattern",
  "creeper charge banner pattern",
  "skull charge banner pattern",
  "thing banner pattern",
  "globe banner pattern",
  "snout banner pattern",
  "flow banner pattern",
  "guster banner pattern",
  "furnace distributor",
]);

/**
 * Fish items (including junk catches)
 * @type {Set<string>}
 */
const FISH = new Set([
  "anthias",
  "blue eel",
  "blue grenadier",
  "bream",
  "bubblefish",
  "catfish",
  "chromis",
  "coralfish",
  "cod",
  "fire eel",
  "gastropod shell",
  "gemfish",
  "golden wahoo",
  "green barb",
  "greenfish",
  "ice fish",
  "jellyfish",
  "pufferfish",
  "purple firefish",
  "rosy barb",
  "salmon",
  "shrimp",
  "slimefish",
  "starfish",
  "stingray",
  "sunfish",
  "token",
  "tropical fish",
  "trout",
  "tuna",
  "battery",
  "dirty sock",
  "metal can",
  "plastic bottle",
  "rope",
  "bucket of axolotl",
  "bucket of cod",
  "bucket of pufferfish",
  "bucket of salmon",
  "bucket of tadpole",
  "bucket of tropical fish",
  "bucket of sulfur cube",
]);

/**
 * Wood types used in block generation
 * @type {string[]}
 */
const WOOD_TYPES = [
  "oak",
  "spruce",
  "birch",
  "jungle",
  "acacia",
  "dark oak",
  "mangrove",
  "cherry",
  "pale oak",
];

/**
 * Fungal types used in block generation
 * @type {string[]}
 */
const FUNGAL_TYPES = ["crimson", "warped"];

/**
 * Generated wood-based blocks (logs, planks, etc.)
 * @type {Set<string>}
 */
const WOOD_BLOCKS = new Set([
  ...WOOD_TYPES.flatMap((t) => [
    `${t} log`,
    `${t} wood`,
    `${t} planks`,
    `${t} slab`,
    `${t} stairs`,
    `${t} fence`,
    `${t} fence gate`,
    `${t} door`,
    `${t} trapdoor`,
    `${t} pressure plate`,
    `${t} button`,
    `${t} sign`,
    `${t} hanging sign`,
    `${t} boat`,
    `${t} boat with chest`,
    `stripped ${t} log`,
    `stripped ${t} wood`,
  ]),

  "bamboo",
  "bamboo block",
  "block of bamboo",
  "stripped bamboo block",
  "block of stripped bamboo",
  "bamboo raft",
  "bamboo raft with chest",
  "bamboo mosaic",
  "bamboo mosaic slab",
  "bamboo mosaic stairs",
  "bamboo planks",
  "bamboo slab",
  "bamboo stairs",
  "bamboo fence",
  "bamboo fence gate",
  "bamboo door",
  "bamboo trapdoor",
  "bamboo pressure plate",
  "bamboo button",
  "bamboo sign",
  "bamboo hanging sign",

  ...FUNGAL_TYPES.flatMap((t) => [
    `${t} stem`,
    `${t} hyphae`,
    `${t} planks`,
    `${t} slab`,
    `${t} stairs`,
    `${t} fence`,
    `${t} fence gate`,
    `${t} door`,
    `${t} trapdoor`,
    `${t} pressure plate`,
    `${t} button`,
    `${t} sign`,
    `${t} hanging sign`,
    `stripped ${t} stem`,
    `stripped ${t} hyphae`,
  ]),
]);

// Stone and mineral blocks

/**
 * Stone blocks that have all three variants (slab, stairs, wall)
 * @type {string[]}
 */
const STONE_HAS_ALL = [
  "stone bricks",
  "mossy stone bricks",
  "cracked stone bricks",
  "cobblestone",
  "mossy cobblestone",
  "granite",
  "polished granite",
  "diorite",
  "polished diorite",
  "andesite",
  "polished andesite",
  "sandstone",
  "cut sandstone",
  "smooth sandstone",
  "red sandstone",
  "cut red sandstone",
  "smooth red sandstone",
  "bricks",
  "prismarine",
  "prismarine bricks",
  "dark prismarine",
  "end stone bricks",
  "nether bricks",
  "red nether bricks",
  "quartz bricks",
  "blackstone",
  "polished blackstone",
  "polished blackstone bricks",
  "cracked polished blackstone bricks",
  "cobbled deepslate",
  "polished deepslate",
  "deepslate bricks",
  "deepslate tiles",
  "cracked deepslate bricks",
  "cracked deepslate tiles",
  "tuff",
  "polished tuff",
  "tuff bricks",
  "chiseled tuff bricks",
  "mud bricks",
  "calcite",
  "dripstone block",
  "smooth basalt",
  "cut copper",
  "exposed cut copper",
  "weathered cut copper",
  "oxidized cut copper",
  "waxed cut copper",
  "waxed exposed cut copper",
  "waxed weathered cut copper",
  "waxed oxidized cut copper",
  "resin bricks",
];

/**
 * Stone blocks that have slab and stairs variants only
 * @type {string[]}
 */
const STONE_HAS_SLAB_STAIRS = [
  "stone",
  "smooth stone",
  "chiseled sandstone",
  "chiseled red sandstone",
  "quartz block",
  "smooth quartz",
  "chiseled quartz block",
  "quartz pillar",
  "purpur block",
  "purpur pillar",
  "chiseled deepslate",
  "chiseled tuff",
  "chiseled nether bricks",
  "cracked nether bricks",
  "chiseled stone bricks",
];

/**
 * Stone blocks that have slab variant only
 * @type {string[]}
 */
const STONE_HAS_SLAB_ONLY = [];

/**
 * Standalone stone blocks (no slab/stairs/wall variants)
 * @type {string[]}
 */
const STONE_STANDALONE = [
  "stone",
  "smooth stone",
  "granite",
  "polished granite",
  "diorite",
  "polished diorite",
  "andesite",
  "polished andesite",
  "cobblestone",
  "mossy cobblestone",
  "stone bricks",
  "mossy stone bricks",
  "cracked stone bricks",
  "chiseled stone bricks",
  "sandstone",
  "chiseled sandstone",
  "cut sandstone",
  "smooth sandstone",
  "red sandstone",
  "chiseled red sandstone",
  "cut red sandstone",
  "smooth red sandstone",
  "bricks",
  "prismarine",
  "prismarine bricks",
  "dark prismarine",
  "end stone bricks",
  "nether bricks",
  "red nether bricks",
  "cracked nether bricks",
  "chiseled nether bricks",
  "quartz block",
  "block of quartz",
  "nether quartz",
  "smooth quartz",
  "smooth quartz block",
  "chiseled quartz block",
  "quartz pillar",
  "quartz bricks",
  "purpur block",
  "purpur pillar",
  "blackstone",
  "polished blackstone",
  "polished blackstone bricks",
  "chiseled polished blackstone",
  "cracked polished blackstone bricks",
  "gilded blackstone",
  "deepslate",
  "cobbled deepslate",
  "polished deepslate",
  "deepslate bricks",
  "deepslate tiles",
  "chiseled deepslate",
  "cracked deepslate bricks",
  "cracked deepslate tiles",
  "tuff",
  "polished tuff",
  "tuff bricks",
  "chiseled tuff",
  "chiseled tuff bricks",
  "mud bricks",
  "calcite",
  "dripstone block",
  "smooth basalt",
  "basalt",
  "polished basalt",
  "magma block",
  "netherrack",
  "soul sand",
  "soul soil",
  "obsidian",
  "crying obsidian",
  "end stone",
  "lodestone",
  "respawn anchor",
  // Copper base blocks (no slab/stairs/wall — only cut copper has those)
  "copper block",
  "exposed copper",
  "weathered copper",
  "oxidized copper",
  "chiseled copper",
  "exposed chiseled copper",
  "weathered chiseled copper",
  "oxidized chiseled copper",
  "copper grate",
  "exposed copper grate",
  "weathered copper grate",
  "oxidized copper grate",
  "copper bulb",
  "exposed copper bulb",
  "weathered copper bulb",
  "oxidized copper bulb",
  "copper door",
  "exposed copper door",
  "weathered copper door",
  "oxidized copper door",
  "copper trapdoor",
  "exposed copper trapdoor",
  "weathered copper trapdoor",
  "oxidized copper trapdoor",
  "cut copper",
  "exposed cut copper",
  "weathered cut copper",
  "oxidized cut copper",
  // Waxed copper — base blocks (no slab/stairs/wall)
  "waxed block of copper",
  "waxed copper block",
  "waxed exposed copper",
  "waxed weathered copper",
  "waxed oxidized copper",
  "waxed chiseled copper",
  "waxed exposed chiseled copper",
  "waxed weathered chiseled copper",
  "waxed oxidized chiseled copper",
  "waxed copper grate",
  "waxed exposed copper grate",
  "waxed weathered copper grate",
  "waxed oxidized copper grate",
  "waxed copper bulb",
  "waxed exposed copper bulb",
  "waxed weathered copper bulb",
  "waxed oxidized copper bulb",
  "waxed copper door",
  "waxed exposed copper door",
  "waxed weathered copper door",
  "waxed oxidized copper door",
  "waxed copper trapdoor",
  "waxed exposed copper trapdoor",
  "waxed weathered copper trapdoor",
  "waxed oxidized copper trapdoor",
  // Waxed cut copper (these DO have slab+stairs+wall — generated in STONE_HAS_ALL above)
  "waxed cut copper",
  "waxed exposed cut copper",
  "waxed weathered cut copper",
  "waxed oxidized cut copper",
  // Resin
  "resin bricks",
  "block of resin",
  "resin clump",
  "chiseled resin bricks",
  // Other
  "nether brick fence", // fence, not wall
  "iron bars",
];

/**
 * Complete set of stone-based blocks (including slabs, stairs, walls)
 * @type {Set<string>}
 */
const STONE_BLOCKS = new Set([
  ...STONE_STANDALONE,
  // Generate slab + stairs + wall for all three-way blocks
  ...STONE_HAS_ALL.flatMap((t) => [`${t} slab`, `${t} stairs`, `${t} wall`]),
  // Generate slab + stairs only for two-way blocks
  ...STONE_HAS_SLAB_STAIRS.flatMap((t) => [`${t} slab`, `${t} stairs`]),
]);

// Color definitions

/**
 * Available dye colors
 * @type {string[]}
 */
const COLORS = [
  "white",
  "orange",
  "magenta",
  "light blue",
  "yellow",
  "lime",
  "pink",
  "gray",
  "light gray",
  "cyan",
  "purple",
  "blue",
  "brown",
  "green",
  "red",
  "black",
];

/**
 * Generated colored blocks (wool, concrete, etc.)
 * @type {Set<string>}
 */
const COLORED_BLOCKS = new Set([
  ...COLORS.flatMap((c) => [
    `${c} wool`,
    `${c} carpet`,
    `${c} concrete`,
    `${c} concrete powder`,
    `${c} terracotta`,
    `${c} glazed terracotta`,
    `${c} stained glass`,
    `${c} stained glass pane`,
    `${c} shulker box`,
    `${c} bed`,
    `${c} banner`,
    `${c} candle`,
    `${c} dye`,
    `${c} bundle`,
    `${c} harness`, // 1.21.5+
  ]),
  "terracotta",
  "shulker box",
  "glass",
  "glass pane",
  "tinted glass",
  "candle",
  "bundle",
]);

/**
 * Naturally occurring blocks (dirt, grass, sand, etc.)
 * @type {Set<string>}
 */
const NATURAL_BLOCKS = new Set([
  "dirt",
  "coarse dirt",
  "rooted dirt",
  "grass block",
  "dirt path",
  "podzol",
  "mycelium",
  "mud",
  "packed mud",
  "clay",
  "gravel",
  "sand",
  "red sand",
  "snow",
  "snow block",
  "ice",
  "packed ice",
  "blue ice",
  "powder snow",
  "bedrock",
]);

/**
 * Organic blocks (leaves, saplings, mushrooms, etc.)
 * @type {Set<string>}
 */
const ORGANIC_BLOCKS = new Set([
  ...WOOD_TYPES.flatMap((t) => [`${t} leaves`, `${t} sapling`]),
  "azalea leaves",
  "flowering azalea leaves",
  "azalea",
  "flowering azalea",
  "pale moss block",
  "pale moss carpet",
  "pale hanging moss",
  "nether wart block",
  "warped wart block",
  "shroomlight",
  "sponge",
  "wet sponge",
  "hay bale",
  "dried kelp block",
  "moss block",
  "moss carpet",
  "muddy mangrove roots",
  "mangrove roots",
  "mangrove propagule",
  "hanging roots",
  "dead bush",
  "fern",
  "large fern",
  "firefly bush",
  "vines",
  "weeping vines",
  "twisting vines",
  "cave vines",
  "glow lichen",
  "sculk vein",
  "big dripleaf",
  "small dripleaf",
  "spore blossom",
  "brown mushroom block",
  "red mushroom block",
  "mushroom stem",
]);

/**
 * Ore blocks (including deepslate variants)
 * @type {Set<string>}
 */
const ORE_BLOCKS = new Set([
  "coal ore",
  "deepslate coal ore",
  "copper ore",
  "deepslate copper ore",
  "raw copper",
  "iron ore",
  "deepslate iron ore",
  "raw iron",
  "gold ore",
  "deepslate gold ore",
  "nether gold ore",
  "raw gold",
  "lapis lazuli ore",
  "deepslate lapis lazuli ore",
  "redstone ore",
  "deepslate redstone ore",
  "diamond ore",
  "deepslate diamond ore",
  "emerald ore",
  "deepslate emerald ore",
  "nether quartz ore",
  "ancient debris",
]);

/**
 * Decorative blocks (torches, paintings, etc.)
 * @type {Set<string>}
 */
const DECORATIVE_BLOCKS = new Set([
  "torch",
  "soul torch",
  "lantern",
  "soul lantern",
  "glowstone",
  "sea lantern",
  "ochre froglight",
  "verdant froglight",
  "pearlescent froglight",
  "jack o lantern",
  "carved pumpkin",
  "item frame",
  "glow item frame",
  "painting",
  "flower pot",
  "bookshelf",
  "chiseled bookshelf",
  "decorated pot",
  "armor stand",
  "bell",
  "chain",
  "iron bars",
  "iron door",
  "iron trapdoor",
  "end rod",
  "lightning rod",
  "ladder",
  "scaffolding",
  "rail",
  "powered rail",
  "detector rail",
  "activator rail",
  "angler pottery sherd",
  "archer pottery sherd",
  "arms up pottery sherd",
  "blade pottery sherd",
  "brewer pottery sherd",
  "burn pottery sherd",
  "danger pottery sherd",
  "explorer pottery sherd",
  "flow pottery sherd",
  "friend pottery sherd",
  "guster pottery sherd",
  "heart pottery sherd",
  "heartbreak pottery sherd",
  "howl pottery sherd",
  "miner pottery sherd",
  "mourner pottery sherd",
  "plenty pottery sherd",
  "prize pottery sherd",
  "scrape pottery sherd",
  "sheaf pottery sherd",
  "shelter pottery sherd",
  "skull pottery sherd",
  "snort pottery sherd",
]);

/**
 * Redstone-related components
 * @type {Set<string>}
 */
const REDSTONE_BLOCKS = new Set([
  "redstone dust",
  "redstone torch",
  "redstone lamp",
  "redstone block",
  "redstone repeater",
  "redstone comparator",
  "lectern",
  "stone button",
  "stone pressure plate",
  "polished blackstone button",
  "polished blackstone pressure plate",
  "heavy weighted pressure plate",
  "light weighted pressure plate",
  "observer",
  "piston",
  "sticky piston",
  "slime block",
  "honey block",
  "dispenser",
  "dropper",
  "hopper",
  "comparator",
  "repeater",
  "tripwire hook",
  "daylight detector",
  "target",
  "sculk sensor",
  "calibrated sculk sensor",
  "sculk shrieker",
  "sculk catalyst",
  "sculk",
  "note block",
  "jukebox",
  "tnt",
  "lever",
  "minecart",
]);

/**
 * Storage and functional blocks
 * @type {Set<string>}
 */
const STORAGE_BLOCKS = new Set([
  "chest",
  "trapped chest",
  "ender chest",
  "barrel",
  "crafting table",
  "furnace",
  "blast furnace",
  "smoker",
  "campfire",
  "soul campfire",
  "anvil",
  "chipped anvil",
  "damaged anvil",
  "enchanting table",
  "grindstone",
  "stonecutter",
  "loom",
  "cartography table",
  "fletching table",
  "smithing table",
  "brewing stand",
  "cauldron",
  "composter",
  "beehive",
  "bee nest",
  "crafter",
  // Trial chambers
  "trial spawner",
  "vault",
]);

/**
 * Plant items (crops, flowers, etc.)
 * @type {Set<string>}
 */
const PLANT_ITEMS = new Set([
  // Food plants
  "wheat",
  "wheat seeds",
  "carrot",
  "potato",
  "poisonous potato",
  "beetroot",
  "beetroot seeds",
  "melon",
  "melon seeds",
  "pumpkin",
  "pumpkin seeds",
  "nether wart",
  "cocoa beans",
  "sugar cane",
  "bamboo",
  "cactus",
  "chorus fruit",
  "popped chorus fruit",
  "chorus flower",
  "sweet berries",
  "glow berries",
  "kelp",
  "torchflower",
  "torchflower seeds",
  "pitcher pod",
  "pitcher plant",
  // Flower blocks
  "dandelion",
  "poppy",
  "blue orchid",
  "allium",
  "azure bluet",
  "red tulip",
  "orange tulip",
  "white tulip",
  "pink tulip",
  "oxeye daisy",
  "cornflower",
  "lily of the valley",
  "wither rose",
  "sunflower",
  "lilac",
  "rose bush",
  "peony",
  "open eyeblossom",
  "closed eyeblossom",
  "wildflowers", // 1.21.5+
  "cactus flower", // 1.21.5+
  "bush", // 1.21.5+
  "pink petals",
  "cherry blossom petals",
  "leaf litter",
  // Other plant blocks
  "lily pad",
  "grass",
  "short grass",
  "short dry grass",
  "tall dry grass",
  "tall grass",
  "seagrass",
  "tall seagrass",
  "sea pickle",
  "spore blossom",
  "brown mushroom",
  "red mushroom",
  // Nether fungi and flora
  "crimson fungus",
  "warped fungus",
  "crimson roots",
  "warped roots",
  "crimson nylium",
  "warped nylium",
  "nether sprouts",
  // Mangrove propagule (sapling equivalent)
  "mangrove propagule",
]);

/**
 * Food and consumable items
 * @type {Set<string>}
 */
const FOOD_ITEMS = new Set([
  "apple",
  "baked potato",
  "bread",
  "cake",
  "cookie",
  "pumpkin pie",
  "melon slice",
  "dried kelp",
  "mushroom stew",
  "beetroot soup",
  "rabbit stew",
  "suspicious stew",
  "bowl",
  // Meat items
  "raw beef",
  "steak",
  "raw porkchop",
  "cooked porkchop",
  "raw chicken",
  "cooked chicken",
  "raw mutton",
  "cooked mutton",
  "raw rabbit",
  "cooked rabbit",
  "rotten flesh",
  // Seafood items
  "cod",
  "cooked cod",
  "salmon",
  "cooked salmon",
  "tropical fish",
  "pufferfish",
  "raw cod",
  "raw salmon",
  // Other
  "spider eye",
  "poisonous potato",
  "milk bucket",
  "water bucket",
  "lava bucket",
  "powder snow bucket",
  "bucket",
  "egg",
  "blue egg",
  "brown egg",
  "honey bottle",
  "honeycomb",
  "honeycomb block",
  "sugar",
  "golden apple",
  "enchanted golden apple",
  "golden carrot",
  "glistering melon slice",
  "glow berries",
  "sweet berries",
  // Potions
  "potion",
  "splash potion",
  "lingering potion",
  "tipped arrow",
  "ominous bottle",
  "glass bottle",
]);

/**
 * Materials and crafting items
 * @type {Set<string>}
 */
const MATERIAL_ITEMS = new Set([
  // Basic crafting materials
  "stick",
  "flint",
  "paper",
  "leather",
  "string",
  "feather",
  "gunpowder",
  "clay ball",
  "brick",
  "nether brick",
  "coal",
  "charcoal",
  "quartz",
  "lapis lazuli",
  "diamond",
  "emerald",
  "bone meal",
  "snowball",
  // Ingots and nuggets
  "gold nugget",
  "iron nugget",
  "copper ingot",
  "gold ingot",
  "iron ingot",
  "resin brick",
  // Book items
  "book",
  "book and quill",
  "written book",
  // Navigation items
  "map",
  "empty map",
  "compass",
  "clock",
  "spyglass",
  "recovery compass",
  // Projectile items
  "arrow",
  "spectral arrow",
  // Combat and miscellaneous items
  "fire charge",
  "wind charge",
  "breeze rod",
  "ender pearl",
  "eye of ender",
  // Mob drops
  "bone",
  "phantom membrane",
  "turtle scute",
  "armadillo scute",
  "rabbit foot",
  "rabbit hide",
  "prismarine shard",
  "prismarine crystals",
  "blaze rod",
  "blaze powder",
  "magma cream",
  "slimeball",
  "ghast tear",
  "ink sac",
  "glow ink sac",
  "feather",
  "gunpowder",
  // Amethyst
  "amethyst shard",
  // Echo
  "echo shard",
  // Misc
  "glowstone dust",
  "nether star",
  "bowl",
  "bucket",
  "music disc 13",
  "music disc cat",
  "music disc blocks",
  "music disc chirp",
  "music disc far",
  "music disc mall",
  "music disc mellohi",
  "music disc stal",
  "music disc strad",
  "music disc ward",
  "music disc 11",
  "music disc wait",
  "music disc otherside",
  "music disc 5",
  "music disc pigstep",
  "music disc relic",
  "music disc creator",
  "music disc creator music box",
  "music disc precipice",
  "disc fragment",
]);

/**
 * Dye items (including bone meal as white dye source)
 * @type {Set<string>}
 */
const DYE_ITEMS = new Set([
  ...COLORS.map((c) => `${c} dye`),
  "bone meal", // white dye source
]);

/**
 * Ocean and aquatic blocks
 * @type {Set<string>}
 */
const OCEAN_BLOCKS = new Set([
  "kelp",
  "dried kelp block",
  "sea pickle",
  "seagrass",
  "tall seagrass",
  "sponge",
  "wet sponge",
  "conduit",
  ...["tube", "brain", "bubble", "fire", "horn"].flatMap((c) => [
    `${c} coral`,
    `${c} coral block`,
    `${c} coral fan`,
    `dead ${c} coral`,
    `dead ${c} coral block`,
    `dead ${c} coral fan`,
  ]),
]);

/**
 * Caves and amethyst blocks
 * @type {Set<string>}
 */
const CAVES_BLOCKS = new Set([
  "block of amethyst",
  "amethyst cluster",
  "large amethyst bud",
  "medium amethyst bud",
  "small amethyst bud",
  "amethyst shard",
  "budding amethyst",
  "tuff",
  "calcite",
  "dripstone block",
  "pointed dripstone",
  "rooted dirt",
  "hanging roots",
  "moss block",
  "moss carpet",
  "spore blossom",
  "glow lichen",
  "sculk",
  "sculk vein",
  "sculk sensor",
  "calibrated sculk sensor",
  "sculk catalyst",
  "sculk shrieker",
]);

/**
 * Vanilla tools (swords, pickaxes, etc.)
 * @type {Set<string>}
 */
const VANILLA_TOOLS = new Set([
  ...["wooden", "stone", "iron", "golden", "diamond", "netherite"].flatMap(
    (m) => [
      `${m} sword`,
      `${m} pickaxe`,
      `${m} axe`,
      `${m} shovel`,
      `${m} hoe`,
    ],
  ),
  "bow",
  "crossbow",
  "trident",
  "shield",
  "mace",
  "flint and steel",
  "shears",
  "fishing rod",
  "carrot on a stick",
  "warped fungus on a stick",
  "brush",
  "spyglass",
]);

/**
 * Vanilla armor items
 * @type {Set<string>}
 */
const VANILLA_ARMOR = new Set([
  ...["leather", "chainmail", "iron", "golden", "diamond", "netherite"].flatMap(
    (m) => [
      `${m} helmet`,
      `${m} chestplate`,
      `${m} leggings`,
      `${m} boots`,
      `${m} cap`,
      `${m} tunic`,
      `${m} pants`,
    ],
  ),
  // Horse armor
  "leather horse armor",
  "iron horse armor",
  "golden horse armor",
  "diamond horse armor",
  "chainmail horse armor",
  "netherite horse armor",
  // Special
  "turtle helmet",
  "elytra",
  // Wolf armor (1.21.5+) — one per color
  ...COLORS.map((c) => `${c} harness`),
  "harness",
]);

/**
 * Mob drop items
 * @type {Set<string>}
 */
const MOB_DROPS = new Set([
  "bone",
  "bone block",
  "cobweb",
  "wither skeleton skull",
  "zombie head",
  "skeleton skull",
  "creeper head",
  "player head",
  "turtle egg",
  "frogspawn",
  "sniffer egg",
  "rotten flesh",
  "ender pearl",
  "shulker shell",
]);

/**
 * Miscellaneous vanilla items
 * @type {Set<string>}
 */
const VANILLA_MISCELLANEOUS = new Set([
  "firework rocket",
  "firework star",
  "creaking heart",
]);

/**
 * Complete set of vanilla Minecraft items (blocks, items, etc.)
 * @type {Set<string>}
 */
const VANILLA_BLOCKS = new Set([
  ...WOOD_BLOCKS,
  ...STONE_BLOCKS,
  ...NATURAL_BLOCKS,
  ...ORGANIC_BLOCKS,
  ...ORE_BLOCKS,
  ...COLORED_BLOCKS,
  ...DECORATIVE_BLOCKS,
  ...REDSTONE_BLOCKS,
  ...STORAGE_BLOCKS,
  ...PLANT_ITEMS,
  ...FOOD_ITEMS,
  ...MATERIAL_ITEMS,
  ...DYE_ITEMS,
  ...OCEAN_BLOCKS,
  ...CAVES_BLOCKS,
  ...VANILLA_TOOLS,
  ...VANILLA_ARMOR,
  ...MOB_DROPS,
  ...VANILLA_MISCELLANEOUS,
]);
