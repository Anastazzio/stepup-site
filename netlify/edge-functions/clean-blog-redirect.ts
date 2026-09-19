import type { Config, Context } from "@netlify/edge-functions";

export default (request: Request, _context: Context) => {
  const legacyPostRedirects: Record<string, string> = {
    "/el/post/hecate-s-tree-aerial-retreat-στη-σαμοθράκη-28-30-αυγούστου-2026":
      "/el/blog/hecates-tree-retreat/",
    "/el/post/γιατί-πρέπει-να-δοκιμάσετε-pole-dancing":
      "/el/blog/wellbeing-through-pole-dance/",
    "/el/post/pole-dancing-ότι-χρειάζεται-να-ξέρεις-αν-σκέφτεσαι-να-ξεκινήσεις-pole-dance":
      "/el/blog/pole-aerial-classes-guide/",
  };

  const blogIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const sourceUrl = new URL(request.url);

  let decodedPathname = sourceUrl.pathname;
  try {
    decodedPathname = decodeURIComponent(decodedPathname);
  } catch {
    // Leave malformed paths untouched so Netlify can handle them normally.
  }

  const normalizedPathname = decodedPathname
    .normalize("NFC")
    .replace(/\/+$/, "");
  const legacyDestinationPath = legacyPostRedirects[normalizedPathname];

  if (legacyDestinationPath) {
    const destinationUrl = new URL(legacyDestinationPath, sourceUrl.origin);
    destinationUrl.search = sourceUrl.search;

    return Response.redirect(destinationUrl, 301);
  }

  const articleId = sourceUrl.searchParams.get("id");

  if (!articleId || !blogIdPattern.test(articleId)) {
    return;
  }

  const languagePrefix = sourceUrl.pathname.startsWith("/el/") ? "/el" : "";
  const destinationUrl = new URL(
    `${languagePrefix}/blog/${articleId}/`,
    sourceUrl.origin,
  );

  sourceUrl.searchParams.delete("id");
  destinationUrl.search = sourceUrl.searchParams.toString();

  return Response.redirect(destinationUrl, 301);
};

export const config: Config = {
  path: [
    "/blog/post",
    "/blog/post/",
    "/el/blog/post",
    "/el/blog/post/",
    "/el/post/*",
  ],
};
