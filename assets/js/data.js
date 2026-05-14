/**
 * Formats a number with appropriate units (K, M, B) or returns locale string
 * @param {number|null} n - The number to format
 * @returns {string} Formatted number string
 */
function fmt(n) {
  if (n == null || n === "") return "—";
  const v = +n;
  if (isNaN(v)) return "—";
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toLocaleString();
}

/**
 * Formats a number to full precision with locale string formatting
 * @param {number|null} n - The number to format
 * @returns {string} Formatted number string
 */
function fmtFull(n) {
  return n == null ? "—" : Math.round(n).toLocaleString();
}

/**
 * Formats a timestamp into a human-readable relative time string
 * @param {string|null} d - ISO date string or timestamp
 * @returns {string} Human-readable time string (e.g., "just now", "5m ago")
 */
function fmtT(d) {
  if (!d) return "—";
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 86400 * 7) return Math.floor(s / 86400) + "d ago";
  return new Date(d).toLocaleDateString();
}

/**
 * Escapes HTML special characters in a string
 * @param {string|null} s - String to escape
 * @returns {string} Escaped string safe for HTML insertion
 */
function esc(s) {
  return s
    ? String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
    : "";
}

/**
 * Converts a string to title case with special handling for Roman numerals and lowercase words
 * @param {string} str - String to convert
 * @returns {string} Title-cased string
 */
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

/**
 * Checks if a seller is blacklisted
 * @param {string|null} seller - Seller name to check
 * @returns {boolean} True if seller is blacklisted
 */
function isBadSeller(seller) {
  if (!seller) return false;
  const sd = allSellers[String(seller).toLowerCase()];
  return !!(sd && sd.is_blacklisted);
}

/**
 * Calculates unit price from a listing object
 * @param {Object|null} l - Listing object with price and count properties
 * @returns {number} Unit price (price divided by count, or price if count is invalid)
 */
function getUnitPrice(l) {
  if (l == null) return 0;
  if (l.unit_price != null) return +l.unit_price || 0;
  const p = +l.price || 0,
    c = +l.count || 1;
  return c ? Math.round(p / c) : p;
}

/**
 * Calculates quantile from a sorted array
 * @param {number[]} sorted - Sorted array of numbers
 * @param {number} p - Quantile probability (0-1)
 * @returns {number} Quantile value
 */
function quantileSorted(sorted, p) {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p,
    lo = Math.floor(idx),
    hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (1 - (idx - lo)) + sorted[hi] * (idx - lo);
}

/**
 * Calculates statistics (median, quartiles) from an array of listings
 * @param {Object[]} listings - Array of listing objects
 * @returns {Object} Statistics object with n, median, q1, q3 properties
 */
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

/**
 * Determines confidence level based on sample count
 * @param {number} n - Number of samples
 * @returns {string} Confidence level ('high', 'good', 'fair', 'low', 'unreliable')
 */
function confidenceFromSamples(n) {
  if (n >= 30) return "high";
  if (n >= 15) return "good";
  if (n >= 7) return "fair";
  if (n >= 3) return "low";
  return "unreliable";
}

/**
 * Calculates price trend from listings over time
 * @param {Object[]} listings - Array of listing objects with timestamp and price
 * @returns {string} Trend direction ('up', 'down', 'stable')
 */
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

/**
 * Gets seller rating information and styling
 * @param {string|null} seller - Seller name
 * @returns {Object} Seller info with sd, label, order, isFlagged, isBlacklisted properties
 */
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

/**
 * Parses a raw item key into structured data
 * @param {string|null} raw - Raw item key string
 * @returns {Object} Parsed item data with displayName, category, tier, setName, rawKey properties
 */
function parseKey(raw) {
  if (!raw)
    return {
      displayName: "—",
      category: "misc",
      tier: 0,
      setName: null,
      rawKey: raw,
    };
  let baseKey = raw.trim(),
    tier = 0;
  const tierMatch = baseKey.match(/\|t([123])$/i);
  if (tierMatch) {
    tier = parseInt(tierMatch[1]);
    baseKey = baseKey.slice(0, baseKey.lastIndexOf("|t")).trim();
  }
  const kl = baseKey.toLowerCase();

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
    };
  }

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
        variantSlug: skill || null,
      };
    }
    return {
      displayName: titleCase(baseKey),
      category: "unique-relic",
      tier: 0,
      setName: null,
      rawKey: raw,
      skillTag: null,
    };
  }

  // Handle runestones (like "ruby's fire", "end veil")
  const klNoSuffix = kl
    .replace(/\s*\([\d.]+%\)\s*$/, "")
    .replace(/\s+(?:\d+|i{1,3}|iv|vi{0,3}|ix)$/i, "")
    .trim();
  if (RUNESTONES.has(kl) || RUNESTONES.has(klNoSuffix))
    return {
      displayName: titleCase(baseKey),
      category: "runestone",
      tier: 0,
      setName: null,
      rawKey: raw,
    };

  // Handle spawner and spawn egg items
  if (kl.endsWith(" spawner"))
    return {
      displayName: titleCase(baseKey),
      category: "spawner",
      tier: 0,
      setName: null,
      rawKey: raw,
    };
  if (kl.endsWith(" spawn egg"))
    return {
      displayName: titleCase(baseKey),
      category: "spawn-egg",
      tier: 0,
      setName: null,
      rawKey: raw,
    };

  // Handle music discs and goat horns
  if (kl.startsWith("music disc") || kl.startsWith("goat horn"))
    return {
      displayName: titleCase(baseKey),
      category: "music-disc",
      tier: 0,
      setName: null,
      rawKey: raw,
    };

  // Handle resources (essences, ores, special items)
  if (RESOURCES.has(kl))
    return {
      displayName: titleCase(baseKey),
      category: "resource",
      tier: 0,
      setName: null,
      rawKey: raw,
    };

  // Handle fish items (including junk items like batteries, dirty socks)
  if (FISH.has(kl.replace(/\s*★+$/, "")))
    return {
      displayName: titleCase(baseKey),
      category: "fish",
      tier: 0,
      setName: null,
      rawKey: raw,
    };

  // Handle utility items (quest crystals, tracking oils, mushrooms, etc.)
  if (UTILITY.has(kl) || UTILITY.has(klNoSuffix))
    return {
      displayName: titleCase(baseKey),
      category: "utility",
      tier: 0,
      setName: null,
      rawKey: raw,
    };

  // Handle vanilla Minecraft items (blocks, items, etc.)
  if (VANILLA_BLOCKS.has(kl))
    return {
      displayName: titleCase(baseKey),
      category: "vanilla",
      tier: 0,
      setName: null,
      rawKey: raw,
    };

  // Fallback for everything else
  return {
    displayName: titleCase(baseKey),
    category: "misc",
    tier: 0,
    setName: null,
    rawKey: raw,
  };
}

/**
 * Enriches raw data rows with parsed item information
 * @param {Object[]} rows - Array of raw data objects from Supabase
 * @returns {Object[]} Enriched array with parsed properties added
 */
function enrich(rows) {
  return (rows || []).map((r) => {
    const parsed = parseKey(r.key);
    const dn = String(parsed.displayName || ""),
      rk = String(parsed.rawKey || "");
    const dnLc = dn.toLowerCase(),
      rkLc = rk.toLowerCase();
    return {
      ...r,
      ...parsed,
      _dn_lc: dnLc,
      _rk_lc: rkLc,
      _search: dnLc + " " + rkLc,
    };
  });
}

const HEADERS = { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY };

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
 * Fetches data from Supabase REST API with automatic retry and exponential backoff.
 * Retries up to 3 times on network errors or 5xx server errors.
 * Will not retry on 4xx client errors (e.g. bad API key, RLS policy blocks).
 * @param {string} table - Table name to query
 * @param {string} [params=''] - Query parameters string (starting with ?)
 * @param {number} [attempt=0] - Current retry attempt (used internally for backoff)
 * @returns {Promise<Array>} Promise resolving to array of data objects
 * @throws {Error} If all retries fail or a non-retryable error occurs
 */
async function sbGet(table, params = "", attempt = 0) {
  const MAX_ATTEMPTS = 3;
  const BACKOFF_MS = [0, 800, 2000]; // delay before each attempt

  if (_isOffline()) {
    throw new Error("You appear to be offline. Please check your connection.");
  }

  if (attempt > 0) {
    await _sleep(BACKOFF_MS[attempt] || 2000);
    console.warn(
      `[sbGet] Retrying ${table} (attempt ${attempt + 1}/${MAX_ATTEMPTS})…`,
    );
  }

  let r;
  try {
    r = await fetch(`${SB_URL}/rest/v1/${table}${params}`, {
      headers: HEADERS,
    });
  } catch (networkErr) {
    // Network-level failure (no response at all — DNS, CORS, etc.)
    console.error(`[sbGet] Network error on ${table}:`, networkErr.message);
    if (attempt + 1 < MAX_ATTEMPTS) {
      return sbGet(table, params, attempt + 1);
    }
    throw new Error(
      `Network error loading ${table}: ${networkErr.message}. Check your connection and try again.`,
    );
  }

  if (!r.ok) {
    const isRetryable = r.status >= 500;
    console.error(`[sbGet] HTTP ${r.status} on ${table}`);
    if (isRetryable && attempt + 1 < MAX_ATTEMPTS) {
      return sbGet(table, params, attempt + 1);
    }
    // 4xx errors: give an actionable message
    if (r.status === 401 || r.status === 403) {
      throw new Error(
        `Access denied (HTTP ${r.status}) on ${table}. Check Supabase RLS policies allow anon SELECT.`,
      );
    }
    throw new Error(`HTTP ${r.status} on ${table}`);
  }

  return r.json();
}

/**
 * Checks if there are any Prismatic base rows (tier 0) in the enriched data
 * @returns {boolean} True if Prismatic base rows exist
 */
function _hasPrismaticBaseRows() {
  return enriched.some((r) => r.setName === "Prismatic" && r.tier === 0);
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
  for (const r of enriched) {
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
  enriched = enrich(allPrices);
  maxSamples = Math.max(1, ...enriched.map((r) => r.samples || 0));
  prismaticTiersReady = true;
  return true;
}

/**
 * Fetches all market data from Supabase and updates application state
 * @param {boolean} silent - If true, suppresses UI loading indicators and toasts
 * @returns {Promise<void>}
 */
async function fetchAll(silent) {
  if (!silent) {
    bootShow("Loading market data…");
    setSt("loading", "Loading...");
    showSkel();
  }

  // GUARD: Only spin button if it exists (index.html)
  const rBtn = $("rBtn");
  if (rBtn) rBtn.classList.add("spinning");

  try {
    prismaticTiersReady = false;
    prismaticTiersPromise = null;
    let priceRows = [],
      off = 0;
    while (true) {
      const batch = await sbGet(
        "price_data",
        `?select=key,median,samples,confidence,iqr_low,iqr_high,trend,last_seen&limit=1000&offset=${off}&order=median.desc`,
      );
      priceRows = priceRows.concat(batch);
      if (batch.length < 1000) break;
      off += 1000;
    }
    let sellerRows = await sbGet(
      "seller_data",
      "?select=seller,total_listings,valid_listings,avg_markup_percent,overpriced_ratio,accuracy_label,is_blacklisted",
    ).catch(() => []);
    allPrices = priceRows;
    enriched = enrich(allPrices);
    const cacheApplied = applyPrismaticTierCache();
    maxSamples = Math.max(1, ...enriched.map((r) => r.samples || 0));
    allSellers = {};
    for (const s of sellerRows) {
      if (s.seller) allSellers[s.seller.toLowerCase()] = s;
    }
    lastLoaded = new Date();

    window.suppressNextStaggerAnim?.();
    buildCatFilter();
    updateStats();
    applyFilters();
    updateSortUI();

    // GUARDS: Only update view elements if they exist (index.html)
    const tvw = $("tvw");
    const cvw = $("cvw");
    const vt = $("vt");
    const vc = $("vc");

    if (tvw) tvw.style.display = vw === "table" ? "" : "none";
    if (cvw) cvw.style.display = vw === "card" ? "" : "none";
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
      const sy = Number(_loadedUIState?.scrollY || 0);
      if (sy > 0) setTimeout(() => window.scrollTo(0, sy), 0);
      const targetKey = getHashItemKey() || _loadedUIState?.activeKey || "";
      if (targetKey) _idle(() => openPanel(targetKey));
    }
    setSt("live", allPrices.length.toLocaleString() + " items");

    // GUARD: Only remove RLS banner if it exists
    const rlsb = $("rlsb");
    if (rlsb) rlsb.classList.remove("on");

    if (!silent)
      toast("Loaded " + allPrices.length.toLocaleString() + " items");
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
    // GUARD: Only stop spinning if button exists
    const rBtn = $("rBtn");
    if (rBtn) rBtn.classList.remove("spinning");
    if (!silent) bootHide();

    if (window.onMarketDataLoaded) window.onMarketDataLoaded();
  }
}
/**
 * Manually refreshes all market data from Supabase and updates application state
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
 * Builds Prismatic tier data by fetching auction data for tier 1-3 items
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
        const rows = await sbGet(
          "auctions",
          `?select=seller,unit_price,price,count,timestamp,tier,item_name,set_name&set_name=eq.Prismatic&item_name=ilike.${encodeURIComponent(r.displayName)}&tier=in.(1,2,3)&order=timestamp.desc&limit=1500`,
        );
        const cleanAll = rows.filter((l) => !isBadSeller(l.seller));
        const grouped = { 1: [], 2: [], 3: [] };
        for (const l of cleanAll) {
          const t = parseInt(l.tier, 10);
          if (t === 1 || t === 2 || t === 3) grouped[t].push(l);
        }
        const out = [];
        for (const t of [1, 2, 3]) {
          const list = grouped[t] || [],
            st = statsFromListings(list);
          if (!st.n) continue;
          out.push({
            key: `${r.rawKey}|t${t}`,
            median: st.median,
            samples: st.n,
            confidence: confidenceFromSamples(st.n),
            iqr_low: st.q1,
            iqr_high: st.q3,
            trend: trendFromListings(list),
            last_seen: list[0]?.timestamp || null,
          });
        }
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
  enriched = enrich(allPrices);
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
    const tierFilter = tier ? `&tier=eq.${tier}` : "";
    const prismaticFilter = tier ? `&set_name=eq.Prismatic` : "";
    return await sbGet(
      "auctions",
      `?select=seller,price,count,unit_price,timestamp,set_name,item_name&item_name=ilike.${encodeURIComponent(baseName)}${prismaticFilter}${tierFilter}&order=timestamp.desc&limit=25`,
    );
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
  // Slight delay to let the connection stabilise before hitting Supabase
  setTimeout(() => fetchAll(true), 1200);
});
