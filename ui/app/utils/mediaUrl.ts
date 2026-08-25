/**
 * Absolute URL for a Strapi upload.
 *
 * Reads `runtimeConfig.public.strapi.url` (`NUXT_PUBLIC_STRAPI_URL`) at
 * *runtime*, which a prebuilt image (Docker) needs — a build-time
 * `import.meta.env` value would bake the build machine's host into the bundle.
 *
 * Deliberately the *public* URL, even when this runs during SSR. What comes out
 * of here is an `<img src>` that a browser has to resolve, so it must be the
 * origin a visitor can reach — not the one this process uses. Those differ in
 * Docker, where the server talks to `http://cms:1337` over the compose network
 * via the separate private `NUXT_STRAPI_URL`; see `docker-compose.yml`.
 */
// Memoized because `useRuntimeConfig()` needs a Nuxt instance, and mediaUrl is
// also reached from head/schema.org resolvers that run outside one. The value
// is process-wide config, not per-request state, so caching it is safe.
let cachedBase: string | undefined

function strapiBase(): string {
  cachedBase ??=
    useRuntimeConfig().public.strapi?.url ?? 'http://localhost:1337'
  return cachedBase.replace(/\/+$/, '')
}

export function mediaUrl(path?: string | null): string {
  // Strapi returns root-relative paths; a missing one must not become
  // "http://localhost:1337undefined" and render as a broken image.
  if (!path) return ''

  // Upload providers (S3, Cloudinary) hand back absolute URLs already.
  if (/^(https?:)?\/\//i.test(path)) return path

  return `${strapiBase()}${path}`
}
