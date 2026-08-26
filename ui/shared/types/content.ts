/**
 * The shape of everything this site reads out of Strapi.
 *
 * Hand-written rather than generated from `cms/types/generated`: those describe
 * Strapi's *internal* attribute objects, not the JSON the REST API answers
 * with, and the `ui` package builds without the `cms` package present (see
 * `ui/Dockerfile`). One file mirroring the schemas under `cms/src/api` is the
 * version that survives a fork.
 *
 * Two rules run through all of it:
 *
 * - **A relation or a media field is absent unless the query populated it.**
 *   Every one of them is optional here, which is what forces the optional
 *   chaining the components already use.
 * - **A field an editor left empty comes back `null`, not missing.** Optional
 *   fields are `?: T | null` so a `??` chain is type-correct rather than
 *   defensive.
 *
 * Auto-imported: Nuxt exposes everything under `shared/types` to both the Vue
 * app and Nitro without an import statement.
 */

/** The fields Strapi 5 puts on every entry, of every type. */
export interface CmsEntry {
  id: number
  documentId: string
  createdAt: string
  updatedAt: string
  /** `null` while a draft. Absent on types with `draftAndPublish` off. */
  publishedAt?: string | null
  locale?: AppLocale
}

/* -------------------------------------------------------------------------- */
/* Media                                                                       */
/* -------------------------------------------------------------------------- */

/** The derivatives the upload plugin generates for an image. */
export type CmsMediaFormatName = 'thumbnail' | 'small' | 'medium' | 'large'

export interface CmsMediaFormat {
  url: string
  width?: number
  height?: number
}

export interface CmsMedia {
  id: number
  documentId: string
  name: string
  url: string
  mime: string
  /** With the dot: ".pdf". */
  ext?: string | null
  /** Kilobytes, as a decimal — Strapi does not report bytes. */
  size?: number
  width?: number | null
  height?: number | null
  alternativeText?: string | null
  caption?: string | null
  /** Absent for a non-image upload, and for an image smaller than a format. */
  formats?: Partial<Record<CmsMediaFormatName, CmsMediaFormat>> | null
}

/* -------------------------------------------------------------------------- */
/* Shared components (`cms/src/components/shared/*.json`)                      */
/* -------------------------------------------------------------------------- */

/** Every component instance carries its own row id. */
interface CmsComponent {
  id: number
}

export interface CmsSeo extends CmsComponent {
  metaTitle: string
  metaDescription: string
  shareImage?: CmsMedia | null
}

export interface CmsLink extends CmsComponent {
  label: string
  url: string
}

export interface CmsLocation extends CmsComponent {
  name: string
  address?: string | null
  city?: string | null
  mapUrl?: string | null
}

export interface CmsStat extends CmsComponent {
  value: string
  label: string
}

export interface CmsCtaCard extends CmsComponent {
  eyebrow?: string | null
  title: string
  body?: string | null
  buttonLabel?: string | null
  buttonUrl?: string | null
  variant: 'accent' | 'support'
}

export interface CmsSocialLink extends CmsComponent {
  platform: 'facebook' | 'instagram' | 'x' | 'youtube'
  url: string
}

export interface CmsMilestone extends CmsComponent {
  year: string
  title: string
  body?: string | null
}

export interface CmsHero extends CmsComponent {
  greeting?: string | null
  headline: string
  body?: string | null
  primaryCta?: CmsLink | null
  secondaryCta?: CmsLink | null
  footnote?: string | null
}

/* -------------------------------------------------------------------------- */
/* Dynamic zone                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A discriminated union on `__component`, which is what makes `BlockZone`'s
 * dispatch exhaustive: add a component to a dynamiczone, add a member here, and
 * the compiler names the branch that is missing.
 */
export type CmsBlock =
  | CmsMediaBlock
  | CmsQuoteBlock
  | CmsRichTextBlock
  | CmsSliderBlock
  | CmsHeroSection
  | CmsRibbonSection
  | CmsFeatureSection
  | CmsFeedSection
  | CmsStatBandSection
  | CmsCtaBandSection

export interface CmsMediaBlock extends CmsComponent {
  __component: 'shared.media'
  file?: CmsMedia | null
}

export interface CmsQuoteBlock extends CmsComponent {
  __component: 'shared.quote'
  title?: string | null
  body?: string | null
}

export interface CmsRichTextBlock extends CmsComponent {
  __component: 'shared.rich-text'
  /** Markdown, rendered by `@comark/nuxt`. */
  body?: string | null
}

export interface CmsSliderBlock extends CmsComponent {
  __component: 'shared.slider'
  files?: CmsMedia[] | null
}

/* -------------------------------------------------------------------------- */
/* Page sections (`cms/src/components/sections/*.json`)                        */
/* -------------------------------------------------------------------------- */

export interface CmsHeroSection extends CmsComponent {
  __component: 'sections.hero'
  hero?: CmsHero | null
  background?: CmsMedia | null
  decoration?: CmsMedia | null
  showScene?: boolean | null
}

export interface CmsRibbonSection extends CmsComponent {
  __component: 'sections.ribbon'
  name?: string | null
  tagline?: string | null
}

export interface CmsFeatureSection extends CmsComponent {
  __component: 'sections.feature'
  article?: CmsArticle | null
}

export type CmsFeedSource =
  | 'articles'
  | 'events'
  | 'aircraft'
  | 'destinations'
  | 'pilots'
  | 'announcements'
  | 'documents'

export interface CmsFeedSection extends CmsComponent {
  __component: 'sections.feed'
  eyebrow?: string | null
  title?: string | null
  source: CmsFeedSource
  limit?: number | null
  layout: 'grid' | 'list'
  ctaLabel?: string | null
  ctaUrl?: string | null
}

export interface CmsStatBandSection extends CmsComponent {
  __component: 'sections.stat-band'
  eyebrow?: string | null
  title?: string | null
  body?: string | null
  linkLabel?: string | null
  linkUrl?: string | null
  stats?: CmsStat[]
}

export interface CmsCtaBandSection extends CmsComponent {
  __component: 'sections.cta-band'
  cards?: CmsCtaCard[]
}

/* -------------------------------------------------------------------------- */
/* Collection types                                                            */
/* -------------------------------------------------------------------------- */

/** `category.color` picks the pill's hue; the slug never does. */
export type CmsCategoryColor =
  'news' | 'fleet' | 'network' | 'ops' | 'crew' | 'grey'

export interface CmsCategory extends CmsEntry {
  name?: string | null
  slug?: string | null
  color?: CmsCategoryColor | null
  description?: string | null
  articles?: CmsArticle[]
}

export interface CmsHub extends CmsEntry {
  name: string
  slug: string
  icao?: string | null
  iata?: string | null
  city?: string | null
  country?: string | null
  timezone?: string | null
  intro?: string | null
  cover?: CmsMedia | null
  location?: CmsLocation | null
  email?: string | null
  phone?: string | null
  articles?: CmsArticle[]
  events?: CmsEvent[]
  pilots?: CmsPilot[]
  announcements?: CmsAnnouncement[]
  aircraft?: CmsAircraft[]
}

export interface CmsRank extends CmsEntry {
  name: string
  slug: string
  minHours?: number | null
  badge?: CmsMedia | null
  order?: number | null
  pilots?: CmsPilot[]
}

export interface CmsPilot extends CmsEntry {
  name: string
  slug: string
  callsign?: string | null
  role?: string | null
  photo?: CmsMedia | null
  bio?: string | null
  email?: string | null
  joinedAt?: string | null
  hours?: number | null
  order?: number | null
  rank?: CmsRank | null
  hub?: CmsHub | null
  articles?: CmsArticle[]
}

export interface CmsArticle extends CmsEntry {
  title?: string | null
  description?: string | null
  slug?: string | null
  cover?: CmsMedia | null
  author?: CmsPilot | null
  category?: CmsCategory | null
  hub?: CmsHub | null
  blocks?: CmsBlock[]
  seo?: CmsSeo | null
}

export interface CmsEvent extends CmsEntry {
  title: string
  slug?: string | null
  startsAt: string
  endsAt?: string | null
  location?: CmsLocation | null
  eventStatus: 'scheduled' | 'postponed' | 'cancelled'
  registrationUrl?: string | null
  description?: string | null
  featured?: boolean | null
  cover?: CmsMedia | null
  hub?: CmsHub | null
  blocks?: CmsBlock[]
  seo?: CmsSeo | null
}

export interface CmsAnnouncement extends CmsEntry {
  title: string
  slug: string
  kind: 'notice' | 'notam' | 'ops' | 'urgent'
  body?: string | null
  expiresAt?: string | null
  pinned?: boolean | null
  hub?: CmsHub | null
  seo?: CmsSeo | null
}

/**
 * One airframe in the fleet.
 *
 * `fleetStatus`, not `status`: Strapi reserves that attribute name on a
 * draftAndPublish type, where it would collide with the Document Service's own
 * `status` query parameter — the same reason `event` carries `eventStatus`.
 */
export interface CmsAircraft extends CmsEntry {
  title: string
  slug: string
  icaoType?: string | null
  registration?: string | null
  livery?: string | null
  fleetStatus: 'active' | 'incoming' | 'stored' | 'retired'
  seats?: number | null
  rangeNm?: number | null
  cruiseSpeed?: number | null
  summary?: string | null
  cover?: CmsMedia | null
  hub?: CmsHub | null
  order?: number | null
  blocks?: CmsBlock[]
  seo?: CmsSeo | null
}

export interface CmsDestination extends CmsEntry {
  name: string
  slug: string
  icao?: string | null
  iata?: string | null
  city?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  summary?: string | null
  cover?: CmsMedia | null
  order?: number | null
  blocks?: CmsBlock[]
  seo?: CmsSeo | null
}

/** Named `CmsDocument` so it never shadows the DOM's `Document`. */
export interface CmsDocument extends CmsEntry {
  title: string
  slug: string
  file?: CmsMedia | null
  category: 'sop' | 'chart' | 'livery' | 'manual' | 'form' | 'other'
  description?: string | null
  publishedOn?: string | null
}

export interface CmsPage extends CmsEntry {
  title: string
  slug: string
  blocks?: CmsBlock[]
  seo?: CmsSeo | null
  showInMenu: boolean
  menuOrder?: number | null
}

/* -------------------------------------------------------------------------- */
/* Single types                                                                */
/* -------------------------------------------------------------------------- */

export interface CmsHome extends CmsEntry {
  sections?: CmsBlock[]
  seo?: CmsSeo | null
}

export interface CmsAbout extends CmsEntry {
  title?: string | null
  blocks?: CmsBlock[]
  history?: CmsMilestone[]
  seo?: CmsSeo | null
}

export interface CmsGlobal extends CmsEntry {
  siteName: string
  siteDescription: string
  favicon?: CmsMedia | null
  logo?: CmsMedia | null
  defaultSeo?: CmsSeo | null
  wordmarkSub?: string | null
  ribbonTagline?: string | null
  location?: string | null
  /**
   * The crew portal the nav's login button points at — an outbound URL, because
   * hours and flights are tracked on a separate system. Empty means the button
   * is not rendered at all. Shared across locales; only its label is localized.
   */
  pilotPortalUrl?: string | null
  pilotPortalLabel?: string | null
  ctaCards?: CmsCtaCard[]
  socialLinks?: CmsSocialLink[]
  footerLinks?: CmsLink[]
  contactEmail?: string | null
  contactPhone?: string | null
  contactAddress?: string | null
  showUnassignedInHubViews: boolean
}

/* -------------------------------------------------------------------------- */
/* Shapes the UI derives from content                                          */
/* -------------------------------------------------------------------------- */

/**
 * What `useEntrySeo()` needs off an entry: the `shared.seo` override and the
 * two fields it falls back to. Structural on purpose — article, event,
 * aircraft, announcement, page and about all satisfy it without a union that
 * would have to grow with the schema.
 */
export interface CmsSeoEntry {
  title?: string | null
  description?: string | null
  seo?: CmsSeo | null
}

/**
 * A category that can actually be filtered on. `slug` is optional on the type
 * because Strapi leaves it null on a localization created before the field was
 * marked shared; `useCategories()` drops those, and this is that guarantee.
 */
export type FilterableCategory = CmsCategory & { slug: string }

/** One option in `AppFilterBar`. `null` is the unfiltered choice. */
export interface FilterOption {
  value: string | null
  label: string
}
