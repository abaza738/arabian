/**
 * The Strapi client, typed against this site's content model.
 *
 * Every read goes through here rather than through `useStrapi()` directly. Two
 * of the module's parameter types cannot describe this site at all — see
 * `shared/types/query.ts` — so the reconciliation is done once, in the cast
 * below, instead of at each of the two dozen call sites.
 *
 * `find` and `findOne` also differ in how a missing entry arrives: `find`
 * answers with an empty list, `findOne` throws a 404. `withLocaleFallback()`
 * absorbs both.
 */
interface CmsClient {
  /** A collection, as a page of entries. */
  find<C extends CmsCollection>(
    collection: C,
    query?: CmsQuery<CmsEntryOf<C>>,
  ): Promise<CmsListResponse<CmsEntryOf<C>>>
  /** One entry of a collection, by `documentId`. Throws 404 if there is none. */
  findOne<C extends CmsCollection>(
    collection: C,
    documentId: string,
    query?: Omit<CmsQuery<CmsEntryOf<C>>, 'filters'>,
  ): Promise<CmsItemResponse<CmsEntryOf<C>>>
  /**
   * A single type. It is the same REST call as `find`, but the payload is one
   * entry rather than a list — a single type has no `documentId`, so `findOne`
   * cannot address it.
   */
  findSingle<S extends CmsSingleType>(
    singleType: S,
    query?: CmsQuery<CmsSingleTypeMap[S]>,
  ): Promise<CmsItemResponse<CmsSingleTypeMap[S]>>
}

export function useCms(): CmsClient {
  const { find, findOne } = useStrapi()

  return {
    find,
    findOne,
    findSingle: find,
  } as unknown as CmsClient
}

/**
 * The active locale, as one of the codes the app is configured for.
 *
 * vue-i18n types `locale` as a bare `string`; the runtime value is always one
 * of the codes declared in `nuxt.config.ts`, which is what `AppLocale` mirrors.
 * This is the one place that assertion is made — everything downstream (the
 * fallback, every query's `locale`) carries the narrow type from here.
 */
export function useAppLocale(): ComputedRef<AppLocale> {
  const { locale } = useI18n()
  return computed(() => locale.value as AppLocale)
}
