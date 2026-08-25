/**
 * The `pilot` collection: the crew roster, the staff list and whoever writes
 * the articles.
 *
 * This replaced a repeatable component on the `about` single type. That was one
 * array per locale, so two locales meant two rosters an editor had to keep in
 * step by hand — and they drifted. A collection keeps identity, order and
 * photograph shared across locales and localizes only the words.
 */
export function usePilots() {
  const { find } = useCms()
  const locale = useAppLocale()

  return useAsyncData(
    () => `pilots-${locale.value}`,
    () =>
      withLocaleFallback(locale.value, (l) =>
        find('Pilots', {
          locale: l,
          populate: ['photo', 'rank'],
          // `order` is the airline's own hierarchy — the chief pilot is not
          // first alphabetically. Name breaks ties so the list is stable.
          sort: ['order:asc', 'name:asc'],
        }),
      )
        // Chrome, not content: a fork that has not granted read access to
        // Pilots should still get an About page.
        .catch(() => null),
    {
      watch: [locale],
      transform: (res) => res?.data ?? [],
      default: () => [] as CmsPilot[],
    },
  )
}

/**
 * Flying now, versus flown with us before.
 *
 * `joinedAt` is the whole mechanism — no status field, no second type. A pilot
 * with no `joinedAt` at all is in neither list, which is how a contributor who
 * only writes articles stays out of the roster grid.
 */
export function splitRoster(pilots: CmsPilot[]) {
  return {
    crew: pilots.filter((p) => p.joinedAt),
    contributors: pilots.filter((p) => !p.joinedAt),
  }
}
