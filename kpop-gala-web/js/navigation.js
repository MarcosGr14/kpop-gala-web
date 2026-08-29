(() => {
  "use strict";

  const init = () => {
    const navbar = document.querySelector(".navbar");
    if (!navbar || navbar.dataset.navigationReady === "true") return;

    const menuButton = navbar.querySelector(".nav-menu-toggle");
    const panel = navbar.querySelector(".nav-panel");
    const more = navbar.querySelector(".nav-more");
    const moreButton = navbar.querySelector(".nav-more-toggle");
    const compact = window.matchMedia("(max-width: 900px)");
    if (!menuButton || !panel || !more || !moreButton) return;

    navbar.dataset.navigationReady = "true";

    const setMore = (open, restoreFocus = false) => {
      more.classList.toggle("is-open", open);
      moreButton.setAttribute("aria-expanded", String(open));
      if (!open && restoreFocus) moreButton.focus();
    };

    const setMenu = (open, restoreFocus = false) => {
      document.body.classList.toggle("nav-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.querySelector(".sr-only").textContent = open ? "Cerrar menú" : "Abrir menú";
      if (!open) setMore(false);
      if (!open && restoreFocus) menuButton.focus();
    };

    menuButton.addEventListener("click", () => {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });

    moreButton.addEventListener("click", () => {
      setMore(moreButton.getAttribute("aria-expanded") !== "true");
    });

    more.addEventListener("focusout", event => {
      if (!compact.matches && !more.contains(event.relatedTarget)) setMore(false);
    });

    panel.addEventListener("click", event => {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("click", event => {
      if (!navbar.contains(event.target)) {
        setMore(false);
        if (compact.matches) setMenu(false);
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      if (moreButton.getAttribute("aria-expanded") === "true" && !compact.matches) {
        setMore(false, true);
      } else if (menuButton.getAttribute("aria-expanded") === "true") {
        setMenu(false, true);
      }
    });

    const resetForViewport = () => setMenu(false);
    if (compact.addEventListener) compact.addEventListener("change", resetForViewport);
    else compact.addListener(resetForViewport);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
