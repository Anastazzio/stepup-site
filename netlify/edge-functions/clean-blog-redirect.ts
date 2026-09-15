import type { Config, Context } from "@netlify/edge-functions";

export default (request: Request, _context: Context) => {
  const blogIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const sourceUrl = new URL(request.url);
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
  ],
};
