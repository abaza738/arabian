/**
 * The `page` collection, filtered to what an editor marked for the menu.
 *
 * Before this existed a page was reachable only by typing its URL: the nav's
 * link list was hardcoded and nothing else read the collection. `showInMenu`
 * and `menuOrder` on `page` are what let an editor add a destination without a
 * developer — the whole reason the type exists.
 *
 * Keyed by locale and deduped by `useAsyncData`, so the layout's single call
 * serves every route — the arrangement `useGlobal()` and `useHubs()` use.
 */
export function useMenuPages() {
  const { find } = useCms()
  const locale = useAppLocale()

  return useAsyncData(
    () => `menu-pages-${locale.value}`,
    () =>
      withLocaleFallback(locale.value, (l) =>
        find('Pages', {
          locale: l,
          // The menu needs a label and a destination, nothing else. Asking for
          // the dynamiczone here would pull every page's whole body into the
          // layout, on every route.
          fields: ['title', 'slug', 'menuOrder'],
          filters: { showInMenu: { $eq: true } },
          // `menuOrder` is optional, and Postgres sorts nulls last on ASC, so
          // unordered pages fall to the bottom in a stable alphabetical run
          // rather than jumping around between requests.
          sort: ['menuOrder:asc', 'title:asc'],
        }),
      )
        // Chrome, not content: a fork that has not granted the public role read
        // access to Pages should get a menu without its page column, not an
        // error on every route. Same soft-fail as `useHubs()`.
        .catch(() => null),
    {
      watch: [locale],
      // A page with no slug has no URL, so it cannot be a menu row.
      transform: (res) => (res?.data ?? []).filter((p) => !!p?.slug),
      // A failed fetch must read as "no pages", never `null` — the menu counts
      // this array without a guard.
      default: () => [] as CmsPage[],
    },
  )
}
