/**
 * A Strapi collection fetched as one growing list: page 1 is SSR'd, `loadMore()`
 * appends the next page client-side. Appending (rather than replacing) is what
 * lets the news page print a month heading only when the month changes — that
 * comparison needs one flat array, not a window into an offset.
 */
export async function useStrapiList<C extends CmsCollection>(
  collection: C,
  key: MaybeRefOrGetter<string>,
  query: () => CmsQuery<CmsEntryOf<C>>,
  options: {
    pageSize?: number
    /**
     * True while the reader has narrowed the feed themselves. It turns the
     * locale fallback off — see below.
     */
    filtered?: MaybeRefOrGetter<boolean>
  } = {},
) {
  const { pageSize = 9, filtered = false } = options
  const { find } = useCms()
  const locale = useAppLocale()

  const fetchPage = (page: number, targetLocale: AppLocale) =>
    find(collection, {
      locale: targetLocale,
      ...query(),
      pagination: { page, pageSize },
    })

  // The key is read, not captured. A filter lives in the URL, so changing it
  // re-runs neither the page's setup nor this function — the feed would keep
  // serving the result it fetched under the old filter. Folding the filter into
  // the key and watching it is what turns a query-param change into a refetch.
  const { data, error } = await useAsyncData(
    () => `${toValue(key)}-${locale.value}`,
    () =>
      // `withLocaleFallback` reads an empty list as "this locale has no
      // translation" and answers in English. That is right for a whole feed and
      // wrong for a narrowed one: an Arabic reader who picks a category with no
      // Arabic articles would get English ones under an Arabic chip, as though
      // they were what the filter selected. A filtered empty result is a real
      // answer, so it is returned as-is.
      toValue(filtered)
        ? fetchPage(1, locale.value)
        : withLocaleFallback(locale.value, (l) => fetchPage(1, l)),
    { watch: [locale, () => toValue(key)] },
  )

  const appended = ref([]) as Ref<CmsEntryOf<C>[]>
  const page = ref(1)
  const pending = ref(false)

  // A locale switch or a filter change refetches page 1; drop whatever was
  // loaded for the old one, or Load more would append across two result sets.
  watch(data, () => {
    appended.value = []
    page.value = 1
  })

  const items = computed<CmsEntryOf<C>[]>(() => [
    ...(data.value?.data ?? []),
    ...appended.value,
  ])
  const meta = computed(() => data.value?.meta?.pagination ?? null)
  const hasMore = computed(() => page.value < (meta.value?.pageCount ?? 0))

  // The locale pin: `withLocaleFallback` answers an empty request in a missing locale with
  // English entries and never says it did, so page 2 must be asked for in the
  // locale that actually answered — otherwise Load more silently returns nothing.
  // Read it off the payload, not a variable captured in the fetcher, so the pin
  // survives hydration (the fetcher does not re-run on the client).
  const resolvedLocale = computed(
    () => data.value?.data?.[0]?.locale ?? locale.value,
  )

  async function loadMore() {
    if (pending.value || !hasMore.value) return
    pending.value = true
    try {
      const next = page.value + 1
      const res = await fetchPage(next, resolvedLocale.value)
      appended.value.push(...(res?.data ?? []))
      page.value = next
    } finally {
      pending.value = false
    }
  }

  return { items, meta, hasMore, pending, error, loadMore }
}
