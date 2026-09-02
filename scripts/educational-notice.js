/* ==========================================================================
   CloudCore Networks — Educational Simulation Notice
   --------------------------------------------------------------------------
   CloudCore is a FICTIONAL site built for teaching. Many interactive actions
   (forms, demo / sign-up buttons, status links) have no real backend. This
   script intercepts those no-op actions and explains — clearly and generically
   — what would happen on a real deployment, so the simulation stays honest.

   Usage
     1. Declarative (preferred): add  data-edu="<verb phrase>"  to any element.
          - on a <form>  -> intercepts submit
          - on a link / button -> intercepts click
        <form data-edu="send your enquiry to our sales team">
        <a href="#" data-edu="open your email client to request a demo">
     2. Imperative:  window.showEducationalNotice("book a consultation")

   No data is ever collected, stored, or transmitted.
   ========================================================================== */
(function () {
  "use strict";

  var BRAND = "#2563eb";
  var BRAND_HOVER = "#1d4ed8";
  var INK = "#0f172a";

  function ensureStyles() {
    if (document.getElementById("edu-notice-style")) return;
    var css = [
      "#edu-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);",
      "backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);",
      "display:flex;align-items:center;justify-content:center;z-index:100000;",
      "padding:1.25rem;opacity:0;transition:opacity .18s ease;}",
      "#edu-overlay.is-open{opacity:1;}",
      "#edu-dialog{background:#fff;border-radius:14px;max-width:440px;width:100%;",
      "box-shadow:0 24px 60px rgba(15,23,42,.28);border:1px solid #e2e8f0;",
      "padding:1.6rem;font-family:inherit;color:#334155;",
      "transform:translateY(8px);transition:transform .18s ease;}",
      "#edu-overlay.is-open #edu-dialog{transform:none;}",
      "#edu-title{display:flex;align-items:center;gap:.55rem;font-size:1.05rem;",
      "font-weight:700;color:" + INK + ";margin:0 0 .7rem;line-height:1.2;}",
      "#edu-title .edu-badge{flex:0 0 auto;width:26px;height:26px;border-radius:50%;",
      "background:#eff6ff;color:" + BRAND + ";display:inline-flex;align-items:center;",
      "justify-content:center;font-size:.85rem;font-weight:800;font-style:normal;}",
      "#edu-body{font-size:.95rem;line-height:1.6;margin:0 0 1.2rem;}",
      "#edu-body strong{color:" + INK + ";}",
      "#edu-actions{display:flex;justify-content:flex-end;}",
      "#edu-close{background:" + BRAND + ";color:#fff;border:1px solid " + BRAND + ";",
      "border-radius:8px;padding:.5rem 1.2rem;font-size:.92rem;font-weight:600;",
      "cursor:pointer;font-family:inherit;transition:background .15s ease,border-color .15s ease;}",
      "#edu-close:hover,#edu-close:focus-visible{background:" + BRAND_HOVER + ";border-color:" + BRAND_HOVER + ";}",
      "#edu-close:focus-visible{outline:3px solid rgba(37,99,235,.3);outline-offset:2px;}",
      "@media(max-width:480px){#edu-dialog{padding:1.3rem;}}"
    ].join("");
    var s = document.createElement("style");
    s.id = "edu-notice-style";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function buildDialog() {
    if (document.getElementById("edu-overlay")) return document.getElementById("edu-overlay");
    ensureStyles();
    var overlay = document.createElement("div");
    overlay.id = "edu-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "edu-title");
    overlay.innerHTML =
      '<div id="edu-dialog">' +
        '<h3 id="edu-title"><span class="edu-badge" aria-hidden="true">i</span>' +
          'Educational simulation</h3>' +
        '<p id="edu-body"></p>' +
        '<div id="edu-actions"><button id="edu-close" type="button">Got it</button></div>' +
      '</div>';
    document.body.appendChild(overlay);

    function close() {
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
    }
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    overlay.querySelector("#edu-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });
    overlay._close = close;
    return overlay;
  }

  function showEducationalNotice(action) {
    var a = (action || "complete this action").trim();
    var overlay = buildDialog();
    overlay.querySelector("#edu-body").innerHTML =
      "<strong>CloudCore Networks is a fictional website</strong> created for " +
      "educational purposes. This action is not connected to a real system, and " +
      "no information is collected, stored, or transmitted. In a live deployment " +
      "this would <strong>" + a + "</strong>.";
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    var btn = overlay.querySelector("#edu-close");
    if (btn) btn.focus();
  }

  /* Public API */
  window.showEducationalNotice = showEducationalNotice;

  /* Auto-wire any element carrying data-edu */
  function wire() {
    var nodes = document.querySelectorAll("[data-edu]");
    Array.prototype.forEach.call(nodes, function (el) {
      if (el._eduWired) return;
      el._eduWired = true;
      var action = el.getAttribute("data-edu");
      if (el.tagName === "FORM") {
        el.addEventListener("submit", function (e) {
          e.preventDefault();
          showEducationalNotice(action);
        });
      } else {
        el.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          showEducationalNotice(action);
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
