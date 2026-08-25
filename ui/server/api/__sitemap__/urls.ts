import type { SitemapUrlInput } from '#sitemap/types'

/**
 * The CMS-driven half of the sitemap. `@nuxtjs/sitemap` discovers the static
 * routes (`/`, `/news`, `/events`, `/about`) from the pages directory on its
 * own and skips the dynamic ones, which is exactly what this fills in.
 *
 * This runs in Nitro, not in the Vue app, so `useStrapi()` does not exist here —
 * the REST API is called directly, against the same URL the client module uses.
 */

// Every `slug` in the schema is `i18n.localized: false`, and a Strapi 5
// `documentId` is shared by all localizations of one document. So a single
// entry per document is correct, and `_i18nTransform` expands it into one URL
// per locale rather than this handler asking for each locale in turn.
const entry = (loc: string, lastmod?: string) => ({
  loc,
  lastmod,
  _i18nTransform: true,
})

// One page per type. `pageSize` is capped at 100 by Strapi's default REST
// config, and a site this size is well inside that.
// ponytail: paginate here if a fork ever passes 100 entries of one type.
const PAGE_SIZE = 100

type Row = { documentId: string; slug?: string; updatedAt?: string }

export default defineSitemapEventHandler(async (event) => {
  // The *private* `strapi.url`, not the public one. `@nuxtjs/strapi` keeps two
  // copies of its config, and the server-side client reads this one — so it is
  // the value that points at the CMS as this process can reach it (`cms:1337`
  // inside Compose), while `public.strapi.url` is the origin a browser must
  // use. This handler runs in Nitro, so it needs the former.
  const config = useRuntimeConfig(event)
  const base = (
    config.strapi?.url ??
    config.public.strapi?.url ??
    'http://localhost:1337'
  ).replace(/\/+$/, '')

  const rows = async (type: string, fields: string[]): Promise<Row[]> => {
    // Built by hand rather than handed to `$fetch`'s `query`: ofetch flattens
    // nested objects to `[object Object]`, and Strapi's syntax is all brackets.
    const params = new URLSearchParams({
      'pagination[pageSize]': String(PAGE_SIZE),
    })
    fields.forEach((f, i) => params.set(`fields[${i}]`, f))

    try {
      const res = await $fetch<{ data: Row[] }>(`${base}/api/${type}?${params}`)
      return res?.data ?? []
    } catch {
      // Per type, not for the whole handler: a fork that has not granted the
      // public role read access to one collection should still get a sitemap
      // covering the rest, the same soft-fail `useHubs()` takes.
      console.warn(`[sitemap] could not read ${type} from Strapi`)
      return []
    }
  }

  // Only published entries come back — `article`, `event`, `announcement`,
  // `aircraft`, `destination` and `page` all have draftAndPublish on, and the
  // public API serves published documents only.
  //
  // `document`, `pilot` and `rank` are absent on purpose: none has a route of
  // its own. A file is linked straight from the documents listing, and the crew
  // renders as one static `/roster` page the sitemap module finds by itself.
  const [articles, events, announcements, aircraft, destinations, pages, hubs] =
    await Promise.all([
      rows('articles', ['updatedAt']),
      rows('events', ['updatedAt']),
      rows('announcements', ['updatedAt']),
      rows('aircrafts', ['slug', 'updatedAt']),
      rows('destinations', ['slug', 'updatedAt']),
      rows('pages', ['slug', 'updatedAt']),
      rows('hubs', ['slug', 'updatedAt']),
    ])

  return [
    ...articles.map((a) => entry(`/article/${a.documentId}`, a.updatedAt)),
    ...events.map((e) => entry(`/event/${e.documentId}`, e.updatedAt)),
    ...announcements.map((a) =>
      entry(`/announcement/${a.documentId}`, a.updatedAt),
    ),
    // Slug-addressed, like a page — evergreen content keeps a readable URL.
    ...aircraft
      .filter((a) => a.slug)
      .map((a) => entry(`/aircraft/${a.slug}`, a.updatedAt)),
    ...destinations
      .filter((d) => d.slug)
      .map((d) => entry(`/destination/${d.slug}`, d.updatedAt)),
    // A hub with no slug has no URL — the same guard `useHubs()` applies.
    ...pages.filter((p) => p.slug).map((p) => entry(`/${p.slug}`, p.updatedAt)),
    ...hubs
      .filter((b) => b.slug)
      .flatMap((b) => [
        entry(`/hub/${b.slug}`, b.updatedAt),
        entry(`/hub/${b.slug}/news`, b.updatedAt),
        entry(`/hub/${b.slug}/events`, b.updatedAt),
      ]),
  ] satisfies SitemapUrlInput[]
})
