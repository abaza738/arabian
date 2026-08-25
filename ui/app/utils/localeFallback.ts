export const DEFAULT_LOCALE: AppLocale = 'en'

/**
 * Strapi has no locale fallback: asking for a locale with no translation yields
 * an empty list (collections) or null (single types) rather than the default
 * locale's entry. Re-run the fetch against `en` when that happens, so a locale
 * with partial content still renders.
 */
export async function withLocaleFallback<T>(
  locale: AppLocale,
  fetcher: (locale: AppLocale) => Promise<T>,
): Promise<T> {
  if (locale === DEFAULT_LOCALE) return fetcher(locale)

  try {
    const result = await fetcher(locale)
    if (!isEmptyResult(result)) return result
  } catch {
    // The two shapes of "no translation" differ by endpoint: a collection query
    // comes back empty, but asking for one entry in a locale it was never
    // translated into is a 404, which the Strapi client throws. Both mean the
    // same thing here, so both fall through to English.
    //
    // A real outage is not swallowed: the retry below hits the same CMS and
    // surfaces its error.
  }

  return fetcher(DEFAULT_LOCALE)
}

function isEmptyResult(result: unknown): boolean {
  if (result === null || result === undefined) return true

  const data = (result as { data?: unknown }).data
  if (data === null || data === undefined) return true
  if (Array.isArray(data)) return data.length === 0

  return false
}
