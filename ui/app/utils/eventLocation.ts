/**
 * `event.location` is a `shared.location` component, not the free-text string it
 * used to be. Three callers print it — the event row, the event detail page and
 * the .ics file — so the one-line form is built here instead of three times.
 */
export function locationLine(location?: CmsLocation | null): string {
  if (!location?.name) return ''
  // Address before city, deduped: an editor who writes "Amman" into both should
  // not get "…, Amman, Amman".
  return [location.name, location.address, location.city]
    .filter((part, i, all): part is string => !!part && all.indexOf(part) === i)
    .join(', ')
}
