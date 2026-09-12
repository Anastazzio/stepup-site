/*
  STEP UP — lightweight, accessible modal for the annual pricing offer terms.
  Used by pricing-render.js via window.stepupOpenPricingModal(title, paragraphs).
  Self-contained: injects its own CSS once, builds the modal lazily on first use.
*/
(function () {
  var STYLE_ID = "stepup-pricing-modal-style";
  if (!document.getElementById(STYLE_ID)) {
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      /* Clickable text inside the ".valid-tag" note: underline + cursor only,
         color and font are inherited so it stays visually identical to the
         rest of the sentence (no accent color, per explicit design spec). */
      ".valid-tag-link{background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:2px;}",
      ".valid-tag-link:hover,.valid-tag-link:focus-visible{text-decoration-thickness:2px;}",
      ".valid-tag-link:focus-visible{outline:3px solid var(--yellow);outline-offset:3px;border-radius:2px;}",

      ".stepup-modal-overlay{position:fixed;inset:0;background:rgba(20,18,17,.55);display:flex;align-items:center;justify-content:center;padding:24px;z-index:1000;}",
      ".stepup-modal-overlay[hidden]{display:none;}",
      ".stepup-modal{background:var(--white);max-width:560px;width:100%;max-height:85vh;overflow-y:auto;padding:36px 32px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.25);}",
      ".stepup-modal h3{font-size:22px;margin:0 26px 18px 0;color:var(--black);}",
      ".stepup-modal p{font-size:14.5px;line-height:1.7;color:var(--gray);font-weight:300;margin-bottom:14px;}",
      ".stepup-modal p:last-child{margin-bottom:0;}",
      ".stepup-modal-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border:0;background:transparent;font-size:22px;line-height:1;color:var(--black);cursor:pointer;display:flex;align-items:center;justify-content:center;}",
      ".stepup-modal-close:hover{color:var(--fuchsia);}",
      ".stepup-modal-close:focus-visible{outline:3px solid var(--yellow);outline-offset:2px;}",
      "@media(max-width:560px){",
      "  .stepup-modal{padding:28px 22px;max-height:90vh;}",
      "  .stepup-modal h3{font-size:19px;margin-right:20px;}",
      "}"
    ].join("\n");
    document.head.appendChild(style);
  }

  var overlay, dialog, titleEl, bodyEl, closeBtn, lastFocused;

  function build() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "stepup-modal-overlay";
    overlay.hidden = true;

    dialog = document.createElement("div");
    dialog.className = "stepup-modal";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");

    closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "stepup-modal-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", close);

    titleEl = document.createElement("h3");
    var titleId = "stepupModalTitle";
    titleEl.id = titleId;
    dialog.setAttribute("aria-labelledby", titleId);

    bodyEl = document.createElement("div");

    dialog.appendChild(closeBtn);
    dialog.appendChild(titleEl);
    dialog.appendChild(bodyEl);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    overlay.addEventListener("mousedown", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay && !overlay.hidden) close();
    });
  }

  function open(title, paragraphs) {
    build();
    titleEl.textContent = title || "";
    bodyEl.innerHTML = "";
    (paragraphs || []).forEach(function (text) {
      var p = document.createElement("p");
      p.textContent = text;
      bodyEl.appendChild(p);
    });
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  window.stepupOpenPricingModal = open;
})();
