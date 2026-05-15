/**
 * State management and persistence for the application.
 * Handles localStorage state, UI state persistence, prismatic tier caching,
 * and hash-based item tracking.
 */

/** @type {Object[]} Raw price rows fetched from the Castia Worker */
let allPrices = [],
  /** @type {Object[]} Enriched price rows with parsed displayName, category, tier, etc. */
  enriched = [],
  /** @type {Object[]} Currently filtered + sorted subset of enriched (shown in table/cards) */
  filtered = [];
/** @type {Object<string, Object>} Seller data keyed by lowercase seller name */
let allSellers = {};
/** @type {string} Current view mode: 'table' or 'card' */
let vw = "table",
  /** @type {string} Current sort column key (e.g. 'median', 'samples', 'displayName') */
  sc = "last_seen",
  /** @type {string} Current sort direction: 'asc' or 'desc' */
  sd = "desc",
  /** @type {string} Last seen sort direction, independent from the active sort column */
  lastSeenDir = "desc",
  /** @type {number} Current pagination page (1-based) */
  pg = 1;
/** @type {number} Max sample count across all enriched rows (used for sample bar scaling) */
let maxSamples = 1,
  /** @type {Date|null} Timestamp of the last successful data fetch */
  lastLoaded = null,
  /** @type {number|null} Debounce timer ID for filter/search changes */
  debT = null;
/** @type {string|null} Raw key of the currently open detail panel item */
let activeKey = null;
/** @type {Object|null} Context object for the currently open detail panel */
let panelCtx = null;
/** @type {string} Sort mode for the detail panel listings ('newest'|'price_asc'|'price_desc'|'seller') */
let panelSort = "newest";
/** @type {boolean} Whether to include flagged/blacklisted seller listings in the panel */
let panelIncludeFlagged = false;
/** @type {boolean} Whether favorites-only filter is active */
let favOnly = false;
/** @type {boolean} Whether data saver mode is active (hides item images) */
let dataSaver = false;
/** @type {Set<string>} Set of favorited item raw keys */
let favSet = new Set();
/** @type {string[]} Up to 3 item raw keys selected for comparison */
let compareKeys = [];

const UI_STATE_KEY = "castia_ui_state_v4";
const UI_STATE_LEGACY_KEY = "castia_ui_state_v3";
const UI_STATE_SCHEMA = 4;
const UI_STATE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const PRISM_CACHE_KEY = "castia_prismatic_tiers_v1";
const PRISM_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Reads and parses a value from localStorage.
 * @param {string} key - The storage key
 * @returns {*} The parsed value or null if error/not found
 */
function _readLS(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch (_e) {
    return null;
  }
}

/**
 * Serializes and writes a value to localStorage.
 * @param {string} key - The storage key
 * @param {*} val - The value to store
 */
function _writeLS(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (_e) {}
}

/**
 * Removes a key from localStorage.
 * @param {string} key - The storage key
 */
function _removeLS(key) {
  try {
    localStorage.removeItem(key);
  } catch (_e) {}
}

/**
 * Reads UI state with schema + TTL validation and legacy fallback.
 * @returns {Object} Validated UI state object
 */
function _readUIState() {
  const now = Date.now();
  const current = _readLS(UI_STATE_KEY);
  if (
    current &&
    current.schema === UI_STATE_SCHEMA &&
    typeof current.ts === "number" &&
    now - current.ts <= UI_STATE_TTL
  ) {
    return current;
  }

  const legacy = _readLS(UI_STATE_LEGACY_KEY);
  if (legacy && typeof legacy === "object") {
    return legacy;
  }
  return {};
}

/**
 * Loads UI state from localStorage and applies it to the application.
 * Restores filters, view state, favorites, and comparisons.
 */
let _loadedUIState = null;
let _saveUIT = null;

// Debounce UI state saving to reduce localStorage writes during rapid changes
function scheduleSaveUIState() {
  clearTimeout(_saveUIT);
  _saveUIT = setTimeout(saveUIState, 300);
}

/**
 * Saves current UI state to localStorage.
 * Persists durable preferences only. Search, filters, and page are transient.
 */
function saveUIState() {
  _writeLS(UI_STATE_KEY, {
    schema: UI_STATE_SCHEMA,
    ts: Date.now(),
    vw,
    sc,
    sd,
    lastSeenDir, // View state: table/cards view, sort column, sort direction
    favOnly: !!favOnly,
    dataSaver: !!dataSaver, // UI toggle states
    fav: [...favSet],
    cmp: [...compareKeys], // Persist favorites and comparison selections
  });
}

/**
 * Applies loaded UI state from localStorage to the application.
 * Restores durable UI settings without reviving stale search/filter/page state.
 */
function applyLoadedUIState() {
  const st = _loadedUIState || {};
  if (st.vw === "card" || st.vw === "table") vw = st.vw;
  if (typeof st.sc === "string") sc = st.sc;
  if (st.sd === "asc" || st.sd === "desc") sd = st.sd;
  if (st.lastSeenDir === "asc" || st.lastSeenDir === "desc") {
    lastSeenDir = st.lastSeenDir;
  } else if (sc === "last_seen") {
    lastSeenDir = sd;
  }
  favOnly = !!st.favOnly;
  dataSaver = !!st.dataSaver;
  favSet = new Set(Array.isArray(st.fav) ? st.fav : []);
  compareKeys = Array.isArray(st.cmp) ? st.cmp.slice(0, 3) : [];
}

/**
 * Reads prismatic tier cache from localStorage.
 * @returns {Object|null} Cached prismatic tier data or null if invalid/expired
 */
function _readPrismaticCache() {
  const c = _readLS(PRISM_CACHE_KEY);
  if (!c || !c.ts || !c.byBase) return null;
  if (Date.now() - c.ts > PRISM_CACHE_TTL) return null;
  return c;
}

/**
 * Writes prismatic tier cache to localStorage.
 * @param {Object} byBase - Object mapping base keys to tier data arrays
 */
function _writePrismaticCache(byBase) {
  if (!byBase || typeof byBase !== "object") return;
  _writeLS(PRISM_CACHE_KEY, { ts: Date.now(), byBase });
}

/**
 * Gets the item key from the URL hash.
 * @returns {string|null} The item key or null if not present
 */
function getHashItemKey() {
  const h = String(location.hash || "").replace(/^#/, "");
  const m = h.match(/(?:^|&)item=([^&]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1] || "");
  } catch (_e) {
    return m[1] || null;
  }
}

/**
 * Sets the item key in the URL hash.
 * @param {string|null} key - The item key to set (null to remove)
 */
function setHashItemKey(key) {
  const k = key ? encodeURIComponent(String(key)) : "";
  if (!k) {
    if (location.hash && location.hash.includes("item="))
      history.replaceState(null, "", location.pathname + location.search);
    return;
  }
  history.replaceState(
    null,
    "",
    location.pathname + location.search + `#item=${k}`,
  );
}

/**
 * Application initialization - waits for render function to be defined
 * to prevent "render is not defined" error on initial load
 */
function initApp() {
  if (typeof render === "function") {
    _loadedUIState = _readUIState();
    applyLoadedUIState();
    _removeLS(UI_STATE_LEGACY_KEY);
    fetchAll(false);
    scheduleRefresh();
    setInterval(() => {
      const sUpd = $("sUpd");
      if (sUpd && lastLoaded) {
        sUpd.textContent = fmtT(lastLoaded);
      }
    }, 30000);
    // Init compare tooltip after data is loaded
    _idle(() => updateCmpTooltip());
    updateOverlayUI();
  } else {
    setTimeout(initApp, 100);
  }
}
