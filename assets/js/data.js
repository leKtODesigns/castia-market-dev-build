function fmt(n) {
  if (n == null || n === "") return "—";
  const v = +n;
  if (isNaN(v)) return "—";
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toLocaleString();
}

function fmtT(d) {
  if (!d) return "—";
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 86400 * 7) return Math.floor(s / 86400) + "d ago";
  return new Date(d).toLocaleDateString();
}

function esc(s) {
  return s
    ? String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
    : "";
}

function formatItemNameH(s) {
  return esc(s || "").replace(/(★+)/g, '<span class="iname-tier-stars">$1</span>');
}

function titleCase(str) {
  if (!str) return str;
  return str
    .split(" ")
    .map((w, i) => {
      const wl = w.toLowerCase();
      if (/^(?=[ivxlcdm]+$)[ivxlcdm]+$/i.test(w)) return w.toUpperCase();
      if (i > 0 && LOWER_WORDS.has(wl)) return wl;
      return wl.charAt(0).toUpperCase() + wl.slice(1);
    })
    .join(" ");
}

function isBadSeller(seller) {
  if (!seller) return false;
  const sd = allSellers[String(seller).toLowerCase()];
  return !!(sd && sd.is_blacklisted);
}

function getUnitPrice(l) {
  if (l == null) return 0;
  if (l.unit_price != null) return +l.unit_price || 0;
  const p = +l.price || 0,
    c = +l.count || 1;
  return c ? Math.round(p / c) : p;
}

function quantileSorted(sorted, p) {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p,
    lo = Math.floor(idx),
    hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (1 - (idx - lo)) + sorted[hi] * (idx - lo);
}

function statsFromListings(listings) {
  const vals = listings
    .map(getUnitPrice)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  const n = vals.length;
  if (!n) return { n: 0, median: 0, q1: 0, q3: 0 };
  return {
    n,
    median: Math.round(quantileSorted(vals, 0.5)),
    q1: Math.round(quantileSorted(vals, 0.25)),
    q3: Math.round(quantileSorted(vals, 0.75)),
  };
}

function confidenceFromSamples(n) {
  if (n >= 30) return "high";
  if (n >= 15) return "good";
  if (n >= 7) return "fair";
  if (n >= 3) return "low";
  return "unreliable";
}

function trendFromListings(listings) {
  const byTime = [...listings]
    .filter((l) => l.timestamp)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  if (byTime.length < 6) return "stable";
  const mid = Math.floor(byTime.length / 2);
  const old = statsFromListings(byTime.slice(0, mid)).median || 0;
  const neu = statsFromListings(byTime.slice(mid)).median || 0;
  if (!old || !neu) return "stable";
  if (neu > old * 1.1) return "up";
  if (neu < old * 0.9) return "down";
  return "stable";
}

function sellerRatingInfo(seller) {
  const sd = allSellers[String(seller || "").toLowerCase()];
  const isFlagged = !!(sd && sd.is_blacklisted);
  const label = isFlagged ? "Flagged" : sd?.accuracy_label || "Neutral";
  return {
    sd,
    label,
    order: SELLER_ORDER[label] ?? SELLER_ORDER.Neutral,
    isFlagged,
    isBlacklisted: !!sd?.is_blacklisted,
  };
}

function parseKey(raw) {
  if (!raw)
    return {
      displayName: "—",
      category: "misc",
      tier: 0,
      setName: null,
      rawKey: raw,
      variantSlug: null,
    };
  let baseKey = raw.trim(),
    tier = 0,
    variantSlug = null;
  const variantMatch = baseKey.match(/\|v:([^|]+)$/i);
  if (variantMatch) {
    variantSlug = (variantMatch[1] || "").trim().toLowerCase() || null;
    baseKey = baseKey.slice(0, baseKey.lastIndexOf("|v:")).trim();
  }
  const tierMatch = baseKey.match(/\|t([123])$/i);
  if (tierMatch) {
    tier = parseInt(tierMatch[1]);
    baseKey = baseKey.slice(0, baseKey.lastIndexOf("|t")).trim();
  }
  const kl = baseKey.toLowerCase();
  const klNoSuffix = kl
    .replace(/\s*\([\d.]+%\)\s*$/, "")
    .replace(/\s+(?:\d+|i{1,3}|iv|vi{0,3}|ix)$/i, "")
    .trim();

  // Handle book items specially - they have unique formatting and categorization
  if (kl.startsWith("book:")) {
    // Clean up book names and remove excessive whitespace
    const bookName = baseKey
      .replace(/^book:\s*/i, "")
      .replace(/^[^\w(]+/, "")
      .replace(/\s+/g, " ")
      .trim();
    return {
      displayName: "Book: " + titleCase(bookName),
      category: "enchanted-book",
      tier: 0,
      setName: null,
      rawKey: raw,
      variantSlug,
    };
  }

  // Exact runestone matches win before set-name inference so names like "Lunar Lure"
  // cannot be mistaken for the Lunar gear family.
  if (RUNESTONES.has(kl) || RUNESTONES.has(klNoSuffix))
    return {
      displayName: titleCase(baseKey),
      category: "runestone",
      tier: 0,
      setName: null,
      rawKey: raw,
      variantSlug,
    };

  // Check for Mithril set items (armor, tools, etc. from specific sets like Prismatic, Daydream, etc.)
  for (const setName of MITHRIL_SETS) {
    const prefix = setName.toLowerCase();
    if (kl === prefix || kl.startsWith(prefix + " ")) {
      const remainder = kl.slice(prefix.length).trim();
      const lastWord = remainder.split(" ").pop();
      // Match if it's a pure set name, or ends with a gear suffix (helmet, sword, etc.)
      if (
        remainder === "" ||
        GEAR_SUFFIXES.has(remainder) ||
        GEAR_SUFFIXES.has(lastWord)
      ) {
        let display = titleCase(baseKey);
        if (tier > 0) {
          // Prismatic sets show star tiers, others show T1/T2/T3 notation
          if (prefix === "prismatic") display += ` ${tierStars(tier)}`;
          else display += ` (T${tier})`;
        }
        return {
          displayName: display,
          category: "set-gear",
          tier,
          setName: titleCase(setName),
          rawKey: raw,
          variantSlug,
        };
      }
    }
  }

  // Handle unique relics (exact matches like "mistle toes")
  if (UNIQUE_RELICS_EXACT.has(kl))
    return {
      displayName: titleCase(baseKey),
      category: "unique-relic",
      tier: 0,
      setName: null,
      rawKey: raw,
      variantSlug,
    };

  // Handle unique relics with variants (like "christmas cap [mining]")
  if (UNIQUE_RELICS_VARIANT.some((r) => kl === r || kl.startsWith(r + " ["))) {
    const bracketMatch = baseKey.match(/^(.+?)\s*\[(.+)\]$/);
    if (bracketMatch) {
      const base = titleCase(bracketMatch[1]),
        skill = (bracketMatch[2] || "").trim().toLowerCase();
      const tagClass = SKILL_TAG_CLASS[skill] || null;
      return {
        displayName: base,
        category: "unique-relic",
        tier: 0,
        setName: null,
        rawKey: raw,
        skillTag: tagClass ? { text: titleCase(skill), cls: tagClass } : null,
        variantSlug: variantSlug || skill || null,
      };
    }
    return {
      displayName: titleCase(baseKey),
      category: "unique-relic",
      tier: 0,
      setName: null,
      rawKey: raw,
      skillTag: null,
      variantSlug,
    };
  }

  // Handle spawner and spawn egg items
  if (kl.endsWith(" spawner"))
    return {
      displayName: titleCase(baseKey),
      category: "spawner",
      tier: 0,
      setName: null,
      rawKey: raw,
      variantSlug,
    };
  if (kl.endsWith(" spawn egg"))
    return {
      displayName: titleCase(baseKey),
      category: "spawn-egg",
      tier: 0,
      setName: null,
      rawKey: raw,
      variantSlug,
    };

  // Handle music discs and goat horns
  if (kl.startsWith("music disc") || kl.startsWith("goat horn"))
    return {
      displayName: titleCase(baseKey),
      category: "music-disc",
      tier: 0,
      setName: null,
      rawKey: raw,
      variantSlug,
    };

  // Handle resources (essences, ores, special items)
  if (RESOURCES.has(kl))
    return {
      displayName: titleCase(baseKey),
      category: "resource",
      tier: 0,
      setName: null,
      rawKey: raw,
      variantSlug,
    };

  // Handle fish items (including junk items like batteries, dirty socks)
  if (FISH.has(kl.replace(/\s*★+$/, "")))
    return {
      displayName: titleCase(baseKey),
      category: "fish",
      tier: 0,
      setName: null,
      rawKey: raw,
      variantSlug,
    };

  // Handle utility items (quest crystals, tracking oils, mushrooms, etc.)
  if (UTILITY.has(kl) || UTILITY.has(klNoSuffix))
    return {
      displayName: titleCase(baseKey),
      category: "utility",
      tier: 0,
      setName: null,
      rawKey: raw,
      variantSlug,
    };

  // Handle vanilla Minecraft items (blocks, items, etc.)
  if (VANILLA_BLOCKS.has(kl))
    return {
      displayName: titleCase(baseKey),
      category: "vanilla",
      tier: 0,
      setName: null,
      rawKey: raw,
      variantSlug,
    };

  // Fallback for everything else
  return {
    displayName: titleCase(baseKey),
    category: "misc",
    tier: 0,
    setName: null,
    rawKey: raw,
    variantSlug,
  };
}

/**
 * Enriches raw data rows with parsed item information
 * @param {Object[]} rows - Array of raw data objects from the Castia Worker
 * @returns {Object[]} Enriched array with parsed properties added
 */
function normalizeBackendCategory(category) {
  const map = {
    "Set Gear": "set-gear",
    "Enchanted Book": "enchanted-book",
    Spawner: "spawner",
    "Spawn Egg": "spawn-egg",
    Runestone: "runestone",
    "Unique Relic": "unique-relic",
    Resource: "resource",
    Utility: "utility",
    "Music Disc": "music-disc",
    Fish: "fish",
    Vanilla: "vanilla",
    Misc: "misc",
  };

  const raw = String(category || "").trim();
  return map[raw] || null;
}

function enrich(rows) {
  return (rows || []).map((r) => {
    const parsed = parseKey(r.key);
    const backendCategory = normalizeBackendCategory(r.category);
    // Known runestones are exact-name matches and should not inherit stale
    // backend Set Gear labels from prefix collisions such as "Lunar Lure".
    const category =
      parsed.category === "runestone" && backendCategory === "set-gear"
        ? "runestone"
        : backendCategory || parsed.category;
    const workerVariantSlug = String(r.variant_key || r.variantKey || "")
      .trim()
      .toLowerCase();
    const dn = String(parsed.displayName || ""),
      rk = String(parsed.rawKey || "");
    const dnLc = dn.toLowerCase(),
      rkLc = rk.toLowerCase();
    return {
      ...r,
      enchantments: parseEnchantments(r.enchantments),
      ...parsed,
      category,
      setName: category === "set-gear" ? parsed.setName : null,
      variantSlug: parsed.variantSlug || workerVariantSlug || null,
      _dn_lc: dnLc,
      _rk_lc: rkLc,
      _search: dnLc + " " + rkLc,
    };
  });
}

function buildSetGearCatalogRows(marketRows) {
  const notes = window.CARD_NOTES || {};
  const marketByKey = new Map(marketRows.map((row) => [row.rawKey, row]));
  const rows = [];
  for (const rawKey of Object.keys(notes)) {
    const parsed = parseKey(rawKey);
    if (parsed.category !== "set-gear") continue;
    if (marketByKey.has(rawKey)) continue;
    rows.push({
      key: rawKey,
      rawKey,
      median: 0,
      samples: 0,
      confidence: null,
      iqr_low: 0,
      iqr_high: 0,
      trend: "stable",
      last_seen: null,
      enchantments: null,
      catalogOnly: true,
      ...parsed,
      _dn_lc: String(parsed.displayName || "").toLowerCase(),
      _rk_lc: String(rawKey || "").toLowerCase(),
      _search: `${String(parsed.displayName || "").toLowerCase()} ${String(rawKey || "").toLowerCase()}`,
    });
  }
  const seen = new Set();
  return rows
    .filter((row) => {
      const key = String(row.rawKey || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function rebuildCatalogRows() {
  const marketRows = enrich(allPrices).map((row) => ({
    ...row,
    catalogOnly: false,
  }));
  catalogRows = buildSetGearCatalogRows(marketRows);
  enriched = [...marketRows, ...catalogRows];
  return catalogRows;
}

function findDisplayRowByKey(key) {
  return enriched.find((row) => row.rawKey === key) || null;
}

function hasMarketHistory(row) {
  return !!row && !row.catalogOnly;
}

/**
 * Checks if the browser is currently offline.
 * @returns {boolean} True if navigator reports offline status
 */
function _isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Waits for a specified number of milliseconds.
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches data from the Castia Worker API with automatic retry and exponential backoff.
 * Retries up to 3 times on network errors or 5xx server errors.
 * Will not retry on 4xx client errors.
 * @param {string} path - Worker endpoint path, e.g. "/prices"
 * @param {Object} [params={}] - Query parameters
 * @param {number} [attempt=0] - Current retry attempt (used internally for backoff)
 * @returns {Promise<Object>} Promise resolving to Worker response object
 * @throws {Error} If all retries fail or a non-retryable error occurs
 */
async function workerGet(path, params = {}, attempt = 0) {
  const MAX_ATTEMPTS = 3;
  const BACKOFF_MS = [0, 800, 2000]; // delay before each attempt

  if (_isOffline()) {
    throw new Error("You appear to be offline. Please check your connection.");
  }

  if (attempt > 0) {
    await _sleep(BACKOFF_MS[attempt] || 2000);
    console.warn(
      `[workerGet] Retrying ${path} (attempt ${attempt + 1}/${MAX_ATTEMPTS})…`,
    );
  }

  let r;
  try {
    const url = new URL(path.replace(/^\/?/, "/"), CASTIA_WORKER_URL);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value != null && value !== "") url.searchParams.set(key, String(value));
    });
    r = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
  } catch (networkErr) {
    console.error(`[workerGet] Network error on ${path}:`, networkErr.message);
    if (attempt + 1 < MAX_ATTEMPTS) {
      return workerGet(path, params, attempt + 1);
    }
    throw new Error(
      `Network error loading market API ${path}: ${networkErr.message}. Check your connection and try again.`,
    );
  }

  if (!r.ok) {
    const isRetryable = r.status >= 500;
    console.error(`[workerGet] HTTP ${r.status} on ${path}`);
    if (isRetryable && attempt + 1 < MAX_ATTEMPTS) {
      return workerGet(path, params, attempt + 1);
    }
    throw new Error(`Market API returned HTTP ${r.status} on ${path}`);
  }

  return r.json();
}

function normalizeDateFromMs(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isFinite(n)) return new Date(n).toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseEnchantments(value) {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch (_e) {
    return null;
  }
}

function normalizePriceRows(workerPrices) {
  return Object.entries(workerPrices || {}).map(([key, row]) => ({
    key,
    category: row?.category || null,
    variant_key: row?.variantKey || null,
    enchantments: parseEnchantments(row?.enchantments),
    median: row?.median ?? null,
    samples: row?.samples ?? 0,
    confidence: row?.confidence || "unreliable",
    iqr_low: row?.iqrLow ?? 0,
    iqr_high: row?.iqrHigh ?? row?.median ?? 0,
    trend: row?.trend || "stable",
    last_seen: normalizeDateFromMs(row?.lastSeenMs),
  }));
}

function normalizeSellerRows(workerSellers) {
  return Object.entries(workerSellers || {}).map(([sellerKey, row]) => ({
    seller: row?.sellerName || row?.seller || sellerKey,
    total_listings: row?.totalListings ?? 0,
    valid_listings: row?.totalListings ?? 0,
    avg_markup_percent: row?.avgMarkupPercent ?? null,
    overpriced_ratio: row?.overpricedRatio ?? null,
    accuracy_label: row?.accuracyLabel || "Neutral",
    is_blacklisted: !!row?.isBlacklisted,
  }));
}

function normalizeAuctionRows(workerAuctions) {
  return (workerAuctions || []).map((row) => ({
    seller: row?.seller || "",
    price: row?.price ?? null,
    count: row?.count ?? 1,
    unit_price: row?.unitPrice ?? null,
    timestamp: row?.timestamp || null,
    set_name: row?.setName || null,
    item_name: row?.itemName || "",
    variant_key: row?.variantKey || null,
    enchantments: parseEnchantments(row?.enchantments),
    tier: row?.tier ?? null,
  }));
}

function normalizePrismaticTierRows(workerTiers, baseRow) {
  const out = [];
  const tiers = workerTiers || {};
  for (const t of [1, 2, 3]) {
    const list = normalizeAuctionRows(tiers[String(t)] || tiers[t] || []).filter(
      (l) => !isBadSeller(l.seller),
    );
    const st = statsFromListings(list);
    if (!st.n) continue;
    out.push({
      key: `${baseRow.rawKey}|t${t}`,
      median: st.median,
      samples: st.n,
      confidence: confidenceFromSamples(st.n),
      iqr_low: st.q1,
      iqr_high: st.q3,
      trend: trendFromListings(list),
      last_seen: list[0]?.timestamp || null,
    });
  }
  return out;
}

/**
 * Checks if there are any Prismatic base rows (tier 0) in the enriched data
 * @returns {boolean} True if Prismatic base rows exist
 */
function _hasPrismaticBaseRows() {
  return enrich(allPrices).some((r) => r.setName === "Prismatic" && r.tier === 0);
}
/**
 * Executes a function during idle periods if supported, otherwise uses setTimeout
 * @param {Function} fn - Function to execute during idle time
 */
function _idle(fn) {
  if ("requestIdleCallback" in window)
    window.requestIdleCallback(fn, { timeout: 1500 });
  else setTimeout(fn, 250);
}

/**
 * Applies cached Prismatic tier data to enrich base Prismatic items
 * @returns {boolean} True if cache was applied, false otherwise
 */
function applyPrismaticTierCache() {
  // Apply cached Prismatic tier data to enrich base Prismatic items with tier-specific stats
  // Returns false if no cache or no Prismatic base rows found
  const c = _readPrismaticCache();
  if (!c) return false;
  const byBase = c.byBase || {},
    byKey = {};
  for (const r of allPrices) byKey[r.key] = r;
  let applied = false;
  const newRows = [];
  for (const r of enrich(allPrices)) {
    if (r.setName === "Prismatic" && r.tier === 0) {
      // If we have cached tier data for this base item, use it
      const tierRows = byBase[r.rawKey];
      if (Array.isArray(tierRows) && tierRows.length) {
        tierRows.forEach((tr) => newRows.push(tr));
        applied = true;
        continue;
      }
    }
    // Otherwise use original row data
    newRows.push(
      byKey[r.rawKey] ||
        byKey[r.key] || {
          key: r.rawKey,
          median: r.median,
          samples: r.samples,
          confidence: r.confidence,
          iqr_low: r.iqr_low,
          iqr_high: r.iqr_high,
          trend: r.trend,
          last_seen: r.last_seen,
        },
    );
  }
  if (!applied) return false;
  // Update global state with enriched data
  allPrices = newRows;
  rebuildCatalogRows();
  maxSamples = Math.max(1, ...enriched.map((r) => r.samples || 0));
  prismaticTiersReady = true;
  return true;
}

/**
 * Fetches all market data from the Castia Worker and updates application state
 * @param {boolean} silent - If true, suppresses UI loading indicators and toasts
 * @returns {Promise<void>}
 */
async function fetchAll(silent) {
  const isListingsPage = !!(
    document.getElementById("tbody") || document.getElementById("cgrid")
  );
  if (!silent) {
    bootShow("Loading market data…");
    setSt("loading", "Loading...");
    if (isListingsPage) showSkel();
  }

  const rBtn = $("rBtn");
  if (rBtn) rBtn.classList.add("spinning");

  try {
    prismaticTiersReady = false;
    prismaticTiersPromise = null;
    const [priceRes, sellerRes] = await Promise.all([
      workerGet("/prices"),
      workerGet("/sellers").catch(() => ({ sellers: {} })),
    ]);
    const priceRows = normalizePriceRows(priceRes?.prices);
    const sellerRows = normalizeSellerRows(sellerRes?.sellers);
    allPrices = priceRows;
    rebuildCatalogRows();
    const cacheApplied = applyPrismaticTierCache();
    maxSamples = Math.max(1, ...enriched.map((r) => r.samples || 0));
    allSellers = {};
    for (const s of sellerRows) {
      if (s.seller) allSellers[s.seller.toLowerCase()] = s;
    }
    lastLoaded = new Date();

    if (isListingsPage) {
      window.suppressNextStaggerAnim?.();
      buildCatFilter();
      updateStats();
      applyFilters();
      updateSortUI();

      const tvw = $("tvw");
      const cvw = $("cvw");
      const vt = $("vt");
      const vc = $("vc");

      if (tvw) tvw.hidden = vw !== "table";
      if (cvw) cvw.hidden = vw !== "card";
      if (vt) vt.classList.toggle("on", vw === "table");
      if (vc) vc.classList.toggle("on", vw === "card");

      const needsPrismatic = _hasPrismaticBaseRows();
      if (!silent && needsPrismatic && !cacheApplied) {
        bootMsg("Loading Prismatic tiers…");
        await ensurePrismaticTiers({ force: true, silentToast: true });
      } else if (needsPrismatic) {
        _idle(() =>
          ensurePrismaticTiers({ force: true, silentToast: true }).catch(
            () => {},
          ),
        );
      }
      if (!silent) {
        updateTopButtons();
        const targetKey = getHashItemKey() || _loadedUIState?.activeKey || "";
        if (targetKey) _idle(() => openPanel(targetKey));
      }
    }
    setSt("live", enriched.length.toLocaleString() + " items");

    const rlsb = $("rlsb");
    if (rlsb) rlsb.classList.remove("on");

    if (!silent)
      toast("Loaded " + enriched.length.toLocaleString() + " items");
  } catch (e) {
    const isOffline =
      _isOffline() || e.message.toLowerCase().includes("offline");
    const errMsg = isOffline
      ? "You appear to be offline — showing cached data if available."
      : e.message;
    console.error("[fetchAll] Failed to load market data:", e);
    setSt("error", isOffline ? "Offline" : "Error");
    toast(
      isOffline ? "Offline — check your connection" : "Failed: " + e.message,
      true,
    );
    if (!allPrices.length) {
      showErr(errMsg);
      const rlsb = $("rlsb");
      if (rlsb) rlsb.classList.add("on");
    }
  } finally {
    const rBtn = $("rBtn");
    if (rBtn) rBtn.classList.remove("spinning");
    if (!silent) bootHide();

    if (window.onMarketDataLoaded) window.onMarketDataLoaded();
  }
}
/**
 * Manually refreshes all market data from the Castia Worker and updates application state
 * @returns {Promise<void>}
 */
function manualRefresh() {
  fetchAll(false);
}

let prismaticTiersReady = false,
  prismaticTiersPromise = null;
/**
 * Ensures Prismatic tier data is loaded, fetching if necessary
 * @param {Object} [opts={}] - Options object
 * @param {boolean} [opts.force=false] - Force reload even if already loaded
 * @returns {Promise<void>}
 */
async function ensurePrismaticTiers(opts = {}) {
  if (prismaticTiersReady && !opts.force) return;
  if (prismaticTiersPromise) return prismaticTiersPromise;
  prismaticTiersPromise = buildPrismaticTiers(opts).finally(() => {
    prismaticTiersReady = true;
    prismaticTiersPromise = null;
  });
  return prismaticTiersPromise;
}

/**
 * Builds Prismatic tier data by fetching Worker auction data for tier 1-3 items
 * @param {Object} [opts={}] - Options object
 * @param {boolean} [opts.silentToast=false] - Suppress toast notifications
 * @returns {Promise<void>}
 */
async function buildPrismaticTiers(opts = {}) {
  const base = enriched.filter(
    (r) => r.setName === "Prismatic" && r.tier === 0,
  );
  if (!base.length) return;
  if (!opts.silentToast) toast("Loading Prismatic tiers…");
  const byKey = {};
  for (const r of allPrices) byKey[r.key] = r;
  const tierRowsByBase = {},
    LIMIT = 4;
  let i = 0;
  const workers = Array.from({ length: LIMIT }, async () => {
    while (i < base.length) {
      const idx = i++,
        r = base[idx];
      try {
        const res = await workerGet("/prismatic-tiers", {
          item: r.displayName,
          limitPerTier: 500,
        });
        const out = normalizePrismaticTierRows(res?.tiers, r);
        if (out.length) tierRowsByBase[r.rawKey] = out;
      } catch (e) {
        console.warn("Tier fetch failed:", e.message);
      }
    }
  });
  await Promise.all(workers);
  const newRows = [];
  for (const r of enriched) {
    if (r.setName === "Prismatic" && r.tier === 0) {
      const tierRows = tierRowsByBase[r.rawKey] || [];
      if (tierRows.length) {
        tierRows.forEach((tr) => newRows.push(tr));
      } else {
        newRows.push(
          byKey[r.rawKey] ||
            byKey[r.key] || {
              key: r.rawKey,
              median: r.median,
              samples: r.samples,
              confidence: r.confidence,
              iqr_low: r.iqr_low,
              iqr_high: r.iqr_high,
              trend: r.trend,
              last_seen: r.last_seen,
            },
        );
      }
      continue;
    }
    newRows.push(
      byKey[r.rawKey] ||
        byKey[r.key] || {
          key: r.rawKey,
          median: r.median,
          samples: r.samples,
          confidence: r.confidence,
          iqr_low: r.iqr_low,
          iqr_high: r.iqr_high,
          trend: r.trend,
          last_seen: r.last_seen,
        },
    );
  }
  allPrices = newRows;
  rebuildCatalogRows();
  maxSamples = Math.max(1, ...enriched.map((r) => r.samples || 0));
  // Background update: don't re-trigger stagger animations (can feel like a second reload).
  window.suppressNextStaggerAnim?.();
  buildCatFilter();
  updateStats();
  applyFilters();
  if (Object.keys(tierRowsByBase).length) _writePrismaticCache(tierRowsByBase);
  if (!opts.silentToast) toast("Prismatic tiers ready");
}

/**
 * Fetches recent listings for a specific item
 * @param {string} itemKey - Item key to fetch listings for
 * @returns {Promise<Array>} Promise resolving to array of listing objects
 */
async function fetchListings(itemKey) {
  const tierMatch = itemKey.match(/\|t([123])$/i);
  const tier = tierMatch ? parseInt(tierMatch[1]) : null;
  const baseName = itemKey.replace(/\|t[123]$/i, "").trim();
  try {
    const res = await workerGet("/auctions", {
      item: baseName,
      limit: 25,
      tier,
      set: tier ? "Prismatic" : "",
    });
    return normalizeAuctionRows(res?.auctions);
  } catch (e) {
    const isOffline =
      _isOffline() || e.message.toLowerCase().includes("offline");
    console.warn(
      `[fetchListings] Could not fetch listings for "${itemKey}":`,
      e.message,
    );
    if (isOffline) {
      console.warn(
        "[fetchListings] Device appears to be offline — skipping retry",
      );
    }
    return [];
  }
}

/**
 * Offline / online detection — auto-refreshes data when connectivity is restored.
 * Shows a toast when going offline so the user knows what's happening.
 */
window.addEventListener("offline", () => {
  setSt("error", "Offline");
  toast("You're offline — market data may be stale", true);
  console.warn("[network] Browser went offline");
});

window.addEventListener("online", () => {
  console.info("[network] Browser came back online — refreshing data…");
  toast("Back online — refreshing…");
  // Slight delay to let the connection stabilise before hitting the Worker API.
  setTimeout(() => fetchAll(true), 1200);
});
