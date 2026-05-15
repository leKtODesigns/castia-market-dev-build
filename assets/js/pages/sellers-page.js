/* ── Mobile menu ── */
      function toggleMobMenu() {
        var nav = document.getElementById("mob-nav");
        var btn = document.getElementById("mobMenuBtn");
        var open = nav.getAttribute("aria-hidden") === "false";
        nav.setAttribute("aria-hidden", open ? "true" : "false");
        nav.classList.toggle("open", !open);
        if (btn) {
          btn.setAttribute("aria-expanded", (!open).toString());
          btn.classList.toggle("open", !open);
        }
      }
      function closeMobMenu() {
        var nav = document.getElementById("mob-nav");
        var btn = document.getElementById("mobMenuBtn");
        if (nav) {
          nav.classList.remove("open");
          nav.setAttribute("aria-hidden", "true");
        }
        if (btn) btn.setAttribute("aria-expanded", "false");
      }

      /* ── Sellers page state ── */
      var _sfFilter = "all";
      var _drawerCache = {};
      var _drawerSort = {};

      function setSf(f) {
        _sfFilter = f;
        ["all", "trustworthy", "neutral", "suspicious", "flagged"].forEach(
          (k) => {
            var el = document.getElementById("sf-" + k);
            if (el) el.classList.toggle("on", k === f);
          },
        );
        renderSellers();
      }

      function filterSellers() {
        updateSellerSearchClear();
        renderSellers();
      }

      function updateSellerSearchClear() {
        var qEl = document.getElementById("qEl");
        var xBtn = document.getElementById("sellerXBtn");
        if (!qEl || !xBtn) return;
        xBtn.classList.toggle("on", !!qEl.value.trim().length);
      }

      function clearSellerSearch() {
        var qEl = document.getElementById("qEl");
        if (!qEl) return;
        qEl.value = "";
        updateSellerSearchClear();
        renderSellers();
        qEl.focus();
      }
      window.clearSellerSearch = clearSellerSearch;

      function avatarInitials(name) {
        if (!name) return "??";
        var cleaned = String(name)
          .trim()
          .replace(/^_+|_+$/g, "");
        var parts = cleaned.split(/[\s_]+/).filter(Boolean);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return cleaned.slice(0, 2).toUpperCase();
      }

      function avatarCls(label) {
        var map = {
          Trustworthy: "av-trustworthy",
          Neutral: "av-neutral",
          Suspicious: "av-suspicious",
          Flagged: "av-flagged",
        };
        return map[label] || "av-neutral";
      }

      function sellerAvatarUrls(name) {
        var safe = encodeURIComponent(name || "");
        return [
          "https://render.crafty.gg/3d/bust/" + safe,
          "https://mc-heads.net/avatar/" + safe + "/96",
        ];
      }

      function loadAvatarChain(
        imgEl,
        fallbackEl,
        name,
        label,
        avatarContainer,
        keepStatusClass,
      ) {
        if (!imgEl || !fallbackEl) return;
        var urls = sellerAvatarUrls(name);
        var idx = 0;
        var done = false;

        fallbackEl.textContent = avatarInitials(name);
        fallbackEl.style.display = "none";
        imgEl.style.display = "block";
        imgEl.alt = (name || "Seller") + " avatar";

        function showFallback() {
          if (done) return;
          done = true;
          imgEl.style.display = "none";
          fallbackEl.style.display = "block";
          if (avatarContainer)
            avatarContainer.classList.add(avatarCls(label));
        }

        function next() {
          if (done) return;
          if (idx >= urls.length) {
            showFallback();
            return;
          }
          imgEl.src = urls[idx++];
        }

        imgEl.onerror = next;
        imgEl.onload = function () {
          done = true;
          imgEl.style.display = "block";
          fallbackEl.style.display = "none";
          if (avatarContainer && !keepStatusClass)
            avatarContainer.classList.remove(avatarCls(label));
        };

        next();
      }

      function hydrateSellerAvatars(scope) {
        (scope || document).querySelectorAll(".scard__avatar").forEach(function (avatarEl) {
          var imgEl = avatarEl.querySelector(".scard__avatar-img");
          var fallbackEl = avatarEl.querySelector(".scard__avatar-fallback");
          var name = avatarEl.getAttribute("data-avatar-name") || "";
          var label = avatarEl.getAttribute("data-avatar-label") || "Neutral";
          loadAvatarChain(imgEl, fallbackEl, name, label, avatarEl, true);
        });
      }

      function cardAnimCls(label) {
        var map = {
          Trustworthy: "scard-trustworthy",
          Neutral:     "scard-neutral",
          Suspicious:  "scard-suspicious",
          Flagged:     "scard-flagged",
          Fair:        "scard-neutral",
        };
        return map[label] || "scard-neutral";
      }

      function trustIconH(label) {
        var map = {
          Trustworthy: '<span class="lbl-ico" aria-hidden="true">◆</span>',
          Neutral: '<span class="lbl-ico" aria-hidden="true">◇</span>',
          Suspicious: '<span class="lbl-ico" aria-hidden="true">⟁</span>',
          Flagged: '<span class="lbl-ico" aria-hidden="true">✕</span>',
        };
        return map[label] || map.Neutral;
      }

      function trustBadgeH(label, text) {
        var cls = String(label || "Neutral").toLowerCase();
        return `<span class="lr-seller-badge ${esc(cls)}">${trustIconH(label)}<span>${esc(text || label || "Neutral")}</span></span>`;
      }

      function barCls(pct) {
        if (pct == null) return "fill-ok";
        if (pct < 15) return "fill-good";
        if (pct < 35) return "fill-warn";
        return "fill-bad";
      }
      function valueCls(pct) {
        if (pct == null) return "";
        if (pct < 15) return "good";
        if (pct < 35) return "warn";
        return "bad";
      }
      function markupCls(m) {
        if (m == null) return "";
        if (m < 5) return "good";
        if (m < 20) return "warn";
        return "bad";
      }

      function buildSellerCard(sd) {
        var name = sd.seller || "—";
        var label = sd.is_blacklisted
          ? "Flagged"
          : sd.accuracy_label || "Neutral";
        var avCls = avatarCls(label);
        var animCls = cardAnimCls(label);
        var initials = avatarInitials(name);
        var pct = sd.overpriced_ratio;
        var markup = sd.avg_markup_percent;
        var total = sd.total_listings;
        var badge = trustBadgeH(label, label);
        var blackBadge = sd.is_blacklisted
          ? trustBadgeH("blacklisted", "Blacklisted")
          : "";
        var pctVal = pct != null ? pct.toFixed(1) + "%" : "—";
        var mrkVal =
          markup != null
            ? (markup > 0 ? "+" : "") + markup.toFixed(1) + "%"
            : "—";
        var totVal = total != null ? total.toLocaleString() : "—";
        var barPct = Math.min(100, pct || 0);

        return `<button type="button" class="scard ${animCls}" data-seller="${esc(name)}" aria-label="Open seller ${esc(name)}">
          <div class="scard__head">
            <div class="scard__avatar ${avCls}" data-avatar-name="${esc(name)}" data-avatar-label="${esc(label)}">
              <img alt="${esc(name)} avatar" class="scard__avatar-img" />
              <span class="scard__avatar-fallback">${esc(initials)}</span>
            </div>
            <div class="scard__info">
              <div class="scard__name" title="${esc(name)}">${esc(name)}</div>
              <div class="scard__badges">${badge}${blackBadge}</div>
            </div>
            <svg class="scard__chevron" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="5,3 9,7 5,11"/></svg>
          </div>
          <div class="scard__stats">
            <div class="scard__stat"><div class="scard__stat-label">Listings</div><div class="scard__stat-value">${totVal}</div></div>
            <div class="scard__stat"><div class="scard__stat-label">Overpriced</div><div class="scard__stat-value ${valueCls(pct)}">${pctVal}</div></div>
            <div class="scard__stat"><div class="scard__stat-label">Avg Markup</div><div class="scard__stat-value ${markupCls(markup)}">${mrkVal}</div></div>
          </div>
          <div class="scard__bar-wrap">
            <div class="scard__bar-label"><span>Overpriced ratio</span><span>${pctVal}</span></div>
            <div class="scard__bar-track"><div class="scard__bar-fill ${barCls(pct)}" style="width:${barPct}%"></div></div>
          </div>
        </button>`;
      }

      function toggleSellerCard(cardEl, sellerName) {
        openSellerPanel(sellerName);
      }

      async function openSellerPanel(sellerName) {
        const panel = document.getElementById("seller-panel");
        const backdropEl = document.getElementById("seller-panel-backdrop");
        const body = document.getElementById("seller-panel-body");
        const title = document.getElementById("seller-panel-title");
        const badgesEl = document.getElementById("seller-panel-badges");
        const avatarImg = document.getElementById("seller-panel-avatar-img");
        const avatarFallback = document.getElementById(
          "seller-panel-avatar-fallback",
        );
        const app = document.getElementById("app");
        const wasOpen = panel.classList.contains("open");

        // Get seller data
        const sellerData = allSellers?.[sellerName.toLowerCase()];
        const name = sellerData?.seller || sellerName;
        const label = sellerData?.is_blacklisted
          ? "Flagged"
          : sellerData?.accuracy_label || "Neutral";

        // Update header elements
        title.textContent = name;

        // Set up avatar with crafted -> mc-heads -> initials fallback
        const avatarEl = document.getElementById("seller-panel-avatar");
        if (avatarEl) avatarEl.className = "panel-avatar";
        loadAvatarChain(avatarImg, avatarFallback, name, label, avatarEl, false);

        // Set badges
        const badge = trustBadgeH(label, label);
        const blackBadge = sellerData?.is_blacklisted
          ? trustBadgeH("blacklisted", "Blacklisted")
          : "";
        badgesEl.innerHTML = badge + blackBadge;

        panel.classList.add("open");
        backdropEl.classList.add("on");
        panel.setAttribute("aria-hidden", "false");
        backdropEl.setAttribute("aria-hidden", "false");
        if (app) app.classList.add("panel-open");
        panel.scrollTop = 0;
        window.updateOverlayUI?.();

        const lock = (() => {
          try {
            return window.matchMedia("(max-width: 600px), (pointer: coarse)")
              .matches;
          } catch (_e) {
            return window.innerWidth <= 600;
          }
        })();
        const closeBtn = panel.querySelector(".panel-close");
        if (!wasOpen && lock) {
          window.overlayFocusPush?.(panel, closeBtn || panel);
        } else if (closeBtn && closeBtn.focus) {
          closeBtn.focus({ preventScroll: true });
        }

        body.innerHTML = `<div class="panel-skel"><div class="pskel-block"></div><div class="pskel-line pskel-line--md"></div><div class="pskel-line pskel-line--lg"></div></div>`;
        try {
          if (_drawerCache[sellerName]) {
            renderSellerPanelListings(sellerName, _drawerCache[sellerName]);
          } else {
            const res = await workerGet("/seller-auctions", {
              seller: sellerName,
              limit: 100,
            });
            const rows = normalizeAuctionRows(res?.auctions);
            _drawerCache[sellerName] = rows;
            renderSellerPanelListings(sellerName, rows);
          }
        } catch (e) {
          body.innerHTML = `<div class="drawer-empty">Could not load listings.</div>`;
        }
      }

      function closeSellerPanel() {
        const panel = document.getElementById("seller-panel");
        const backdropEl = document.getElementById("seller-panel-backdrop");
        const app = document.getElementById("app");
        if (panel) {
          panel.classList.remove("open");
          panel.setAttribute("aria-hidden", "true");
        }
        if (backdropEl) {
          backdropEl.classList.remove("on");
          backdropEl.setAttribute("aria-hidden", "true");
        }
        if (app) app.classList.remove("panel-open");
        window.updateOverlayUI?.();
        window.overlayFocusPop?.(panel);
      }

      function rowHTML(r) {
        var priceStr = fmt(r.unitPrice);
        var tagMap = { over: "Overpriced", under: "Good deal", fair: "" };
        var tagEl =
          r.tag && r.tag !== "fair"
            ? `<span class="sl-price-tag ${r.tag}">${tagMap[r.tag]}</span>`
            : "";
        var countEl =
          r.raw.count > 1
            ? `<span class="sl-item-count">×${r.raw.count}</span>`
            : "";
        var date = r.raw.timestamp ? fmtT(r.raw.timestamp) : "";
        return `<div class="sl-row">
          <span class="sl-item" title="${esc(r.raw.item_name || "")}">${formatItemNameH(r.displayName || "—")}</span>
          ${countEl}
          <span class="sl-price ${r.tag}">${priceStr}</span>
          ${tagEl}
          <span class="sl-date">${esc(date)}</span>
        </div>`;
      }

      function renderSellerPanelListings(sellerName, rows) {
        const body = document.getElementById("seller-panel-body");
        if (!body) return;
        if (!rows || !rows.length) {
          body.innerHTML = `<div class="drawer-empty">No recent listings found.</div>`;
          return;
        }

        var sort = _drawerSort[sellerName] || "deals";
        var enrichedRows = rows.map(function (l) {
          var name = String(l.item_name || "")
            .trim()
            .toLowerCase();

          var listingTier = parseInt(l.tier, 10);
          var prismaticKey =
            String(l.set_name || "").toLowerCase() === "prismatic" &&
            [1, 2, 3].includes(listingTier)
              ? `${l.item_name}|t${listingTier}`
              : "";

          var match = (typeof enriched !== "undefined" ? enriched : []).find(
            (r) =>
              (prismaticKey &&
                r.rawKey.toLowerCase() === prismaticKey.toLowerCase()) ||
              r.displayName.toLowerCase() === name ||
              r.rawKey.toLowerCase() === name,
          );

          var unitPrice =
            l.unit_price != null
              ? +l.unit_price
              : l.count
                ? Math.round(l.price / l.count)
                : +l.price;
          var tag = "fair";
          if (match && match.median) {
            if (unitPrice > match.median * 1.4) tag = "over";
            else if (unitPrice < match.median * 0.7) tag = "under";
          }
          var parsed = parseKey(match?.rawKey || prismaticKey || l.item_name || "");
          return {
            raw: l,
            unitPrice: unitPrice,
            tag: tag,
            ts: l.timestamp ? new Date(l.timestamp).getTime() : 0,
            match: match,
            displayName:
              (match && match.displayName) || parsed.displayName || l.item_name || "—",
          };
        });

        // --- SORTING LOGIC ---
        if (sort === "price_asc") {
          enrichedRows.sort((a, b) => a.unitPrice - b.unitPrice);
        } else if (sort === "price_desc") {
          enrichedRows.sort((a, b) => b.unitPrice - a.unitPrice);
        } else if (sort === "deals") {
          const order = { under: 0, fair: 1, over: 2 };
          enrichedRows.sort((a, b) => {
            if (order[a.tag] !== order[b.tag])
              return order[a.tag] - order[b.tag];
            // Within each category, sort by price descending (highest price first)
            return b.unitPrice - a.unitPrice;
          });
        } else {
          enrichedRows.sort((a, b) => b.ts - a.ts);
        }

        var sortActive = _drawerSort[sellerName] || "deals";
        var sortBar = `<div class="scard__drawer-hdr">Listings
          <div class="scard__drawer-sort">
            <button class="dsort-btn ${sortActive === "deals" ? "on" : ""}" data-sort="deals" data-seller="${esc(sellerName)}">Best Deals</button>
            <button class="dsort-btn ${sortActive === "price_asc" || sortActive === "price_desc" ? "on" : ""}" data-sort="price_toggle" data-seller="${esc(sellerName)}" data-current="${sortActive}">Price ${sortActive === "price_desc" ? "↓" : "↑"}</button>
            <button class="dsort-btn ${sortActive === "newest" ? "on" : ""}" data-sort="newest" data-seller="${esc(sellerName)}">Newest</button>
          </div>
        </div>`;

        var content = `<div class="listing-section">${enrichedRows
          .map(function (row, idx) {
            return rowHTML(row);
          })
          .join("")}</div>`;

        body.innerHTML = sortBar + content;
      }

      function setDrawerSort(sellerName, sort) {
        if (sort === "price_toggle") {
          var currentSort = _drawerSort[sellerName] || "deals";
          if (currentSort === "price_asc") {
            sort = "price_desc";
          } else if (currentSort === "price_desc") {
            sort = "price_asc";
          } else {
            sort = "price_asc";
          }
        }
        _drawerSort[sellerName] = sort;
        if (_drawerCache[sellerName])
          renderSellerPanelListings(sellerName, _drawerCache[sellerName]);
      }

      function renderSellers() {
        var grid = document.getElementById("sellersGrid");
        if (!grid) return;
        var q = (document.getElementById("qEl")?.value || "")
          .trim()
          .toLowerCase();
        var sellers = Object.values(allSellers || {});
        if (q)
          sellers = sellers.filter((s) =>
            String(s.seller || "")
              .toLowerCase()
              .includes(q),
          );
        if (_sfFilter === "trustworthy")
          sellers = sellers.filter(
            (s) => s.accuracy_label === "Trustworthy" && !s.is_blacklisted,
          );
        else if (_sfFilter === "neutral")
          sellers = sellers.filter(
            (s) => s.accuracy_label === "Neutral" && !s.is_blacklisted,
          );
        else if (_sfFilter === "suspicious")
          sellers = sellers.filter((s) => s.accuracy_label === "Suspicious");
        else if (_sfFilter === "flagged")
          sellers = sellers.filter(
            (s) => s.is_blacklisted || s.accuracy_label === "Flagged",
          );
        sellers.sort(
          (a, b) =>
            (a.is_blacklisted ? 1 : 0) - (b.is_blacklisted ? 1 : 0) ||
            (b.total_listings || 0) - (a.total_listings || 0),
        );
        var countEl = document.getElementById("sellersCount");
        updateSellerSearchClear();
        if (countEl)
          countEl.textContent =
            sellers.length + " seller" + (sellers.length !== 1 ? "s" : "");
        if (countEl) countEl.classList.add("ready");
        grid.innerHTML = sellers.length
          ? sellers.map(buildSellerCard).join("")
          : `<div class="sellers-empty">No sellers match filters.</div>`;
        hydrateSellerAvatars(grid);
        grid.classList.add("loaded");
      }

      function showSellersSkeleton() {
        var grid = document.getElementById("sellersGrid");
        var countEl = document.getElementById("sellersCount");
        if (!grid) return;
        if (countEl) {
          countEl.classList.remove("ready");
          countEl.textContent = "";
        }
        grid.classList.remove("loaded");
        var skel = "";
        for (var i = 0; i < 10; i++) {
          skel += `<div class="scard-skel"><div class="scard-skel__head"><div class="skel-circle"></div><div class="skel-lines"><div class="skel-line skel-line--medium"></div><div class="skel-line skel-line--short"></div></div></div><div class="scard-skel__stats"><div class="scard-skel__stat"><div class="skel-mini skel-mini--half"></div></div><div class="scard-skel__stat"><div class="skel-mini skel-mini--half"></div></div><div class="scard-skel__stat"><div class="skel-mini skel-mini--half"></div></div></div></div>`;
        }
        grid.innerHTML = skel;
      }

      window.onMarketDataLoaded = function () {
        renderSellers();
      };
      showSellersSkeleton();

      /* ════════════════════════════════════════════════════════
         Seller card particle system  (enhanced v2)
         ════════════════════════════════════════════════════════
         Each trust tier now has TWO phases (arrays of configs).
         On every hover we randomly pick one phase so consecutive
         hovers feel different.  Trustworthy uses "rise" OR "burst",
         suspicious uses "glitch" OR a jittery "burst", etc.
         ════════════════════════════════════════════════════════ */

      var _particleTimers  = new WeakMap();
      var _particleCleaners = new WeakMap();
      var _particlePhase   = new WeakMap(); // active conf per card
      var _cardFxTimeouts = new WeakMap();
      var _flaggedShakeTimers = new WeakMap();

      var TRUST_PARTICLES = {
        trustworthy: [
          /* Phase A — coins / stars rising upward */
          {
            emojis:  ["💰", "🪙", "✨", "⭐", "💛", "🌟"],
            anim:    "rise",
            sizePx:  [20, 20, 14, 16, 18, 14],
            count:   9,
            interval: 175,
          },
          /* Phase B — money bursting outward */
          {
            emojis:  ["💵", "🤑", "💸", "💫", "🏆", "✨"],
            anim:    "burst",
            sizePx:  [22, 24, 22, 16, 20, 14],
            count:   8,
            interval: 190,
          },
        ],

        neutral: [
          /* Phase A — quiet balance symbols drifting */
          {
            emojis:  ["⚖️", "◆", "○", "·", "–", "•"],
            anim:    "drift",
            sizePx:  [14, 10, 11, 10, 12, 10],
            count:   5,
            interval: 310,
          },
          /* Phase B — subtle question marks rising */
          {
            emojis:  ["❔", "💭", "〰️", "…", "◇", "·"],
            anim:    "rise",
            sizePx:  [13, 12, 12, 12, 10, 10],
            count:   5,
            interval: 330,
          },
        ],

        suspicious: [
          /* Phase A — eyes and warnings glitching */
          {
            emojis:  ["👀", "⚠️", "❓", "🕵️", "💭", "🧐", "❗", "🤔"],
            anim:    "glitch",
            sizePx:  [18, 14, 14, 14, 14, 14, 14, 16],
            count:   8,
            interval: 210,
          },
          /* Phase B — chaotic burst of question marks */
          {
            emojis:  ["❓", "⚠️", "👁️", "💢", "❗", "🔍"],
            anim:    "burst",
            sizePx:  [16, 14, 14, 14, 14, 13],
            count:   7,
            interval: 230,
          },
        ],

        flagged: [
          /* Phase A — skulls and trash falling */
          {
            emojis:  ["💀", "🗑️", "😵", "🚫", "☠️", "💩", "🤮", "😤"],
            anim:    "fall",
            sizePx:  [18, 16, 16, 16, 18, 18, 16, 14],
            count:   9,
            interval: 155,
          },
          /* Phase B — glitch corruption effect */
          {
            emojis:  ["☠️", "🛑", "💢", "😈", "🩸", "💀", "🚩"],
            anim:    "glitch",
            sizePx:  [18, 18, 14, 16, 14, 16, 18],
            count:   8,
            interval: 165,
          },
        ],
      };

      /* ── helpers ── */
      function _rnd(min, max) { return min + Math.random() * (max - min); }

      function _pickPhase(type) {
        var phases = TRUST_PARTICLES[type];
        if (!phases) return null;
        return phases[Math.floor(Math.random() * phases.length)];
      }

      /* ── spawn a single particle ── */
      function spawnParticle(card, container, conf) {
        var w = card.offsetWidth, h = card.offsetHeight;
        var idx  = Math.floor(Math.random() * conf.emojis.length);
        var emoji = conf.emojis[idx];
        var sz   = conf.sizePx[idx] || 16;

        var el = document.createElement("span");
        el.className    = "scard-particle";
        el.textContent  = emoji;
        el.dataset.anim = conf.anim;
        el.style.fontSize = sz + "px";

        var x0, y0, x1, y1, x2, dist, rot;

        if (conf.anim === "rise") {
          x0   = _rnd(0.05, 0.95) * w;
          y0   = _rnd(0.35, 0.88) * h;
          x1   = x0 + _rnd(-35, 35);
          dist = _rnd(55, h * 0.82);
          rot  = _rnd(-200, 200);
          el.style.setProperty("--x0",   x0   + "px");
          el.style.setProperty("--y0",   y0   + "px");
          el.style.setProperty("--x1",   x1   + "px");
          el.style.setProperty("--dist", dist + "px");
          el.style.setProperty("--rot",  rot  + "deg");

        } else if (conf.anim === "burst") {
          x0  = _rnd(0.15, 0.85) * w;
          y0  = _rnd(0.25, 0.75) * h;
          x1  = x0 + _rnd(-85, 85);
          y1  = y0 + _rnd(-85, 20);
          rot = _rnd(-300, 300);
          el.style.setProperty("--x0",  x0  + "px");
          el.style.setProperty("--y0",  y0  + "px");
          el.style.setProperty("--x1",  x1  + "px");
          el.style.setProperty("--y1",  y1  + "px");
          el.style.setProperty("--rot", rot + "deg");

        } else if (conf.anim === "fall") {
          x0   = _rnd(0.04, 0.96) * w;
          y0   = _rnd(-0.05, 0.18) * h;
          x1   = x0 + _rnd(-22, 22);
          dist = _rnd(60, h * 0.92);
          rot  = _rnd(80, 290);
          el.style.setProperty("--x0",   x0   + "px");
          el.style.setProperty("--y0",   y0   + "px");
          el.style.setProperty("--x1",   x1   + "px");
          el.style.setProperty("--dist", dist + "px");
          el.style.setProperty("--rot",  rot  + "deg");

        } else if (conf.anim === "drift") {
          x0 = _rnd(0.1, 0.9) * w;
          y0 = _rnd(0.3, 0.8) * h;
          x1 = x0 + _rnd(-48, 48);
          x2 = x0 + _rnd(-28, 28);
          el.style.setProperty("--x0", x0 + "px");
          el.style.setProperty("--y0", y0 + "px");
          el.style.setProperty("--x1", x1 + "px");
          el.style.setProperty("--x2", x2 + "px");

        } else if (conf.anim === "glitch") {
          x0 = _rnd(0.04, 0.92) * w;
          y0 = _rnd(0.15, 0.85) * h;
          el.style.setProperty("--x0", x0 + "px");
          el.style.setProperty("--y0", y0 + "px");
        }

        /* Slightly wider duration range for more organic feel */
        var dur   = _rnd(0.85, 2.1);
        var delay = _rnd(0, 0.12);
        el.style.setProperty("--dur",   dur   + "s");
        el.style.setProperty("--delay", delay + "s");

        container.appendChild(el);

        /* Self-cleanup */
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, (dur + delay) * 1000 + 80);
      }

      /* ── start / stop ── */
      function startParticles(card) {
        if (_particleTimers.has(card)) return;

        var cls  = card.classList;
        var type = cls.contains("scard-trustworthy") ? "trustworthy"
                 : cls.contains("scard-flagged")     ? "flagged"
                 : cls.contains("scard-suspicious")  ? "suspicious"
                 : cls.contains("scard-neutral")     ? "neutral"
                 : null;
        if (!type) return;

        /* Pick (and cache) a random phase for this hover session */
        var conf = _pickPhase(type);
        if (!conf) return;
        _particlePhase.set(card, conf);

        var container = card.querySelector(".scard-particles");
        if (!container) {
          container = document.createElement("div");
          container.className = "scard-particles";
          card.appendChild(container);
        }

        /* Initial staggered burst */
        var burst = Math.ceil(conf.count * 0.55);
        for (var i = 0; i < burst; i++) {
          (function (offset) {
            setTimeout(function () {
              if (_particleTimers.has(card))
                spawnParticle(card, container, _particlePhase.get(card) || conf);
            }, offset * 52 + Math.random() * 25);
          })(i);
        }

        /* Continuous drip — occasionally double-spawn for extra life */
        var timer = setInterval(function () {
          if (!_particleTimers.has(card)) return;
          var c = _particlePhase.get(card) || conf;
          spawnParticle(card, container, c);
          if (Math.random() < 0.25) spawnParticle(card, container, c);
        }, conf.interval);

        _particleTimers.set(card, timer);
        _particleCleaners.set(card, container);
      }

      function stopParticles(card) {
        setTimeout(function () {
          var timer = _particleTimers.get(card);
          if (timer != null) clearInterval(timer);
          _particleTimers.delete(card);
          _particlePhase.delete(card);
          var container = _particleCleaners.get(card);
          if (container) {
            setTimeout(function () {
              if (!_particleTimers.has(card) && container.parentNode)
                container.innerHTML = "";
            }, 2200);
          }
        }, 420);
      }

      function startCardFx(card) {
        var t = _cardFxTimeouts.get(card);
        if (t) clearTimeout(t);
        card.classList.add("fx-active");
        if (card.classList.contains("scard-flagged")) {
          card.classList.remove("fx-shake");
          card.offsetWidth;
          card.classList.add("fx-shake");
          var st = _flaggedShakeTimers.get(card);
          if (st) clearTimeout(st);
          st = setTimeout(function () {
            card.classList.remove("fx-shake");
            _flaggedShakeTimers.delete(card);
          }, 660);
          _flaggedShakeTimers.set(card, st);
        }
        startParticles(card);
      }

      function stopCardFx(card) {
        stopParticles(card);
        var isFlagged = card.classList.contains("scard-flagged");
        var t = setTimeout(function () {
          card.classList.remove("fx-active");
          _cardFxTimeouts.delete(card);
        }, isFlagged ? 1200 : 700);
        _cardFxTimeouts.set(card, t);
      }

      /* ── attach listeners ── */
      function attachParticleListeners(grid) {
        grid.querySelectorAll(".scard").forEach(function (card) {
          if (card._particlesWired) return;
          card._particlesWired = true;
          card.addEventListener("mouseenter", function () { startCardFx(card); });
          card.addEventListener("mouseleave", function () { stopCardFx(card);  });
          /* Touch: brief burst on tap */
          card.addEventListener("touchstart", function () {
            startCardFx(card);
            setTimeout(function () { stopCardFx(card); }, 1600);
          }, { passive: true });
        });
      }

      function initSellersInteractions() {
        var grid = document.getElementById("sellersGrid");
        if (!grid) return;

        var obs = new MutationObserver(function () { attachParticleListeners(grid); });
        obs.observe(grid, { childList: true });

        grid.addEventListener("click", function (e) {
          var card = e.target.closest(".scard");
          if (card) toggleSellerCard(card, card.getAttribute("data-seller"));
        });
        document.addEventListener("click", function (e) {
          var sortBtn = e.target.closest(".dsort-btn");
          if (sortBtn) {
            e.preventDefault();
            setDrawerSort(
              sortBtn.getAttribute("data-seller"),
              sortBtn.getAttribute("data-sort"),
            );
          }
        });
        document.addEventListener("click", function (e) {
          var nav = document.getElementById("mob-nav");
          if (!nav || nav.getAttribute("aria-hidden") === "true") return;
          if (!e.target.closest(".mob-nav") && !e.target.closest("#mobMenuBtn"))
            closeMobMenu();
        });
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSellersInteractions);
      } else {
        initSellersInteractions();
      }
