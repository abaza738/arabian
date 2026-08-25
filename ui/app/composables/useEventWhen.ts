/**
 * Which half of the calendar a reader is looking at, read off `?when=past`.
 *
 * Upcoming and past split on `startsAt` and are exact complements — every event
 * is in one of them and never both, which is what makes "past" trustworthy as
 * an archive rather than a second view of the same rows. (A multi-day event
 * that has begun but not ended counts as past, as it already did before the
 * archive existed.)
 *
 * Both calendars — site-wide and hub-scoped — read this, so they cannot
 * drift apart on the boundary or on the instant it is measured from.
 */
export function useEventWhen() {
  const { t } = useI18n()
  const route = useRoute()

  // Frozen for the life of the page: page 2 must be offset into the same result
  // set page 1 came from. A fresh `new Date()` per request would let an event
  // start between the two calls, shift every offset by one, and silently drop a
  // row at the seam. `useState` (not a plain const) so the client reuses the
  // server's timestamp instead of minting its own at hydration.
  const now = useState('events-now', () => new Date().toISOString()).value

  const past = computed(() => {
    const raw = route.query.when
    return (Array.isArray(raw) ? raw[0] : raw) === 'past'
  })

  const whenOptions = computed<FilterOption[]>(() => [
    { value: null, label: t('filters.upcoming') },
    { value: 'past', label: t('filters.past') },
  ])

  const eventFilter = (): CmsFilters<CmsEvent> => ({
    startsAt: past.value ? { $lt: now } : { $gte: now },
  })

  // The archive reads backward from today, the calendar forward from it — each
  // half starts at the boundary the reader is standing on.
  const eventSort = (): CmsSort<CmsEvent> =>
    past.value ? 'startsAt:desc' : 'startsAt:asc'

  return { past, whenOptions, eventFilter, eventSort }
}
