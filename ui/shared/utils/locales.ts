/**
 * The locales this site offers — **the one place a fork edits.**
 * `nuxt.config.ts` spreads this into `i18n.locales`, and `AppLocale` is derived
 * from it, so adding Arabic is one entry here plus its message file.
 *
 * Codes match Strapi's ISO locale list, so the same code routes the URL and
 * asks the CMS for a translation.
 *
 * - `short` is the two-character label a locale switcher would show. Nothing
 *   renders one while this list has a single entry.
 * - `dir` drives `<html dir>`; the stylesheet's logical properties do the rest.
 *
 * The site ships one language, so `nuxt.config.ts` sets `strategy: 'no_prefix'`
 * and routes carry no `/en/` segment. A second entry means revisiting that: two
 * locales need a prefix on at least the non-default one, and `SiteNav` needs its
 * switcher back.
 */
export const LOCALES = [
  {
    code: 'en',
    name: 'English',
    short: 'EN',
    language: 'en',
    dir: 'ltr',
    file: 'en.json',
  },
] as const satisfies ReadonlyArray<{
  code: string
  name: string
  short: string
  language: string
  dir: 'ltr' | 'rtl'
  file: string
}>

/**
 * A configured locale code, read off `LOCALES` rather than written out again.
 *
 * It exists because `@nuxtjs/strapi` types its `locale` parameter as a closed
 * list of CLDR codes that would not have heard of whatever a fork adds. Strapi
 * accepts whatever locale the admin created, so this is the accurate list by
 * construction.
 */
export type AppLocale = (typeof LOCALES)[number]['code']

/**
 * The label a locale switcher shows, from each locale's `short`.
 *
 * The parameter is typed structurally rather than as i18n's own `LocaleObject`
 * so this stays a plain function over `{ code, short? }`: a locale object with
 * no `short` satisfies it, and no cast is needed at the call site. A locale
 * added to the config without one still renders, as its code.
 */
export const localeShort = (l: { code: string; short?: string }) =>
  l.short ?? l.code.toUpperCase()
