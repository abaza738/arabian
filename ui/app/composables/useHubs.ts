/**
 * The `hub` collection: the airports the airline bases crew and aircraft at.
 * Keyed by locale and deduped by `useAsyncData`, so the layout, the landing
 * page and the About page share one request — the same arrangement
 * `useGlobal()` uses.
 */
export function useHubs() {
  const { find } = useCms()
  const locale = useAppLocale()

  return useAsyncData(
    () => `hubs-${locale.value}`,
    () =>
      withLocaleFallback(locale.value, (l) =>
        find('Hubs', {
          locale: l,
          populate: ['location'],
          // No manual `order` field — alphabetical is a rule an editor cannot
          // get wrong, and the bar has to be stable across locales.
          sort: 'name:asc',
        }),
      )
        // Chrome, not content: a fork that has not granted the public role read
        // access to Hubs should render the site it had before hubs existed, not
        // an error in the layout on every page.
        .catch(() => null),
    {
      watch: [locale],
      // A hub with no slug has no URL, so it cannot be a nav pill or a
      // directory entry. Strapi leaves `slug` null on a localization created
      // before the field was marked shared (`i18n.localized: false`), which is
      // a whole locale's worth of hubs pointing at nothing — drop them here
      // rather than let every link resolve against the current route.
      transform: (res) => (res?.data ?? []).filter((h) => !!h?.slug),
      // A failed fetch must read as "no hubs", never `null` — every caller
      // below counts this array without a guard.
      default: () => [] as CmsHub[],
    },
  )
}

/**
 * The hub the current route is inside, or `null` on every site-wide page.
 *
 * Returns `null` for a slug that is not in `hubs` — a hub untranslated in this
 * locale is missing from the list but its page still renders off its own
 * fallback fetch. The nav and footer degrade (no highlight, global contact
 * details); the page does not 404.
 */
export function useActiveHub(hubs: Ref<CmsHub[]>) {
  const route = useRoute()

  return computed(() => {
    // `pages/[slug].vue` is named "page" and carries a `slug` param too, so the
    // route name is what separates them. i18n appends `___en`, which is why
    // this is a prefix test and not an equality one.
    if (!String(route.name ?? '').startsWith('hub')) return null
    return hubs.value.find((h) => h.slug === route.params.slug) ?? null
  })
}
