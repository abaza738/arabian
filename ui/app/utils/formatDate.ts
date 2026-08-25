// `locale` is required: the old `en-GB` default silently produced a different
// field order ("3 August 2026") than the `en` every caller now passes
// ("August 3, 2026"), so the two would disagree page to page.
export function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
