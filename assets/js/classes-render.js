/*
  STEP UP — Classes page renderer
  Reads /content/classes-en.json or /content/classes-el.json (edited via the
  /admin CMS panel) and renders the top photo gallery + the category/class
  grid into the placeholders left in classes/index.html and
  el/classes/index.html. Also regenerates the page's ItemList JSON-LD from
  the same data, so the SEO structured data never drifts out of sync with
  what editors change in the CMS.
*/
(function () {
  var lang = window.STEPUP_LANG === "el" ? "el" : "en";
  var jsonUrl = "/content/classes-" + lang + ".json";

  var galleryHost = document.getElementById("classes-gallery");
  var listHost = document.getElementById("classes-list");
  if (!galleryHost && !listHost) return;

  var priceHref = lang === "el" ? "/el/pricing" : "/pricing";
  var priceLabel = lang === "el" ? "Δες τιμές" : "View prices";

  fetch(jsonUrl, { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("classes json not found");
      return r.json();
    })
    .then(function (data) {
      renderGallery(Array.isArray(data.gallery) ? data.gallery : []);
      renderCategories(Array.isArray(data.categories) ? data.categories : []);
      updateJsonLd(Array.isArray(data.categories) ? data.categories : []);
    })
    .catch(function () {
      /* leave whatever static markup (if any) was already in the page */
    });

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function renderGallery(items) {
    if (!galleryHost) return;
    galleryHost.innerHTML = "";
    items.forEach(function (item) {
      var gItem = el("div", "g-item");
      var img = document.createElement("img");
      img.src = item.image || "";
      img.alt = item.alt || "";
      gItem.appendChild(img);
      gItem.appendChild(el("span", null, item.label || ""));
      galleryHost.appendChild(gItem);
    });
  }

  function renderCategories(categories) {
    if (!listHost) return;
    listHost.innerHTML = "";
    categories.forEach(function (cat) {
      var block = el("div", "category-block");

      var head = el("div", "category-head");
      var h3 = document.createElement("h3");
      h3.appendChild(el("span", "class-title-accent", cat.name || ""));
      head.appendChild(h3);
      head.appendChild(el("span", null, cat.subtitle || ""));
      block.appendChild(head);

      var cards = el("div", "cards");
      (cat.cards || []).forEach(function (card) {
        cards.appendChild(renderCard(card));
      });
      block.appendChild(cards);

      listHost.appendChild(block);
    });
  }

  function renderCard(card) {
    var cardEl = el("div", "card");

    if (card.image) {
      var imgWrap = el("div", "card-img");
      var img = document.createElement("img");
      img.className = "hover-bw-color";
      img.loading = "lazy";
      img.src = card.image;
      img.alt = card.image_alt || card.title || "";
      imgWrap.appendChild(img);
      cardEl.appendChild(imgWrap);
    }

    if (card.badge) {
      cardEl.appendChild(el("span", "new-badge", card.badge));
    }

    cardEl.appendChild(el("h4", null, card.title || ""));
    cardEl.appendChild(el("p", "desc", card.description || ""));

    var meta = el("div", "meta");
    var priceSpan = el("span", "price");
    var priceLink = document.createElement("a");
    priceLink.href = priceHref;
    priceLink.textContent = priceLabel;
    priceSpan.appendChild(priceLink);
    meta.appendChild(priceSpan);
    meta.appendChild(el("span", "level", card.level || ""));
    cardEl.appendChild(meta);

    return cardEl;
  }

  function updateJsonLd(categories) {
    var script = document.querySelector('script[type="application/ld+json"]');
    if (!script) return;
    var data;
    try {
      data = JSON.parse(script.textContent);
    } catch (e) {
      return;
    }
    if (!data || !Array.isArray(data["@graph"])) return;

    var itemListEntry = data["@graph"].filter(function (node) {
      return node["@type"] === "ItemList";
    })[0];
    if (!itemListEntry) return;

    var position = 0;
    var items = [];
    categories.forEach(function (cat) {
      (cat.cards || []).forEach(function (card) {
        position++;
        items.push({
          "@type": "ListItem",
          "position": position,
          "item": {
            "@type": "Course",
            "name": card.title || "",
            "provider": { "@type": "Organization", "name": "Step Up Dance Studio" }
          }
        });
      });
    });
    itemListEntry.itemListElement = items;

    script.textContent = JSON.stringify(data, null, 2);
  }
})();

