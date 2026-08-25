// CMS-authored links are plain paths ("/about"), normalized to exactly one
// leading slash so "about" and "//about" from the admin both resolve. Use
// localePath({ name }) for links defined in code.
//
// No locale prefix: the site runs `strategy: 'no_prefix'`, so the routes are
// the bare paths and prefixing here would point every CMS link at a route that
// does not exist. Adding a second language means restoring the prefix in this
// one function — which is why it still carries a locale-shaped name.
//
// Off-site URLs are detected by `isExternal()`, an allow-list — anything it
// does not recognise (`javascript:`, `data:`) falls through to the internal
// path, which is inert.
export function localeUrl(url: string | undefined | null) {
  if (!url) return ''
  if (isExternal(url)) return url
  return `/${url.replace(/^\/+/, '')}`
}
