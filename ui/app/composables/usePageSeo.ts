/**
 * SEO for a page that is not one CMS entry — the feeds, a hub's pages.
 * `useEntrySeo()` is the counterpart for the four types that carry a
 * `shared.seo` component.
 *
 * The share image is always a generated card naming the section. A feed has no
 * picture of its own, and the site's default banner under every one of them
 * says nothing about which page was shared.
 */
export function usePageSeo(
  title: () => string,
  options: { description?: () => string | undefined } = {},
) {
  // Not awaited: `app.vue` awaits the same key before any page sets up, so this
  // is the resolved instance rather than a second request.
  const { data: global } = useGlobal()

  useSeoMeta({
    titleTemplate: (siteTitle) => `${title()} | ${siteTitle}`,
    // Without this the card would name the section while `og:title` still said
    // the site's name, which is what `app.vue` sets.
    ogTitle: title,
    description: options.description,
    ogDescription: options.description,
  })

  // ponytail: read once at setup, so a client-side locale switch leaves the card
  // in the old language. Crawlers always arrive on a fresh SSR render, which is
  // the only reader this image has.
  defineOgImage('Card.takumi', {
    title: title(),
    subtitle: global.value?.siteName ?? '',
  })
}
