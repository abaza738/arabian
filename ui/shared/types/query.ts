/**
 * The Strapi 5 REST query parameters, typed against this site's content model.
 *
 * `@nuxtjs/strapi` ships its own `Strapi5RequestParams`, and three of its
 * members are unusable here — not a matter of taste, they reject valid Strapi
 * queries:
 *
 * - `locale` is a closed list of CLDR codes with no room for a locale a fork adds.
 * - `pagination` demands `start` alongside `limit`, though the REST API
 *   defaults `start` to 0.
 * - `filters` resolves to `never` for any nullable field (every optional field
 *   in a CMS), and has no `$or` at the top level — which is how the
 *   announcements feed and every branch-scoped feed are written.
 *
 * So the parameters are declared here instead, and `useCms()` is the one place
 * that reconciles the two.
 */

/** A leaf a filter can compare against; anything else is a relation. */
type Scalar = string | number | boolean

/** Strapi's operators, narrowed to the field they are applied to. */
interface CmsOperators<V> {
  $eq?: V
  $eqi?: V
  $ne?: V
  $nei?: V
  $in?: V[]
  $notIn?: V[]
  $lt?: V
  $lte?: V
  $gt?: V
  $gte?: V
  $between?: [V, V]
  $null?: boolean
  $notNull?: boolean
  $contains?: string
  $notContains?: string
  $containsi?: string
  $notContainsi?: string
  $startsWith?: string
  $endsWith?: string
}

/** A relation or component reached through a filter, with arrays unwrapped. */
type Related<V> =
  NonNullable<V> extends readonly (infer I)[] ? NonNullable<I> : NonNullable<V>

export type CmsFilters<T> = {
  [K in keyof T]?: NonNullable<T[K]> extends Scalar
    ? CmsOperators<NonNullable<T[K]>> | NonNullable<T[K]>
    : CmsFilters<Related<T[K]>>
} & {
  $or?: CmsFilters<T>[]
  $and?: CmsFilters<T>[]
  $not?: CmsFilters<T>
  /** A relation filtered on its presence rather than on one of its fields. */
  $null?: boolean
  $notNull?: boolean
}

/** `"publishedAt:desc"`, `"title"` — a field name with an optional direction. */
export type CmsSort<T> = `${Exclude<keyof T, symbol>}${':asc' | ':desc' | ''}`

/**
 * `populate`, as the three forms Strapi accepts: everything, a list of field
 * names, or a per-field spec that can nest.
 *
 * Only relations, components, media and dynamic zones can be populated, but
 * this does not try to exclude scalars — `T[K]` for an optional field always
 * includes `undefined`, so an "is it an object" test resolves to `never` for
 * every nullable relation, which is exactly the trap the module's own type
 * falls into.
 */
export type CmsPopulate<T> =
  | '*'
  | Array<Exclude<keyof T, symbol>>
  | {
      [K in keyof T]?:
        | boolean
        | '*'
        | {
            /**
             * Narrow what comes back off the relation itself. The timetable
             * populates two airports onto every one of several hundred legs and
             * needs only their ICAO, so this is the difference between a payload
             * that is worth fetching whole and one that is not.
             */
            fields?: Array<Exclude<keyof Related<T[K]>, symbol>>
            populate?: CmsPopulate<Related<T[K]>>
          }
    }

/** Page-based or offset-based; Strapi defaults whichever half is omitted. */
export type CmsPagination =
  | { page?: number; pageSize?: number; withCount?: boolean }
  | { start?: number; limit?: number; withCount?: boolean }

export interface CmsQuery<T> {
  locale?: AppLocale
  fields?: Array<Exclude<keyof T, symbol>>
  populate?: CmsPopulate<T>
  filters?: CmsFilters<T>
  sort?: CmsSort<T> | CmsSort<T>[]
  pagination?: CmsPagination
  status?: 'published' | 'draft'
}

/** What Strapi reports back about a list request it paginated. */
export interface CmsPaginationMeta {
  page: number
  pageSize: number
  pageCount: number
  total: number
}

export interface CmsListResponse<T> {
  data: T[]
  meta: { pagination?: CmsPaginationMeta }
}

export interface CmsItemResponse<T> {
  /** `null` for a single type an editor has never filled in. */
  data: T | null
  meta: Record<string, unknown>
}

/**
 * The REST endpoints this site reads, each mapped to what it answers with.
 * `@nuxtjs/strapi` addresses a collection by its capitalised plural and a
 * single type by its schema name; spelling one wrong is a 404 at runtime and
 * nothing at all at build time, which is why these are unions and not `string`.
 *
 * The mapping is what makes the endpoint name enough on its own: `find`,
 * `useStrapiList()` and `AppEntryFeed` all infer the entry type from it, so
 * nothing downstream has to be told twice which collection it is working in.
 */
export interface CmsCollectionMap {
  Articles: CmsArticle
  Events: CmsEvent
  Announcements: CmsAnnouncement
  Aircrafts: CmsAircraft
  Destinations: CmsDestination
  Airports: CmsAirport
  Flights: CmsFlight
  Documents: CmsDocument
  Pages: CmsPage
  Pilots: CmsPilot
  Ranks: CmsRank
  Hubs: CmsHub
  Categories: CmsCategory
}

export interface CmsSingleTypeMap {
  about: CmsAbout
  global: CmsGlobal
  home: CmsHome
}

export type CmsCollection = keyof CmsCollectionMap
export type CmsSingleType = keyof CmsSingleTypeMap

/** The entry a collection is made of: `CmsEntryOf<'Articles'>` is `CmsArticle`. */
export type CmsEntryOf<C extends CmsCollection> = CmsCollectionMap[C]
