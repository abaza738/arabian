import { LOCALES } from './shared/utils/locales'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    rootTag: 'main',
    rootAttrs: {
      id: 'arabian',
      class: 'flex-1 flex flex-col',
    },
    head: {
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap',
        },
      ],
    },
  },

  css: [
    '~/assets/styles/tokens.css',
    '~/assets/styles/utils.css',
    '~/assets/styles/main.css',
  ],
  compatibilityDate: '2025-07-15',
  modules: [
    '@nuxt/fonts',
    '@nuxtjs/seo',
    '@nuxtjs/strapi',
    '@nuxtjs/i18n',
    '@comark/nuxt',
    '@vueuse/nuxt',
    'motion-v/nuxt',
  ],

  // Here only to feed the OG image renderer. It generates images outside a
  // browser, so it cannot use the site's `@font-face` rules or the Google Fonts
  // link in `app.head` — `@nuxt/fonts` is the module's one supported way in, and
  // `global: true` is what makes the font data reach it.
  fonts: {
    families: [{ name: 'Marcellus', weights: [400], global: true }],
  },

  strapi: {
    version: 'v5',
  },

  site: {
    trailingSlash: false,
  },

  seo: {
    canonicalQueryWhitelist: [],
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },

  // The list itself lives in `shared/utils/locales.ts`, because `AppLocale` —
  // the type every Strapi query's `locale` is checked against — is derived from
  // it. Spread, not passed: i18n wants a mutable array and the source is frozen
  // so the type can read the codes off it.
  //
  // `no_prefix` because the site ships one language: with `prefix` every route
  // would sit under `/en/`, and there would be nothing to switch to. The module
  // stays installed so `en.json` remains the one place UI chrome copy lives, and
  // so adding a second language is an entry in `LOCALES` plus its message file.
  // `detectBrowserLanguage` is off for the same reason — nothing to detect.
  i18n: {
    baseUrl: import.meta.env.NUXT_PUBLIC_SITE_URL,
    strategy: 'no_prefix',
    defaultLocale: 'en',
    vueI18n: './i18n.config.ts',
    locales: [...LOCALES],
  },

  vite: {
    optimizeDeps: {
      include: ['@unhead/schema-org/vue'],
    },
  },
})
