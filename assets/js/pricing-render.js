/*
  STEP UP — Pricing page renderer
  Reads /content/pricing-en.json or /content/pricing-el.json (edited via the
  /admin CMS panel) and renders the pricing-specific discount notice plus the
  drop-in box and price-block tier groups into the placeholders left in
  pricing/index.html and el/pricing/index.html.
*/
(function () {
  var lang = window.STEPUP_LANG === "el" ? "el" : "en";
  var jsonUrl = "/content/pricing-" + lang + ".json";

  var noticeHost = document.getElementById("pricing-discount-notice");
  var listHost = document.getElementById("pricing-list");
  if (!noticeHost && !listHost) return;

  fetch(jsonUrl, { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("pricing json not found");
      return r.json();
    })
    .then(function (data) {
      renderDiscountNotice(data.discount_notice || {});
      renderGroups(Array.isArray(data.groups) ? data.groups : [], data);
      renderPayOnline("pricing-pay-top", data);
      renderPayOnline("pricing-pay-bottom", data);
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

  function renderDiscountNotice(notice) {
    if (!noticeHost) return;
    noticeHost.innerHTML = "";
    noticeHost.appendChild(el("div", "badge", notice.badge || "%"));

    var text = document.createElement("div");
    var h4 = document.createElement("h4");
    h4.textContent = notice.title || "";
    text.appendChild(h4);
    if (notice.text) {
      var p = document.createElement("p");
      p.textContent = notice.text;
      text.appendChild(p);
    }
    noticeHost.appendChild(text);
  }

  function renderRow(row) {
    row = row || {};
    var rowEl = el("div", "price-row" + (row.tbd ? " tbd" : ""));
    rowEl.appendChild(el("span", "q-num", row.qty || ""));

    var nameSpan = el("span", "p-name");
    nameSpan.appendChild(document.createTextNode(row.name || ""));
    if (row.note) {
      var small = document.createElement("small");
      small.textContent = row.note;
      nameSpan.appendChild(small);
    }
    rowEl.appendChild(nameSpan);

    rowEl.appendChild(el("span", "p-amt", row.amount || ""));
    return rowEl;
  }

  function renderGroups(groups, data) {
    if (!listHost) return;
    listHost.innerHTML = "";
    groups.forEach(function (group) {
      if (group.type === "dropin") {
        listHost.appendChild(renderDropin(group));
      } else {
        listHost.appendChild(renderRegular(group, data));
      }
    });
  }

  function renderHead(group) {
    var head = el("div", "price-block-head");

    var h4 = document.createElement("h4");
    h4.appendChild(document.createTextNode((group.name || "") + (group.name_tag ? " " : "")));
    if (group.name_tag) h4.appendChild(el("span", "tbc-tag", group.name_tag));
    head.appendChild(h4);

    head.appendChild(el("span", "tier-label", group.tier_label || ""));
    return head;
  }

  function renderDropin(group) {
    var box = el("div", "dropin-box");
    box.appendChild(renderHead(group));
    if (group.lead) box.appendChild(el("p", "lead", group.lead));
    (group.sections || []).forEach(function (section) {
      (section.rows || []).forEach(function (row) {
        box.appendChild(renderRow(row));
      });
    });
    return box;
  }

  function renderRegular(group, data) {
    var block = el("div", "price-block");
    block.appendChild(renderHead(group));

    (group.sections || []).forEach(function (section) {
      /* An empty label means this section's rows belong under the block's
         main head (already rendered above). A non-empty label starts a new
         mini tier header inside the same block, e.g. "3-month package". */
      if (section.label) {
        var subHead = el("div", "price-block-head");
        subHead.style.marginTop = "14px";
        subHead.appendChild(el("span", null, ""));

        var tierSpan = el("span", "tier-label");
        tierSpan.appendChild(document.createTextNode(section.label));
        if (section.tag) tierSpan.appendChild(el("span", "tbc-tag", section.tag));
        subHead.appendChild(tierSpan);

        block.appendChild(subHead);
      }
      (section.rows || []).forEach(function (row) {
        block.appendChild(renderRow(row));
      });
    });

    if (group.valid_note) {
      block.appendChild(el("p", "valid-tag", group.valid_note));
    }

    (group.extra_rows || []).forEach(function (row) {
      block.appendChild(renderRow(row));
    });

    return block;
  }

  /* Two fixed "Pay Online" entry points (top, near the page header, and
     bottom, right after the last price block) replace the old per-group
     buttons that used to appear scattered mid-page. */
  function renderPayOnline(hostId, data) {
    var host = document.getElementById(hostId);
    if (!host || !data.pay_online_url) return;
    host.innerHTML = "";
    var a = document.createElement("a");
    a.className = "online-pay";
    a.href = data.pay_online_url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = data.pay_online_label || "Pay Online";
    host.appendChild(a);
  }
})();
