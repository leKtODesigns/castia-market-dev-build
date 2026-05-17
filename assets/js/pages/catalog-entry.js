(function () {
  var BASE_PATH = "/castia-market-dev-build/";
  function toBasePath(assetPath) {
    return BASE_PATH + String(assetPath || "").replace(/^\/+/, "");
  }
  function wireInlineActions() {
    document.addEventListener("click", function (event) {
      var target = event.target.closest("[data-action]");
      if (!target) return;
      var action = target.getAttribute("data-action");
      if (action === "manual-refresh") return window.manualRefresh?.();
      if (action === "toggle-mobile-menu") return window.toggleMobMenu?.();
      if (action === "close-mobile-menu") return window.closeMobMenu?.();
      if (action === "close-panel") return window.closePanel?.();
      if (action === "open-compare") return window.openCompare?.();
      if (action === "close-compare") return window.closeCompare?.();
      if (action === "clear-compare") return window.clearCompare?.();
    });
  }
  var queue = [
    "assets/js/card_notes.js",
    "assets/js/constants/config.js",
    "assets/js/constants/items.js",
    "assets/js/constants/ui-constants.js",
    "assets/js/state.js",
    "assets/js/data.js",
    "assets/js/ui.js",
    "assets/js/panel.js",
    "assets/js/features.js",
    "assets/js/pages/catalog-page.js",
  ];
  function loadNext(index) {
    if (index >= queue.length) return;
    var script = document.createElement("script");
    script.src = toBasePath(queue[index]);
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
