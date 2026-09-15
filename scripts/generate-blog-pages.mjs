import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const siteOrigin = "https://www.stepupdancegr.com";
const generatedUrls = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function cleanInternalPostLinks(html, lang) {
  const prefix = lang === "el" ? "/el/blog/" : "/blog/";
  return String(html ?? "")
    .replace(/href="\/(el\/)?blog\/post\/?\?id=([a-z0-9-]+)"/g, (_match, elPrefix, id) => {
      const targetPrefix = elPrefix ? "/el/blog/" : "/blog/";
      return `href="${targetPrefix}${id}/"`;
    })
    .replace(/href="https:\/\/www\.stepupdancegr\.com\/(el\/)?blog\/post\/?\?id=([a-z0-9-]+)"/g, (_match, elPrefix, id) => {
      const targetPrefix = elPrefix ? "/el/blog/" : "/blog/";
      return `href="${targetPrefix}${id}/"`;
    })
    .replace(/href="\/blog\/post\/?\?id=([a-z0-9-]+)"/g, (_match, id) => `href="${prefix}${id}/"`);
}

function materializeDataImage(article, lang) {
  if (!article.image?.startsWith("data:image/")) return article.image || "";
  const match = article.image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/s);
  if (!match) return "";
  const extension = match[1] === "jpeg" ? "jpg" : match[1];
  const relative = `assets/images/blog-${article.id}-${lang}.${extension}`;
  const destination = path.join(root, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, Buffer.from(match[2], "base64"));
  return `/${relative}`;
}

function pageTitle(article) {
  const title = String(article.title || "Step Up Dance Studio Blog").trim();
  return title.length <= 51 ? `${title} | STEP UP` : title;
}

for (const lang of ["en", "el"]) {
  const isGreek = lang === "el";
  const contentPath = path.join(root, `content/blog-${lang}.json`);
  const templatePath = path.join(root, isGreek ? "el/blog/post/index.html" : "blog/post/index.html");
  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  const template = fs.readFileSync(templatePath, "utf8");

  for (const article of content.articles || []) {
    if (!/^[a-z0-9-]+$/.test(article.id || "")) {
      throw new Error(`Invalid blog id in ${contentPath}: ${article.id}`);
    }

    const prefix = isGreek ? "/el/blog" : "/blog";
    const counterpartPrefix = isGreek ? "/blog" : "/el/blog";
    const canonicalPath = `${prefix}/${article.id}/`;
    const counterpartPath = `${counterpartPrefix}/${article.id}/`;
    const canonical = `${siteOrigin}${canonicalPath}`;
    const counterpart = `${siteOrigin}${counterpartPath}`;
    const title = pageTitle(article);
    const description = String(article.description || "").trim();
    const image = materializeDataImage(article, lang);
    const body = cleanInternalPostLinks(article.body || article.description || "", lang);
    const metaLine = [article.date_label, article.read_time].filter(Boolean).join(" · ");

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          "@id": `${canonical}#article`,
          headline: article.title || "",
          description,
          ...(image ? { image: image.startsWith("http") ? image : `${siteOrigin}${image}` } : {}),
          inLanguage: lang,
          mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
          author: { "@type": "Organization", name: "STEP UP Dance Studio" },
          publisher: {
            "@type": "Organization",
            name: "STEP UP Dance Studio",
            logo: { "@type": "ImageObject", url: `${siteOrigin}/assets/logo-stepup-fuchsia.png` }
          }
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: isGreek ? "Αρχική" : "Home", item: isGreek ? `${siteOrigin}/el/` : `${siteOrigin}/` },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${siteOrigin}${prefix}/` },
            { "@type": "ListItem", position: 3, name: article.title || "", item: canonical }
          ]
        }
      ]
    };

    const seoTags = [
      `<link rel="alternate" hreflang="${lang}" href="${canonical}"/>`,
      `<link rel="alternate" hreflang="${isGreek ? "en" : "el"}" href="${counterpart}"/>`,
      `<link rel="alternate" hreflang="x-default" href="${isGreek ? counterpart : canonical}"/>`,
      `<meta property="og:type" content="article"/>`,
      `<meta property="og:title" content="${escapeHtml(title)}"/>`,
      `<meta property="og:description" content="${escapeHtml(description)}"/>`,
      `<meta property="og:url" content="${canonical}"/>`,
      ...(image ? [`<meta property="og:image" content="${escapeHtml(image.startsWith("http") ? image : `${siteOrigin}${image}`)}"/>`] : []),
      `<meta name="twitter:card" content="summary_large_image"/>`,
      `<script type="application/ld+json">${escapeJsonForHtml(structuredData)}</script>`
    ].join("\n");

    const articleMarkup = `<main class="wrap">
  <article id="post-article">
    <header class="post-head">
      <a class="post-back" href="${prefix}/">${isGreek ? "← Πίσω στο Blog" : "← Back to Blog"}</a>
      <span class="post-cat">${escapeHtml(article.category_label || "")}</span>
      <h1>${escapeHtml(article.title || "")}</h1>
      <span class="post-meta">${escapeHtml(metaLine)}</span>
    </header>
    ${image ? `<div class="post-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(article.image_alt || article.title || "")}"/></div>` : ""}
    <div class="post-body">${body}</div>
  </article>
</main>`;

    let html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
      .replace(/<meta content="[\s\S]*?" name="description"\/>/, `<meta content="${escapeHtml(description)}" name="description"/>`)
      .replace(/<meta content="(?:noindex|index), follow" name="robots"\/>/, '<meta content="index, follow" name="robots"/>')
      .replace(/<link href="https:\/\/www\.stepupdancegr\.com\/(el\/)?blog\/" rel="canonical"\/>/, `<link href="${canonical}" rel="canonical"/>\n${seoTags}`)
      .replace(/<main class="wrap">[\s\S]*?<\/main>/, articleMarkup)
      .replace(/\s*<script>window\.STEPUP_BLOG_LANG = "(?:en|el)";<\/script>/, "")
      .replace(/\s*<script src="\/assets\/js\/marked\.min\.js" defer><\/script>/, "")
      .replace(/\s*<script src="\/assets\/js\/blog-post-render\.js" defer><\/script>/, "");

    if (isGreek) {
      html = html.replaceAll('href="/blog" lang="en"', `href="${counterpartPath}" lang="en"`);
    } else {
      html = html.replaceAll('href="/el/blog" lang="el"', `href="${counterpartPath}" lang="el"`);
    }

    const output = path.join(root, canonicalPath.slice(1), "index.html");
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, html);
    generatedUrls.push(canonical);
  }
}

const sitemapPath = path.join(root, "sitemap.xml");
let sitemap = fs.readFileSync(sitemapPath, "utf8")
  .replace(/\s*<!-- BLOG_URLS_START[^>]*-->[\s\S]*?<!-- BLOG_URLS_END -->\s*/g, "\n")
  .replace(/\s*<url><loc>https:\/\/www\.stepupdancegr\.com\/(?:el\/)?blog\/post\/\?id=[^<]+<\/loc><\/url>/g, "");
const sitemapBlogEntries = generatedUrls
  .sort((a, b) => a.localeCompare(b))
  .map((url) => `  <url><loc>${url}</loc></url>`)
  .join("\n");
sitemap = sitemap.replace(
  "</urlset>",
  `  <!-- BLOG_URLS_START: generated by scripts/generate-blog-pages.mjs -->\n${sitemapBlogEntries}\n  <!-- BLOG_URLS_END -->\n</urlset>`
);
fs.writeFileSync(sitemapPath, sitemap);

console.log("Generated static STEP UP blog pages.");
