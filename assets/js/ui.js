/**
 * UI utilities and DOM helpers for the application.
 * Contains functions for DOM manipulation, UI state management,
 * rendering helpers, and user interaction utilities.
 */

/**
 * DOM element references
 */
const $ = (id) => document.getElementById(id);
const qEl = $("qEl"),
    catEl = $("catEl"),
    confEl = $("confEl"),
    tierEl = $("tierEl");
const suggEl = $("suggEl");
const tbody = $("tbody"),
    cgrid = $("cgrid");
const panel = $("detail-panel"),
    panelBackdrop = $("panel-backdrop");
const panelMeta = $("panel-meta");
const appShell = $("app");
const boot = $("boot-preloader"),
    bootTxt = $("boot-text");
const favOnlyBtn = $("favOnlyBtn"),
    dsBtn = $("dsBtn");
const cmpCountEl = $("cmpCount");
const compareModal = $("compareModal"),
    cmpBody = $("cmpBody");

/**
 * Shows the boot preloader with optional message
 * @param {string|null} msg - Message to display in the boot preloader
 */
function bootShow(msg) {
  if (!boot) return;
  if (msg && bootTxt) bootTxt.textContent = msg;
  boot.classList.add("on");
  boot.classList.remove("off");
  boot.setAttribute("aria-hidden", "false");
}

/**
 * Updates the boot preloader message text without showing/hiding the preloader
 * @param {string} msg - Message to display
 */
function bootMsg(msg) {
  if (bootTxt) bootTxt.textContent = msg;
}
/**
 * Hides the boot preloader and marks the app as booted.
 * Adds the 'booted' class to body so first-load-only CSS animations
 * don't re-trigger on subsequent view toggles.
 */
function bootHide() {
  if (!boot) return;
  boot.classList.remove("on");
  boot.classList.add("off");
  boot.setAttribute("aria-hidden", "true");
  // Marks the UI as "booted" so first-load-only animations don't retrigger on view toggles.
  document.body.classList.add("booted");
}

/**
 * Sets the status dot and text
 * @param {string} state - State class ('loading', 'live', 'error')
 * @param {string} txt - Text to display
 */
function setSt(state, txt) {
  $("sdot").className = "dot " + state;
  $("stxt").textContent = txt;
}

/**
 * Shows a toast message
 * @param {string} msg - Message to display
 * @param {boolean} err - Whether to show as error
 */
function toast(msg, err) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "on" + (err ? " err" : "");
  clearTimeout(toast._t);
  // Timing: longer for errors/warnings and for longer messages.
  const m = String(msg || "");
  const base = err ? 5200 : 3600;
  const perChar = err ? 55 : 35;
  const dur = Math.max(base, Math.min(9000, base + m.length * perChar));
  toast._t = setTimeout(() => (t.className = ""), dur);
}

/**
 * Marks the currently selected item as active in both table and card views
 */
function markActiveSelection() {
  document
      .querySelectorAll("#tbody tr.active-row")
      .forEach((el) => el.classList.remove("active-row"));
  if (activeKey) {
    const tr = document.querySelector(
        `#tbody tr[data-key="${CSS.escape(activeKey)}"]`,
    );
    if (tr) tr.classList.add("active-row");
  }
  document
      .querySelectorAll("#cgrid .pcard.active-card")
      .forEach((el) => el.classList.remove("active-card"));
  if (activeKey) {
    const card = document.querySelector(
        `#cgrid .pcard[data-key="${CSS.escape(activeKey)}"]`,
    );
    if (card) card.classList.add("active-card");
  }
}

/**
 * Captures the bounding rectangles of all card elements for FLIP animation
 * @returns {Map<string, DOMRect>} Map of item keys to their rectangles
 */
function captureCGridRects() {
  const map = new Map();
  if (!cgrid) return map;
  cgrid
      .querySelectorAll(".pcard[data-key]")
      .forEach((el) => map.set(el.dataset.key, el.getBoundingClientRect()));
  return map;
}

/**
 * Plays the FLIP animation for card elements
 * @param {Map<string, DOMRect>} firstRects - Map of initial rectangles
 */
function playCGridFlip(firstRects) {
  if (!cgrid || !firstRects || !firstRects.size) return;
  requestAnimationFrame(() => {
    cgrid.querySelectorAll(".pcard[data-key]").forEach((el) => {
      const first = firstRects.get(el.dataset.key);
      if (!first) return;
      const last = el.getBoundingClientRect();
      const dx = first.left - last.left,
          dy = first.top - last.top;
      if (!dx && !dy) return;
      el.style.willChange = "transform";
      el.animate(
          [
            { transform: `translate(${dx}px,${dy}px)` },
            { transform: "translate(0,0)" },
          ],
          { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" },
      ).finished.finally(() => {
        el.style.willChange = "";
      });
    });
  });
}

/**
 * Runs a mutation with FLIP animation for card grid
 * @param {Function} mutator - Function to mutate the DOM
 */
function withCGridFlip(mutator) {
  if (vw !== "card" || !cgrid) {
    mutator();
    return;
  }
  const first = captureCGridRects();
  if (appShell) appShell.classList.add("no-shell-anim");
  mutator();
  if (appShell) appShell.offsetWidth;
  if (appShell) appShell.classList.remove("no-shell-anim");
  playCGridFlip(first);
}

/**
 * Enhanced select element manager
 */
const cselects = new Map();
const toolbarCSelects = new Map();

/**
 * Closes all custom select dropdowns
 * @param {string|null} exceptId - ID of select to exclude from closing
 */
function closeAllCSelects(exceptId = null) {
  for (const [id, cs] of cselects) {
    if (exceptId && id === exceptId) continue;
    cs.wrap.classList.remove("open");
    try {
      cs.btn?.setAttribute("aria-expanded", "false");
    } catch (_e) {}
  }
  for (const [id, cs] of toolbarCSelects) {
    if (exceptId && id === exceptId) continue;
    cs.wrap.classList.remove("open");
    cs.btn?.setAttribute("aria-expanded", "false");
  }
  const ps = $("panelSortSel");
  if (ps && (!exceptId || exceptId !== "panelSortSel")) {
    ps.classList.remove("open");
    const b = ps.querySelector(".cselect-btn");
    if (b) b.setAttribute("aria-expanded", "false");
  }
}

/**
 * Enhances a native select element with custom styling
 * @param {HTMLSelectElement} selectEl - The select element to enhance
 */
function enhanceSelect(selectEl) {
  if (!selectEl || !selectEl.id) return;
  const id = selectEl.id;
  if (cselects.has(id)) return;
  selectEl.classList.add("native-hidden");
  const wrap = document.createElement("div");
  wrap.className = "cselect";
  wrap.dataset.for = id;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cselect-btn";
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = `<span class="cval"></span>`;
  const menu = document.createElement("div");
  menu.className = "cselect-menu";
  menu.setAttribute("role", "listbox");
  wrap.appendChild(btn);
  wrap.appendChild(menu);
  selectEl.insertAdjacentElement("afterend", wrap);
  function refresh() {
    const cur = selectEl.value;
    menu.innerHTML = [...selectEl.querySelectorAll("option")]
        .map((o) => {
          const v = o.value,
              lbl = o.textContent || v || "—",
              on = v === cur;
          return `<button type="button" class="copt ${on ? "on" : ""}" data-value="${esc(v)}">${esc(lbl)}</button>`;
        })
        .join("");
    const selOpt =
        selectEl.querySelector(`option[value="${CSS.escape(cur)}"]`) ||
        selectEl.options[selectEl.selectedIndex];
    btn.querySelector(".cval").textContent = selOpt
        ? selOpt.textContent || selOpt.value || "—"
        : "—";
  }
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = wrap.classList.contains("open");
    closeAllCSelects(isOpen ? null : id);
    wrap.classList.toggle("open", !isOpen);
    btn.setAttribute("aria-expanded", (!isOpen).toString());
  });
  menu.addEventListener("click", (e) => {
    const opt = e.target.closest(".copt[data-value]");
    if (!opt) return;
    selectEl.value = opt.dataset.value ?? "";
    selectEl.dispatchEvent(new Event("change", { bubbles: true }));
    refresh();
    wrap.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  });
  selectEl.addEventListener("change", refresh);
  refresh();
  cselects.set(id, { wrap, btn, menu, refresh });
}

/**
 * Binds the visible toolbar custom select to the real native select.
 * The native select remains the source of truth for filtering.
 * @param {HTMLSelectElement} selectEl - The select element to bind
 */
function bindToolbarSelect(selectEl) {
  if (!selectEl || !selectEl.id || toolbarCSelects.has(selectEl.id)) return;
  const id = selectEl.id;
  const wrap = $(id + "Wrap");
  const btn = wrap?.querySelector(".cselect-btn");
  const val = $(id + "Val");
  const menu = $(id + "Menu");
  if (!wrap || !btn || !val || !menu) return;
  btn.removeAttribute("onclick");

  function refresh() {
    const cur = selectEl.value;
    menu.innerHTML = [...selectEl.querySelectorAll("option")]
      .map((o) => {
        const v = o.value;
        const lbl = o.textContent || v || "All";
        const on = v === cur;
        return `<button type="button" class="copt ${on ? "on" : ""}" role="option" aria-selected="${on}" data-value="${esc(v)}">${esc(lbl)}</button>`;
      })
      .join("");
    const selOpt =
      selectEl.querySelector(`option[value="${CSS.escape(cur)}"]`) ||
      selectEl.options[selectEl.selectedIndex];
    val.textContent = selOpt
      ? selOpt.textContent || selOpt.value || "All"
      : "All";
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = wrap.classList.contains("open");
    closeAllCSelects(isOpen ? null : id);
    wrap.classList.toggle("open", !isOpen);
    btn.setAttribute("aria-expanded", (!isOpen).toString());
  });

  menu.addEventListener("click", (e) => {
    const opt = e.target.closest(".copt[data-value]");
    if (!opt) return;
    selectEl.value = opt.dataset.value ?? "";
    selectEl.dispatchEvent(new Event("change", { bubbles: true }));
    refresh();
    wrap.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  });

  selectEl.addEventListener("change", refresh);
  toolbarCSelects.set(id, { wrap, btn, menu, refresh });
  refresh();
}

function toggleCSelect(id) {
  const cs = toolbarCSelects.get(id) || cselects.get(id);
  if (!cs) return;
  const isOpen = cs.wrap.classList.contains("open");
  closeAllCSelects(isOpen ? null : id);
  cs.wrap.classList.toggle("open", !isOpen);
  cs.btn?.setAttribute("aria-expanded", (!isOpen).toString());
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".cselect")) closeAllCSelects();
});

/**
 * Refreshes a custom select element to sync its display with the underlying
 * native <select> value. Must be called whenever the native select's value or
 * options are changed programmatically (e.g. after clearing filters or
 * rebuilding the category list).
 * @param {string} id - The ID of the native select element to refresh
 */
function refreshCSelect(id) {
  const cs = cselects.get(id);
  if (cs && typeof cs.refresh === "function") cs.refresh();
  const toolbarCs = toolbarCSelects.get(id);
  if (toolbarCs && typeof toolbarCs.refresh === "function") toolbarCs.refresh();
}

function buildStaticFilterOptions() {
  if (confEl) {
    const want = confEl?.dataset?.restore || confEl.value || "";
    confEl.innerHTML = '<option value="">All confidence</option>';
    Object.keys(CONF_ORDER).forEach((key) => {
      const o = document.createElement("option");
      o.value = key;
      o.textContent = key[0].toUpperCase() + key.slice(1);
      confEl.appendChild(o);
    });
    confEl.value = [...confEl.options].some((o) => o.value === want) ? want : "";
    if (confEl.dataset) delete confEl.dataset.restore;
    refreshCSelect("confEl");
  }
  if (tierEl) {
    const want = tierEl?.dataset?.restore || tierEl.value || "";
    const tiers = [
      ["", "All tiers"],
      ["0", "No tier"],
      ["1", "Tier 1"],
      ["2", "Tier 2"],
      ["3", "Tier 3"],
    ];
    tierEl.innerHTML = "";
    tiers.forEach(([value, label]) => {
      const o = document.createElement("option");
      o.value = value;
      o.textContent = label;
      tierEl.appendChild(o);
    });
    tierEl.value = [...tierEl.options].some((o) => o.value === want) ? want : "";
    if (tierEl.dataset) delete tierEl.dataset.restore;
    refreshCSelect("tierEl");
  }
}

/**
 * Builds the category filter dropdown options
 */
function buildCatFilter() {
  buildStaticFilterOptions();
  if (!catEl) return;
  const want = catEl?.dataset?.restore || catEl.value || "";
  const counts = new Map();
  enriched.forEach((r) => {
    if (!r.category) return;
    counts.set(r.category, (counts.get(r.category) || 0) + 1);
  });
  const knownCats = Object.keys(CAT_LABELS).filter((c) => counts.has(c));
  const extraCats = [...counts.keys()]
    .filter((c) => !CAT_LABELS[c])
    .sort((a, b) => String(a).localeCompare(String(b)));
  const cats = [...knownCats, ...extraCats];
  catEl.innerHTML = `<option value="">All categories (${enriched.length})</option>`;
  cats.forEach((c) => {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = `${CAT_LABELS[c] || c} (${counts.get(c) || 0})`;
    catEl.appendChild(o);
  });
  catEl.value = [...catEl.options].some((o) => o.value === want) ? want : "";
  if (catEl.dataset) delete catEl.dataset.restore;
  const sCat = $("sCat");
  if (sCat) sCat.textContent = cats.length;
  refreshCSelect("catEl");
}

/**
 * Updates a stat element with pop animation
 * @param {string} id - Element ID
 * @param {string|number} val - Value to display
 */
function popStat(id, val) {
  const el = $(id);
  if (!el) return;
  el.textContent = val;
  el.classList.remove("pop");
  el.offsetWidth;
  el.classList.add("pop");
}

/**
 * Updates all statistics in the UI
 */
function updateStats() {
  popStat("sTot", allPrices.length.toLocaleString());
  const maxR = enriched.reduce(
      (a, b) => ((b.median || 0) > (a.median || 0) ? b : a),
      { median: 0 },
  );
  const avg = enriched.length
      ? Math.round(
          enriched.reduce((s, r) => s + (r.median || 0), 0) / enriched.length,
      )
      : 0;
  popStat("sMax", fmt(maxR.median));

  // GUARD: Check if sMaxN exists before setting text
  const sMaxN = $("sMaxN");
  if (sMaxN) {
    sMaxN.textContent = maxR.displayName
        ? maxR.displayName.length > 22
            ? maxR.displayName.slice(0, 20) + "…"
            : maxR.displayName
        : "";
  }

  popStat("sAvg", fmt(avg));

  // GUARD: Check if sUpd exists
  const sUpd = $("sUpd");
  if (sUpd) sUpd.textContent = fmtT(lastLoaded);

  // Update hero items count
  const heroItemsCount = $("hero-items-count");
  if (heroItemsCount) {
    heroItemsCount.textContent = allPrices.length.toLocaleString();
  }
}

/**
 * Applies the current filters and updates the view
 */
function applyFilters() {
  if (!qEl) return;

  pg = 1;
  // Use optional chaining (?.) or logical OR to prevent crashes on sellers.html
  const q = (qEl?.value || "").trim().toLowerCase(),
      cat = catEl?.value || "",
      conf = confEl?.value || "",
      tier = tierEl?.value || "";

  filtered = enriched.filter((r) => {
    if (q && !(r._search || "").includes(q)) return false;
    if (favOnly && !isFav(r.rawKey)) return false;
    if (cat && r.category !== cat) return false;
    if (conf && r.confidence !== conf) return false;
    if (tier !== "") {
      if (tier === "0" && r.tier !== 0) return false;
      if (tier !== "0" && r.tier !== parseInt(tier)) return false;
    }
    return true;
  });
  filtered.sort((a, b) => {
    let av = a[sc];
    let bv = b[sc];

    if (sc === "timestamp") {
      // Convert the ISO‑8601 strings to milliseconds.
      // Guard against null/undefined values.
      av = av ? new Date(av).getTime() : sd === "asc" ? -Infinity : Infinity;
      bv = bv ? new Date(bv).getTime() : sd === "asc" ? -Infinity : Infinity;
    } else if (sc === "confidence") {
      av = CONF_ORDER[av] ?? 5;
      bv = CONF_ORDER[bv] ?? 5;
    } else if (typeof av === "string") {
      av = av.toLowerCase();
      bv = (bv || "").toLowerCase();
    }

    // Treat missing values as -Infinity for asc, +Infinity for desc
    av = av ?? (sd === "asc" ? -Infinity : Infinity);
    bv = bv ?? (sd === "asc" ? -Infinity : Infinity);

    return sd === "asc"
        ? av > bv
            ? 1
            : av < bv
                ? -1
                : 0
        : av < bv
            ? 1
            : av > bv
                ? -1
                : 0;
  });
  render();
  updateChips();
  const spillBtn = document.getElementById("sp-lastseen");
  if (spillBtn) {
    spillBtn.classList.toggle("on", sc === "last_seen");
  }
  updateSortUI();
  scheduleSaveUIState();
}

/**
 * Updates the filter chips UI
 */
function updateChips() {
  if (!qEl) return;

  const el = $("chips");
  if (!el) return;

  el.innerHTML = "";
  const q = qEl.value.trim(),
      cat = catEl?.value || "",
      conf = confEl?.value || "",
      tier = tierEl?.value || "";
  if (q)
    addChip("Search: " + q, () => {
      qEl.value = "";
      $("xBtn")?.classList.remove("on");
      applyFilters();
    });
  if (favOnly)
    addChip("Favorites", () => {
      favOnly = false;
      updateTopButtons();
      applyFilters();
    });
  if (cat)
    addChip("Category: " + (CAT_LABELS[cat] || cat), () => {
      catEl.value = "";
      refreshCSelect("catEl");
      applyFilters();
    });
  if (conf)
    addChip("Confidence: " + conf, () => {
      confEl.value = "";
      refreshCSelect("confEl");
      applyFilters();
    });
  if (tier === "0")
    addChip("Tier: None", () => {
      tierEl.value = "";
      refreshCSelect("tierEl");
      applyFilters();
    });
  else if (tier)
    addChip("Tier: " + tier, () => {
      tierEl.value = "";
      refreshCSelect("tierEl");
      applyFilters();
    });
}

/**
 * Adds a filter chip to the UI
 * @param {string} label - Chip label
 * @param {Function} fn - Callback to run when chip is removed
 */
function addChip(label, fn) {
  const d = document.createElement("div");
  d.className = "chip";
  d.innerHTML = `${esc(label)}<button class="chipx" type="button" title="Remove" aria-label="Remove filter">×</button>`;
  d.querySelector(".chipx").addEventListener("click", fn);
  $("chips").appendChild(d);
}

/**
 * Search suggestion state
 */
let suggItems = [],
    suggIndex = -1;

/**
 * Hides the search suggestion dropdown
 */
function hideSugg() {
  if (!suggEl) return;
  suggEl.classList.remove("on");
  suggEl.innerHTML = "";
  suggItems = [];
  suggIndex = -1;
  suggEl.setAttribute("aria-hidden", "true");
}

/**
 * Shows the search suggestion dropdown
 * @param {Array} items - Array of suggestion items
 */
function showSugg(items) {
  suggItems = items || [];
  suggIndex = -1;
  if (!suggItems.length) {
    hideSugg();
    return;
  }
  suggEl.innerHTML = suggItems
      .map(
          (it, i) =>
              `<button type="button" role="option" aria-selected="false" data-i="${i}"><span class="sname">${formatItemNameH(it.displayName)}</span><span class="smeta">${esc(it.categoryLabel || "")}</span></button>`,
      )
      .join("");
  suggEl.classList.add("on");
  suggEl.setAttribute("aria-hidden", "false");
}

/**
 * Updates search suggestions based on current input
 */
function updateSugg() {
  const q = qEl.value.trim().toLowerCase();
  if (!q) {
    hideSugg();
    return;
  }
  const out = [],
      seen = new Set();
  for (const r of enriched) {
    const dn = r._dn_lc || "",
        rk = r._rk_lc || "";
    const idx = dn.indexOf(q) >= 0 ? dn.indexOf(q) : rk.indexOf(q);
    if (idx < 0 || seen.has(r.rawKey)) continue;
    seen.add(r.rawKey);
    out.push({
      rawKey: r.rawKey,
      displayName: r.displayName,
      idx,
      starts: dn.startsWith(q),
      categoryLabel: CAT_LABELS[r.category] || r.category,
      median: r.median || 0,
    });
    if (out.length >= 30) break;
  }
  out.sort((a, b) => {
    if (a.starts !== b.starts) return a.starts ? -1 : 1;
    if (a.idx !== b.idx) return a.idx - b.idx;
    return (b.median || 0) - (a.median || 0);
  });
  showSugg(out.slice(0, 10));
}

/**
 * Sets the active suggestion index
 * @param {number} i - Index to set
 */
function setSuggIndex(i) {
  suggIndex = i;
  const btns = [...suggEl.querySelectorAll("button[data-i]")];
  btns.forEach((b) => {
    b.classList.remove("on");
    b.setAttribute("aria-selected", "false");
  });
  const btn = btns.find((b) => parseInt(b.dataset.i) === suggIndex);
  if (btn) {
    btn.classList.add("on");
    btn.setAttribute("aria-selected", "true");
    btn.scrollIntoView({ block: "nearest" });
  }
}

/**
 * Applies the selected suggestion
 * @param {number} i - Index of suggestion to apply
 * @returns {boolean} True if suggestion was applied
 */
function applySugg(i) {
  const it = suggItems[i];
  if (!it) return false;
  qEl.value = it.displayName;
  $("xBtn").classList.toggle("on", qEl.value.length > 0);
  hideSugg();
  applyFilters();
  qEl.focus();
  return true;
}

/**
 * Suppresses the next stagger animation (used to prevent double animation on view switch)
 */
/**
 * Suppresses the next stagger animation for table rows or cards.
 * Used when switching views or refreshing data to avoid a "double load"
 * animation that would feel like a second page load to the user.
 */
let _suppressNextStaggerAnim = false;
function suppressNextStaggerAnim() {
  _suppressNextStaggerAnim = true;
}
window.suppressNextStaggerAnim = suppressNextStaggerAnim;

/**
 * Image file extensions to check
 */
const IMAGE_EXTS = ["png", "gif", "webp"];
const _imgExistsCache = new Map();

/**
 * Asynchronously finds an existing image path from a list of candidates
 * @param {string[]} paths - Array of image paths to check
 * @returns {Promise<string>} First existing path or placeholder
 */
async function findExistingImagePath(paths) {
  for (const path of paths) {
    if (_imgExistsCache.has(path)) {
      if (_imgExistsCache.get(path)) return path;
      continue;
    }
    try {
      const res = await fetch(path, { method: "HEAD" });
      const ok = res.ok;
      _imgExistsCache.set(path, ok);
      if (ok) return path;
    } catch (_e) {
      _imgExistsCache.set(path, false);
    }
  }
  return "./assets/images/items/_placeholder.svg";
}

/**
 * Generates an image slug from a raw item key
 * @param {string} rawKey - The raw item key
 * @returns {string} Slug for image lookup
 */
function imageSlugFromRawKey(rawKey) {
  return (
      String(rawKey || "")
          .replace(/\|t[123]$/i, "")
          .replace(/\s*\[[^\]]+\]\s*$/, "")
          .replace(/\s*\([\d.]+%\)\s*$/, "")
          .trim()
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/['"]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .replace(/-(?:\d+|i{1,3}|iv|vi{0,3}|ix)$/, "")
          .slice(0, 120) || "unknown"
  );
}

/**
 * Slugifies text for use in URLs or identifiers
 * @param {string} txt - Text to slugify
 * @returns {string} Slugified string
 */
function slugifyText(txt) {
  return (
      String(txt || "")
          .trim()
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/['"]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 80) || "unknown"
  );
}

/**
 * Gets image paths for a given item row
 * @param {Object} r - Item data row
 * @returns {string[]} Array of image paths to try
 */
function imagePathsForRow(r) {
  if (!r || r.category === "misc") return [];
  const base = "./assets/images/items",
      slug = imageSlugFromRawKey(r.rawKey),
      cat = String(r.category || "misc"),
      paths = [];
  const variantSlug = r.variantSlug
      ? slug + "-" + r.variantSlug.replace(/[^a-z0-9]+/g, "-")
      : null;
  for (const ext of IMAGE_EXTS) {
    if (cat === "set-gear" && r.setName)
      paths.push(`${base}/set-gear/${slugifyText(r.setName)}/${slug}.${ext}`);
    if (variantSlug) paths.push(`${base}/${cat}/${variantSlug}.${ext}`);
    paths.push(`${base}/${cat}/${slug}.${ext}`);
    paths.push(`${base}/${slug}.${ext}`);
  }
  return [...new Set(paths)];
}

/**
 * Handles image fallback when loading fails
 * @param {HTMLImageElement} imgEl - The image element that failed
 */
function imgFallback(imgEl) {
  try {
    const list = (imgEl.dataset.fallbacks || "").split("|").filter(Boolean),
        idx = parseInt(imgEl.dataset.fallbackIndex || "0", 10);
    if (idx >= list.length) {
      imgEl.onerror = null;
      imgEl.src = "./assets/images/items/_placeholder.svg";
      return;
    }
    imgEl.dataset.fallbackIndex = String(idx + 1);
    imgEl.src = list[idx];
  } catch (_e) {
    imgEl.onerror = null;
    imgEl.src = "./assets/images/items/_placeholder.svg";
  }
}

/**
 * Lazy image observer setup
 */
let _lazyImgObserver = null,
    _lazyQueue = [],
    _lazyTicking = false;

/**
 * Ensures the lazy image observer is created
 * @returns {IntersectionObserver|null} The observer or null if not supported
 */
function _ensureLazyObserver() {
  if (_lazyImgObserver) return _lazyImgObserver;
  if (!("IntersectionObserver" in window)) return null;
  _lazyImgObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const img = e.target;
          _lazyImgObserver.unobserve(img);
          if (img.dataset.loaded === "1") continue;
          _lazyQueue.push(img);
        }
        _lazyPumpQueue();
      },
      { root: null, rootMargin: "250px 0px", threshold: 0.01 },
  );
  return _lazyImgObserver;
}

/**
 * Processes the lazy image queue
 */
function _lazyPumpQueue() {
  if (_lazyTicking) return;
  _lazyTicking = true;
  requestAnimationFrame(() => {
    _lazyTicking = false;
    const batch = _lazyQueue.splice(0, 10);
    let hi = 0;
    for (const img of batch) {
      _loadLazyImg(img, hi < 3 ? "high" : "low");
      if (hi < 3) hi++;
    }
    if (_lazyQueue.length) _lazyPumpQueue();
  });
}

/**
 * Loads a lazy image with optional priority
 * @param {HTMLImageElement} img - Image element to load
 * @param {'high'|'low'} priority - Load priority
 */
function _loadLazyImg(img, priority = "low") {
  if (!img || img.dataset.loaded === "1") return;
  const src = img.dataset.src;
  if (!src) return;
  img.dataset.loaded = "1";
  try {
    img.setAttribute("fetchpriority", priority);
  } catch (_e) {}
  img.decoding = "async";
  img.src = src;
}

/**
 * Observes lazy images in a root element
 * @param {HTMLElement} rootEl - Root element to observe
 */
function observeLazyImages(rootEl) {
  const obs = _ensureLazyObserver();
  if (!rootEl) return;
  if (!obs) {
    rootEl
        .querySelectorAll("img[data-src]")
        .forEach((img) => _loadLazyImg(img, "low"));
    return;
  }
  rootEl.querySelectorAll("img[data-src]").forEach((img) => {
    if (img.dataset.loaded === "1") return;
    obs.observe(img);
  });
}

/**
 * Generates HTML for an item's image
 * @param {Object} r - Item data row
 * @param {string} cls - CSS class to apply
 * @param {Object} [opts={}] - Options (eager, fetchPriority)
 * @returns {string} HTML image tag
 */
function imageHTMLForRow(r, cls = "", opts = {}) {
  const paths = imagePathsForRow(r);
  if (!paths.length) return "";
  const eager = !!opts.eager,
      priority = opts.fetchPriority || "low";
  const first = paths[0],
      fb = [...paths.slice(1), "./assets/images/items/_placeholder.svg"].join(
          "|",
      );
  if (eager)
    return `<img loading="eager" fetchpriority="${esc(priority)}" decoding="async" class="${cls}" src="${esc(first)}" data-fallbacks="${esc(fb)}" data-fallback-index="0" alt="" onerror="imgFallback(this)" />`;
  return `<img loading="lazy" fetchpriority="${esc(priority)}" decoding="async" class="${cls} lazy-img" src="./assets/images/items/_placeholder.svg" data-src="${esc(first)}" data-fallbacks="${esc(fb)}" data-fallback-index="0" data-loaded="0" alt="" onerror="imgFallback(this)" />`;
}

/**
 * Gets the note key from a raw item key
 * @param {string} rawKey - The raw item key
 * @returns {string} Normalized key for note lookup
 */
function noteKeyFromRawKey(rawKey) {
  return String(rawKey || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
}

/**
 * Gets the card note for an item row
 * @param {Object} r - Item data row
 * @returns {Object|null} The note object or null
 */
function getCardNoteForRow(r) {
  const notes = window.CARD_NOTES || {},
      raw = String(r?.rawKey || "").trim();
  if (!raw) return null;
  const keyTier = noteKeyFromRawKey(raw);
  if (notes[keyTier]) return notes[keyTier];
  return notes[keyTier.replace(/\|t[123]$/i, "")] || null;
}

/**
 * Generates HTML for extra card content (notes)
 * @param {Object} r - Item data row
 * @returns {string} HTML for extra content
 */
function cardExtraH(r) {
  if (!r) return "";
  const note = getCardNoteForRow(r);
  if (!note || !note.lines?.length) return "";
  const lines = note.lines
      .map((line) => {
        const s = String(line || "");
        if (s.trim().startsWith("■"))
          return `<div class="cline"><span class="cdiamond" aria-hidden="true"></span><span>${esc(s.replace(/^■\s*/, ""))}</span></div>`;
        return `<div class="cline"><span class="cdot" aria-hidden="true"></span><span>${esc(s)}</span></div>`;
      })
      .join("");
  return `<div class="csub">${lines}</div>`;
}

/**
 * Generates HTML for panel meta section (image and notes)
 * @param {Object} r - Item data row
 * @returns {string} HTML for panel meta
 */
function panelMetaHTML(r) {
  if (!r) return "";
  const note = getCardNoteForRow(r);
  const imgPaths = dataSaver ? [] : imagePathsForRow(r);
  const hasImg = imgPaths.length > 0,
      hasNote = !!(note && note.lines && note.lines.length);
  if (!hasImg && !hasNote) return "";
  const cols =
      hasImg && hasNote ? "pm-two" : hasImg ? "pm-only-img" : "pm-only-note";
  const img = hasImg
      ? `<div class="pm-img">${imageHTMLForRow(r, "", { eager: true, fetchPriority: "high" })}</div>`
      : "";
  const lines = hasNote
      ? note.lines
          .map((line) => {
            const s = String(line || "");
            if (s.trim().startsWith("■"))
              return `<div class="pm-line"><span class="pm-b">■</span><span>${esc(s.replace(/^■\s*/, ""))}</span></div>`;
            return `<div class="pm-line"><span class="pm-dot" aria-hidden="true"></span><span>${esc(s)}</span></div>`;
          })
          .join("")
      : "";
  const centerCls =
      note && note.lines && note.lines.length <= 4 ? " pm-center" : "";
  const noteHtml = hasNote
      ? `<div class="pm-note${centerCls}"><div class="pm-note-inner">${lines}</div></div>`
      : "";
  return `<div class="pmeta ${cols}">${img}${noteHtml}</div>`;
}

/**
 * Renders items as table rows
 * @param {Object[]} rows - Array of item data rows
 */
function renderTbl(rows) {
  if (!tbody) return;
  tbody.classList.remove("rows-animating");
  tbody.innerHTML = rows
      .map((r, i) => {
        const isActive = r.rawKey === activeKey,
            ar = adaptiveRange(r);
        const inCmp = compareKeys.includes(r.rawKey);
        const favOn = isFav(r.rawKey);
        const actions = `<span class="row-actions">
        <button type="button" class="fstar ${favOn ? "on" : ""}" data-act="fav" data-key="${esc(r.rawKey)}" title="${favOn ? "Remove from favorites" : "Add to favorites"}" aria-label="${favOn ? "Remove from favorites" : "Add to favorites"}" aria-pressed="${favOn ? "true" : "false"}">★</button>
        <button type="button" class="cmp-star ${inCmp ? "on" : ""}" data-act="cmp" data-key="${esc(r.rawKey)}" title="${inCmp ? "Remove from compare" : "Add to compare"}" aria-label="${inCmp ? "Remove from compare" : "Add to compare"}" aria-pressed="${inCmp ? "true" : "false"}">⇄</button>
      </span>`;
        return `<tr data-key="${esc(r.rawKey)}" class="${isActive ? "active-row" : ""}">
        <td class="item-col"><span class="iname-wrap" title="${esc(r.rawKey)}">${actions}<span class="iname-txt">${formatItemNameH(r.displayName)}</span>${skillTagH(r.skillTag)}</span></td>
        <td class="hsm hpanel">${catBadge(r.category)}${r.tier ? "&nbsp;" + tierBadge(r.tier) : ""}</td>
        <td><div class="price-main">${fmt(r.median)}</div><div class="price-range hmd">${fmt(ar.low)} — ${fmt(ar.high)}</div></td>
        <td class="hmd hpanel"><span class="price-range">${fmt(ar.low)} — ${fmt(ar.high)}</span></td>
        <td class="hsm hpanel"><span class="conf-b ${confCls(r.confidence)}">■ ${r.confidence || "—"}</span></td>
        <td class="hmd hpanel">${trendH(r.trend)}</td>
        <td>${sampH(r.samples)}</td>
      </tr>`;
      })
      .join("");
  if (_suppressNextStaggerAnim) {
    _suppressNextStaggerAnim = false;
    return;
  }
  // Trigger stagger animation — rAF ensures DOM is painted first
  requestAnimationFrame(() => {
    tbody.classList.add("rows-animating");
    // Remove class after longest possible delay so re-renders retrigger correctly
    clearTimeout(renderTbl._t);
    renderTbl._t = setTimeout(
        () => tbody.classList.remove("rows-animating"),
        600,
    );
  });
}

/**
 * Calculates adaptive price range based on sample size
 * @param {Object} r - Item data row
 * @returns {{low: number, high: number}} Adapted price range
 */
function adaptiveRange(r) {
  // Blend between IQR-based range and credibility-adjusted range based on sample size
  // Low samples: favor credibility-adjusted range (wider confidence interval)
  // High samples: favor IQR range (more precise)
  const n = r.samples || 0,
      median = r.median || 0,
      blend = Math.min(1, n / 50);
  const credWidth = median * (0.3 - 0.15 * (Math.min(n, 10) / 10));
  return {
    low: Math.round(
        (r.iqr_low || 0) * blend + Math.max(0, median - credWidth) * (1 - blend),
    ),
    high: Math.round(
        (r.iqr_high || median) * blend + (median + credWidth) * (1 - blend),
    ),
  };
}

/**
 * Renders items as cards
 * @param {Object[]} rows - Array of item data rows
 */
function renderCards(rows) {
  if (!cgrid) return;
  cgrid.classList.remove("cards-animating");
  cgrid.innerHTML = rows
      .map((r) => {
        const isActive = r.rawKey === activeKey,
            ar = adaptiveRange(r);
        const inCmp = compareKeys.includes(r.rawKey);
        const favOn = isFav(r.rawKey);
        const imgPaths = imagePathsForRow(r);
        const isMisc = r.category === "misc";
        const showImg = !dataSaver && (imgPaths.length || isMisc);
        const imgHTML = showImg
            ? `<div class="cimgwrap${isMisc ? " cimgwrap-misc" : ""}">${imgPaths.length ? imageHTMLForRow(r, "") : '<img src="./assets/images/items/_placeholder.svg" alt="" />'}</div>`
            : "";
        const a11yLabel = `Open details for ${r.displayName || r.rawKey || "item"}`;
        return `<div class="pcard ${!showImg ? "pcard-no-img" : ""} ${isActive ? "active-card" : ""}" data-key="${esc(r.rawKey)}" role="button" tabindex="0" aria-label="${esc(a11yLabel)}">
        ${imgHTML}
        <button type="button" class="pcard-act pcard-fav fstar ${favOn ? "on" : ""}" data-act="fav" data-key="${esc(r.rawKey)}" title="${favOn ? "Remove from favorites" : "Add to favorites"}" aria-label="${favOn ? "Remove from favorites" : "Add to favorites"}" aria-pressed="${favOn ? "true" : "false"}">★</button>
        <button type="button" class="pcard-act pcard-cmp cmp-star ${inCmp ? "on" : ""}" data-act="cmp" data-key="${esc(r.rawKey)}" title="${inCmp ? "Remove from compare" : "Add to compare"}" aria-label="${inCmp ? "Remove from compare" : "Add to compare"}" aria-pressed="${inCmp ? "true" : "false"}">⇄</button>
        <div class="ccard-head">
          <div class="ckey" title="${esc(r.rawKey)}"><span class="iname-wrap"><span class="iname-txt">${formatItemNameH(r.displayName)}</span>${skillTagH(r.skillTag)}</span></div>
        </div>
        ${cardExtraH(r)}
        <div class="cprice">${fmt(r.median)}</div>
        <div class="crange">${fmt(ar.low)} — ${fmt(ar.high)}</div>
        <div class="cfoot">${catBadge(r.category)}${r.tier ? tierBadge(r.tier) : ""}<span class="conf-b ${confCls(r.confidence)}">■ ${r.confidence || "—"}</span>${trendH(r.trend)}</div>
      </div>`;
      })
      .join("");
  observeLazyImages(cgrid);
  if (_suppressNextStaggerAnim) {
    _suppressNextStaggerAnim = false;
    return;
  }
  requestAnimationFrame(() => {
    cgrid.classList.add("cards-animating");
    clearTimeout(renderCards._t);
    renderCards._t = setTimeout(
        () => cgrid.classList.remove("cards-animating"),
        600,
    );
  });
}

/**
 * Generates a category badge
 * @param {string} cat - Category key
 * @returns {string} HTML for badge
 */
function catBadge(cat) {
  return `<span class="cb cat-${cat}">${CAT_LABELS[cat] || cat}</span>`;
}

/**
 * Generates HTML for a skill tag
 * @param {Object|null} tag - Skill tag object
 * @returns {string} HTML for skill tag
 */
function skillTagH(tag) {
  if (!tag || !tag.cls || !tag.text) return "";
  return `<span class="stag ${tag.cls}">${esc(tag.text)}</span>`;
}

/**
 * Generates HTML for a tier badge
 * @param {number} tier - Tier level (1-3)
 * @returns {string} HTML for tier badge
 */
function tierBadge(tier) {
  return `<span class="tier-badge tier-${tier}">T${tier} ${tierStars(tier)}</span>`;
}

/**
 * Gets CSS class for confidence level
 * @param {string} c - Confidence level
 * @returns {string} CSS class
 */
function confCls(c) {
  return (
      { high: "ch", good: "cg", fair: "cf", low: "cl", unreliable: "cu" }[c] ||
      "cl"
  );
}

/**
 * Generates HTML for trend indicator
 * @param {string} t - Trend direction
 * @returns {string} HTML for trend
 */
function trendH(t) {
  if (t === "up") return '<span class="trend tu">↑ rising</span>';
  if (t === "down") return '<span class="trend td">↓ falling</span>';
  return '<span class="trend ts">→ stable</span>';
}

/**
 * Generates HTML for sample count visualization
 * @param {number|null} n - Sample count
 * @returns {string} HTML for sample bar
 */
function sampH(n) {
  const pct =
      maxSamples > 0
          ? Math.min(100, Math.round(((n || 0) / maxSamples) * 100))
          : 0;
  return `<div class="swrap"><div class="sbg"><div class="sfill" style="width:${pct}%"></div></div><span class="snum">${n != null ? n.toLocaleString() : "—"}</span></div>`;
}

/**
 * Rounds a price to a "clean" value (nearest 50, 500, 5k, etc. based on magnitude)
 * @param {number} n - Price to round
 * @returns {number} Rounded price
 */
function roundToCleanPrice(n) {
  if (!n || n <= 0) return 0;
  const digits = Math.floor(Math.log10(n));

  let step;
  if (n >= 1_000_000)
    step = 50_000; //  1M-10M → nearest 50k
  else if (n >= 100_000)
    step = 5_000; // 100k-1M → nearest 5k
  else if (n >= 10_000)
    step = 500; //  10k-100k → nearest 500
  else step = 50; //    <10k → nearest 50

  return Math.round(n / step) * step;
}

/**
 * Copies a price to clipboard
 * @param {number} n - Price to copy
 * @param {HTMLElement|null} btn - Button that triggered the copy (for UI feedback)
 */
function copyPrice(n, btn) {
  const rounded = roundToCleanPrice(Math.round(n || 0));
  navigator.clipboard
      ?.writeText(String(rounded))
      .then(() => {
        if (btn) {
          btn.classList.add("copied");
          setTimeout(() => btn.classList.remove("copied"), 1800);
        }
        toast("Copied " + rounded.toLocaleString());
      })
      .catch(() => toast("Could not copy", true));
}

/**
 * Shows empty state UI when no items match filters
 * @param {boolean} hasF - Whether filters are active
 */
function showEmpty(hasF) {
  if (!tbody && !cgrid) return;
  // Hide pagination when showing empty state
  const pagEl = document.querySelector(".pag");
  if (pagEl) pagEl.classList.add("pag-hidden");
  if (favOnly && !favSet.size) {
    const inner = `<div class="estate"><div class="eicon">★</div><div class="emsg">No favorites yet</div><div class="esub">Click the ★ star on any item to add it to your watchlist.</div><div class="esub esub-action"><button class="empty-action" data-action="toggle-fav-only">Show all items</button></div></div>`;
    if (vw === "table")
      tbody.innerHTML = `<tr><td colspan="7">${inner}</td></tr>`;
    else cgrid.innerHTML = `<div class="grid-full">${inner}</div>`;
    return;
  }
  const msg = hasF ? "No items match your filters" : "No data loaded";
  const sub = hasF
      ? `<div class="esub esub-action"><button class="empty-action" data-action="clear-all">Clear all filters</button></div>`
      : "";
  const inner = `<div class="estate"><div class="eicon">⊘</div><div class="emsg">${msg}</div>${sub}</div>`;
  if (vw === "table")
    tbody.innerHTML = `<tr><td colspan="7">${inner}</td></tr>`;
  else cgrid.innerHTML = `<div class="grid-full">${inner}</div>`;
}

/**
 * Shows loading skeleton state
 */
function showSkel() {
  if (!tbody) return; // Guard: only run if we are on index.html
  const ragged = ["sbar-w-rag-1", "sbar-w-rag-2", "sbar-w-rag-3"];
  tbody.innerHTML = Array.from(
      { length: 14 },
      (_, i) =>
          `<tr class="skel"><td><div class="sbar ${ragged[i % ragged.length]}"></div></td><td class="hsm hpanel"><div class="sbar sbar-w-md"></div></td><td><div class="sbar sbar-w-sm"></div></td><td class="hmd hpanel"><div class="sbar sbar-w-xl"></div></td><td class="hsm hpanel"><div class="sbar sbar-w-md"></div></td><td class="hmd hpanel"><div class="sbar sbar-w-xs"></div></td><td><div class="sbar sbar-w-lg sbar-align-end"></div></tr>`,
  ).join("");
}

/**
 * Shows error state in table
 * @param {string} msg - Error message to display
 */
function showErr(msg) {
  if (!tbody) return; // Guard: only run if we are on index.html
  tbody.innerHTML = `<tr><td colspan="7"><div class="estate"><div class="eicon estate-error">✕</div><div class="emsg estate-error">Failed to load</div><div class="esub">${esc(msg)}S</div></div></td></tr>`;
}

/**
 * Main render function - coordinates UI rendering based on current state
 * Handles: filtering, pagination, view switching (table/cards), and updating UI elements
 */
function render() {
  const tot = filtered.length,
      pages = Math.max(1, Math.ceil(tot / PAGE));
  if (pg > pages) pg = pages;

  const hasF =
      (qEl?.value || "").trim() ||
      catEl?.value ||
      confEl?.value ||
      tierEl?.value !== "";

  // GUARD: Only update if elements exist on the current page
  const riEl = $("ri");
  if (riEl) {
    riEl.textContent = hasF
        ? `${tot.toLocaleString()} of ${allPrices.length.toLocaleString()} items`
        : `${tot.toLocaleString()} items`;
  }

  if (!tot) {
    showEmpty(hasF);
    renderPag(0);
    return;
  }

  const slice = filtered.slice((pg - 1) * PAGE, pg * PAGE);
  vw === "table" ? renderTbl(slice) : renderCards(slice);
  renderPag(pages);

  const sUpd = $("sUpd");
  if (sUpd && lastLoaded) sUpd.textContent = fmtT(lastLoaded);
}

/**
 * Renders pagination controls
 * @param {number} pages - Total number of pages
 */
function renderPag(pages) {
  // FIXED: Guard against null to prevent crashes on sellers.html
  const pmetaEl = $("pmeta");
  if (pmetaEl) {
    pmetaEl.textContent = filtered.length
        ? `Page ${pg} of ${pages} · ${filtered.length.toLocaleString()} results`
        : "";
  }

  // ----- TOP pagination -----
  const elTop = $("pbtns-top");
  const b = []; // always defined

  if (pages > 1) {
    // ← Previous page
    b.push(
        `<button class="pb" data-action="go-page" data-page="${pg - 1}" ${pg === 1 ? "disabled" : ""}>←</button>`,
    );

    // Page numbers
    let s = Math.max(1, pg - 2);
    let e = Math.min(pages, s + 4);
    if (e - s < 4) s = Math.max(1, e - 4);
    for (let i = s; i <= e; i++) {
      // Add 'on' class to the button that matches the current page
      const activeCls = i === pg ? "on" : "";
      b.push(
          `<button class="pb ${activeCls}" data-action="go-page" data-page="${i}">${i}</button>`,
      );
    }

    // → Next page (with ellipsis handling)
    if (e < pages) {
      if (e < pages - 1) {
        b.push(
            `<span class="pagination-ellipsis">…</span>`,
        );
      }
      b.push(`<button class="pb" data-action="go-page" data-page="${pages}">${pages}</button>`);
    }

    // → Next page button
    b.push(
        `<button class="pb" data-action="go-page" data-page="${pg + 1}" ${pg === pages ? "disabled" : ""}>→</button>`,
    );
  }

  // Apply the top bar (empty string when there’s only one page)
  if (elTop) {
    elTop.innerHTML = b.join("");
  }

  // ----- BOTTOM pagination (duplicate the top bar) -----
  const elBottom = $("pbtns");
  if (pages <= 1) {
    if (elBottom) elBottom.innerHTML = "";
  } else {
    // FIXED: Guard against null for bottom pagination
    if (elBottom && elTop) {
      elBottom.innerHTML = elTop.innerHTML;
    }
  }
}

/**
 * Navigates to a specific page
 * @param {number} n - Page number to navigate to
 */
function goPg(n) {
  pg = n;
  render();
  const isMobile = (() => {
    try {
      return window.matchMedia("(max-width: 768px)").matches;
    } catch (_e) {
      return window.innerWidth <= 768;
    }
  })();
  const targetEl = isMobile ? $("pbtns-top") : $("rlsb");
  if (targetEl) {
    const rect = targetEl.getBoundingClientRect();
    const headerOffset = isMobile ? 80 : 0;
    const top = Math.max(0, window.scrollY + rect.top - headerOffset);
    window.scrollTo({ top, behavior: "smooth" });
    return;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Sets the sort column and direction
 * @param {string} col - Column to sort by
 */
function setSort(col) {
  if (sc === col) {
    sd = sd === "asc" ? "desc" : "asc"; // toggle direction on same column
  } else {
    sc = col;
    // Default direction: newest first for last_seen, otherwise:
    //   median & samples → desc (high → low)
    //   displayName, confidence, trend → asc (A‑Z, low → high)
    sd =
        col === "last_seen" || col === "median" || col === "samples"
            ? "desc"
            : "asc";
  }
  if (col === "last_seen") lastSeenDir = sd;
  updateSortUI(); // refresh the arrows / active states
  applyFilters(); // re‑filter & re‑render with the new sort
  scheduleSaveUIState(); // persist UI state
}

/**
 * Toggles sort direction
 */
function flipDir() {
  sd = sd === "asc" ? "desc" : "asc";
  if (sc === "last_seen") lastSeenDir = sd;
  updateSortUI();
  applyFilters();
  scheduleSaveUIState();
}

/**
 * Updates sort UI indicators
 */
function updateSortUI() {
  [
    "displayName",
    "median",
    "confidence",
    "trend",
    "samples",
    "last_seen",
  ].forEach((c) => {
    const th = $("th-" + c),
        ar = $("ar-" + c);
    // GUARD: Only update if the table header elements exist
    if (th) th.classList.toggle("on", c === sc);
    if (ar) ar.textContent = c === sc ? (sd === "asc" ? "↑" : "↓") : "";
  });

  ["median", "samples", "displayName", "confidence", "last_seen"].forEach(
      (c) => {
        // "last_seen" pill has id="sp-lastseen" (no underscore) in HTML
        const pid = c === "last_seen" ? "sp-lastseen" : "sp-" + c;
        const p = $(pid);
        // GUARD: Only update if the sort pill button exists
        if (p) p.classList.toggle("on", c === sc);
      },
  );

  // GUARD: Only update the direction arrow if it exists
  const dirBtn = $("sp-dir");
  if (dirBtn) dirBtn.textContent = sd === "asc" ? "↑" : "↓";

  // GUARD: Only update the text of the last_seen button if it exists
  const tsBtn = $("sp-lastseen");
  if (tsBtn) {
    tsBtn.textContent = lastSeenDir === "asc" ? "Oldest" : "Newest";
  }
}

/**
 * Sets the view mode (table or cards)
 * @param {string} v - View mode ('table' or 'card')
 */
function setView(v) {
  suppressNextStaggerAnim(); // avoids “double load” feeling when switching view
  vw = v;
  const tvw = $("tvw"),
      cvw = $("cvw");
  if (tvw) tvw.style.display = "";
  if (cvw) cvw.style.display = "";
  tvw.hidden = v !== "table";
  cvw.hidden = v !== "card";
  $("vt").classList.toggle("on", v === "table");
  $("vc").classList.toggle("on", v === "card");
  const entering = v === "table" ? tvw : cvw;
  entering.classList.remove("view-entering");
  entering.offsetWidth; // reflow
  entering.classList.add("view-entering");
  setTimeout(() => entering.classList.remove("view-entering"), 300);
  render();
  scheduleSaveUIState();
}

/**
 * Clears the search input
 */
function clearQ() {
  if (!qEl) return;
  qEl.value = "";
  $("xBtn")?.classList.remove("on");
  hideSugg();
  applyFilters();
  qEl.focus();
}

/**
 * Clears all filters and resets UI state
 */
function clearAll() {
  if (!qEl) return;
  qEl.value = "";
  if (catEl) catEl.value = "";
  if (confEl) confEl.value = "";
  if (tierEl) tierEl.value = "";
  $("xBtn")?.classList.remove("on");
  if (catEl) refreshCSelect("catEl");
  if (confEl) refreshCSelect("confEl");
  if (tierEl) refreshCSelect("tierEl");
  applyFilters();
}
