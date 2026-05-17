/**
 * Detail panel management and UI rendering.
 * Handles opening/closing the item detail panel, rendering panel content,
 * managing listings, seller information, and panel controls.
 */

/**
 * Sets the panel sort option and updates the UI.
 * @param {string} v - The sort option value ('newest', 'price_asc', 'price_desc', 'seller')
 */
function setPanelSort(v) {
  panelSort = v;
  renderPanelFromCtx({ partial: true });
  scheduleSaveUIState();
}

/**
 * Sets whether to include flagged items in the panel and updates the UI.
 * @param {boolean} v - Whether to include flagged items
 */
function setPanelIncludeFlagged(v) {
  panelIncludeFlagged = !!v;
  renderPanelFromCtx({ partial: true });
  scheduleSaveUIState();
}
/**
 * Toggles the panel sort dropdown open/closed.
 * Closes all other custom selects before opening this one.
 */
function togglePanelSortSel() {
  const el = $("panelSortSel");
  if (!el) return;
  const isOpen = el.classList.contains("open");
  closeAllCSelects(isOpen ? null : "panelSortSel");
  el.classList.toggle("open", !isOpen);
  const btn = el.querySelector(".cselect-btn");
  if (btn) btn.setAttribute("aria-expanded", (!isOpen).toString());
}

// Panel animation
let _panelAnimToken = 0;

function setPanelShellOpen(open) {
  const header = document.querySelector(".site-header");
  const targets = [appShell, header].filter(Boolean);
  const shouldAnimate = targets.length && window.innerWidth > 768;
  const first = shouldAnimate
    ? targets.map((el) => ({ el, rect: el.getBoundingClientRect() }))
    : [];

  appShell?.classList.add("no-shell-anim");
  header?.classList.add("no-shell-anim");
  document.documentElement.classList.toggle("panel-scrollbar-hidden", open);
  document.body.classList.toggle("panel-open", open);
  appShell?.classList.toggle("panel-open", open);

  if (!shouldAnimate) {
    appShell?.classList.remove("no-shell-anim");
    header?.classList.remove("no-shell-anim");
    return;
  }

  const animations = first
    .map(({ el, rect }) => {
      try {
        el.getAnimations().forEach((a) => a.cancel());
      } catch (_e) {}
      const next = el.getBoundingClientRect();
      const dx = rect.left - next.left;
      const sx = next.width ? rect.width / next.width : 1;
      if (Math.abs(dx) < 0.5 && Math.abs(sx - 1) < 0.002) return null;
      return el.animate(
        [
          { transform: `translateX(${dx}px) scaleX(${sx})` },
          { transform: "translateX(0) scaleX(1)" },
        ],
        {
          duration: 190,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        },
      );
    })
    .filter(Boolean);

  Promise.all(animations.map((a) => a.finished.catch(() => {}))).then(() => {
    appShell?.classList.remove("no-shell-anim");
    header?.classList.remove("no-shell-anim");
  });
}

/**
 * Animates the panel content swap with fade-out/fade-in effects.
 * @param {Function} mutator - Function to mutate the panel content
 * @returns {Promise<void>}
 */
async function panelSwapAnimate(mutator) {
  const hdr = panel?.querySelector(".panel-header"),
    body = $("panel-body");
  const els = [hdr, body].filter(Boolean);
  for (const el of els) {
    try {
      el.getAnimations().forEach((a) => a.cancel());
    } catch (_e) {}
  }
  const token = ++_panelAnimToken;
  const out = els.map((el) =>
    el.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(6px)" },
      ],
      { duration: 90, easing: "ease-out" },
    ),
  );
  await Promise.all(out.map((a) => a.finished.catch(() => {})));
  if (token !== _panelAnimToken) return;
  mutator();
  const inn = els.map((el) =>
    el.animate(
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 140, easing: "cubic-bezier(.2,.8,.2,1)" },
    ),
  );
  await Promise.all(inn.map((a) => a.finished.catch(() => {})));
}

/**
 * Opens the detail panel for a specific item.
 * @param {string} key - The raw key of the item to display
 * @returns {Promise<void>}
 */
async function openPanel(key) {
  if (!panel) return;
  const wasOpen = panel.classList.contains("open");
  if (activeKey === key && wasOpen) {
    closePanel();
    return;
  }
  activeKey = key;
  setHashItemKey(key);
  scheduleSaveUIState();
  markActiveSelection();
  const item = findDisplayRowByKey(key);
  if (!item) {
    closePanel();
    return;
  }
  panel.classList.add("open");
  panelBackdrop?.classList.add("on");
  if (!wasOpen) setPanelShellOpen(true);
  // Sync global overlay state (scroll lock, overlay-open class, etc.)
  window.updateOverlayUI?.();
  // Focus trap only on mobile (desktop should still allow selecting other cards while open).
  const lock = (() => {
    try {
      return window.matchMedia("(max-width: 600px), (pointer: coarse)").matches;
    } catch (_e) {
      return window.innerWidth <= 600;
    }
  })();
  if (!wasOpen && lock)
    window.overlayFocusPush?.(panel, $("panelCloseBtn") || panel);
  const swap = () => {
    const titleInner = `
      <span class="panel-title__inner">
        <span class="iname-txt">${formatItemNameH(item.displayName)}</span>${skillTagH(item.skillTag)}
      </span>
    `;
    const badgeLine = `
      ${item.category ? catBadge(item.category) : ""}
      ${item.setName ? `<div class="mpill"><span class="mplabel">Set</span> ${esc(item.setName)}</div>` : ""}
    `;
    $("panel-title").innerHTML = `
      <div class="panel-title__line">${titleInner}</div>
      <div class="panel-title__line">${badgeLine}</div>
    `;
    panelMeta.innerHTML = panelMetaHTML(item);
    $("panel-body").innerHTML = panelSkeleton();
  };

  // Always animate — on first open, skip the fade-out step (nothing to hide)
  if (wasOpen) {
    await panelSwapAnimate(swap);
  } else {
    swap();
    // Fade in skeleton on first open, consistent with subsequent opens
    const body = $("panel-body");
    if (body)
      body.animate(
        [
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 160, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
  }
  const listingsRaw = await fetchListings(key);
  if (activeKey !== key) return;
  const listingsClean = listingsRaw.filter((l) => !isBadSeller(l.seller));
  const removed = listingsRaw.length - listingsClean.length;
  const st = statsFromListings(listingsClean);
  panelCtx = {
    key,
    item,
    listingsRaw,
    listingsClean,
    removed,
    samplesFromListings: st.n || 0,
  };
  renderPanelFromCtx({ partial: false });
}

/**
 * Closes the detail panel.
 */
function closePanel() {
  if (!panel) return;
  panel.classList.remove("open");
  panelBackdrop?.classList.remove("on");
  setPanelShellOpen(false);
  activeKey = null;
  panelCtx = null;
  if (panelMeta) panelMeta.innerHTML = "";
  markActiveSelection();
  setHashItemKey(null);
  scheduleSaveUIState();
  window.updateOverlayUI?.();
  window.overlayFocusPop?.(panel);
}

/**
 * Generates skeleton loading HTML for the panel body.
 * Shown while listings are being fetched from the Castia Worker.
 * @returns {string} HTML string for the skeleton UI
 */
function panelSkeleton() {
  return `<div class="panel-skel"><div class="pskel-block"></div><div class="pskel-line pskel-line--md"></div><div class="pskel-line pskel-line--lg"></div><div class="pskel-line pskel-line--sm"></div></div>`;
}

/**
 * Returns a human-readable label for the current panel sort option.
 * @returns {string} Display label for the current sort (e.g. "Price ↑", "Newest")
 */
function panelSortLabel() {
  return panelSort === "price_asc"
    ? "Price ↑"
    : panelSort === "price_desc"
      ? "Price ↓"
      : panelSort === "seller"
        ? "Seller rating"
        : "Newest";
}

function sellerBadgeHTML(label, text) {
  const cls = String(label || "neutral").toLowerCase();
  return `<span class="lr-seller-badge ${esc(cls)}">${esc(text || label || "Neutral")}</span>`;
}

/**
 * Builds HTML for the listings section in the panel.
 * @param {Object} pd - Parsed item data
 * @param {Object[]} listings - Array of listing objects
 * @returns {string} HTML string for listings
 */
function buildPanelListingsHTML(pd, listings) {
  if (!listings.length)
    return `<div class="no-listings">No recent listings found</div>`;
  let html = "";
  for (const l of listings) {
    const info = sellerRatingInfo(l.seller);
    const sellerBadge = info.label
      ? sellerBadgeHTML(info.label, info.label)
      : "";
    const blacklistedBadge = info.isBlacklisted
      ? sellerBadgeHTML("blacklisted", "Blacklisted")
      : "";
    let priceClass = "";
    if (pd.iqr_high && l.unit_price > pd.iqr_high * 1.5) priceClass = "over";
    else if (pd.iqr_low && l.unit_price < pd.iqr_low * 0.7)
      priceClass = "under";
    html += `<div class="listing-row">
      <div class="listing-row-main">
        <div class="listing-row-seller">
          <span class="lr-seller">${esc(l.seller || "Unknown")}</span>${sellerBadge}${blacklistedBadge}
        </div>
        ${l.count > 1 ? `<div class="lr-count">×${l.count.toLocaleString()}</div>` : ""}
      </div>
      <div class="listing-row-price">
        <div class="lr-price ${priceClass}">${fmt(l.unit_price)}</div>
        ${l.count > 1 ? `<div class="lr-date">total ${fmt(l.price)}</div>` : ""}
        <div class="lr-date">${fmtT(l.timestamp)}</div>
      </div>
    </div>`;
  }
  return html;
}

/**
 * Builds HTML for the top sellers section in the panel.
 * @param {Object[]} listings - Array of listing objects
 * @returns {string} HTML string for top sellers
 */
function buildPanelTopSellersHTML(listings) {
  const sellerCounts = {};
  for (const l of listings)
    if (l.seller) sellerCounts[l.seller] = (sellerCounts[l.seller] || 0) + 1;
  const topSellers = Object.entries(sellerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);
  if (!topSellers.length) return "";
  let html = `<div class="psec"><div class="psec-title">Sellers of This Item</div>`;
  for (const sellerName of topSellers) {
    const sd = allSellers[sellerName.toLowerCase()];
    if (!sd) continue;
    const label =
      sd.is_blacklisted || sd.is_flagged
        ? "Flagged"
        : sd.accuracy_label || "Neutral";
    html += `<div class="seller-rep">
      <div class="sr-name">
        ${esc(sd.seller)}
        ${sellerBadgeHTML(label, label)}
        ${sd.is_blacklisted ? sellerBadgeHTML("blacklisted", "Blacklisted") : ""}
      </div>
      <div class="sr-row"><span class="sr-label">Total Listings</span><span class="sr-value">${sd.total_listings?.toLocaleString() || "—"}</span></div>
      <div class="sr-row"><span class="sr-label">Avg Markup</span><span class="sr-value">${sd.avg_markup_percent != null ? sd.avg_markup_percent.toFixed(1) + "%" : "—"}</span></div>
      <div class="sr-row"><span class="sr-label">Overpriced Ratio</span><span class="sr-value ${(sd.overpriced_ratio || 0) > 30 ? "warn" : ""}">${sd.overpriced_ratio != null ? sd.overpriced_ratio.toFixed(1) + "%" : "—"}</span></div>
      <div class="sr-row"><span class="sr-label">Listings for this item</span><span class="sr-value">${sellerCounts[sellerName] || "—"}</span></div>
    </div>`;
  }
  html += `</div>`;
  return html;
}

/**
 * Updates the panel controls (sort dropdown and flagged toggle).
 */
function updatePanelControls() {
  const val = $("panelSortVal");
  if (val) val.textContent = panelSortLabel();
  const tog = $("panelFlagTog");
  if (tog) {
    tog.classList.toggle("on", !!panelIncludeFlagged);
    tog.setAttribute("aria-checked", panelIncludeFlagged ? "true" : "false");
  }
  const menu = $("panelSortMenu");
  if (menu) {
    menu.querySelectorAll("button[data-sort]").forEach((btn) => {
      const on = btn.dataset.sort === panelSort;
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
  }
  const sel = $("panelSortSel");
  if (sel) {
    const b = sel.querySelector(".cselect-btn");
    if (b)
      b.setAttribute(
        "aria-expanded",
        sel.classList.contains("open") ? "true" : "false",
      );
  }
}

/**
 * Renders the panel content from the current context.
 * @param {Object} [opts={}] - Options object
 * @param {boolean} [opts.partial=false] - Whether to update only parts of the panel
 */
function renderPanelFromCtx(opts = {}) {
  if (!panelCtx) return;
  const { item, listingsRaw, listingsClean, removed, samplesFromListings } =
    panelCtx;
  const pd = { ...item };
  const st = statsFromListings(listingsClean);
  if (st.n) {
    // Keep database median — only update range, trend, last_seen from live listings
    pd.iqr_low = st.q1;
    pd.iqr_high = st.q3;
    pd.trend = trendFromListings(listingsClean);
    pd.last_seen = listingsClean[0]?.timestamp || pd.last_seen;
  }
  const visible = panelIncludeFlagged ? [...listingsRaw] : [...listingsClean];
  const sorted = sortPanelListings(visible, pd);
  const body = $("panel-body");
  const preserveScroll = opts.partial && body;
  const scrollTop = preserveScroll ? body.scrollTop : 0;
  if (
    opts.partial &&
    $("panelListings") &&
    $("panelRemovedNote") &&
    $("panelTopSellers")
  ) {
    updatePanelControls();
    const note = $("panelRemovedNote");
    if (note) {
      if (removed && !panelIncludeFlagged) {
        note.classList.remove("u-hidden");
        note.innerHTML = `Filtered out ${removed} listing${removed === 1 ? "" : "s"} from flagged/blacklisted sellers`;
      } else {
        note.classList.add("u-hidden");
        note.innerHTML = "";
      }
    }
    $("panelListings").innerHTML = buildPanelListingsHTML(pd, sorted);
    $("panelTopSellers").innerHTML = buildPanelTopSellersHTML(visible);
    if (preserveScroll) body.scrollTop = scrollTop;
    return;
  }
  body.innerHTML = buildPanelHTML(pd, sorted, { removed, samplesFromListings });
  updatePanelControls();
}

/**
 * Sorts listings for the panel based on the current sort setting.
 * @param {Object[]} listings - Array of listing objects to sort
 * @param {Object} pd - Parsed item data (for reference)
 * @returns {Object[]} Sorted array of listings
 */
function sortPanelListings(listings, pd) {
  const out = [...listings].map((l) => ({
    ...l,
    unit_price: getUnitPrice(l),
    _ts: l.timestamp ? new Date(l.timestamp).getTime() : 0,
    _rating: sellerRatingInfo(l.seller).order,
  }));
  if (panelSort === "price_asc")
    out.sort(
      (a, b) => (a.unit_price || 0) - (b.unit_price || 0) || b._ts - a._ts,
    );
  else if (panelSort === "price_desc")
    out.sort(
      (a, b) => (b.unit_price || 0) - (a.unit_price || 0) || b._ts - a._ts,
    );
  else if (panelSort === "seller")
    out.sort(
      (a, b) =>
        a._rating - b._rating ||
        b._ts - a._ts ||
        (a.unit_price || 0) - (b.unit_price || 0),
    );
  else out.sort((a, b) => b._ts - a._ts);
  return out;
}

/**
 * Builds the complete HTML for the panel.
 * @param {Object} item - Parsed item data
 * @param {Object[]} listings - Array of listing objects to display
 * @param {Object} [meta={}] - Metadata (removed count, samplesFromListings)
 * @returns {string} Complete HTML string for the panel
 */
function buildPanelHTML(item, listings, meta = {}) {
  const pd = item,
    removed = meta.removed || 0,
    samplesFromListings = meta.samplesFromListings || 0;
  const hasHistory = !pd.catalogOnly;
  // Use database samples if available, otherwise use live listing samples
  const nTotal = pd.samples || 0,
    n = nTotal > 0 ? nTotal : samplesFromListings,
    median = pd.median || 0;
  // Raw IQR from database (may be zero for new items)
  const rawLow = pd.iqr_low || 0,
    rawHigh = pd.iqr_high || median;

  // Blend between database IQR and credibility-adjusted range based on sample size
  // Low samples: favor credibility-adjusted range (wider confidence interval)
  // High samples: favor database IQR range (more precise)
  // Formula: blended = raw * blend + credibility * (1 - blend)
  const blend = Math.min(1, n / 50),
    credWidth = median * (0.3 - 0.15 * (Math.min(n, 10) / 10));
  const credLow = Math.max(0, median - credWidth),
    credHigh = median + credWidth;
  const displayLow = Math.round(rawLow * blend + credLow * (1 - blend));
  const displayHigh = Math.round(rawHigh * blend + credHigh * (1 - blend));
  const iqrSpan = displayHigh - displayLow,
    rangeMax = displayHigh * 1.2 || 1;
  const lowPct = Math.max(0, Math.min(100, (displayLow / rangeMax) * 100));
  const highPct = Math.max(0, Math.min(100, (displayHigh / rangeMax) * 100));
  const medPct = Math.max(0, Math.min(100, (median / rangeMax) * 100));
  const fillW = Math.max(0, highPct - lowPct);

  // Sample size warnings for UI
  const rangeNote =
    n >= 30
      ? ""
      : n >= 10
        ? `<div class="range-note">⚠ Range estimated — fewer than 30 samples</div>`
        : n >= 3
          ? `<div class="range-note range-note-warn">⚠ Low sample count — range is approximate</div>`
          : `<div class="range-note range-note-danger">⚠ Very few samples — treat range as indicative only</div>`;
  let html = "";

  // Price hero section with median price and IQR visualization
  html += hasHistory
    ? `<div class="price-hero">
    <div class="ph-label">Median Unit Price</div>
    <div class="ph-head">
      <div class="ph-median">${fmt(median)}</div>
      <button type="button" class="copy-price-btn" data-act="copy-price" data-price="${median}" title="Copy price" aria-label="Copy price">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3.5" y="3.5" width="6" height="6" rx="1"/><path d="M1.5 7.5V1.5h6"/></svg>
      </button>
    </div>
    <!-- IQR bar showing credible interval -->
    <div class="iqr-bar-wrap">
      <div class="iqr-bar-bg">
        <div class="iqr-bar-fill" style="left:${lowPct}%;width:${fillW}%"></div>
        <div class="iqr-bar-median" style="left:${medPct}%"></div>
      </div>
      <div class="iqr-labels"><span>${fmt(displayLow)}</span><span>${fmt(displayHigh)}</span></div>
    </div>
    ${rangeNote}
    <div class="ph-range">
      <div class="ph-range-item"><div class="ph-rl">${n >= 10 ? "IQR Low" : "Est. Low"}</div><div class="ph-rv">${fmt(displayLow)}</div></div>
      <div class="ph-range-item"><div class="ph-rl">${n >= 10 ? "IQR High" : "Est. High"}</div><div class="ph-rv">${fmt(displayHigh)}</div></div>
      <div class="ph-range-item"><div class="ph-rl">Spread</div><div class="ph-rv">${fmt(iqrSpan)}</div></div>
    </div>
  </div>`
    : `<div class="price-hero price-hero--empty">
      <div class="ph-label">Market History</div>
      <div class="ph-empty">No market history yet</div>
      <div class="ph-empty-sub">This catalog item can still be inspected and compared, but there are no tracked listings to estimate a price range.</div>
    </div>`;

  // Meta pills row 1: Confidence, Trend, Samples, Tier, Last seen
  html += `<div class="meta-pills">
    <div class="mpill"><span class="mplabel">Confidence</span> <span class="conf-b conf-inline ${confCls(pd.confidence)}">■ ${pd.confidence || "—"}</span></div>
    <div class="mpill"><span class="mplabel">Trend</span> ${trendH(pd.trend)}</div>
    <div class="mpill"><span class="mplabel">Samples</span> ${pd.samples?.toLocaleString() || "—"}</div>
    ${pd.tier ? `<div class="mpill"><span class="mplabel">Tier</span> ${tierBadge(pd.tier)}</div>` : ""}
    <div class="mpill"><span class="mplabel">Last seen</span> ${fmtT(pd.last_seen)}</div>
  </div>`;

  // Meta pills row 2: Favorite, Compare
  html += `<div class="meta-pills">
    <button type="button" class="mpill mpill-btn ${isFav(pd.rawKey) ? "on" : ""}" data-act="fav" data-key="${esc(pd.rawKey)}" title="Toggle favorite" aria-label="Toggle favorite" aria-pressed="${isFav(pd.rawKey) ? "true" : "false"}" id="panelFavBtn">★ Favorite</button>
    <button type="button" class="mpill mpill-btn ${compareKeys.includes(pd.rawKey) ? "on" : ""}" data-act="cmp" data-key="${esc(pd.rawKey)}" title="Toggle compare" aria-label="Toggle compare" aria-pressed="${compareKeys.includes(pd.rawKey) ? "true" : "false"}" id="panelCmpBtn">⇄ Compare</button>
  </div>`;

  // Recent listings section with sortable header and controls
  html += `<div class="psec"><div class="psec-title">Listings</div>`;
  html += `<div class="pctrl">
    <span class="pcl">Sort</span>
    <div class="cselect" id="panelSortSel">
      <button type="button" class="cselect-btn" data-act="panel-sort-toggle" aria-haspopup="listbox" aria-expanded="false">
        <span class="cval" id="panelSortVal">${panelSortLabel()}</span>
      </button>
      <div class="cselect-menu" id="panelSortMenu" role="listbox" aria-label="Sort listings">
        <button type="button" class="copt ${panelSort === "newest" ? "on" : ""}" data-act="panel-sort" data-sort="newest">Newest</button>
        <button type="button" class="copt ${panelSort === "price_asc" ? "on" : ""}" data-act="panel-sort" data-sort="price_asc">Price ↑</button>
        <button type="button" class="copt ${panelSort === "price_desc" ? "on" : ""}" data-act="panel-sort" data-sort="price_desc">Price ↓</button>
        <button type="button" class="copt ${panelSort === "seller" ? "on" : ""}" data-act="panel-sort" data-sort="seller">Seller rating</button>
      </div>
    </div>
    <button type="button" class="ptog-switch ${panelIncludeFlagged ? "on" : ""}" id="panelFlagTog" data-act="panel-include-flagged" role="switch" aria-checked="${panelIncludeFlagged ? "true" : "false"}">
      <span class="ptog-switch__label">Include Flagged</span>
      <span class="ptog-switch__track" aria-hidden="true">
        <span class="ptog-switch__thumb"></span>
      </span>
    </button>
  </div>`;

  // Note about filtered listings from flagged/blacklisted sellers
  if (removed && !panelIncludeFlagged) {
    html += `<div id="panelRemovedNote" class="panel-removed-note">Filtered out ${removed} listing${removed === 1 ? "" : "s"} from flagged/blacklisted sellers</div>`;
  } else {
    html += `<div id="panelRemovedNote" class="panel-removed-note u-hidden"></div>`;
  }

  // Recent listings and top sellers sections
  html += `<div id="panelListings">${buildPanelListingsHTML(pd, listings)}</div></div>`;
  html += `<div id="panelTopSellers">${buildPanelTopSellersHTML(listings)}</div>`;

  // Panel scroll-to-top button
  html += `<button type="button" class="panel-scroll-top" data-act="panel-scroll-top" aria-label="Back to top">
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="2,7 5.5,3.5 9,7"/></svg>
    Back to top
  </button>`;
  return html;
}
