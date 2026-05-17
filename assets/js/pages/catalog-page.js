(function () {
  function toggleMobMenu() {
    var nav = document.getElementById("mob-nav");
    var btn = document.getElementById("mobMenuBtn");
    if (!nav || !btn) return;
    var open = nav.getAttribute("aria-hidden") === "false";
    nav.setAttribute("aria-hidden", open ? "true" : "false");
    nav.classList.toggle("open", !open);
    btn.setAttribute("aria-expanded", String(!open));
    btn.classList.toggle("open", !open);
  }
  function closeMobMenu() {
    var nav = document.getElementById("mob-nav");
    var btn = document.getElementById("mobMenuBtn");
    if (!nav || !btn) return;
    nav.setAttribute("aria-hidden", "true");
    nav.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    btn.classList.remove("open");
  }
  function renderCatalog() {
    var q = String(document.getElementById("catalogSearch")?.value || "")
      .trim()
      .toLowerCase();
    var rows = catalogRows.filter(function (row) {
      return !q || row._search.includes(q);
    });
    var count = document.getElementById("catalogCount");
    if (count)
      count.textContent =
        rows.length.toLocaleString() +
        " item" +
        (rows.length === 1 ? "" : "s") +
        (q ? " matching" : " in catalog");
    renderCards(rows);
  }
  async function loadCatalog(silent) {
    if (!silent) setSt("loading", "Loading...");
    var rBtn = document.getElementById("rBtn");
    if (rBtn) rBtn.classList.add("spinning");
    try {
      var responses = await Promise.all([
        workerGet("/prices"),
        workerGet("/sellers").catch(function () {
          return { sellers: {} };
        }),
      ]);
      allPrices = normalizePriceRows(responses[0]?.prices);
      enriched = enrich(allPrices);
      rebuildCatalogRows();
      allSellers = {};
      normalizeSellerRows(responses[1]?.sellers).forEach(function (seller) {
        if (seller.seller) allSellers[seller.seller.toLowerCase()] = seller;
      });
      lastLoaded = new Date();
      maxSamples = Math.max(1, ...enriched.map(function (row) {
        return row.samples || 0;
      }));
      renderCatalog();
      updateTopButtons();
      setSt("ok", "Synced");
      var hk = getHashItemKey();
      if (hk) openPanel(hk);
    } catch (err) {
      setSt("err", "Failed");
      toast("Failed: " + (err.message || err), true);
    } finally {
      if (rBtn) rBtn.classList.remove("spinning");
    }
  }
  function initCatalogPage() {
    var input = document.getElementById("catalogSearch");
    if (input) input.addEventListener("input", renderCatalog);
    window.manualRefresh = function () {
      loadCatalog(false);
    };
    window.toggleMobMenu = toggleMobMenu;
    window.closeMobMenu = closeMobMenu;
    loadCatalog(false);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCatalogPage);
  } else {
    initCatalogPage();
  }
})();
