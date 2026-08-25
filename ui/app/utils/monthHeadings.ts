/**
 * Month bucketing for the date-grouped lists (news, events).
 *
 * Buckets are computed in local time, never from a UTC string slice:
 * 2026-08-01T00:30Z is still July in Amman (UTC+3).
 */
export function monthKey(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}`
}

export function monthLabel(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

/**
 * True where a month heading belongs: on the first entry of a month, and never
 * on an entry with no date to head. Direction-agnostic — it only asks whether
 * the bucket changed, so a descending feed and an ascending calendar both work.
 *
 * Comparing against the previous index is what keeps headings non-repeating
 * across "load more" appends: the list stays one flat growing array.
 */
export function startsMonth<T>(
  items: readonly T[],
  i: number,
  field: keyof T & string,
): boolean {
  // A feed's date field is whatever the page named — `publishedAt`, `startsAt`
  // — so it is read positionally and checked here rather than assumed.
  const dateAt = (n: number) => {
    const value = items[n]?.[field]
    return typeof value === 'string' ? value : null
  }

  const key = monthKey(dateAt(i))
  return !!key && key !== monthKey(dateAt(i - 1))
}
