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

      if (action === "toggle-mobile-menu") return window.toggleMobMenu?.();
      if (action === "close-mobile-menu") return window.closeMobMenu?.();
      if (action === "close-seller-panel") return window.closeSellerPanel?.();
      if (action === "set-seller-filter")
        return window.setSf?.(target.getAttribute("data-filter"));
    });

    document.addEventListener("input", function (event) {
      var target = event.target;
      if (!target || target.getAttribute("data-action") !== "filter-sellers") return;
      window.filterSellers?.();
    });
  }

  var sharedScripts = [
    "assets/js/card_notes.js",
    "assets/js/constants/config.js",
    "assets/js/constants/items.js",
    "assets/js/constants/ui-constants.js",
    "assets/js/state.js",
    "assets/js/data.js",
    "assets/js/ui.js",
    "assets/js/panel.js",
    "assets/js/features.js",
  ];

  var pageScripts = ["assets/js/pages/sellers-page.js"];
  var queue = sharedScripts.concat(pageScripts);

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
