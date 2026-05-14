(function () {
  function wireInlineActions() {
    document.addEventListener("click", function (event) {
      var target = event.target.closest("[data-action]");
      if (!target) return;
      var action = target.getAttribute("data-action");

      if (action === "manual-refresh") return window.manualRefresh?.();
      if (action === "toggle-mobile-menu") return window.toggleMobMenu?.();
      if (action === "close-mobile-menu") return window.closeMobMenu?.();
      if (action === "close-panel") return window.closePanel?.();
      if (action === "toggle-data-saver") return window.toggleDataSaver?.();
      if (action === "clear-search") return window.clearQ?.();
      if (action === "toggle-cselect")
        return window.toggleCSelect?.(target.getAttribute("data-target"));
      if (action === "set-sort")
        return window.setSort?.(target.getAttribute("data-sort-key"));
      if (action === "flip-sort-dir") return window.flipDir?.();
      if (action === "toggle-fav-only") return window.toggleFavOnly?.();
      if (action === "open-compare") return window.openCompare?.();
      if (action === "set-view")
        return window.setView?.(target.getAttribute("data-view"));
      if (action === "scroll-top")
        return window.scrollTo({ top: 0, behavior: "smooth" });
      if (action === "close-compare") return window.closeCompare?.();
      if (action === "clear-compare") return window.clearCompare?.();
    });

    document.addEventListener("input", function (event) {
      var target = event.target;
      if (!target || target.getAttribute("data-action") !== "apply-filters") return;
      window.applyFilters?.();
    });
  }

  var sharedScripts = [
    "./assets/js/card_notes.js",
    "./assets/js/constants/config.js",
    "./assets/js/constants/items.js",
    "./assets/js/constants/ui-constants.js",
    "./assets/js/state.js",
    "./assets/js/data.js",
    "./assets/js/ui.js",
    "./assets/js/panel.js",
    "./assets/js/features.js",
  ];

  var pageScripts = ["./assets/js/pages/index-page.js"];
  var queue = sharedScripts.concat(pageScripts);

  function loadNext(index) {
    if (index >= queue.length) return;
    var script = document.createElement("script");
    script.src = queue[index];
    script.async = false;
    script.defer = true;
    script.onload = function () {
      loadNext(index + 1);
    };
    document.head.appendChild(script);
  }

  loadNext(0);
  wireInlineActions();
})();
