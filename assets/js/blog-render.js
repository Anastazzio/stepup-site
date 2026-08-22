/*
  STEP UP — Blog renderer
  Reads /content/blog-en.json or /content/blog-el.json (edited via the
  /admin CMS panel) and renders the featured card + article grid into
  the placeholders left in blog/index.html and el/blog/index.html.
  Keeps the exact same markup/classes the page was designed with, so the
  existing CSS and category filter chips keep working unchanged.
*/
(function () {
  var lang = window.STEPUP_BLOG_LANG === "el" ? "el" : "en";
  var jsonUrl = "/content/blog-" + lang + ".json";

  var featuredHost = document.getElementById("blog-featured");
  var gridHost = document.getElementById("blog-grid");
  if (!featuredHost || !gridHost) return;

  var emptyLabel =
    lang === "el"
      ? "Δεν υπάρχουν άρθρα ακόμα. Πρόσθεσε το πρώτο από το πάνελ διαχείρισης."
      : "No articles yet. Add the first one from the admin panel.";

  fetch(jsonUrl, { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("blog json not found");
      return r.json();
    })
    .then(function (data) {
      var articles = Array.isArray(data.articles) ? data.articles : [];
      render(articles);
    })
    .catch(function () {
      render([]);
    });

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function render(articles) {
    featuredHost.innerHTML = "";
    gridHost.innerHTML = "";

    var featured = articles.find(function (a) { return a.featured; });
    var rest = articles.filter(function (a) { return a !== featured; });

    if (!featured && rest.length === 0) {
      gridHost.appendChild(el("p", "empty-note", emptyLabel));
      return;
    }

    if (featured) {
      var wrap = document.createElement(featured.link ? "a" : "div");
      wrap.className = "featured";
      wrap.setAttribute("data-cat", (featured.categories || []).join(" "));
      if (featured.link) {
        wrap.href = featured.link;
        if (/^https?:\/\//.test(featured.link)) {
          wrap.target = "_blank";
          wrap.rel = "noopener noreferrer";
        }
      }

      var fImg = el("div", "f-img");
      if (featured.badge) fImg.appendChild(el("span", "f-badge", featured.badge));
      var img = document.createElement("img");
      img.src = featured.image || "";
      img.alt = featured.image_alt || featured.title || "";
      img.loading = "lazy";
      fImg.appendChild(img);
      wrap.appendChild(fImg);

      var fTxt = el("div", "f-txt");
      fTxt.appendChild(el("span", "cat", featured.category_label || ""));
      fTxt.appendChild(el("h2", null, featured.title || ""));
      fTxt.appendChild(el("p", null, featured.description || ""));
      var meta = (featured.date_label || "") + (featured.read_time ? " · " + featured.read_time : "");
      fTxt.appendChild(el("span", "f-meta", meta));
      if (featured.link) {
        fTxt.appendChild(document.createElement("br"));
        fTxt.appendChild(el("span", "f-link", lang === "el" ? "Διάβασε περισσότερα →" : "Read more →"));
      }
      wrap.appendChild(fTxt);
      featuredHost.appendChild(wrap);
    }

    if (rest.length === 0) return;

    var grid = el("div", "article-grid");
    rest.forEach(function (a) {
      var card = a.link ? document.createElement("a") : document.createElement("div");
      card.className = "article-card";
      card.setAttribute("data-cat", (a.categories || []).join(" "));
      if (a.link) {
        card.href = a.link;
        card.style.display = "block";
        if (/^https?:\/\//.test(a.link)) {
          card.target = "_blank";
          card.rel = "noopener noreferrer";
        }
      }

      var aImg = el("div", "a-img");
      var img2 = document.createElement("img");
      img2.src = a.image || "";
      img2.alt = a.image_alt || a.title || "";
      img2.loading = "lazy";
      aImg.appendChild(img2);
      card.appendChild(aImg);

      var body = el("div", "a-body");
      body.appendChild(el("span", "cat", a.category_label || ""));
      body.appendChild(el("h4", null, a.title || ""));
      body.appendChild(el("p", "desc", a.description || ""));
      var meta2 = (a.date_label || "") + (a.read_time ? " · " + a.read_time : "");
      body.appendChild(el("span", "a-meta", meta2));
      card.appendChild(body);

      grid.appendChild(card);
    });
    gridHost.appendChild(grid);

    wireFilters();
  }

  function wireFilters() {
    var chips = document.querySelectorAll(".filter-chip");
    var items = document.querySelectorAll("[data-cat]:not(.filter-chip)");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        var cat = chip.dataset.cat;
        items.forEach(function (item) {
          var cats = (item.dataset.cat || "").split(" ");
          item.style.display = cat === "all" || cats.indexOf(cat) !== -1 ? "" : "none";
        });
      });
    });
  }
})();
