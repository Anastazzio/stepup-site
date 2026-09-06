/*
  STEP UP — Blog POST renderer
  Reads ?id=<slug> from the URL, fetches /content/blog-en.json or
  /content/blog-el.json (edited via the /admin CMS panel), finds the
  matching article and renders it into the placeholders left in
  blog/post/index.html and el/blog/post/index.html.
*/
(function () {
    var lang = window.STEPUP_BLOG_LANG === "el" ? "el" : "en";
    var jsonUrl = "/content/blog-" + lang + ".json";
    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");

   var host = document.getElementById("post-body");
    var titleHost = document.getElementById("post-title");
    var metaHost = document.getElementById("post-meta");
    var catHost = document.getElementById("post-cat");
    var imgHost = document.getElementById("post-image");
    var notFoundHost = document.getElementById("post-not-found");
    var articleWrap = document.getElementById("post-article");

   var notFoundLabel =
         lang === "el"
        ? "Δεν βρέθηκε αυτό το άρθρο. Μπορεί να έχει αφαιρεθεί ή να άλλαξε η διεύθυνσή του."
           : "This article could not be found. It may have been removed or its link changed.";
    var backLabel = lang === "el" ? "← Πίσω στο Blog" : "← Back to Blog";
    var backHref = lang === "el" ? "/el/blog" : "/blog";

   if (!id || !host) {
         showNotFound();
   } else {
         fetch(jsonUrl, { cache: "no-cache" })
           .then(function (r) {
                     if (!r.ok) throw new Error("blog json not found");
                     return r.json();
           })
           .then(function (data) {
                     var articles = Array.isArray(data.articles) ? data.articles : [];
                     var article = articles.filter(function (a) { return a.id === id; })[0];
                     if (!article) return showNotFound();
                     render(article);
           })
           .catch(showNotFound);
   }

   function showNotFound() {
         if (articleWrap) articleWrap.style.display = "none";
         if (notFoundHost) {
                 notFoundHost.style.display = "block";
                 notFoundHost.innerHTML =
                           "<p>" + escapeHtml(notFoundLabel) + "</p><a class=\"btn-primary\" href=\"" +
                           backHref + "\">" + escapeHtml(backLabel) + "</a>";
         }
   }

   function escapeHtml(s) {
         return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
                 return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
         });
   }

   // Small fallback markdown-to-HTML: paragraphs, **bold**, *italic*, [link](url).
   // Used only if the marked.js library (loaded from CDN) fails to load.
   function simpleMarkdown(text) {
         var paragraphs = String(text || "").split(/\n\s*\n/);
         return paragraphs
           .map(function (p) {
                     var html = escapeHtml(p.trim())
                       .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                       .replace(/\*(.+?)\*/g, "<em>$1</em>")
                       .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                       .replace(/\n/g, "<br>");
                     return "<p>" + html + "</p>";
           })
           .join("");
   }

   function setMeta(attr, key, value) {
         var selector = "meta[" + attr + "='" + key + "']";
         var node = document.querySelector(selector);
         if (!node) {
                 node = document.createElement("meta");
                 node.setAttribute(attr, key);
                 document.head.appendChild(node);
         }
         node.setAttribute("content", value || "");
   }

   function render(article) {
         var pageTitle = (article.title || "Step Up") + " | Step Up Dance Studio";
         document.title = pageTitle;
         var descMeta = document.querySelector('meta[name="description"]');
         if (descMeta) descMeta.setAttribute("content", article.description || "");

      // Canonical + hreflang: the static template ships a canonical pointing at
      // the blog index, which tells search engines every article is a duplicate
      // of /blog. Point it at this specific article instead so posts can be indexed.
      var canonicalHref = window.location.origin + window.location.pathname + "?id=" + encodeURIComponent(id);
      var canonicalNode = document.querySelector('link[rel="canonical"]');
      if (canonicalNode) canonicalNode.setAttribute("href", canonicalHref);

      setMeta("property", "og:type", "article");
      setMeta("property", "og:title", pageTitle);
      setMeta("property", "og:description", article.description || "");
      setMeta("property", "og:url", canonicalHref);
      if (article.image) setMeta("property", "og:image", article.image);
      setMeta("name", "twitter:card", "summary_large_image");
      setMeta("name", "twitter:title", pageTitle);
      setMeta("name", "twitter:description", article.description || "");

      // BlogPosting structured data, built from the same fields the CMS already
      // has (no separate SEO panel needed). Replaces any previous injected copy
      // so re-renders (client-side nav) don't stack duplicate script tags.
      var oldLd = document.getElementById("post-blogposting-ld");
      if (oldLd) oldLd.remove();
      var ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "post-blogposting-ld";
      ld.textContent = JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": article.title || "",
              "description": article.description || "",
              "image": article.image || undefined,
              "inLanguage": lang,
              "mainEntityOfPage": canonicalHref,
              "author": { "@type": "Organization", "name": "Step Up Dance Studio" },
              "publisher": {
                      "@type": "Organization",
                      "name": "Step Up Dance Studio",
                      "address": {
                              "@type": "PostalAddress",
                              "streetAddress": "5 Stratigou Brantouna St",
                              "postalCode": "54626",
                              "addressLocality": "Thessaloniki",
                              "addressCountry": "GR"
                      }
              }
      });
      document.head.appendChild(ld);

      if (catHost) catHost.textContent = article.category_label || "";
         if (titleHost) titleHost.textContent = article.title || "";
         var metaLine = (article.date_label || "") + (article.read_time ? " · " + article.read_time : "");
         if (metaHost) metaHost.textContent = metaLine;

      if (imgHost) {
              if (article.image) {
                        var img = document.createElement("img");
                        img.src = article.image;
                        img.alt = article.image_alt || article.title || "";
                        imgHost.innerHTML = "";
                        imgHost.appendChild(img);
                        imgHost.style.display = "";
              } else {
                        imgHost.style.display = "none";
              }
      }

      var bodyText = article.body && String(article.body).trim() ? article.body : article.description;
         if (host) {
                 if (window.marked && typeof window.marked.parse === "function") {
                           host.innerHTML = window.marked.parse(String(bodyText || ""));
                 } else {
                           host.innerHTML = simpleMarkdown(bodyText);
                 }
         }

      if (articleWrap) articleWrap.style.display = "";
         if (notFoundHost) notFoundHost.style.display = "none";
   }
})();
