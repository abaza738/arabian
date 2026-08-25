// Allow-list, not a deny-list: a bare `[a-z]+:` prefix test would also pass
// `javascript:` and `data:` through to an href, turning a link URL typed in the
// Strapi admin into stored XSS.
const EXTERNAL = /^(https?:|mailto:|tel:|\/\/|#)/i

export function isExternal(url: string): boolean {
  return EXTERNAL.test(url)
}

/**
 * An href for a link that is always off-site (social profiles). An
 * unrecognised scheme yields an empty href rather than a live `javascript:`
 * handler — there is no internal path to fall back to.
 */
export function externalUrl(url: string | undefined | null): string {
  return url && isExternal(url) ? url : ''
}
