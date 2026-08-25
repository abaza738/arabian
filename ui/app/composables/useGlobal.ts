const POPULATE: CmsPopulate<CmsGlobal> = {
  logo: true,
  favicon: true,
  ctaCards: true,
  socialLinks: true,
  footerLinks: true,
  // Nested media needs naming: `defaultSeo: true` returns the component's text
  // fields but leaves shareImage null.
  defaultSeo: { populate: ['shareImage'] },
}

/**
 * The `global` single type: site identity and the nav/footer chrome. The
 * landing page is not in here — it owns its own sections through the `home`
 * single type, so a hero or a stat band is edited where it is seen. Keyed by
 * locale and deduped by `useAsyncData`, so the layout and every page that
 * needs the chrome share one request.
 */
export function useGlobal() {
  // `findSingle` (not `findOne`) — a single type has no documentId, so it is
  // addressed by name and answers with one entry rather than a list.
  const { findSingle } = useCms()
  const locale = useAppLocale()

  const fetchGlobal = (l: AppLocale) =>
    findSingle('global', { locale: l, populate: POPULATE })

  return useAsyncData(
    () => `global-${locale.value}`,
    async () => {
      const res = await withLocaleFallback(locale.value, fetchGlobal)
      const data = res?.data ?? null

      // `withLocaleFallback` covers the locale nobody ever created — it hands
      // back the English document whole. This covers the locale that exists but
      // was left half-written: Strapi answers with the document and a null for
      // every field the editor skipped, so the footer's links disappear rather
      // than falling back. Read `locale` off the payload, since the
      // fallback above may already have switched us to English.
      if (!data || data.locale === DEFAULT_LOCALE) return data
      if (!Object.values(data).some(isBlank)) return data

      // Indexed by field name, which a typed view of the entry cannot express —
      // the borrow is field-agnostic on purpose, so a field added to the schema
      // is covered without touching this.
      const fields = data as unknown as Record<string, unknown>

      try {
        const english = (await fetchGlobal(DEFAULT_LOCALE))?.data
        if (english) {
          for (const [field, value] of Object.entries(english)) {
            if (isBlank(fields[field])) {
              fields[field] = value
            }
          }
        }
      } catch {
        // This locale's own content loaded. Failing to reach English is a
        // reason to render it with gaps, not to fail the page.
      }

      return data
    },
    { watch: [locale] },
  )
}

/** What an editor leaving a field alone looks like, per field type. */
function isBlank(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  )
}
