/**
 * UI features and event handling for the application.
 * Manages overlays, favorites, data saver mode, item comparison, UI updates,
 * search suggestions, filters, and keyboard shortcuts.
 */

// Overlay state management
let _scrollLockY = 0;
let _scrollLockOn = false;
let _compareOpenScrollY = 0;
/**
 * Determines if body scroll should be locked based on screen size and pointer type.
 * @returns {boolean} True if scroll should be locked (mobile/coarse pointer)
 */
function _shouldLockBodyScroll() {
  // Mobile-first: lock on coarse pointer or small screens (prevents background scroll under sheets/modals).
  try {
    return window.matchMedia("(max-width: 600px), (pointer: coarse)").matches;
  } catch (_e) {
    return window.innerWidth <= 600;
  }
}
/**
 * Sets or removes body scroll locking.
 * @param {boolean} locked - Whether to lock or unlock scrolling
 */
function _setBodyScrollLocked(locked) {
  if (!locked) {
    if (!_scrollLockOn) return;
    const restoreY = _scrollLockY || 0;
    _scrollLockOn = false;
    document.body.classList.remove("scroll-locked");
    const root = document.documentElement;
    const prevScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, restoreY);
    requestAnimationFrame(() => {
      window.scrollTo(0, restoreY);
      root.style.scrollBehavior = prevScrollBehavior;
    });
    return;
  }
  if (_scrollLockOn) return;
  _scrollLockOn = true;
  _scrollLockY = window.scrollY || 0;
  document.body.classList.add("scroll-locked");
  // iOS-friendly locking: fixed body with negative top offset.
  document.body.style.position = "fixed";
  document.body.style.top = `-${_scrollLockY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  document.body.style.overflow = "hidden";
}

/**
 * Updates overlay UI based on panel and compare modal states.
 * Manages body scroll locking, aria-hidden attributes, and focus trapping.
 */
function updateOverlayUI() {
  const panelOpen = !!(panel && panel.classList.contains("open"));
  const sellerPanel = document.getElementById("seller-panel");
  const sellerPanelOpen = !!(
    sellerPanel && sellerPanel.classList.contains("open")
  );
  const cmpOpen = !!(compareModal && compareModal.classList.contains("on"));
  const open = panelOpen || sellerPanelOpen || cmpOpen;
  const lockForPanel = panelOpen && _shouldLockBodyScroll(); // mobile only
  const lockForSellerPanel = sellerPanelOpen && _shouldLockBodyScroll(); // mobile only
  const lockForCompare = cmpOpen; // modal always locks
  const lock = lockForPanel || lockForSellerPanel || lockForCompare;

  document.body.classList.toggle("overlay-open", open);

  // Scroll-lock: always for compare modal; for detail panel only on mobile.
  _setBodyScrollLocked(lock);

  // A11y / interaction: compare modal should isolate the page; detail panel only isolates on mobile.
  if (appShell) {
    appShell.setAttribute("aria-hidden", lock ? "true" : "false");
    try {
      appShell.toggleAttribute("inert", lock);
    } catch (_e) {}
  }
  if (panel) panel.setAttribute("aria-hidden", panelOpen ? "false" : "true");
  if (sellerPanel)
    sellerPanel.setAttribute("aria-hidden", sellerPanelOpen ? "false" : "true");
  if (compareModal)
    compareModal.setAttribute("aria-hidden", cmpOpen ? "false" : "true");

  const sellerBackdrop = document.getElementById("seller-panel-backdrop");
  if (sellerBackdrop)
    sellerBackdrop.setAttribute(
      "aria-hidden",
      sellerPanelOpen ? "false" : "true",
    );

  const cmpBtn = $("cmpBtn");
  if (cmpBtn) {
    cmpBtn.setAttribute("aria-haspopup", "dialog");
    cmpBtn.setAttribute("aria-expanded", cmpOpen ? "true" : "false");
  }
  _updateScrollTopBtnVisibility?.();
}

// Overlay focus management
const _overlayFocus = {
  stack: [],
  keyHandler: null,
  focusInHandler: null,
};

/**
 * Gets all focusable elements within a container.
 * @param {HTMLElement|null} root - Container element
 * @returns {HTMLElement[]} Array of focusable elements
 */
function _getFocusable(root) {
  if (!root) return [];
  const q = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");
  return [...root.querySelectorAll(q)].filter((el) => {
    if (!(el instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  });
}

/**
 * Gets the currently active overlay container.
 * @returns {HTMLElement|null} The topmost overlay container
 */
function _activeOverlayContainer() {
  return _overlayFocus.stack.length
    ? _overlayFocus.stack[_overlayFocus.stack.length - 1].container
    : null;
}
/**
 * Gets the topmost overlay container.
 * @returns {HTMLElement|null} The topmost overlay container
 */
function overlayFocusTop() {
  return _activeOverlayContainer();
}
/**
 * Checks if a container is in the overlay focus stack.
 * @param {HTMLElement} container - Container to check
 * @returns {boolean} True if container is in the stack
 */
function overlayFocusHas(container) {
  return !!_overlayFocus.stack.find((s) => s.container === container);
}

/**
 * Ensures overlay trap handlers are attached.
 */
function _ensureOverlayTrapHandlers() {
  if (_overlayFocus.keyHandler) return;

  _overlayFocus.keyHandler = (e) => {
    if (e.key !== "Tab") return;
    const container = _activeOverlayContainer();
    if (!container) return;
    const focusables = _getFocusable(container);
    if (!focusables.length) {
      e.preventDefault();
      container.focus?.();
      return;
    }
    const first = focusables[0],
      last = focusables[focusables.length - 1];
    const cur = document.activeElement;

    if (e.shiftKey) {
      if (cur === first || !container.contains(cur)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (cur === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  _overlayFocus.focusInHandler = (e) => {
    const container = _activeOverlayContainer();
    if (!container) return;
    if (container.contains(e.target)) return;
    const focusables = _getFocusable(container);
    const target = focusables[0] || container;
    if (target && target.focus) target.focus();
  };

  document.addEventListener("keydown", _overlayFocus.keyHandler, true);
  document.addEventListener("focusin", _overlayFocus.focusInHandler, true);
}

/**
 * Removes overlay trap handlers if no overlays are active.
 */
function _maybeRemoveOverlayTrapHandlers() {
  if (_overlayFocus.stack.length) return;
  if (_overlayFocus.keyHandler)
    document.removeEventListener("keydown", _overlayFocus.keyHandler, true);
  if (_overlayFocus.focusInHandler)
    document.removeEventListener("focusin", _overlayFocus.focusInHandler, true);
  _overlayFocus.keyHandler = null;
  _overlayFocus.focusInHandler = null;
}

/**
 * Pushes a container onto the overlay focus stack.
 * @param {HTMLElement} container - Container to push
 * @param {HTMLElement|null} initialFocusEl - Element to focus initially
 */
function overlayFocusPush(container, initialFocusEl) {
  if (!container) return;
  _ensureOverlayTrapHandlers();
  const returnFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  _overlayFocus.stack.push({ container, returnFocus });

  // Defer focus until after DOM updates / animations.
  setTimeout(() => {
    const root = _activeOverlayContainer();
    if (root !== container) return;
    const focusTarget =
      initialFocusEl && container.contains(initialFocusEl)
        ? initialFocusEl
        : _getFocusable(container)[0] || container;
    if (focusTarget && focusTarget.focus)
      focusTarget.focus({ preventScroll: true });
  }, 0);
}

/**
 * Pops a container from the overlay focus stack.
 * @param {HTMLElement} container - Container to pop
 */
function overlayFocusPop(container) {
  if (!container) return;
  // Only pop if it exists in stack (usually top).
  const idx = [..._overlayFocus.stack]
    .map((s) => s.container)
    .lastIndexOf(container);
  if (idx < 0) return;
  const [entry] = _overlayFocus.stack.splice(idx, 1);

  // Restore focus to where user was before this overlay opened.
  if (entry?.returnFocus && document.contains(entry.returnFocus)) {
    try {
      entry.returnFocus.focus({ preventScroll: true });
    } catch (_e) {}
  }

  _maybeRemoveOverlayTrapHandlers();
}

// Expose focus management helpers for other modules
window.overlayFocusPush = overlayFocusPush;
window.overlayFocusPop = overlayFocusPop;

/**
 * Removes native title tooltips on touch devices to avoid long-press overlays.
 */
function stripTitlesOnTouch() {
  const scrub = (root) => {
    (root || document).querySelectorAll?.("[title]").forEach((el) => {
      if (el.hasAttribute("title")) el.removeAttribute("title");
    });
  };
  try {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
  } catch (_e) {
    return;
  }
  scrub(document);
  const obs = new MutationObserver((muts) => {
    muts.forEach((m) => m.addedNodes.forEach((n) => scrub(n)));
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
}
stripTitlesOnTouch();
window.overlayFocusTop = overlayFocusTop;
window.overlayFocusHas = overlayFocusHas;

// Favorites management
/**
 * Checks if an item is in favorites.
 * @param {string|null} key - Item key to check
 * @returns {boolean} True if item is favorited
 */
function isFav(key) {
  return favSet.has(String(key || ""));
}

/**
 * Toggles favorite status for an item.
 * @param {string|null} key - Item key to toggle
 */
function toggleFavorite(key) {
  const k = String(key || "");
  if (!k) return;
  const adding = !favSet.has(k);
  if (favSet.has(k)) favSet.delete(k);
  else favSet.add(k);
  toast(adding ? "Added to favorites" : "Removed from favorites");
  scheduleSaveUIState();
  updateTopButtons();
  // Update all star buttons in the current view without a full re-render
  document
    .querySelectorAll(`[data-act="fav"][data-key="${CSS.escape(k)}"]`)
    .forEach((btn) => {
      btn.classList.toggle("on", favSet.has(k));
      btn.title = favSet.has(k) ? "Remove from favorites" : "Add to favorites";
      try {
        btn.setAttribute("aria-label", btn.title);
        btn.setAttribute("aria-pressed", favSet.has(k) ? "true" : "false");
      } catch (_e) {}
      // Pulse animation only when adding
      if (adding) {
        btn.classList.remove("just-activated");
        btn.offsetWidth;
        btn.classList.add("just-activated");
        setTimeout(() => btn.classList.remove("just-activated"), 400);
      }
    });
  renderPanelFromCtx({ partial: true });
  // When in favOnly mode, immediately remove the item from the view with FLIP
  if (favOnly) withCGridFlip(() => render());
  // Update compare modal if open - only update button states, don't reopen
  if (compareModal && compareModal.classList.contains("on")) {
    updateCmpTooltip();
  }
}

/**
 * Toggles favorites-only view mode.
 */
function toggleFavOnly() {
  favOnly = !favOnly;
  updateTopButtons();
  scheduleSaveUIState();
  // Pulse the button when activating favorites view
  if (favOnly && favOnlyBtn) {
    favOnlyBtn.classList.remove("just-activated");
    favOnlyBtn.offsetWidth;
    favOnlyBtn.classList.add("just-activated");
    setTimeout(() => favOnlyBtn.classList.remove("just-activated"), 400);
  }
  withCGridFlip(() => applyFilters());
}

// Data saver mode
/**
 * Toggles data saver mode (disable images).
 */
function toggleDataSaver() {
  dataSaver = !dataSaver;
  updateTopButtons();
  scheduleSaveUIState();
  render();
  if (panel && panel.classList.contains("open"))
    panelMeta.innerHTML = panelMetaHTML(panelCtx?.item);
}

// Item comparison
/**
 * Toggles compare status for an item.
 * @param {string|null} key - Item key to toggle
 */
function toggleCompare(key) {
  const k = String(key || "");
  if (!k) return;
  const idx = compareKeys.indexOf(k);
  if (idx >= 0) {
    compareKeys.splice(idx, 1);
    toast("Removed from compare");
  } else {
    if (compareKeys.length >= 3) {
      toast("Compare is limited to 3 items", true);
      return;
    }
    compareKeys.push(k);
    toast("Added to compare");
  }
  updateTopButtons();
  updateCmpTooltip();
  scheduleSaveUIState();
  syncCompareButtons();
  // Update compare modal if open - only update button states, don't reopen
  if (compareModal && compareModal.classList.contains("on")) {
    openCompare();
  }
}

/**
 * Syncs every visible compare control to the current compareKeys state.
 * This keeps table/card buttons and the detail panel pill honest after bulk actions.
 */
function syncCompareButtons() {
  document.querySelectorAll('[data-act="cmp"][data-key]').forEach((btn) => {
    const inCmp = compareKeys.includes(btn.dataset.key || "");
    btn.classList.toggle("on", inCmp);
    btn.title = inCmp ? "Remove from compare" : "Add to compare";
    try {
      btn.setAttribute("aria-label", btn.title);
      btn.setAttribute("aria-pressed", inCmp ? "true" : "false");
    } catch (_e) {}
  });
}

/**
 * Updates the top buttons UI based on state.
 */
function updateTopButtons() {
  if (favOnlyBtn) favOnlyBtn.classList.toggle("on", !!favOnly);
  if (dsBtn) dsBtn.classList.toggle("on", !!dataSaver);
  if (favOnlyBtn)
    favOnlyBtn.setAttribute("aria-pressed", favOnly ? "true" : "false");
  if (dsBtn) dsBtn.setAttribute("aria-pressed", dataSaver ? "true" : "false");
  const banner = $("dsBanner");
  if (banner) banner.classList.toggle("on", !!dataSaver);
  if (cmpCountEl) {
    const n = compareKeys.length;
    cmpCountEl.textContent = String(n);
    const wasOff = cmpCountEl.classList.contains("off");
    cmpCountEl.classList.toggle("off", n <= 0);
    // Pop animation when badge becomes visible or count changes
    if (n > 0) {
      cmpCountEl.classList.remove("pop");
      cmpCountEl.offsetWidth;
      cmpCountEl.classList.add("pop");
      setTimeout(() => cmpCountEl.classList.remove("pop"), 400);
    }
  }
}

/**
 * Opens the compare modal.
 */
function openCompare() {
  if (!compareModal || !cmpBody) return;
  _compareOpenScrollY = window.scrollY || 0;
  const wasOpen = compareModal.classList.contains("on");
  if (!compareKeys.length) {
    cmpBody.innerHTML = `<div class="cmp-empty">
      <div class="eicon">⇄</div>
      <div class="emsg">No items selected for comparison</div>
      <div class="esub">Open any item’s detail panel and click <strong>⇄ Compare</strong> to add up to 3 items.</div>
    </div>`;
  } else {
    const items = compareKeys
      .map((k) => enriched.find((r) => r.rawKey === k))
      .filter(Boolean);
    const grid = items
      .map((r) => {
        const ar = adaptiveRange(r),
          inFav = isFav(r.rawKey);
        // Image + notes block (same logic as panelMetaHTML but compact)
        const note = getCardNoteForRow(r);
        const imgPaths = dataSaver ? [] : imagePathsForRow(r);
        const hasImg = imgPaths.length > 0;
        const hasNote = !!(note && note.lines && note.lines.length);
        let metaHTML = "";
        if (hasImg || hasNote) {
          const imgHTML = hasImg
            ? `<div class="cmp-meta-img">${imageHTMLForRow(r, "", { eager: true, fetchPriority: "high" })}</div>`
            : "";
          const noteHTML = hasNote
            ? `<div class="cmp-meta-note">${note.lines
                .map((line) => {
                  const s = String(line || "");
                  if (s.trim().startsWith("\u25a0"))
                    return `<div class="cmp-meta-line"><span class="cmp-meta-diamond"></span><span>${esc(s.replace(/^\u25a0\s*/, ""))}</span></div>`;
                  return `<div class="cmp-meta-line"><span class="cmp-meta-dot"></span><span>${esc(s)}</span></div>`;
                })
                .join("")}</div>`
            : "";
          metaHTML = `<div class="cmp-meta">${imgHTML}${noteHTML}</div>`;
        }
        return `<div class="cmp-item">
        <div class="cmp-item-head">
          <div class="cmp-head-main">
            <div class="cmp-item-name" title="${esc(r.rawKey)}"><span class="iname-wrap"><span class="iname-txt">${formatItemNameH(r.displayName)}</span>${skillTagH(r.skillTag)}</span></div>
            <div class="cmp-badge-row">${catBadge(r.category)}${r.tier ? tierBadge(r.tier) : ""}</div>
          </div>
          <div class="cmp-item-actions">
            <button type="button" class="fstar ${inFav ? "on" : ""}" data-act="fav" data-key="${esc(r.rawKey)}" title="${inFav ? "Remove from favorites" : "Add to favorites"}" aria-label="${inFav ? "Remove from favorites" : "Add to favorites"}" aria-pressed="${inFav ? "true" : "false"}">★</button>
          </div>
        </div>
        ${metaHTML}
        <div class="cmp-price-row">
          <div class="cmp-price">${fmt(r.median)}</div>
          <button type="button" class="copy-price-btn" data-act="copy-price" data-price="${r.median}" title="Copy price" aria-label="Copy price">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3.5" y="3.5" width="6" height="6" rx="1"/><path d="M1.5 7.5V1.5h6"/></svg>
          </button>
        </div>
        <div class="cmp-range">${fmt(ar.low)} — ${fmt(ar.high)}</div>
        <div class="cmp-row"><span class="rl">Trend</span><span>${trendH(r.trend)}</span></div>
        <div class="cmp-row"><span class="rl">Confidence</span><span class="conf-b conf-inline ${confCls(r.confidence)}">■ ${r.confidence || "—"}</span></div>
        <div class="cmp-row"><span class="rl">Samples</span><span class="cmp-mono">${r.samples?.toLocaleString() || "—"}</span></div>
        <div class="cmp-row"><span class="rl">Last seen</span><span class="cmp-mono">${fmtT(r.last_seen)}</span></div>
        <div class="cmp-footer">
          <button type="button" class="hbtn" data-act="cmp-open" data-key="${esc(r.rawKey)}" aria-label="Open details">Open detail</button>
          <button type="button" class="hbtn" data-act="cmp-remove" data-key="${esc(r.rawKey)}" aria-label="Remove from compare">Remove</button>
        </div>
      </div>`;
      })
      .join("");
    cmpBody.innerHTML = `<div class="cmp-grid">${grid}</div>`;
    observeLazyImages(cmpBody);
  }
  compareModal.classList.add("on");
  compareModal.setAttribute("aria-hidden", "false");
  // Trigger fresh CSS animation on the card each open
  const card = compareModal.querySelector(".cmp-card");
  if (card) {
    card.style.animation = "none";
    card.offsetWidth;
    card.style.animation = "";
  }
  updateOverlayUI();
  if (!wasOpen)
    window.overlayFocusPush?.(card || compareModal, $("cmpCloseBtn") || card);
}

/**
 * Closes the compare modal.
 */
function closeCompare() {
  if (!compareModal) return;
  const restoreY = _compareOpenScrollY;
  const card = compareModal.querySelector(".cmp-card");
  compareModal.classList.remove("on");
  compareModal.setAttribute("aria-hidden", "true");
  updateOverlayUI();
  window.overlayFocusPop?.(card || compareModal);
  if (typeof restoreY === "number" && restoreY >= 0) {
    requestAnimationFrame(() =>
      window.scrollTo({ top: restoreY, left: 0, behavior: "auto" }),
    );
  }
  // If the detail panel is still open behind the modal but wasn't trapped yet, trap it (mobile only).
  if (panel && panel.classList.contains("open") && _shouldLockBodyScroll()) {
    const top = window.overlayFocusTop?.();
    if (top !== panel && !window.overlayFocusHas?.(panel))
      window.overlayFocusPush?.(panel, $("panelCloseBtn") || panel);
  }
}

/**
 * Copy price variant for compare modal — targets the clicked button directly.
 * @param {number|null} n - Price to copy
 * @param {HTMLElement|null} btn - Button that was clicked
 */
function copyPriceFromCmp(n, btn) {
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
 * Clears all items from comparison.
 */
function clearCompare() {
  if (compareModal && compareModal.classList.contains("on")) {
    const items = [...compareModal.querySelectorAll(".cmp-item")];
    if (items.length) {
      items.forEach((item, i) => {
        item.style.transition =
          "opacity 220ms ease, transform 260ms cubic-bezier(.2,.8,.2,1)";
        item.style.transitionDelay = `${i * 28}ms`;
        item.style.opacity = "0";
        item.style.transform = "translateY(-10px) scale(0.98)";
      });
      setTimeout(() => {
        compareKeys = [];
        updateTopButtons();
        updateCmpTooltip();
        syncCompareButtons();
        scheduleSaveUIState();
        openCompare();
      }, Math.min(380, 220 + items.length * 28));
      return;
    }
  }
  compareKeys = [];
  updateTopButtons();
  updateCmpTooltip();
  syncCompareButtons();
  scheduleSaveUIState();
  openCompare();
}

// UI event delegation
if (tbody) {
  tbody.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]");
    if (act) {
      e.preventDefault();
      e.stopPropagation();
      if (act.dataset.act === "fav") {
        toggleFavorite(act.dataset.key);
        return;
      }
      if (act.dataset.act === "cmp") {
        toggleCompare(act.dataset.key);
        return;
      }
    }
    // Prevent accidental row open when clicking inside the action rail gap.
    if (e.target.closest(".row-actions")) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const tr = e.target.closest("tr[data-key]");
    if (tr) openPanel(tr.dataset.key);
  });
}

if (cgrid) {
  cgrid.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]");
    if (act) {
      e.preventDefault();
      e.stopPropagation();
      if (act.dataset.act === "fav") {
        toggleFavorite(act.dataset.key);
        return;
      }
      if (act.dataset.act === "cmp") {
        toggleCompare(act.dataset.key);
        return;
      }
    }
    // Prevent accidental panel open when clicking inside the action cluster container.
    if (e.target.closest(".pcard-act")) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const card = e.target.closest(".pcard[data-key]");
    if (card) openPanel(card.dataset.key);
  });
  cgrid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    // If focus is on an action button inside the card, let it handle the keypress.
    if (e.target.closest("[data-act]")) return;
    const card = e.target.closest(".pcard[data-key]");
    if (!card) return;
    e.preventDefault();
    openPanel(card.dataset.key);
  });
}

if (panel) {
  panel.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]");
    if (!act) return;
    const key = act.dataset.key;
    if (act.dataset.act === "fav") {
      e.preventDefault();
      toggleFavorite(key);
      return;
    }
    if (act.dataset.act === "cmp") {
      e.preventDefault();
      toggleCompare(key);
      return;
    }
    if (act.dataset.act === "copy-price") {
      e.preventDefault();
      copyPrice(Number(act.dataset.price || 0), act);
      return;
    }
    if (act.dataset.act === "panel-sort-toggle") {
      e.preventDefault();
      togglePanelSortSel();
      return;
    }
    if (act.dataset.act === "panel-sort") {
      e.preventDefault();
      setPanelSort(act.dataset.sort);
      closeAllCSelects();
      return;
    }
    if (act.dataset.act === "panel-include-flagged") {
      e.preventDefault();
      setPanelIncludeFlagged(!panelIncludeFlagged);
      return;
    }
    if (act.dataset.act === "panel-scroll-top") {
      e.preventDefault();
      $("panel-body")?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
  });
}

if (compareModal) {
  compareModal.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]");
    if (!act) return;
    const key = act.dataset.key;
    if (act.dataset.act === "fav") {
      e.preventDefault();
      toggleFavorite(key);
      // Don't call openCompare() - just update the modal state
      if (compareModal.classList.contains("on")) {
        updateCmpTooltip();
      }
      return;
    }
    if (act.dataset.act === "copy-price") {
      e.preventDefault();
      copyPriceFromCmp(Number(act.dataset.price || 0), act);
      return;
    }
    if (act.dataset.act === "cmp-open") {
      e.preventDefault();
      closeCompare();
      openPanel(key);
      return;
    }
    if (act.dataset.act === "cmp-remove") {
      e.preventDefault();
      // Remove the item with fade-out animation
      const item = e.target.closest(".cmp-item");
      if (item) {
        item.style.opacity = "0";
        item.style.transform = "translateY(-8px)";
        setTimeout(() => {
          toggleCompare(key);
          openCompare();
        }, 200);
      }
      return;
    }
  });
}

// --- Search Input handling ---
if (qEl) {
  qEl.addEventListener("input", () => {
    $("xBtn")?.classList.toggle("on", qEl.value.length > 0);
    updateSugg();
    clearTimeout(debT);
    debT = setTimeout(applyFilters, 60);
    scheduleSaveUIState();
  });
  qEl.addEventListener("keydown", (e) => {
    const open = suggEl?.classList.contains("on");
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSuggIndex(
        Math.min(suggItems.length - 1, suggIndex < 0 ? 0 : suggIndex + 1),
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSuggIndex(Math.max(0, suggIndex < 0 ? 0 : suggIndex - 1));
      return;
    }
    if (e.key === "Enter") {
      if (suggIndex >= 0) {
        e.preventDefault();
        applySugg(suggIndex);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      hideSugg();
      return;
    }
  });
  qEl.addEventListener("blur", () => setTimeout(hideSugg, 150));
}

// Suggestion dropdown handling
if (suggEl) {
  suggEl.addEventListener("mousedown", (e) => {
    const btn = e.target.closest("button[data-i]");
    if (!btn) return;
    e.preventDefault();
    applySugg(parseInt(btn.dataset.i));
  });
}

// Filter selection handling
if (catEl) catEl.addEventListener("change", applyFilters);
if (confEl) confEl.addEventListener("change", applyFilters);
if (tierEl) {
  tierEl.addEventListener("change", async () => {
    if (tierEl.value && tierEl.value !== "0") await ensurePrismaticTiers();
    applyFilters();
  });
}

// Other logic: Ensure these are also guarded
if (catEl || confEl || tierEl) {
  [catEl, confEl, tierEl].forEach((el) => {
    if (!el) return;
    el.addEventListener("focus", hideSugg);
    el.addEventListener("click", hideSugg);
  });
}

// Scroll position persistence
window.addEventListener("scroll", scheduleSaveUIState, { passive: true });

// URL hash handling
window.addEventListener("hashchange", () => {
  const hk = getHashItemKey();
  if (!hk) {
    if (panel.classList.contains("open")) closePanel();
    return;
  }
  if (hk === activeKey && panel.classList.contains("open")) return;
  if (enriched && enriched.length) openPanel(hk);
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  const inInput =
    active === qEl ||
    active.tagName === "INPUT" ||
    active.tagName === "SELECT" ||
    active.tagName === "TEXTAREA";
  if ((e.key === "/" || e.key === "t" || e.key === "T") && !inInput) {
    e.preventDefault();
    qEl.focus();
    qEl.select();
    return;
  }
  if (e.key === "Escape") {
    if (compareModal && compareModal.classList.contains("on")) {
      closeCompare();
      return;
    }
    if (panel.classList.contains("open")) {
      closePanel();
      return;
    }
    if (document.activeElement === qEl) {
      if (suggEl.classList.contains("on")) {
        hideSugg();
        return;
      }
      if (qEl.value) {
        clearQ();
      } else {
        qEl.blur();
      }
      return;
    }
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".sw")) hideSugg();
});

// Enhanced select elements
enhanceSelect(catEl);
enhanceSelect(confEl);
enhanceSelect(tierEl);
bindToolbarSelect(catEl);
bindToolbarSelect(confEl);
bindToolbarSelect(tierEl);

// Automatic data refresh
const REFRESH_MS = 5 * 60 * 1000;
let nextRefresh = Date.now() + REFRESH_MS;
/**
 * Schedules the next automatic data refresh.
 */
function scheduleRefresh() {
  const delay = Math.max(0, nextRefresh - Date.now());
  setTimeout(() => {
    fetchAll(true);
    nextRefresh = Date.now() + REFRESH_MS;
    scheduleRefresh();
  }, delay);
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && Date.now() >= nextRefresh) {
    fetchAll(true);
    nextRefresh = Date.now() + REFRESH_MS;
  }
});
// Update compare tooltip after auto-refresh
setInterval(() => {
  if (compareKeys.length) updateCmpTooltip();
}, 5000);

// Scroll-to-top button
const scrollTopBtn = $("scrollTopBtn");
function _updateScrollTopBtnVisibility() {
  if (!scrollTopBtn) return;
  const hasOverlayOpen = !!document.body.classList.contains("overlay-open");
  const shouldShow = !hasOverlayOpen && window.scrollY > 300;
  scrollTopBtn.classList.toggle("on", shouldShow);
}
window.addEventListener("scroll", _updateScrollTopBtnVisibility, {
  passive: true,
});
window.addEventListener("resize", _updateScrollTopBtnVisibility, {
  passive: true,
});
_updateScrollTopBtnVisibility();

// Compare tooltip
/**
 * Updates the compare button tooltip with selected items.
 */
function updateCmpTooltip() {
  const btn = $("cmpBtn");
  if (!btn) return;
  let tip = btn.querySelector(".cmp-tip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "cmp-tip";
    btn.appendChild(tip);
  }
  if (!compareKeys.length) {
    tip.innerHTML = `<span class="cmp-tip-empty">No items selected yet</span>`;
  } else {
    tip.innerHTML = compareKeys
      .map((k) => {
        const r = enriched.find((e) => e.rawKey === k);
        if (!r) return `<div class="cmp-tip-item">${esc(k)}</div>`;

        // Use displayName directly from enriched data (already formatted with titleCase and tier stars)
        // Just add skill tag if present (same logic as in UI views)
        let displayName = r.displayName || k;
        let skillTagHTML = skillTagH(r.skillTag);

        return `<div class="cmp-tip-item">${esc(displayName)}${skillTagHTML}</div>`;
      })
      .join("");
  }
}

// Row hover tooltip
let _rowTip = null;
/**
 * Gets the row tooltip element, creating it if necessary.
 * @returns {HTMLElement} The row tooltip element
 */
function getRowTip() {
  if (!_rowTip) {
    _rowTip = document.createElement("div");
    _rowTip.className = "row-tip";
    document.body.appendChild(_rowTip);
  }
  return _rowTip;
}
/**
 * Shows the row tooltip for a listing.
 * @param {MouseEvent} e - Mouse event
 * @param {Object} r - Listing data
 */
function showRowTip(e, r) {
  const tip = getRowTip();
  const ar = adaptiveRange(r);
  tip.innerHTML = `
    <div class="row-tip-row"><span class="row-tip-label">Range</span><span class="row-tip-val">${fmt(ar.low)} — ${fmt(ar.high)}</span></div>
    <div class="row-tip-row"><span class="row-tip-label">Trend</span><span class="row-tip-val">${trendH(r.trend)}</span></div>
    <div class="row-tip-row"><span class="row-tip-label">Confidence</span><span class="row-tip-val row-tip-conf conf-b ${confCls(r.confidence)}">■ ${r.confidence || "—"}</span></div>
    <div class="row-tip-row"><span class="row-tip-label">Samples</span><span class="row-tip-val">${r.samples?.toLocaleString() || "—"}</span></div>`;
  positionRowTip(e);
  tip.classList.add("on");
}
/**
 * Positions the row tooltip near the mouse.
 * @param {MouseEvent} e - Mouse event
 */
function positionRowTip(e) {
  const tip = getRowTip();
  if (!tip.classList.contains("on")) return;
  const x = e.clientX + 16,
    y = e.clientY - 10;
  const maxX = window.innerWidth - tip.offsetWidth - 12;
  const maxY = window.innerHeight - tip.offsetHeight - 12;
  tip.style.left = Math.min(x, maxX) + "px";
  tip.style.top = Math.min(y, maxY) + "px";
}
/**
 * Hides the row tooltip.
 */
function hideRowTip() {
  const tip = getRowTip();
  tip.classList.remove("on");
}

// Row and card tooltips
const _isTouchPrimary = () => window.matchMedia("(pointer:coarse)").matches;

if (tbody) {
  tbody.addEventListener("mouseover", (e) => {
    if (_isTouchPrimary()) return;
    const tr = e.target.closest("tr[data-key]");
    if (!tr) return;
    const r = enriched.find((x) => x.rawKey === tr.dataset.key);
    if (!r) return;
    showRowTip(e, r);
  });
  tbody.addEventListener("mousemove", (e) => {
    if (_isTouchPrimary()) return;
    positionRowTip(e);
  });
  tbody.addEventListener("mouseout", (e) => {
    const tr = e.target.closest("tr[data-key]");
    if (!tr) return;
    // Don't hide when moving between cells inside the same row.
    if (e.relatedTarget && tr.contains(e.relatedTarget)) return;
    hideRowTip();
  });
  tbody.addEventListener("mouseleave", hideRowTip);
}

// Card tooltip handling
if (cgrid) {
  cgrid.addEventListener("mouseover", (e) => {
    if (_isTouchPrimary()) return;
    const card = e.target.closest(".pcard[data-key]");
    if (!card) return;
    // Don't show if hovering action buttons
    if (e.target.closest(".pcard-act")) return;
    const r = enriched.find((x) => x.rawKey === card.dataset.key);
    if (!r) return;
    showRowTip(e, r);
  });
  cgrid.addEventListener("mousemove", (e) => {
    if (_isTouchPrimary()) return;
    positionRowTip(e);
  });
  cgrid.addEventListener("mouseout", (e) => {
    const card = e.target.closest(".pcard[data-key]");
    if (!card) return;
    if (e.relatedTarget && card.contains(e.relatedTarget)) return;
    hideRowTip();
  });
  cgrid.addEventListener("mouseleave", hideRowTip);
}

// Hard-stop any lingering tooltip when the user scrolls or resizes.
window.addEventListener("scroll", hideRowTip, { passive: true });
window.addEventListener("resize", hideRowTip);

// Empty favorites state
/**
 * Shows the empty favorites state UI.
 */
function showEmptyFavs() {
  const inner = `<div class="estate">
    <div class="eicon">★</div>
    <div class="emsg">No favorites yet</div>
    <div class="esub">Click the ★ star on any item to add it to your watchlist.</div>
    <div class="esub esub-action"><button class="empty-action" data-action="toggle-fav-only">Show all items</button></div>
  </div>`;
  if (vw === "table")
    tbody.innerHTML = `<tr><td colspan="7">${inner}</td></tr>`;
  else cgrid.innerHTML = `<div class="grid-full">${inner}</div>`;
}

// Application initialization
applyLoadedUIState();
scheduleRefresh(); // Keep this
setInterval(() => {
  const sUpd = $("sUpd");
  if (sUpd && lastLoaded) {
    sUpd.textContent = fmtT(lastLoaded);
  }
}, 30000);

_idle(() => updateCmpTooltip());
updateOverlayUI();
initApp();
