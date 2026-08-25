/**
 * The `category` collection, as the options behind the news filter. Keyed by
 * locale and deduped by `useAsyncData` the way `useHubs()` is, so the
 * site-wide feed and a hub's feed share one request.
 */
export function useCategories() {
  const { find } = useCms()
  const locale = useAppLocale()

  return useAsyncData(
    () => `categories-${locale.value}`,
    () =>
      withLocaleFallback(locale.value, (l) =>
        find('Categories', {
          locale: l,
          // No manual order field on the type, and alphabetical is a rule an
          // editor cannot get wrong — the same reasoning as the hub bar.
          sort: 'name:asc',
        }),
      )
        // Chrome, not content: a fork that has not granted the public role read
        // access to Categories should render the feed it had before the filter
        // existed, not an error above it.
        .catch(() => null),
    {
      watch: [locale],
      // The filter addresses a category by slug. One without a slug cannot be
      // filtered on, so it cannot be an option.
      // Narrowed, not just filtered: everything downstream addresses a category
      // by its slug, and the guard here is what makes that safe without a `!`.
      transform: (res) =>
        (res?.data ?? []).filter((c): c is FilterableCategory => !!c?.slug),
      default: () => [] as FilterableCategory[],
    },
  )
}

/**
 * The news filter, read off `?category=`: the option list the bar renders, the
 * Strapi filter the feed queries with, and the active slug the page folds into
 * its cache key and its empty-state copy.
 *
 * Both news feeds — site-wide and hub-scoped — are the same three lines, so
 * they share this rather than each keeping their own copy of the parameter name.
 */
export function useCategoryFilter(categories: Ref<FilterableCategory[]>) {
  const { t } = useI18n()
  const route = useRoute()

  const activeCategory = computed(() => {
    const raw = route.query.category
    return (Array.isArray(raw) ? raw[0] : raw) ?? null
  })

  const categoryOptions = computed<FilterOption[]>(() => [
    { value: null, label: t('filters.allCategories') },
    ...categories.value.map((c) => ({
      value: c.slug,
      // A category untranslated in this locale still has a slug, and a chip
      // with no text is not a control. Fall back to the address.
      label: c.name || c.slug,
    })),
  ])

  // Empty when nothing is selected, so it spreads into a query that has other
  // filters — the hub feeds — without contributing a key.
  const categoryFilter = (): CmsFilters<CmsArticle> =>
    activeCategory.value
      ? { category: { slug: { $eq: activeCategory.value } } }
      : {}

  // One category is not a choice, so the bar stays off a site with one — but it
  // must appear whenever a filter is *active*, even if the options failed to
  // load. Otherwise a reader who arrives on `?category=…` gets a narrowed feed
  // with no control to widen it again.
  const showCategoryBar = computed(
    () => categoryOptions.value.length > 2 || !!activeCategory.value,
  )

  return { activeCategory, categoryOptions, categoryFilter, showCategoryBar }
}
