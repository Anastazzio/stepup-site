const BLOG_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default (request) => {
  const sourceUrl = new URL(request.url);
  const articleId = sourceUrl.searchParams.get("id");

  if (!articleId || !BLOG_ID_PATTERN.test(articleId)) {
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

export const config = {
  path: [
    "/blog/post",
    "/blog/post/",
    "/el/blog/post",
    "/el/blog/post/",
  ],
  method: ["GET", "HEAD"],
  onError: "bypass",
};
