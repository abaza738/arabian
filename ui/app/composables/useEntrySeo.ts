/**
 * Per-entry meta from the `shared.seo` component, which sits on `article`,
 * `event`, `page` and `about`.
 *
 * Every field falls back rather than rendering blank: `seo` is an editor's
 * override, and most entries will never have one filled in. The order is
 * override → the entry's own field → nothing.
 *
 * WhatsApp and Facebook are the distribution channel for this audience, so
 * `ogImage` matters as much as the title and gets one more rung: an entry with
 * no picture of its own renders a generated card carrying its title, rather
 * than the site's generic banner under every such link.
 */
export function useEntrySeo(
  entry: () => CmsSeoEntry | null | undefined,
  fallback: { image?: () => string | null | undefined } = {},
) {
  // Not awaited: `app.vue` awaits the same key before any page sets up, so this
  // is the resolved instance rather than a second request.
  const { data: global } = useGlobal()

  const title = () => entry()?.seo?.metaTitle || entry()?.title || ''
  const description = () =>
    entry()?.seo?.metaDescription || entry()?.description || undefined
  // The editor's override, then the entry's own cover. mediaUrl() returns "" for
  // a missing upload, so `||` walks past it.
  const ownImage = () =>
    mediaUrl(entry()?.seo?.shareImage?.url) || fallback.image?.() || ''
  // Last resort. The generated card below normally wins over this, but it is
  // still what the Schema.org node uses and what remains if generation is off.
  const image = () =>
    ownImage() ||
    mediaUrl(global.value?.defaultSeo?.shareImage?.url) ||
    undefined

  useSeoMeta({
    titleTemplate: (siteTitle) =>
      title() ? `${title()} | ${siteTitle}` : (siteTitle ?? ''),
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage: () => image() || undefined,
    twitterCard: () => (image() ? 'summary_large_image' : undefined),
  })

  // Nothing to show but the site's generic banner → render a card carrying the
  // entry's own title instead. It sets `og:image` itself and must therefore come
  // *after* useSeoMeta and only when the entry has no picture, or it would
  // replace a real cover with a text card.
  // ponytail: read once at setup, so a client-side locale switch leaves the card
  // in the old language. Crawlers always arrive on a fresh SSR render, which is
  // the only reader this image has.
  if (!ownImage()) {
    defineOgImage('Card.takumi', {
      title: title(),
      subtitle: global.value?.siteName ?? '',
    })
  }

  // Handed back for the page's Schema.org node: an Article and an Event both
  // want the image they share with, and resolving it twice is how the two drift.
  return { shareImage: image }
}

/** Populate clause for the component — nested media needs naming, as on `global`. */
export const SEO_POPULATE: { populate: CmsPopulate<CmsSeo> } = {
  populate: ['shareImage'],
}
