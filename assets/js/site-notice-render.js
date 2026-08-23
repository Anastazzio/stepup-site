/*
  STEP UP — Shared site notice renderer
  Reads /content/site-notice-en.json or /content/site-notice-el.json (edited
  via the /admin CMS panel, one place, applies everywhere this script is
  included) and fills in the seasonal notice box that appears on the Classes
  and Pricing pages. Leaves the box untouched if the fetch fails, so the
  page never shows a blank notice.
*/
(function () {
  var lang = window.STEPUP_LANG === "el" ? "el" : "en";
  var jsonUrl = "/content/site-notice-" + lang + ".json";

  var host = document.getElementById("site-notice");
  if (!host) return;

  fetch(jsonUrl, { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("site notice json not found");
      return r.json();
    })
    .then(render)
    .catch(function () {
      /* keep whatever static fallback markup (if any) was left in the page */
    });

  function render(data) {
    var badgeHost = host.querySelector(".badge");
    if (badgeHost) badgeHost.textContent = data.badge || "i";

    var textHost = host.querySelector(".notice-text");
    if (!textHost) return;
    textHost.innerHTML = "";

    var h4 = document.createElement("h4");
    h4.textContent = data.title || "";
    textHost.appendChild(h4);

    (data.paragraphs || []).forEach(function (para) {
      var p = document.createElement("p");
      p.textContent = para;
      textHost.appendChild(p);
    });
  }
})();

