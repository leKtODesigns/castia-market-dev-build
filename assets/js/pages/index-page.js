function toggleMobMenu() {
    var nav = document.getElementById("mob-nav");
    var btn = document.getElementById("mobMenuBtn");
    var open = nav.getAttribute("aria-hidden") === "false";
    nav.setAttribute("aria-hidden", open ? "true" : "false");
    nav.classList.toggle("open", !open);
    btn.setAttribute("aria-expanded", (!open).toString());
    if (btn) btn.classList.toggle("open", !open);
  }
  function closeMobMenu() {
    var nav = document.getElementById("mob-nav");
    var btn = document.getElementById("mobMenuBtn");
    nav.setAttribute("aria-hidden", "true");
    nav.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    if (btn) btn.classList.remove("open");
  }
  document.addEventListener("click", function (e) {
    var nav = document.getElementById("mob-nav");
    if (!nav || nav.getAttribute("aria-hidden") === "true") return;
    if (!e.target.closest(".mob-nav") && !e.target.closest("#mobMenuBtn"))
      closeMobMenu();
  });
